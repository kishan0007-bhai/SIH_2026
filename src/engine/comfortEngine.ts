import type { ComfortResult, VentilationType } from '@/types';

// ============================================================
// Thermal Comfort Engine — Prototype comfort index
//
// Simplified comfort model based on indoor temperature, humidity,
// and air movement. NOT an official PMV/PPD certification.
// ============================================================

const COMFORT_CATEGORIES: { min: number; max: number; label: string }[] = [
  { min: 90, max: 100, label: 'Excellent' },
  { min: 75, max: 89, label: 'Comfortable' },
  { min: 60, max: 74, label: 'Acceptable' },
  { min: 40, max: 59, label: 'Uncomfortable' },
  { min: 0, max: 39, label: 'Critical' },
];

export function getComfortCategory(score: number): string {
  const cat = COMFORT_CATEGORIES.find(c => score >= c.min && score <= c.max);
  return cat?.label ?? 'Critical';
}

export function getComfortColor(score: number): string {
  if (score >= 90) return '#10b981';
  if (score >= 75) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

export function calculateComfort(
  avgIndoorTemp: number,
  avgHumidity: number,
  ventilation: VentilationType,
): ComfortResult {
  // Optimal comfort temperature band: 20-26°C
  const optimal = 23;
  const tempDeviation = Math.abs(avgIndoorTemp - optimal);

  // Temperature score: 100 at optimal, decreasing with deviation
  let tempScore = 100 - tempDeviation * 7;
  tempScore = Math.max(0, Math.min(100, tempScore));

  // Humidity adjustment: ideal 30-60%, penalty outside
  let humidityPenalty = 0;
  if (avgHumidity < 30) humidityPenalty = (30 - avgHumidity) * 0.3;
  else if (avgHumidity > 60) humidityPenalty = (avgHumidity - 60) * 0.4;
  humidityPenalty = Math.max(0, humidityPenalty);

  // Air movement bonus: cross/mechanical ventilation helps comfort in warm conditions
  const airBonusMap: Record<VentilationType, number> = {
    natural: 0,
    cross: avgIndoorTemp > 26 ? 8 : 0,
    mechanical: avgIndoorTemp > 26 ? 10 : 0,
    hybrid: avgIndoorTemp > 26 ? 9 : 0,
  };
  const airBonus = airBonusMap[ventilation] ?? 0;

  let score = tempScore - humidityPenalty + airBonus;
  score = Math.max(0, Math.min(100, Math.round(score)));

  const category = getComfortCategory(score);

  return {
    score,
    category,
    avgIndoor: Math.round(avgIndoorTemp * 10) / 10,
    avgOutdoor: 0, // filled by caller context
    temperatureReduction: 0,
    avgHumidity: Math.round(avgHumidity),
  };
}
