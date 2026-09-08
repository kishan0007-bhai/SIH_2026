import type {
  ClimateProfile,
  ShelterModel,
  SimulationConfig,
  OptimizationCandidate,
  OptimizationWeights,
  CostEstimate,
  SustainabilityMetrics,
  PerformanceMetrics,
  ComfortResult,
  SimulationResult,
  VentilationType,
  ShadingType,
} from '@/types';
import { runSimulation } from './thermalEngine';
import { calculateCost } from './costEngine';
import { calculateSustainability } from './sustainabilityEngine';
import { getMaterial } from '@/data/materials';

// ============================================================
// Optimization Engine — Local candidate evaluation
//
// Evaluates combinations of materials, orientation, openings,
// ventilation, and shading. Ranks by weighted multi-objective score.
// ============================================================

interface OptConfig {
  wallMaterialId: string;
  roofMaterialId: string;
  insulationMaterialId: string;
  insulationThickness: number;
  orientation: number;
  windowRatio: number;
  ventilation: VentilationType;
  shading: ShadingType;
}

const WALL_OPTIONS = ['wall-brick', 'wall-aac', 'wall-mud', 'wall-insulated-panel'];
const ROOF_OPTIONS = ['roof-rcc', 'roof-insulated-metal', 'roof-cool'];
const INSULATION_OPTIONS = ['ins-none', 'ins-mineral-wool', 'ins-eps', 'ins-xps'];
const ORIENTATION_OPTIONS = [0, 90, 180, 270];
const WINDOW_RATIO_OPTIONS = [0.05, 0.10, 0.15, 0.20];
const VENTILATION_OPTIONS: VentilationType[] = ['natural', 'cross', 'mechanical', 'hybrid'];
const SHADING_OPTIONS: ShadingType[] = ['none', 'overhang', 'external', 'louvers'];

// Climate-specific filtering to keep the search space manageable and relevant
function filterOptionsByClimate(climateType: string): {
  walls: string[];
  roofs: string[];
  insulation: string[];
  ventilation: VentilationType[];
  shading: ShadingType[];
  orientations: number[];
  windowRatios: number[];
} {
  const isCold = climateType === 'high-altitude-cold' || climateType === 'cold';
  const isHot = climateType === 'hot-dry' || climateType === 'warm-humid';

  return {
    walls: isCold
      ? ['wall-aac', 'wall-mud', 'wall-insulated-panel']
      : ['wall-brick', 'wall-aac', 'wall-mud'],
    roofs: isCold
      ? ['roof-insulated-metal', 'roof-rcc']
      : ['roof-cool', 'roof-insulated-metal', 'roof-rcc'],
    insulation: isCold
      ? ['ins-mineral-wool', 'ins-eps', 'ins-xps']
      : ['ins-none', 'ins-eps', 'ins-xps'],
    ventilation: isCold
      ? ['natural', 'hybrid']
      : ['cross', 'mechanical', 'hybrid'],
    shading: isCold
      ? ['none', 'overhang']
      : ['overhang', 'external', 'louvers'],
    orientations: isCold ? [180, 90, 270] : [0, 90, 180],
    windowRatios: isCold ? [0.05, 0.10, 0.15] : [0.05, 0.10, 0.15, 0.20],
  };
}

function buildShelter(base: ShelterModel, opt: OptConfig): ShelterModel {
  const wallMat = getMaterial(opt.wallMaterialId);
  const { length, width, height } = base.geometry;
  const wallArea = 2 * (length + width) * height;

  return {
    ...base,
    wallMaterialId: opt.wallMaterialId,
    roofMaterialId: opt.roofMaterialId,
    insulationMaterialId: opt.insulationMaterialId,
    insulationThickness: opt.insulationMaterialId === 'ins-none' ? 0 : opt.insulationThickness,
    geometry: { ...base.geometry, orientation: opt.orientation },
    openings: {
      ...base.openings,
      windowRatio: opt.windowRatio,
      windowArea: Math.round(wallArea * opt.windowRatio * 100) / 100,
    },
    ventilation: opt.ventilation,
    shading: opt.shading,
  };
}

function scoreCandidate(
  metrics: PerformanceMetrics,
  comfort: ComfortResult,
  cost: CostEstimate,
  sustainability: SustainabilityMetrics,
  weights: OptimizationWeights,
): { overall: number; subscores: OptimizationCandidate['scores'] } {
  // Subscores 0-100
  const comfortScore = comfort.score;
  const retentionScore = metrics.thermalRetentionIndex;
  const energyScore = 100 - metrics.energyDemandIndex;
  const solarScore = Math.min(100, metrics.solarHeatGain * 15); // more solar utilization = better
  const costScore = Math.max(0, 100 - cost.costPerSqm / 80); // lower cost = higher score
  const sustainScore = sustainability.sustainabilityScore;

  const totalWeight = weights.comfort + weights.retention + weights.energy + weights.solar + weights.cost + weights.sustainability;

  const overall =
    (comfortScore * weights.comfort +
      retentionScore * weights.retention +
      energyScore * weights.energy +
      solarScore * weights.solar +
      costScore * weights.cost +
      sustainScore * weights.sustainability) / totalWeight;

  return {
    overall: Math.round(overall * 10) / 10,
    subscores: {
      comfort: Math.round(comfortScore),
      retention: Math.round(retentionScore),
      energy: Math.round(energyScore),
      solar: Math.round(solarScore),
      cost: Math.round(costScore),
      sustainability: Math.round(sustainScore),
    },
  };
}

function generateLabel(opt: OptConfig): string {
  const wall = getMaterial(opt.wallMaterialId)?.name.split(' ')[0] ?? '?';
  const roof = getMaterial(opt.roofMaterialId)?.name.split(' ')[0] ?? '?';
  const ins = opt.insulationMaterialId === 'ins-none' ? 'No Ins' : getMaterial(opt.insulationMaterialId)?.name.split(' ')[0] ?? '?';
  const vent = opt.ventilation === 'cross' ? 'CrossVent' : opt.ventilation === 'mechanical' ? 'MechVent' : opt.ventilation === 'hybrid' ? 'HybridVent' : 'NatVent';
  const shade = opt.shading === 'none' ? 'NoShade' : opt.shading === 'overhang' ? 'Overhang' : opt.shading === 'external' ? 'ExtShade' : 'Louvers';
  return `${wall}+${roof}+${ins}+${vent}+${shade}+${opt.orientation}°`;
}

export function runOptimization(
  climate: ClimateProfile,
  baseShelter: ShelterModel,
  simConfig: SimulationConfig,
  weights: OptimizationWeights,
  onProgress?: (current: number, total: number) => void,
): OptimizationCandidate[] {
  const opts = filterOptionsByClimate(climate.climateType);

  const candidates: OptimizationCandidate[] = [];
  let id = 0;

  const configs: OptConfig[] = [];
  for (const wall of opts.walls) {
    for (const roof of opts.roofs) {
      for (const ins of opts.insulation) {
        for (const orient of opts.orientations) {
          for (const wr of opts.windowRatios) {
            for (const vent of opts.ventilation) {
              for (const shade of opts.shading) {
                configs.push({
                  wallMaterialId: wall,
                  roofMaterialId: roof,
                  insulationMaterialId: ins,
                  insulationThickness: ins === 'ins-none' ? 0 : 0.075,
                  orientation: orient,
                  windowRatio: wr,
                  ventilation: vent,
                  shading: shade,
                });
              }
            }
          }
        }
      }
    }
  }

  const total = configs.length;

  for (let i = 0; i < configs.length; i++) {
    const opt = configs[i];
    const shelter = buildShelter(baseShelter, opt);
    const result = runSimulation(climate, shelter, simConfig);
    const cost = calculateCost(shelter);
    const sustainability = calculateSustainability(result.metrics, shelter, climate);
    const { overall, subscores } = scoreCandidate(result.metrics, result.comfort, cost, sustainability, weights);

    candidates.push({
      id: id++,
      label: generateLabel(opt),
      shelter,
      metrics: result.metrics,
      comfort: result.comfort,
      cost,
      sustainability,
      overallScore: overall,
      scores: subscores,
    });

    if (onProgress && i % 10 === 0) {
      onProgress(i + 1, total);
    }
  }

  candidates.sort((a, b) => b.overallScore - a.overallScore);
  return candidates;
}
