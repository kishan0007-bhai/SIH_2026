import { useApp } from '@/store/AppContext';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Controls';
import { ShelterDiagram } from '@/components/ShelterDiagram';
import { CLIMATE_TYPE_LABELS, CLIMATE_PRESETS } from '@/data/climatePresets';
import { getMaterial, SHADING_LABELS, VENTILATION_LABELS, MATERIALS } from '@/data/materials';
import { getComfortCategory, getComfortColor } from '@/engine/comfortEngine';
import { calculateCost } from '@/engine/costEngine';
import { calculateSustainability } from '@/engine/sustainabilityEngine';
import { runSimulation } from '@/engine/thermalEngine';
import {
  FileText, Download, Printer, FlaskConical, ShieldCheck, ArrowRight, Leaf, Zap,
} from 'lucide-react';
import type { ShelterModel } from '@/types';

export function ReportPage() {
  const { climate, shelter, simConfig, simResult, optimizationCandidates, recommendations, cost, sustainability } = useApp();

  const m = simResult?.metrics;
  const best = optimizationCandidates[0];

  // Generate the report as a downloadable file
  const generateReportText = (): string => {
    const lines: string[] = [];
    lines.push('='.repeat(70));
    lines.push('THERMOSHELTER-X — Engineering Report');
    lines.push('Zone Zero • SIH 2026 • PS: SIH26051');
    lines.push('"Design the shelter for the climate — not the climate for the shelter."');
    lines.push('='.repeat(70));
    lines.push('');

    lines.push('1. PROJECT OVERVIEW');
    lines.push('-'.repeat(40));
    lines.push(`Product: THERMOSHELTER-X`);
    lines.push(`Team: Zone Zero`);
    lines.push(`Event: Smart India Hackathon 2026`);
    lines.push(`Problem Statement: SIH26051`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push('');

    lines.push('2. CLIMATE PROFILE');
    lines.push('-'.repeat(40));
    lines.push(`Location: ${climate.location}`);
    lines.push(`Climate Type: ${CLIMATE_TYPE_LABELS[climate.climateType]}`);
    lines.push(`Duration: ${climate.durationHours} hours`);
    lines.push(`Time Step: ${climate.timeStepMinutes} minutes`);
    lines.push(`Data Points: ${climate.data.length}`);
    lines.push(`Source: ${climate.source}`);
    const avgOutdoor = climate.data.reduce((s, d) => s + d.ambientTemperature, 0) / climate.data.length;
    lines.push(`Average Outdoor Temperature: ${avgOutdoor.toFixed(1)}°C`);
    lines.push('');

    lines.push('3. SHELTER GEOMETRY');
    lines.push('-'.repeat(40));
    lines.push(`Dimensions: ${shelter.geometry.length}m × ${shelter.geometry.width}m × ${shelter.geometry.height}m`);
    lines.push(`Floor Area: ${(shelter.geometry.length * shelter.geometry.width).toFixed(1)} m²`);
    lines.push(`Volume: ${(shelter.geometry.length * shelter.geometry.width * shelter.geometry.height).toFixed(1)} m³`);
    lines.push(`Orientation: ${shelter.geometry.orientation}°`);
    lines.push(`Window-to-Wall Ratio: ${(shelter.openings.windowRatio * 100).toFixed(0)}%`);
    lines.push(`Window Area: ${shelter.openings.windowArea} m²`);
    lines.push(`Door Area: ${shelter.openings.doorArea} m²`);
    lines.push('');

    lines.push('4. MATERIALS');
    lines.push('-'.repeat(40));
    const wm = getMaterial(shelter.wallMaterialId);
    const rm = getMaterial(shelter.roofMaterialId);
    const fm = getMaterial(shelter.floorMaterialId);
    const im = getMaterial(shelter.insulationMaterialId);
    lines.push(`Wall: ${wm?.name} (k=${wm?.thermalConductivity} W/m·K)`);
    lines.push(`Roof: ${rm?.name} (k=${rm?.thermalConductivity} W/m·K)`);
    lines.push(`Floor: ${fm?.name} (k=${fm?.thermalConductivity} W/m·K)`);
    lines.push(`Insulation: ${im?.name} (thickness: ${shelter.insulationThickness * 1000}mm)`);
    lines.push('');

    lines.push('5. SIMULATION PARAMETERS');
    lines.push('-'.repeat(40));
    lines.push(`Duration: ${simConfig.durationHours} hours`);
    lines.push(`Time Step: ${simConfig.timeStepMinutes} minutes`);
    lines.push(`Internal Heat Gain: ${simConfig.internalHeatGain} W`);
    lines.push(`Initial Indoor Temperature: ${simConfig.initialIndoorTemp}°C`);
    lines.push('');

    if (m) {
      lines.push('6. THERMAL PERFORMANCE');
      lines.push('-'.repeat(40));
      lines.push(`Peak Indoor Temperature: ${m.peakIndoor}°C`);
      lines.push(`Minimum Indoor Temperature: ${m.minIndoor}°C`);
      lines.push(`Average Indoor Temperature: ${m.avgIndoor}°C`);
      lines.push(`Temperature Fluctuation: ${m.temperatureFluctuation}°C`);
      lines.push(`Total Heat Gain: ${m.totalHeatGain} kWh`);
      lines.push(`Total Heat Loss: ${m.totalHeatLoss} kWh`);
      lines.push(`Solar Heat Gain: ${m.solarHeatGain} kWh`);
      lines.push(`Thermal Retention Index: ${m.thermalRetentionIndex}/100`);
      lines.push(`Ventilation Effectiveness: ${m.ventilationEffectiveness}/100`);
      lines.push(`Energy Demand Index: ${m.energyDemandIndex}/100`);
      lines.push('');

      lines.push('7. COMFORT ANALYSIS');
      lines.push('-'.repeat(40));
      lines.push(`Comfort Score: ${simResult!.comfort.score}/100`);
      lines.push(`Comfort Category: ${simResult!.comfort.category}`);
      lines.push(`Average Humidity: ${simResult!.comfort.avgHumidity}%`);
      lines.push('');
    }

    if (optimizationCandidates.length > 0) {
      lines.push('8. CANDIDATE COMPARISON (Top 5)');
      lines.push('-'.repeat(40));
      optimizationCandidates.slice(0, 5).forEach((c, i) => {
        lines.push(`  #${i + 1}: ${c.label} — Score: ${c.overallScore} (Comfort: ${c.scores.comfort}, Cost: ₹${(c.cost.totalCost / 1000).toFixed(0)}k)`);
      });
      lines.push('');
    }

    if (best) {
      lines.push('9. OPTIMIZATION RESULTS');
      lines.push('-'.repeat(40));
      lines.push(`Best Configuration: ${best.label}`);
      lines.push(`Overall Score: ${best.overallScore}`);
      lines.push(`Comfort: ${best.scores.comfort}/100`);
      lines.push(`Energy: ${best.scores.energy}/100`);
      lines.push(`Sustainability: ${best.scores.sustainability}/100`);
      lines.push(`Estimated Cost: ₹${best.cost.totalCost.toLocaleString()}`);
      lines.push('');
    }

    lines.push('10. RECOMMENDED CONFIGURATION');
    lines.push('-'.repeat(40));
    if (best) {
      lines.push(`Wall: ${getMaterial(best.shelter.wallMaterialId)?.name}`);
      lines.push(`Roof: ${getMaterial(best.shelter.roofMaterialId)?.name}`);
      lines.push(`Insulation: ${getMaterial(best.shelter.insulationMaterialId)?.name}`);
      lines.push(`Orientation: ${best.shelter.geometry.orientation}°`);
      lines.push(`Ventilation: ${VENTILATION_LABELS[best.shelter.ventilation]}`);
      lines.push(`Shading: ${SHADING_LABELS[best.shelter.shading]}`);
    } else {
      lines.push('No optimization has been run yet.');
    }
    lines.push('');

    lines.push('11. SUSTAINABILITY');
    lines.push('-'.repeat(40));
    lines.push(`Sustainability Score: ${sustainability.sustainabilityScore}/100`);
    lines.push(`Passive Contribution: ${sustainability.passiveContribution}%`);
    lines.push(`Solar Utilization: ${sustainability.solarUtilization}%`);
    lines.push(`CO₂ Impact (indicative): ${sustainability.co2Impact} kg/year`);
    lines.push('');

    lines.push('12. COST ESTIMATE');
    lines.push('-'.repeat(40));
    lines.push(`Envelope Cost: ₹${cost.envelopeCost.toLocaleString()}`);
    lines.push(`Thermal Enhancement Cost: ₹${cost.thermalEnhancementCost.toLocaleString()}`);
    lines.push(`Total Cost: ₹${cost.totalCost.toLocaleString()}`);
    lines.push(`Cost per m²: ₹${cost.costPerSqm.toLocaleString()}`);
    lines.push('');

    lines.push('13. ENGINEERING VALIDATION PATHWAY');
    lines.push('-'.repeat(40));
    lines.push('Prototype Physics Engine → Parametric Configuration →');
    lines.push('ANSYS Mechanical Transient Thermal Analysis →');
    lines.push('Simulation Validation → Field Measurement → Model Calibration');
    lines.push('');
    lines.push('ANSYS integration planned for high-fidelity validation.');
    lines.push('');

    lines.push('14. LIMITATIONS');
    lines.push('-'.repeat(40));
    lines.push('This prototype demonstrates the decision-support architecture and');
    lines.push('preliminary physics-based thermal estimation. High-fidelity');
    lines.push('engineering validation requires ANSYS Mechanical transient thermal');
    lines.push('analysis and field measurements.');
    lines.push('');
    lines.push('NOT claimed: certified engineering result, actual ANSYS');
    lines.push('simulation, guaranteed comfort, exact construction cost, or');
    lines.push('real-world validated performance.');
    lines.push('');

    lines.push('15. FUTURE ANSYS/FIELD VALIDATION');
    lines.push('-'.repeat(40));
    lines.push('Phase 1: Ladakh / High-altitude cold');
    lines.push('Phase 2: Indian Himalayan regions');
    lines.push('Phase 3: Multi-climate (Cold, Hot-Dry, Warm-Humid, Composite, Temperate)');
    lines.push('');
    lines.push('Same framework, new climate inputs.');
    lines.push('');

    lines.push('='.repeat(70));
    lines.push('End of Report — THERMOSHELTER-X • Zone Zero • SIH 2026');
    lines.push('='.repeat(70));

    return lines.join('\n');
  };

  const handleDownload = () => {
    const text = generateReportText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `THERMOSHELTER-X_Report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const config = {
      project: 'THERMOSHELTER-X',
      team: 'Zone Zero',
      event: 'SIH 2026',
      problemStatement: 'SIH26051',
      timestamp: new Date().toISOString(),
      geometry: shelter.geometry,
      openings: shelter.openings,
      materials: {
        wall: getMaterial(shelter.wallMaterialId),
        roof: getMaterial(shelter.roofMaterialId),
        floor: getMaterial(shelter.floorMaterialId),
        insulation: getMaterial(shelter.insulationMaterialId),
        insulationThickness: shelter.insulationThickness,
      },
      ventilation: shelter.ventilation,
      shading: shelter.shading,
      climateProfile: {
        location: climate.location,
        climateType: climate.climateType,
        durationHours: climate.durationHours,
        timeStepMinutes: climate.timeStepMinutes,
      },
      simulationConfig: simConfig,
      boundaryConditions: climate.data,
      results: simResult ? {
        metrics: simResult.metrics,
        comfort: simResult.comfort,
      } : null,
      optimization: best ? {
        bestConfiguration: best.label,
        overallScore: best.overallScore,
      } : null,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `THERMOSHELTER-X_ANSYS_Config_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  // Ladakh case study: baseline vs optimized
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
    label: 'Baseline',
  };
  const baselineResult = runSimulation(climate, baselineShelter, simConfig);
  const baselineCost = calculateCost(baselineShelter);
  const baselineSustain = calculateSustainability(baselineResult.metrics, baselineShelter, climate);

  const optimizedShelter = best?.shelter ?? shelter;
  const optimizedResult = simResult ?? baselineResult;
  const optimizedCost = cost;
  const optimizedSustain = sustainability;

  const tempImprovement = optimizedResult.metrics.avgIndoor - baselineResult.metrics.avgIndoor;
  const heatLossReduction = baselineResult.metrics.totalHeatLoss > 0
    ? ((baselineResult.metrics.totalHeatLoss - optimizedResult.metrics.totalHeatLoss) / baselineResult.metrics.totalHeatLoss * 100)
    : 0;
  const retentionImprovement = optimizedResult.metrics.thermalRetentionIndex - baselineResult.metrics.thermalRetentionIndex;
  const comfortImprovement = optimizedResult.comfort.score - baselineResult.comfort.score;
  const energyReduction = baselineResult.metrics.energyDemandIndex - optimizedResult.metrics.energyDemandIndex;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Engineering Report</h2>
          <p className="text-sm text-slate-500">THERMOSHELTER-X • Zone Zero • SIH 2026 • PS SIH26051</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="secondary" size="sm" icon={<Printer className="w-4 h-4" />}>Print</Button>
          <Button onClick={handleDownload} variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Download TXT</Button>
          <Button onClick={handleDownloadJSON} size="sm" icon={<FlaskConical className="w-4 h-4" />}>Export ANSYS JSON</Button>
        </div>
      </div>

      {/* Report content */}
      <Card title="1. Project Overview">
        <div className="text-sm text-slate-300 space-y-1">
          <p><strong className="text-slate-100">Product:</strong> THERMOSHELTER-X — Area-Specific Digital Twin & Optimization Platform for Passive Thermal-Comfort Shelters</p>
          <p><strong className="text-slate-100">Team:</strong> Zone Zero</p>
          <p><strong className="text-slate-100">Event:</strong> Smart India Hackathon 2026</p>
          <p><strong className="text-slate-100">Problem Statement:</strong> SIH26051 — Software-Based Model Development for Design of Area-Specific Shelter for Thermal Comfort Maintenance</p>
          <p><strong className="text-slate-100">Tagline:</strong> "Design the shelter for the climate — not the climate for the shelter."</p>
        </div>
      </Card>

      <Card title="2. Climate Profile">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div><span className="text-slate-500">Location:</span> <span className="text-slate-200">{climate.location}</span></div>
          <div><span className="text-slate-500">Climate:</span> <span className="text-slate-200">{CLIMATE_TYPE_LABELS[climate.climateType]}</span></div>
          <div><span className="text-slate-500">Duration:</span> <span className="text-slate-200">{climate.durationHours}h</span></div>
          <div><span className="text-slate-500">Time Step:</span> <span className="text-slate-200">{climate.timeStepMinutes}min</span></div>
        </div>
      </Card>

      <Card title="3. Shelter Geometry & 4. Materials">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm space-y-1">
              <p><span className="text-slate-500">Dimensions:</span> <span className="text-slate-200">{shelter.geometry.length}m × {shelter.geometry.width}m × {shelter.geometry.height}m</span></p>
              <p><span className="text-slate-500">Orientation:</span> <span className="text-slate-200">{shelter.geometry.orientation}°</span></p>
              <p><span className="text-slate-500">Ventilation:</span> <span className="text-slate-200">{VENTILATION_LABELS[shelter.ventilation]}</span></p>
              <p><span className="text-slate-500">Shading:</span> <span className="text-slate-200">{SHADING_LABELS[shelter.shading]}</span></p>
            </div>
          </div>
          <div>
            <div className="text-sm space-y-1">
              <p><span className="text-slate-500">Wall:</span> <span className="text-slate-200">{getMaterial(shelter.wallMaterialId)?.name}</span></p>
              <p><span className="text-slate-500">Roof:</span> <span className="text-slate-200">{getMaterial(shelter.roofMaterialId)?.name}</span></p>
              <p><span className="text-slate-500">Floor:</span> <span className="text-slate-200">{getMaterial(shelter.floorMaterialId)?.name}</span></p>
              <p><span className="text-slate-500">Insulation:</span> <span className="text-slate-200">{getMaterial(shelter.insulationMaterialId)?.name} ({shelter.insulationThickness * 1000}mm)</span></p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <ShelterDiagram shelter={shelter} />
        </div>
      </Card>

      {m && (
        <Card title="5-7. Simulation Results & Comfort Analysis">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Peak Indoor</div><div className="text-lg font-bold text-slate-200">{m.peakIndoor}°C</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Min Indoor</div><div className="text-lg font-bold text-slate-200">{m.minIndoor}°C</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Avg Indoor</div><div className="text-lg font-bold text-slate-200">{m.avgIndoor}°C</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Fluctuation</div><div className="text-lg font-bold text-slate-200">{m.temperatureFluctuation}°C</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Heat Gain</div><div className="text-lg font-bold text-slate-200">{m.totalHeatGain} kWh</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Heat Loss</div><div className="text-lg font-bold text-slate-200">{m.totalHeatLoss} kWh</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Solar Gain</div><div className="text-lg font-bold text-slate-200">{m.solarHeatGain} kWh</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-xs text-slate-500">Retention</div><div className="text-lg font-bold text-slate-200">{m.thermalRetentionIndex}/100</div></div>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <div>
              <span className="text-xs text-slate-500">Comfort Score: </span>
              <span className="text-lg font-bold" style={{ color: getComfortColor(simResult!.comfort.score) }}>{simResult!.comfort.score}/100</span>
              <span className="text-sm text-slate-400 ml-2">({getComfortCategory(simResult!.comfort.score)})</span>
            </div>
          </div>
        </Card>
      )}

      {/* Ladakh case study comparison */}
      <Card title="8-9. Baseline vs Optimized Comparison (Ladakh Case Study)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-800">
                <th className="text-left py-2 px-3">Metric</th>
                <th className="text-right py-2 px-3">Baseline</th>
                <th className="text-right py-2 px-3">Optimized</th>
                <th className="text-right py-2 px-3">Improvement</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800/50">
                <td className="py-2 px-3 text-slate-300">Avg Indoor Temperature</td>
                <td className="text-right py-2 px-3 font-mono text-slate-400">{baselineResult.metrics.avgIndoor}°C</td>
                <td className="text-right py-2 px-3 font-mono text-slate-200">{optimizedResult.metrics.avgIndoor}°C</td>
                <td className="text-right py-2 px-3 font-mono text-emerald-400">{tempImprovement > 0 ? '+' : ''}{tempImprovement.toFixed(1)}°C</td>
              </tr>
              <tr className="border-b border-slate-800/50">
                <td className="py-2 px-3 text-slate-300">Total Heat Loss</td>
                <td className="text-right py-2 px-3 font-mono text-slate-400">{baselineResult.metrics.totalHeatLoss} kWh</td>
                <td className="text-right py-2 px-3 font-mono text-slate-200">{optimizedResult.metrics.totalHeatLoss} kWh</td>
                <td className="text-right py-2 px-3 font-mono text-emerald-400">{heatLossReduction > 0 ? '-' : '+'}{Math.abs(heatLossReduction).toFixed(1)}%</td>
              </tr>
              <tr className="border-b border-slate-800/50">
                <td className="py-2 px-3 text-slate-300">Thermal Retention</td>
                <td className="text-right py-2 px-3 font-mono text-slate-400">{baselineResult.metrics.thermalRetentionIndex}/100</td>
                <td className="text-right py-2 px-3 font-mono text-slate-200">{optimizedResult.metrics.thermalRetentionIndex}/100</td>
                <td className="text-right py-2 px-3 font-mono text-emerald-400">{retentionImprovement > 0 ? '+' : ''}{retentionImprovement}</td>
              </tr>
              <tr className="border-b border-slate-800/50">
                <td className="py-2 px-3 text-slate-300">Comfort Score</td>
                <td className="text-right py-2 px-3 font-mono text-slate-400">{baselineResult.comfort.score}/100</td>
                <td className="text-right py-2 px-3 font-mono text-slate-200">{optimizedResult.comfort.score}/100</td>
                <td className="text-right py-2 px-3 font-mono text-emerald-400">{comfortImprovement > 0 ? '+' : ''}{comfortImprovement}</td>
              </tr>
              <tr className="border-b border-slate-800/50">
                <td className="py-2 px-3 text-slate-300">Energy Demand</td>
                <td className="text-right py-2 px-3 font-mono text-slate-400">{baselineResult.metrics.energyDemandIndex}/100</td>
                <td className="text-right py-2 px-3 font-mono text-slate-200">{optimizedResult.metrics.energyDemandIndex}/100</td>
                <td className="text-right py-2 px-3 font-mono text-emerald-400">{energyReduction > 0 ? '-' : '+'}{Math.abs(energyReduction)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-600 mt-3 italic">All improvements are calculated from the model — no hard-coded percentages.</p>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card title="10. Recommendations">
          <div className="space-y-2">
            {recommendations.slice(0, 5).map(rec => (
              <div key={rec.id} className="flex items-start gap-3 text-sm">
                <Badge color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'blue'}>{rec.priority.toUpperCase()}</Badge>
                <div>
                  <span className="text-slate-200 font-medium">{rec.title}</span>
                  <p className="text-xs text-slate-500">{rec.expectedImpact}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sustainability + Cost */}
      <Card title="11-12. Sustainability & Cost Estimate">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="text-slate-500">Sustainability Score:</span> <span className="text-slate-200 font-bold">{sustainability.sustainabilityScore}/100</span></p>
            <p><span className="text-slate-500">Passive Contribution:</span> <span className="text-slate-200">{sustainability.passiveContribution}%</span></p>
            <p><span className="text-slate-500">CO₂ Impact (indicative):</span> <span className="text-slate-200">{sustainability.co2Impact} kg/yr</span></p>
          </div>
          <div>
            <p><span className="text-slate-500">Envelope Cost:</span> <span className="text-slate-200">₹{cost.envelopeCost.toLocaleString()}</span></p>
            <p><span className="text-slate-500">Thermal Enhancement:</span> <span className="text-slate-200">₹{cost.thermalEnhancementCost.toLocaleString()}</span></p>
            <p><span className="text-slate-500">Total Cost:</span> <span className="text-slate-200 font-bold">₹{cost.totalCost.toLocaleString()}</span></p>
          </div>
        </div>
      </Card>

      {/* ANSYS pathway */}
      <Card title="13-15. Engineering Validation Pathway & Limitations">
        <div className="flex flex-wrap items-center gap-2 py-2 mb-4">
          {['Prototype Physics Engine', 'Parametric Configuration', 'ANSYS Mechanical', 'Simulation Validation', 'Field Measurement', 'Model Calibration'].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-300">{step}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
            </div>
          ))}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-200 font-medium mb-1">Scientific Honesty</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                This prototype demonstrates the decision-support architecture and preliminary physics-based thermal estimation.
                High-fidelity engineering validation requires ANSYS Mechanical transient thermal analysis and field measurements.
                Not claimed: certified engineering result, actual ANSYS simulation, guaranteed comfort, exact construction cost, or real-world validated performance.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-200 mb-2">Scalability Roadmap</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <Badge color="blue">Phase 1</Badge>
              <p className="text-xs text-slate-400 mt-2">Ladakh / High-altitude cold</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <Badge color="blue">Phase 2</Badge>
              <p className="text-xs text-slate-400 mt-2">Indian Himalayan regions</p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <Badge color="blue">Phase 3</Badge>
              <p className="text-xs text-slate-400 mt-2">Multi-climate: Cold, Hot-Dry, Warm-Humid, Composite, Temperate</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 italic">Same framework, new climate inputs.</p>
        </div>
      </Card>

      <div className="text-center py-4 border-t border-slate-800">
        <p className="text-sm text-slate-400">THERMOSHELTER-X • Zone Zero • SIH 2026 • PS SIH26051</p>
        <p className="text-xs text-slate-600 mt-1">"Design the shelter for the climate — not the climate for the shelter."</p>
        <p className="text-xs text-slate-700 mt-2">Indicative prototype estimate — local rates required for deployment. CO₂ values are indicative estimates.</p>
      </div>
    </div>
  );
}
