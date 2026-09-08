import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  ClimateProfile,
  ShelterModel,
  SimulationConfig,
  SimulationResult,
  OptimizationCandidate,
  OptimizationWeights,
  SavedConfiguration,
  CostEstimate,
  SustainabilityMetrics,
  Recommendation,
} from '@/types';
import { createClimateProfile, CLIMATE_PRESETS } from '@/data/climatePresets';
import { runSimulation } from '@/engine/thermalEngine';
import { calculateCost } from '@/engine/costEngine';
import { calculateSustainability } from '@/engine/sustainabilityEngine';
import { generateRecommendations } from '@/engine/designAdvisor';

interface AppState {
  climate: ClimateProfile;
  shelter: ShelterModel;
  simConfig: SimulationConfig;
  simResult: SimulationResult | null;
  baselineResult: SimulationResult | null;
  optimizedResult: SimulationResult | null;
  optimizationCandidates: OptimizationCandidate[];
  optimizationWeights: OptimizationWeights;
  savedConfigs: SavedConfiguration[];
  recommendations: Recommendation[];
  cost: CostEstimate;
  sustainability: SustainabilityMetrics;
  appliedOptimized: boolean;
}

interface AppActions {
  setClimate: (c: ClimateProfile) => void;
  setShelter: (s: ShelterModel) => void;
  setSimConfig: (c: SimulationConfig) => void;
  runSim: () => void;
  setOptimizationCandidates: (c: OptimizationCandidate[]) => void;
  setOptimizationWeights: (w: OptimizationWeights) => void;
  applyOptimizedDesign: (candidate: OptimizationCandidate) => void;
  saveBaseline: () => void;
  runLadakhCaseStudy: () => void;
  loadDemo: () => void;
  addSavedConfig: (config: SavedConfiguration) => void;
  removeSavedConfig: (id: string) => void;
  clearSavedConfigs: () => void;
  recalculateRecommendations: () => void;
}

type AppContextValue = AppState & AppActions;

const DEFAULT_CLIMATE = createClimateProfile('Leh / Ladakh', 'high-altitude-cold', 24, 60);

const DEFAULT_SHELTER: ShelterModel = {
  geometry: { length: 8, width: 5, height: 3, orientation: 180 },
  openings: { windowRatio: 0.10, windowArea: 3.9, windowOrientation: 180, doorArea: 1.8 },
  wallMaterialId: 'wall-brick',
  roofMaterialId: 'roof-rcc',
  floorMaterialId: 'floor-concrete',
  insulationMaterialId: 'ins-none',
  insulationThickness: 0,
  ventilation: 'natural',
  shading: 'none',
  label: 'Baseline Design',
};

const DEFAULT_SIM_CONFIG: SimulationConfig = {
  durationHours: 24,
  timeStepMinutes: 60,
  internalHeatGain: 200,
  initialIndoorTemp: 16,
};

const DEFAULT_WEIGHTS: OptimizationWeights = {
  comfort: 35,
  retention: 20,
  energy: 20,
  solar: 10,
  cost: 10,
  sustainability: 5,
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [climate, setClimate] = useState<ClimateProfile>(DEFAULT_CLIMATE);
  const [shelter, setShelter] = useState<ShelterModel>(DEFAULT_SHELTER);
  const [simConfig, setSimConfig] = useState<SimulationConfig>(DEFAULT_SIM_CONFIG);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [baselineResult, setBaselineResult] = useState<SimulationResult | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<SimulationResult | null>(null);
  const [optimizationCandidates, setOptimizationCandidates] = useState<OptimizationCandidate[]>([]);
  const [optimizationWeights, setOptimizationWeights] = useState<OptimizationWeights>(DEFAULT_WEIGHTS);
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [appliedOptimized, setAppliedOptimized] = useState(false);

  const cost = calculateCost(shelter);

  const sustainability = simResult
    ? calculateSustainability(simResult.metrics, shelter, climate)
    : calculateSustainability(
        { peakIndoor: 0, minIndoor: 0, avgIndoor: 0, temperatureFluctuation: 0,
          totalHeatGain: 0, totalHeatLoss: 0, solarHeatGain: 0,
          thermalRetentionIndex: 50, ventilationEffectiveness: 30,
          energyDemandIndex: 50, comfortScore: 50 },
        shelter, climate
      );

  const runSim = useCallback(() => {
    const result = runSimulation(climate, shelter, simConfig);
    setSimResult(result);
    const recs = generateRecommendations(result.metrics, result.comfort, shelter, climate);
    setRecommendations(recs);
  }, [climate, shelter, simConfig]);

  const recalculateRecommendations = useCallback(() => {
    if (simResult) {
      const recs = generateRecommendations(simResult.metrics, simResult.comfort, shelter, climate);
      setRecommendations(recs);
    }
  }, [simResult, shelter, climate]);

  const applyOptimizedDesign = useCallback((candidate: OptimizationCandidate) => {
    setShelter({ ...candidate.shelter, label: 'Optimized Design' });
    setAppliedOptimized(true);
    // Run simulation with the new shelter
    const result = runSimulation(climate, candidate.shelter, simConfig);
    setOptimizedResult(result);
    setSimResult(result);
    const recs = generateRecommendations(result.metrics, result.comfort, candidate.shelter, climate);
    setRecommendations(recs);
  }, [climate, simConfig]);

  const saveBaseline = useCallback(() => {
    if (!simResult) return;
    const config: SavedConfiguration = {
      id: `config-${Date.now()}`,
      name: shelter.label,
      shelter: { ...shelter },
      climate: { ...climate },
      result: simResult,
      cost: calculateCost(shelter),
      sustainability: calculateSustainability(simResult.metrics, shelter, climate),
      timestamp: Date.now(),
    };
    setSavedConfigs(prev => [...prev, config]);
  }, [simResult, shelter, climate]);

  const runLadakhCaseStudy = useCallback(() => {
    const ladakhClimate = createClimateProfile('Leh / Ladakh', 'high-altitude-cold', 24, 60);
    setClimate(ladakhClimate);

    // Baseline: poor envelope
    const baselineShelter: ShelterModel = {
      geometry: { length: 8, width: 5, height: 3, orientation: 0 },
      openings: { windowRatio: 0.05, windowArea: 1.95, windowOrientation: 0, doorArea: 1.8 },
      wallMaterialId: 'wall-brick',
      roofMaterialId: 'roof-metal',
      floorMaterialId: 'floor-concrete',
      insulationMaterialId: 'ins-none',
      insulationThickness: 0,
      ventilation: 'natural',
      shading: 'none',
      label: 'Baseline Design (Ladakh)',
    };

    setShelter(baselineShelter);
    setAppliedOptimized(false);

    const baselineSimConfig: SimulationConfig = {
      durationHours: 24,
      timeStepMinutes: 60,
      internalHeatGain: 150,
      initialIndoorTemp: 10,
    };
    setSimConfig(baselineSimConfig);

    const baselineRun = runSimulation(ladakhClimate, baselineShelter, baselineSimConfig);
    setSimResult(baselineRun);
    setBaselineResult(baselineRun);

    const recs = generateRecommendations(baselineRun.metrics, baselineRun.comfort, baselineShelter, ladakhClimate);
    setRecommendations(recs);
  }, []);

  const loadDemo = useCallback(() => {
    const demoClimate = createClimateProfile('Leh / Ladakh', 'high-altitude-cold', 24, 60);
    setClimate(demoClimate);
    setShelter(DEFAULT_SHELTER);
    setSimConfig(DEFAULT_SIM_CONFIG);
    setOptimizationCandidates([]);
    setSavedConfigs([]);
    setAppliedOptimized(false);

    const result = runSimulation(demoClimate, DEFAULT_SHELTER, DEFAULT_SIM_CONFIG);
    setSimResult(result);
    setBaselineResult(result);
    const recs = generateRecommendations(result.metrics, result.comfort, DEFAULT_SHELTER, demoClimate);
    setRecommendations(recs);
  }, []);

  const addSavedConfig = useCallback((config: SavedConfiguration) => {
    setSavedConfigs(prev => [...prev, config]);
  }, []);

  const removeSavedConfig = useCallback((id: string) => {
    setSavedConfigs(prev => prev.filter(c => c.id !== id));
  }, []);

  const clearSavedConfigs = useCallback(() => {
    setSavedConfigs([]);
  }, []);

  const value: AppContextValue = {
    climate,
    shelter,
    simConfig,
    simResult,
    baselineResult,
    optimizedResult,
    optimizationCandidates,
    optimizationWeights,
    savedConfigs,
    recommendations,
    cost,
    sustainability,
    appliedOptimized,
    setClimate,
    setShelter,
    setSimConfig,
    runSim,
    setOptimizationCandidates,
    setOptimizationWeights,
    applyOptimizedDesign,
    saveBaseline,
    runLadakhCaseStudy,
    loadDemo,
    addSavedConfig,
    removeSavedConfig,
    clearSavedConfigs,
    recalculateRecommendations,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
