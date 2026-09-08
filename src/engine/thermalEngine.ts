import type {
  ClimateProfile,
  ShelterModel,
  SimulationConfig,
  SimulationDataPoint,
  SimulationResult,
  PerformanceMetrics,
  ComfortResult,
  Material,
} from '@/types';
import { getMaterial, SHADING_FACTORS, VENTILATION_ACH } from '@/data/materials';
import { calculateComfort } from './comfortEngine';

// ============================================================
// Physics-Based Transient Thermal Approximation
//
// Energy balance model:
//   C × dT_inside/dt = Q_solar + Q_conduction + Q_ventilation + Q_internal
//
// This is a preliminary engineering approximation for a hackathon MVP.
// Validation with ANSYS/field measurements required.
// ============================================================

const AIR_DENSITY = 1.225;        // kg/m³
const AIR_SPECIFIC_HEAT = 1005;   // J/(kg·K)
const SOLAR_FACTOR = 0.76;        // SHGC approximation for single glazing
const INTERNAL_CONVECTION_COEFF = 8.0; // W/(m²·K) — indoor surface
const EXTERNAL_CONVECTION_COEFF_BASE = 17.0; // W/(m²·K) — outdoor surface (wind-adjusted)

interface ComputedRValues {
  wallR: number;
  roofR: number;
  floorR: number;
  insulationR: number;
  effectiveWallR: number;
  effectiveRoofR: number;
  effectiveFloorR: number;
}

function computeRValues(shelter: ShelterModel): ComputedRValues {
  const wallMat = getMaterial(shelter.wallMaterialId);
  const roofMat = getMaterial(shelter.roofMaterialId);
  const floorMat = getMaterial(shelter.floorMaterialId);
  const insMat = getMaterial(shelter.insulationMaterialId);

  const { length, width, height } = shelter.geometry;

  const wallArea = 2 * (length + width) * height;
  const roofArea = length * width;
  const floorArea = length * width;

  const wallR = wallMat ? wallMat.thickness / (wallMat.thermalConductivity * wallArea) : 99;
  const roofR = roofMat ? roofMat.thickness / (roofMat.thermalConductivity * roofArea) : 99;
  const floorR = floorMat ? floorMat.thickness / (floorMat.thermalConductivity * floorArea) : 99;

  const insulationR =
    insMat && insMat.id !== 'ins-none' && shelter.insulationThickness > 0
      ? shelter.insulationThickness / (insMat.thermalConductivity * wallArea)
      : 0;

  return {
    wallR,
    roofR,
    floorR,
    insulationR,
    effectiveWallR: wallR + insulationR,
    effectiveRoofR: roofR + insulationR * (roofArea / wallArea),
    effectiveFloorR: floorR,
  };
}

function computeThermalMass(shelter: ShelterModel): number {
  const wallMat = getMaterial(shelter.wallMaterialId);
  const roofMat = getMaterial(shelter.roofMaterialId);
  const floorMat = getMaterial(shelter.floorMaterialId);

  const { length, width, height } = shelter.geometry;
  const wallVolume = 2 * (length + width) * height * (wallMat?.thickness ?? 0.2);
  const roofVolume = length * width * (roofMat?.thickness ?? 0.15);
  const floorVolume = length * width * (floorMat?.thickness ?? 0.1);

  const wallMass = (wallMat?.density ?? 1700) * wallVolume;
  const roofMass = (roofMat?.density ?? 2300) * roofVolume;
  const floorMass = (floorMat?.density ?? 2100) * floorVolume;

  const wallCap = wallMass * (wallMat?.specificHeat ?? 800);
  const roofCap = roofMass * (roofMat?.specificHeat ?? 1000);
  const floorCap = floorMass * (floorMat?.specificHeat ?? 1000);

  // Effective thermal capacitance (only ~40% of mass is thermally active in transient)
  const airVolume = length * width * height;
  const airCap = AIR_DENSITY * airVolume * AIR_SPECIFIC_HEAT;

  return 0.4 * (wallCap + roofCap + floorCap) + airCap;
}

function externalConvectionCoeff(windSpeed: number): number {
  // Wind-enhanced external convection: h = 5 + 3.5 * v
  return Math.max(5, EXTERNAL_CONVECTION_COEFF_BASE * 0.4 + 3.5 * windSpeed);
}

export function runSimulation(
  climate: ClimateProfile,
  shelter: ShelterModel,
  config: SimulationConfig,
): SimulationResult {
  const rv = computeRValues(shelter);
  const thermalCap = computeThermalMass(shelter);

  const { length, width, height } = shelter.geometry;
  const volume = length * width * height;
  const wallArea = 2 * (length + width) * height;
  const roofArea = length * width;
  const floorArea = length * width;

  const shadingFactor = SHADING_FACTORS[shelter.shading] ?? 0;
  const ach = VENTILATION_ACH[shelter.ventilation] ?? 0.5;

  // Effective opening area for solar gain (windows facing the sun)
  const effectiveOpeningArea = shelter.openings.windowArea + shelter.openings.doorArea * 0.3;

  const dt = config.timeStepMinutes * 60; // seconds
  const points: SimulationDataPoint[] = [];

  let indoorTemp = config.initialIndoorTemp;

  let totalGain = 0;
  let totalLoss = 0;
  let totalSolar = 0;
  let peakIndoor = indoorTemp;
  let minIndoor = indoorTemp;
  let tempSum = 0;
  let humiditySum = 0;
  let count = 0;

  for (const dp of climate.data) {
    const Tamb = dp.ambientTemperature;
    const solar = dp.solarRadiation;
    const wind = dp.windSpeed;

    // --- Conduction through walls (including insulation) ---
    const hExt = externalConvectionCoeff(wind);
    // Combined conduction + convection resistance for walls
    const wallConductionR = rv.effectiveWallR + 1 / (INTERNAL_CONVECTION_COEFF * wallArea) + 1 / (hExt * wallArea);
    const Q_wall = (Tamb - indoorTemp) / wallConductionR;

    // --- Conduction through roof ---
    const roofConductionR = rv.effectiveRoofR + 1 / (INTERNAL_CONVECTION_COEFF * roofArea) + 1 / (hExt * roofArea);
    const Q_roof = (Tamb - indoorTemp) / roofConductionR;

    // --- Conduction through floor (ground-coupled, assume ground temp = avg ambient - 2) ---
    const groundTemp = Tamb - 2; // simplified
    const floorConductionR = rv.effectiveFloorR + 1 / (INTERNAL_CONVECTION_COEFF * floorArea);
    const Q_floor = (groundTemp - indoorTemp) / floorConductionR;

    const Q_conduction = Q_wall + Q_roof + Q_floor;

    // --- Solar heat gain through openings ---
    // Orientation factor: south-facing (180°) gets most in cold climates; we apply a cosine-based reduction
    const orientationFactor = 0.5 + 0.5 * Math.cos(((shelter.geometry.orientation - 180) * Math.PI) / 180);
    const Q_solar = solar * effectiveOpeningArea * SOLAR_FACTOR * (1 - shadingFactor) * orientationFactor;

    // --- Ventilation / infiltration ---
    const volFlowRate = (ach * volume) / 3600; // m³/s
    const massFlowRate = volFlowRate * AIR_DENSITY;
    const Q_ventilation = massFlowRate * AIR_SPECIFIC_HEAT * (Tamb - indoorTemp);

    // --- Internal heat gain ---
    const Q_internal = config.internalHeatGain;

    // --- Net heat flow ---
    const Q_total = Q_solar + Q_conduction + Q_ventilation + Q_internal;

    // --- Transient update: C × dT/dt = Q_total ---
    const dT = (Q_total * dt) / thermalCap;
    indoorTemp = indoorTemp + dT;

    // Clamp to physically reasonable bounds
    indoorTemp = Math.max(-50, Math.min(80, indoorTemp));

    // Classify gain vs loss
    const conductionGain = Q_conduction > 0 ? Q_conduction : 0;
    const ventilationGain = Q_ventilation > 0 ? Q_ventilation : 0;
    const conductionLoss = Q_conduction < 0 ? -Q_conduction : 0;
    const ventilationLoss = Q_ventilation < 0 ? -Q_ventilation : 0;

    const totalHeatGain = Q_solar + conductionGain + ventilationGain + Q_internal;
    const totalHeatLoss = conductionLoss + ventilationLoss;

    // Accumulate (in Joules, then convert to kWh at the end)
    totalGain += totalHeatGain * dt;
    totalLoss += totalHeatLoss * dt;
    totalSolar += Q_solar * dt;

    if (indoorTemp > peakIndoor) peakIndoor = indoorTemp;
    if (indoorTemp < minIndoor) minIndoor = indoorTemp;
    tempSum += indoorTemp;
    humiditySum += dp.relativeHumidity;
    count++;

    points.push({
      time: dp.time,
      ambientTemp: Tamb,
      indoorTemp: Math.round(indoorTemp * 100) / 100,
      solarGain: Math.round(Q_solar * 10) / 10,
      conductionGain: Math.round(Q_conduction * 10) / 10,
      ventilationGain: Math.round(Q_ventilation * 10) / 10,
      internalGain: Math.round(Q_internal * 10) / 10,
      totalHeatGain: Math.round(totalHeatGain * 10) / 10,
      totalHeatLoss: Math.round(totalHeatLoss * 10) / 10,
      humidity: dp.relativeHumidity,
    });
  }

  const avgIndoor = tempSum / count;
  const avgHumidity = humiditySum / count;
  const avgOutdoor = climate.data.reduce((s, d) => s + d.ambientTemperature, 0) / climate.data.length;

  const comfort = calculateComfort(avgIndoor, avgHumidity, shelter.ventilation);

  // Thermal retention: how well the shelter maintains temperature above outdoor minimum
  const outdoorMin = Math.min(...climate.data.map(d => d.ambientTemperature));
  const outdoorMax = Math.max(...climate.data.map(d => d.ambientTemperature));
  const outdoorRange = outdoorMax - outdoorMin;
  const indoorRange = peakIndoor - minIndoor;
  const thermalRetentionIndex = outdoorRange > 0
    ? Math.max(0, Math.min(100, 100 * (1 - indoorRange / outdoorRange)))
    : 50;

  // Ventilation effectiveness: how much ventilation contributes to comfort
  const ventEffectivenessBase = {
    natural: 30,
    cross: 70,
    mechanical: 85,
    hybrid: 75,
  };
  const ventilationEffectiveness = Math.min(100, ventEffectivenessBase[shelter.ventilation] ?? 40);

  // Energy demand index: higher when indoor temp deviates more from comfort band
  const comfortBandLow = 20;
  const comfortBandHigh = 26;
  let deviation = 0;
  for (const p of points) {
    if (p.indoorTemp < comfortBandLow) deviation += comfortBandLow - p.indoorTemp;
    else if (p.indoorTemp > comfortBandHigh) deviation += p.indoorTemp - comfortBandHigh;
  }
  deviation /= count;
  const energyDemandIndex = Math.max(0, Math.min(100, deviation * 5));

  const metrics: PerformanceMetrics = {
    peakIndoor: Math.round(peakIndoor * 10) / 10,
    minIndoor: Math.round(minIndoor * 10) / 10,
    avgIndoor: Math.round(avgIndoor * 10) / 10,
    temperatureFluctuation: Math.round((peakIndoor - minIndoor) * 10) / 10,
    totalHeatGain: Math.round((totalGain / 3_600_000) * 100) / 100, // kWh
    totalHeatLoss: Math.round((totalLoss / 3_600_000) * 100) / 100,
    solarHeatGain: Math.round((totalSolar / 3_600_000) * 100) / 100,
    thermalRetentionIndex: Math.round(thermalRetentionIndex),
    ventilationEffectiveness: Math.round(ventilationEffectiveness),
    energyDemandIndex: Math.round(energyDemandIndex),
    comfortScore: comfort.score,
  };

  return { points, config, metrics, comfort };
}
