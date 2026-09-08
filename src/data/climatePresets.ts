import type { ClimateProfile, ClimateDataPoint, ClimateType } from '@/types';

interface PresetMeta {
  location: string;
  climateType: ClimateType;
  description: string;
  minTemp: number;
  maxTemp: number;
  avgHumidity: number;
  avgWind: number;
  peakSolar: number;
}

export const CLIMATE_PRESETS: PresetMeta[] = [
  {
    location: 'Leh / Ladakh',
    climateType: 'high-altitude-cold',
    description: 'High-altitude cold desert. Extreme diurnal range, intense solar radiation, very cold nights.',
    minTemp: -2,
    maxTemp: 22,
    avgHumidity: 40,
    avgWind: 3.5,
    peakSolar: 950,
  },
  {
    location: 'Srinagar',
    climateType: 'cold',
    description: 'Cold climate with moderate humidity. Significant seasonal variation.',
    minTemp: 2,
    maxTemp: 28,
    avgHumidity: 65,
    avgWind: 2.0,
    peakSolar: 700,
  },
  {
    location: 'Surat',
    climateType: 'warm-humid',
    description: 'Warm-humid coastal climate. High humidity year-round, moderate diurnal range.',
    minTemp: 24,
    maxTemp: 36,
    avgHumidity: 78,
    avgWind: 4.0,
    peakSolar: 750,
  },
  {
    location: 'Ahmedabad',
    climateType: 'hot-dry',
    description: 'Hot-dry climate. Very high daytime temperatures, large diurnal range, low humidity.',
    minTemp: 24,
    maxTemp: 44,
    avgHumidity: 35,
    avgWind: 3.0,
    peakSolar: 900,
  },
  {
    location: 'Delhi',
    climateType: 'composite',
    description: 'Composite climate. Distinct seasons — extreme summer, monsoon, winter. Requires balanced design.',
    minTemp: 8,
    maxTemp: 40,
    avgHumidity: 55,
    avgWind: 2.5,
    peakSolar: 800,
  },
];

// Generate a 24-hour sinusoidal temperature profile
function generateProfile(meta: PresetMeta, durationHours: number, timeStepMinutes: number): ClimateDataPoint[] {
  const points: ClimateDataPoint[] = [];
  const dt = timeStepMinutes / 60;
  const totalSteps = Math.round(durationHours / dt);

  const avgTemp = (meta.minTemp + meta.maxTemp) / 2;
  const amplitude = (meta.maxTemp - meta.minTemp) / 2;

  for (let i = 0; i <= totalSteps; i++) {
    const t = i * dt;
    // Temperature: minimum around 5:00, maximum around 15:00
    const tempPhase = ((t - 5) / 24) * 2 * Math.PI;
    const ambientTemp = avgTemp + amplitude * Math.sin(tempPhase);

    // Solar radiation: bell curve centered at 12:00, zero at night
    const hourOfDay = t % 24;
    let solar = 0;
    if (hourOfDay >= 6 && hourOfDay <= 18) {
      const solarPhase = ((hourOfDay - 6) / 12) * Math.PI;
      solar = meta.peakSolar * Math.sin(solarPhase);
      solar = Math.max(0, solar);
    }

    // Wind: slightly higher in afternoon, base + variation
    const windBase = meta.avgWind;
    const windVar = 1.5 * Math.sin(((t - 9) / 24) * 2 * Math.PI);
    const wind = Math.max(0.5, windBase + windVar);

    // Humidity: inverse to temperature — higher at night
    const humidityBase = meta.avgHumidity;
    const humidityVar = 15 * Math.cos(tempPhase);
    const humidity = Math.max(10, Math.min(100, humidityBase + humidityVar));

    points.push({
      time: t,
      ambientTemperature: Math.round(ambientTemp * 10) / 10,
      solarRadiation: Math.round(solar),
      windSpeed: Math.round(wind * 10) / 10,
      relativeHumidity: Math.round(humidity),
    });
  }

  return points;
}

export function createClimateProfile(
  location: string,
  climateType: ClimateType,
  durationHours: number,
  timeStepMinutes: number,
): ClimateProfile {
  const meta = CLIMATE_PRESETS.find(p => p.location === location) ?? CLIMATE_PRESETS[0];
  return {
    location,
    climateType,
    durationHours,
    timeStepMinutes,
    data: generateProfile(meta, durationHours, timeStepMinutes),
    source: 'Illustrative demonstration profile — not official measured field data.',
  };
}

export function getPresetByLocation(location: string): PresetMeta | undefined {
  return CLIMATE_PRESETS.find(p => p.location === location);
}

export const CLIMATE_TYPE_LABELS: Record<ClimateType, string> = {
  'high-altitude-cold': 'High-Altitude Cold',
  'warm-humid': 'Warm-Humid',
  'hot-dry': 'Hot-Dry',
  composite: 'Composite',
  cold: 'Cold',
};

export const CLIMATE_TYPE_COLORS: Record<ClimateType, string> = {
  'high-altitude-cold': '#0ea5e9',
  'warm-humid': '#14b8a6',
  'hot-dry': '#f59e0b',
  composite: '#8b5cf6',
  cold: '#3b82f6',
};
