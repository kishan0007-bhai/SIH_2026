import type { ShelterModel, CostEstimate } from '@/types';
import { getMaterial } from '@/data/materials';

// ============================================================
// Cost Estimation Engine
// Indicative prototype estimate — local rates required for deployment.
// ============================================================

const SHADING_COST: Record<string, number> = {
  none: 0,
  overhang: 350,
  external: 500,
  louvers: 800,
  vegetation: 400,
};

const VENTILATION_COST: Record<string, number> = {
  natural: 0,
  cross: 100,
  mechanical: 1200,
  hybrid: 600,
};

const WINDOW_COST_PER_SQM = 3500; // ₹/m² for glazed windows

export function calculateCost(shelter: ShelterModel): CostEstimate {
  const { length, width } = shelter.geometry;
  const floorArea = length * width;
  const wallArea = 2 * (length + width) * shelter.geometry.height;
  const roofArea = floorArea;

  const wallMat = getMaterial(shelter.wallMaterialId);
  const roofMat = getMaterial(shelter.roofMaterialId);
  const floorMat = getMaterial(shelter.floorMaterialId);
  const insMat = getMaterial(shelter.insulationMaterialId);

  const wallCost = (wallMat?.costPerSqm ?? 1500) * wallArea;
  const roofCost = (roofMat?.costPerSqm ?? 2000) * roofArea;
  const floorCost = (floorMat?.costPerSqm ?? 1200) * floorArea;
  const windowCost = shelter.openings.windowArea * WINDOW_COST_PER_SQM;

  const envelopeCost = wallCost + roofCost + floorCost + windowCost;

  const insulationArea = shelter.insulationThickness > 0 ? wallArea + roofArea : 0;
  const insulationCost = (insMat?.costPerSqm ?? 0) * insulationArea * (shelter.insulationThickness > 0 ? 1 : 0);
  const shadingCost = (SHADING_COST[shelter.shading] ?? 0) * wallArea * 0.3;
  const ventilationCost = (VENTILATION_COST[shelter.ventilation] ?? 0) * floorArea;

  const thermalEnhancementCost = insulationCost + shadingCost + ventilationCost;
  const totalCost = envelopeCost + thermalEnhancementCost;

  return {
    envelopeCost: Math.round(envelopeCost),
    thermalEnhancementCost: Math.round(thermalEnhancementCost),
    totalCost: Math.round(totalCost),
    costPerSqm: Math.round(totalCost / Math.max(1, floorArea)),
  };
}
