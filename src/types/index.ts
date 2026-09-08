// ============================================================
// THERMOSHELTER-X — Core Type Definitions
// Zone Zero • SIH 2026 • PS SIH26051
// ============================================================

export type ClimateType =
  | 'high-altitude-cold'
  | 'warm-humid'
  | 'hot-dry'
  | 'composite'
  | 'cold';

export type VentilationType =
  | 'natural'
  | 'cross'
  | 'mechanical'
  | 'hybrid';

export type ShadingType =
  | 'none'
  | 'overhang'
  | 'external'
  | 'louvers'
  | 'vegetation';

export interface ClimateDataPoint {
  time: number;          // hours from start (0..duration)
  ambientTemperature: number; // °C
  solarRadiation: number;      // W/m²
  windSpeed: number;           // m/s
  relativeHumidity: number;    // %
}

export interface ClimateProfile {
  location: string;
  climateType: ClimateType;
  durationHours: number;
  timeStepMinutes: number;
  data: ClimateDataPoint[];
  source: string;
}

export interface Material {
  id: string;
  name: string;
  category: 'wall' | 'roof' | 'floor' | 'insulation';
  thermalConductivity: number; // W/(m·K)
  density: number;              // kg/m³
  specificHeat: number;         // J/(kg·K)
  thickness: number;            // m
  costPerSqm: number;           // ₹/m² (indicative)
  color: string;
}

export interface ShelterGeometry {
  length: number;       // m
  width: number;        // m
  height: number;       // m
  orientation: number;  // degrees 0..315
}

export interface ShelterOpenings {
  windowRatio: number;      // 0..1 of wall area
  windowArea: number;       // m²
  windowOrientation: number; // degrees
  doorArea: number;         // m²
}

export interface ShelterModel {
  geometry: ShelterGeometry;
  openings: ShelterOpenings;
  wallMaterialId: string;
  roofMaterialId: string;
  floorMaterialId: string;
  insulationMaterialId: string;
  insulationThickness: number; // m
  ventilation: VentilationType;
  shading: ShadingType;
  label: string;
}

export interface SimulationConfig {
  durationHours: number;
  timeStepMinutes: number;
  internalHeatGain: number; // W (occupancy + equipment)
  initialIndoorTemp: number; // °C
}

export interface SimulationDataPoint {
  time: number;
  ambientTemp: number;
  indoorTemp: number;
  solarGain: number;
  conductionGain: number;
  ventilationGain: number;
  internalGain: number;
  totalHeatGain: number;
  totalHeatLoss: number;
  humidity: number;
}

export interface SimulationResult {
  points: SimulationDataPoint[];
  config: SimulationConfig;
  metrics: PerformanceMetrics;
  comfort: ComfortResult;
}

export interface PerformanceMetrics {
  peakIndoor: number;
  minIndoor: number;
  avgIndoor: number;
  temperatureFluctuation: number;
  totalHeatGain: number;   // kWh
  totalHeatLoss: number;   // kWh
  solarHeatGain: number;   // kWh
  thermalRetentionIndex: number; // 0..100
  ventilationEffectiveness: number; // 0..100
  energyDemandIndex: number; // 0..100 (higher = more active energy needed)
  comfortScore: number;
}

export interface ComfortResult {
  score: number;       // 0..100
  category: string;
  avgIndoor: number;
  avgOutdoor: number;
  temperatureReduction: number;
  avgHumidity: number;
}

export interface OptimizationCandidate {
  id: number;
  label: string;
  shelter: ShelterModel;
  metrics: PerformanceMetrics;
  comfort: ComfortResult;
  cost: CostEstimate;
  sustainability: SustainabilityMetrics;
  overallScore: number;
  scores: {
    comfort: number;
    retention: number;
    energy: number;
    solar: number;
    cost: number;
    sustainability: number;
  };
}

export interface OptimizationWeights {
  comfort: number;      // default 35
  retention: number;    // default 20
  energy: number;       // default 20
  solar: number;        // default 10
  cost: number;         // default 10
  sustainability: number; // default 5
}

export interface CostEstimate {
  envelopeCost: number;
  thermalEnhancementCost: number;
  totalCost: number;
  costPerSqm: number;
}

export interface SustainabilityMetrics {
  passiveContribution: number;   // 0..100
  energyDemandIndex: number;     // 0..100
  activeBurden: number;          // 0..100
  solarUtilization: number;      // 0..100
  thermalEfficiency: number;     // 0..100
  co2Impact: number;             // kg CO2/year (indicative)
  sustainabilityScore: number;   // 0..100
}

export interface Recommendation {
  id: string;
  title: string;
  reason: string;
  expectedImpact: string;
  priority: 'high' | 'medium' | 'low';
  climate: ClimateType | 'all';
}

export interface SavedConfiguration {
  id: string;
  name: string;
  shelter: ShelterModel;
  climate: ClimateProfile;
  result: SimulationResult;
  cost: CostEstimate;
  sustainability: SustainabilityMetrics;
  timestamp: number;
}
