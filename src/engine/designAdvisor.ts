import type {
  PerformanceMetrics,
  ComfortResult,
  ShelterModel,
  ClimateProfile,
  Recommendation,
} from '@/types';

// ============================================================
// THERMOSHELTER-X Design Advisor
// Deterministic rule-based expert recommendation engine.
// NOT a paid LLM. Recommendations change by climate type.
// ============================================================

export function generateRecommendations(
  metrics: PerformanceMetrics,
  comfort: ComfortResult,
  shelter: ShelterModel,
  climate: ClimateProfile,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const climateType = climate.climateType;
  const isCold = climateType === 'high-altitude-cold' || climateType === 'cold';
  const isHot = climateType === 'hot-dry' || climateType === 'warm-humid';

  // --- Heat loss too high ---
  if (metrics.totalHeatLoss > metrics.totalHeatGain * 0.8) {
    recs.push({
      id: 'insul-increase',
      title: 'Increase insulation thickness',
      reason: `Total heat loss (${metrics.totalHeatLoss} kWh) is high relative to heat gain (${metrics.totalHeatGain} kWh). The envelope is losing heat faster than it can be retained.`,
      expectedImpact: 'Reduce heat loss by 15-30%, improve thermal retention by 10-20%',
      priority: 'high',
      climate: isCold ? 'high-altitude-cold' : 'all',
    });
  }

  // --- Solar gain low in cold climate ---
  if (isCold && metrics.solarHeatGain < metrics.totalHeatGain * 0.2) {
    recs.push({
      id: 'solar-exposure',
      title: 'Increase south-facing solar exposure',
      reason: `Solar heat gain (${metrics.solarHeatGain} kWh) is low. In cold climates, passive solar heating is critical for thermal comfort and energy reduction.`,
      expectedImpact: 'Increase solar gain by 20-40%, reduce heating energy demand by 15-25%',
      priority: 'high',
      climate: climateType,
    });
  }

  // --- Solar gain excessive in hot climate ---
  if (isHot && metrics.solarHeatGain > metrics.totalHeatGain * 0.5) {
    recs.push({
      id: 'add-shading',
      title: 'Add external shading or louvers',
      reason: `Solar heat gain (${metrics.solarHeatGain} kWh) contributes over 50% of total heat gain. Reducing solar ingress is essential for cooling comfort.`,
      expectedImpact: 'Reduce indoor peak temperature by 2-5°C, improve comfort score by 10-20 points',
      priority: 'high',
      climate: climateType,
    });
  }

  // --- Temperature fluctuation high ---
  if (metrics.temperatureFluctuation > 8) {
    recs.push({
      id: 'thermal-mass',
      title: 'Increase thermal mass / envelope resistance',
      reason: `Indoor temperature fluctuation is ${metrics.temperatureFluctuation}°C. High fluctuation indicates insufficient thermal mass or envelope resistance to buffer outdoor swings.`,
      expectedImpact: 'Reduce temperature fluctuation by 30-50%, improve thermal retention by 15-25%',
      priority: 'medium',
      climate: 'all',
    });
  }

  // --- Ventilation insufficient in warm-humid ---
  if (climateType === 'warm-humid' && shelter.ventilation === 'natural') {
    recs.push({
      id: 'cross-vent',
      title: 'Improve cross ventilation',
      reason: 'Warm-humid climates require high air exchange rates for comfort. Natural ventilation alone is insufficient.',
      expectedImpact: 'Improve ventilation effectiveness by 40-60%, reduce perceived temperature by 2-3°C',
      priority: 'high',
      climate: 'warm-humid',
    });
  }

  // --- Opening ratio excessive ---
  if (shelter.openings.windowRatio > 0.20) {
    recs.push({
      id: 'reduce-openings',
      title: 'Reduce exposed opening area',
      reason: `Window-to-wall ratio is ${(shelter.openings.windowRatio * 100).toFixed(0)}%. Excessive openings increase unwanted heat gain in hot climates and heat loss in cold climates.`,
      expectedImpact: 'Reduce unwanted heat transfer by 15-25%',
      priority: 'medium',
      climate: 'all',
    });
  }

  // --- Roof heat gain dominant ---
  if (metrics.totalHeatGain > 0) {
    const roofContribution = 0.3; // approximate
    if (isHot && roofContribution > 0.25) {
      recs.push({
        id: 'cool-roof',
        title: 'Apply reflective/cool-roof treatment',
        reason: 'Roof receives the most solar radiation in hot climates. A cool roof with high solar reflectance significantly reduces heat ingress.',
        expectedImpact: 'Reduce roof heat gain by 30-50%, lower peak indoor temperature by 2-4°C',
        priority: 'high',
        climate: climateType,
      });
    }
  }

  // --- Energy demand high ---
  if (metrics.energyDemandIndex > 50) {
    recs.push({
      id: 'envelope-upgrade',
      title: 'Upgrade envelope performance',
      reason: `Energy demand index is ${metrics.energyDemandIndex}/100. A better envelope reduces the need for active heating/cooling.`,
      expectedImpact: 'Reduce energy demand by 20-40%, lower operational CO₂ by 20-35%',
      priority: 'medium',
      climate: 'all',
    });
  }

  // --- Comfort score low ---
  if (comfort.score < 60) {
    recs.push({
      id: 'holistic-review',
      title: 'Conduct holistic design review',
      reason: `Comfort score is ${comfort.score}/100 (${comfort.category}). Multiple parameters may need adjustment — orientation, materials, insulation, and ventilation should be reviewed together.`,
      expectedImpact: 'Improve comfort score by 15-30 points through combined strategies',
      priority: 'high',
      climate: 'all',
    });
  }

  // --- Night ventilation for hot-dry ---
  if (climateType === 'hot-dry' && shelter.ventilation !== 'cross' && shelter.ventilation !== 'mechanical') {
    recs.push({
      id: 'night-vent',
      title: 'Implement night-purge ventilation',
      reason: 'Hot-dry climates benefit from night ventilation to flush accumulated heat and cool the thermal mass for the next day.',
      expectedImpact: 'Reduce morning start temperature by 3-5°C, improve daytime comfort by 10-15%',
      priority: 'medium',
      climate: 'hot-dry',
    });
  }

  // --- Cold climate: nighttime heat loss ---
  if (isCold && metrics.minIndoor < 5) {
    recs.push({
      id: 'night-insulation',
      title: 'Enhance nighttime insulation',
      reason: `Minimum indoor temperature reaches ${metrics.minIndoor}°C. Cold-climate shelters need strategies to reduce nighttime radiative and convective heat loss.`,
      expectedImpact: 'Raise minimum indoor temperature by 3-6°C, improve comfort score by 15-25 points',
      priority: 'high',
      climate: climateType,
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

export const PRIORITY_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
};
