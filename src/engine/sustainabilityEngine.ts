import type {
  PerformanceMetrics,
  ShelterModel,
  ClimateProfile,
  SustainabilityMetrics,
} from '@/types';
import { VENTILATION_ACH } from '@/data/materials';

// ============================================================
// Sustainability Engine
// CO₂ values are indicative estimates.
// ============================================================

const CO2_PER_KWH = 0.82; // kg CO₂ per kWh (India grid average, indicative)

export function calculateSustainability(
  metrics: PerformanceMetrics,
  shelter: ShelterModel,
  climate: ClimateProfile,
): SustainabilityMetrics {
  const { length, width } = shelter.geometry;
  const floorArea = length * width;

  // Passive contribution: fraction of comfort achieved without active energy
  const passiveContribution = Math.max(0, Math.min(100, 100 - metrics.energyDemandIndex));

  // Active burden: inverse of passive contribution
  const activeBurden = 100 - passiveContribution;

  // Solar utilization: solar heat gain relative to total heat gain
  const solarUtilization = metrics.totalHeatGain > 0
    ? Math.min(100, (metrics.solarHeatGain / metrics.totalHeatGain) * 100)
    : 0;

  // Thermal efficiency: how well envelope retains heat (retention + low loss)
  const thermalEfficiency = Math.round(
    0.5 * metrics.thermalRetentionIndex +
    0.5 * Math.max(0, 100 - metrics.energyDemandIndex)
  );

  // CO2 impact: based on estimated annual energy demand
  // Scale simulation energy to annual (rough)
  const daysPerYear = 180; // heating/cooling season
  const dailyEnergyKwh = metrics.energyDemandIndex * 0.5 * floorArea / 100;
  const co2Impact = Math.round(dailyEnergyKwh * daysPerYear * CO2_PER_KWH);

  // Sustainability score: weighted combination
  const sustainabilityScore = Math.round(
    0.35 * passiveContribution +
    0.25 * (100 - metrics.energyDemandIndex) +
    0.15 * solarUtilization +
    0.15 * thermalEfficiency +
    0.10 * Math.max(0, 100 - (co2Impact / (floorArea * 10)))
  );

  return {
    passiveContribution: Math.round(passiveContribution),
    energyDemandIndex: Math.round(metrics.energyDemandIndex),
    activeBurden: Math.round(activeBurden),
    solarUtilization: Math.round(solarUtilization),
    thermalEfficiency,
    co2Impact,
    sustainabilityScore: Math.max(0, Math.min(100, sustainabilityScore)),
  };
}
