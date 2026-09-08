import { useApp } from '@/store/AppContext';
import { Card, Badge, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Controls';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { runSimulation } from '@/engine/thermalEngine';
import { calculateCost } from '@/engine/costEngine';
import { calculateSustainability } from '@/engine/sustainabilityEngine';
import type { SavedConfiguration, ShelterModel } from '@/types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { Plus, Trash2, GitCompareArrows, Save } from 'lucide-react';

export function ComparePage() {
  const { climate, shelter, simConfig, simResult, savedConfigs, saveBaseline, removeSavedConfig, addSavedConfig } = useApp();

  const handleSaveCurrent = () => {
    if (!simResult) return;
    saveBaseline();
  };

  // Auto-generate comparison configs if we have a simulation result
  const generateComparisonConfigs = (): SavedConfiguration[] => {
    if (!simResult) return [];

    const configs: SavedConfiguration[] = [];

    // Configuration A: High thermal mass (mud walls)
    const configA: ShelterModel = {
      ...shelter,
      label: 'Config A: High Thermal Mass',
      wallMaterialId: 'wall-mud',
      geometry: { ...shelter.geometry, orientation: 180 },
    };
    const resultA = runSimulation(climate, configA, simConfig);
    configs.push({
      id: 'auto-a',
      name: 'Config A: High Thermal Mass',
      shelter: configA,
      climate,
      result: resultA,
      cost: calculateCost(configA),
      sustainability: calculateSustainability(resultA.metrics, configA, climate),
      timestamp: Date.now(),
    });

    // Configuration B: Well-insulated (AAC + XPS)
    const configB: ShelterModel = {
      ...shelter,
      label: 'Config B: Well-Insulated',
      wallMaterialId: 'wall-aac',
      insulationMaterialId: 'ins-xps',
      insulationThickness: 0.075,
      geometry: { ...shelter.geometry, orientation: 180 },
    };
    const resultB = runSimulation(climate, configB, simConfig);
    configs.push({
      id: 'auto-b',
      name: 'Config B: Well-Insulated',
      shelter: configB,
      climate,
      result: resultB,
      cost: calculateCost(configB),
      sustainability: calculateSustainability(resultB.metrics, configB, climate),
      timestamp: Date.now(),
    });

    // Configuration C: Shaded + cross-vent
    const configC: ShelterModel = {
      ...shelter,
      label: 'Config C: Shaded + Vent',
      shading: 'external',
      ventilation: 'cross',
      wallMaterialId: 'wall-brick',
    };
    const resultC = runSimulation(climate, configC, simConfig);
    configs.push({
      id: 'auto-c',
      name: 'Config C: Shaded + Vent',
      shelter: configC,
      climate,
      result: resultC,
      cost: calculateCost(configC),
      sustainability: calculateSustainability(resultC.metrics, configC, climate),
      timestamp: Date.now(),
    });

    return configs;
  };

  const allConfigs = [...savedConfigs];
  if (simResult && allConfigs.length < 3) {
    const auto = generateComparisonConfigs();
    for (const a of auto) {
      if (!allConfigs.find(c => c.name === a.name)) {
        allConfigs.push(a);
      }
    }
  }

  // Current design as a config too
  if (simResult) {
    allConfigs.unshift({
      id: 'current',
      name: shelter.label,
      shelter,
      climate,
      result: simResult,
      cost: calculateCost(shelter),
      sustainability: calculateSustainability(simResult.metrics, shelter, climate),
      timestamp: Date.now(),
    });
  }

  // Comparison chart data (temperature profiles)
  const tempChartData = simResult
    ? simResult.points.map((p, i) => {
        const row: Record<string, number> = { time: p.time };
        for (const cfg of allConfigs) {
          row[cfg.name] = cfg.result.points[i]?.indoorTemp ?? 0;
        }
        return row;
      })
    : [];

  // Radar chart data
  const radarData = allConfigs.map(c => ({
    name: c.name.length > 20 ? c.name.substring(0, 18) + '...' : c.name,
    Comfort: c.result.comfort.score,
    Retention: c.result.metrics.thermalRetentionIndex,
    Energy: 100 - c.result.metrics.energyDemandIndex,
    Solar: Math.min(100, c.result.metrics.solarHeatGain * 15),
    Cost: Math.max(0, 100 - c.cost.costPerSqm / 80),
    Sustain: c.sustainability.sustainabilityScore,
  }));

  const colors = ['#38bdf8', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Configuration Comparison</h2>
          <p className="text-sm text-slate-500">Compare multiple shelter configurations side-by-side</p>
        </div>
        {simResult && (
          <Button onClick={handleSaveCurrent} icon={<Save className="w-4 h-4" />} size="sm">Save Current Configuration</Button>
        )}
      </div>

      {allConfigs.length === 0 && (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <GitCompareArrows className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">Run a simulation first to generate comparison configurations.</p>
          </div>
        </Card>
      )}

      {allConfigs.length > 0 && (
        <>
          {/* Comparison table */}
          <Card title="Performance Comparison Table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2 px-3">Configuration</th>
                    <th className="text-right py-2 px-3">Avg Indoor (°C)</th>
                    <th className="text-right py-2 px-3">Peak (°C)</th>
                    <th className="text-right py-2 px-3">Heat Gain (kWh)</th>
                    <th className="text-right py-2 px-3">Heat Loss (kWh)</th>
                    <th className="text-right py-2 px-3">Retention</th>
                    <th className="text-right py-2 px-3">Comfort</th>
                    <th className="text-right py-2 px-3">Energy</th>
                    <th className="text-right py-2 px-3">Cost (₹k)</th>
                    <th className="text-right py-2 px-3">Overall</th>
                    <th className="text-center py-2 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {allConfigs.map((cfg, i) => {
                    const overall = Math.round(
                      0.35 * cfg.result.comfort.score +
                      0.20 * cfg.result.metrics.thermalRetentionIndex +
                      0.20 * (100 - cfg.result.metrics.energyDemandIndex) +
                      0.15 * cfg.sustainability.sustainabilityScore +
                      0.10 * Math.max(0, 100 - cfg.cost.costPerSqm / 80)
                    );
                    return (
                      <tr key={cfg.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ background: colors[i % colors.length] }} />
                            <span className="text-slate-200 text-xs">{cfg.name}</span>
                          </span>
                        </td>
                        <td className="text-right py-2 px-3 text-slate-300 font-mono">{cfg.result.metrics.avgIndoor}</td>
                        <td className="text-right py-2 px-3 text-slate-300 font-mono">{cfg.result.metrics.peakIndoor}</td>
                        <td className="text-right py-2 px-3 text-slate-300 font-mono">{cfg.result.metrics.totalHeatGain}</td>
                        <td className="text-right py-2 px-3 text-slate-300 font-mono">{cfg.result.metrics.totalHeatLoss}</td>
                        <td className="text-right py-2 px-3 font-mono">{cfg.result.metrics.thermalRetentionIndex}</td>
                        <td className="text-right py-2 px-3 font-mono">
                          <Badge color={cfg.result.comfort.score >= 75 ? 'green' : cfg.result.comfort.score >= 60 ? 'yellow' : 'red'}>{cfg.result.comfort.score}</Badge>
                        </td>
                        <td className="text-right py-2 px-3 font-mono">{cfg.result.metrics.energyDemandIndex}</td>
                        <td className="text-right py-2 px-3 text-slate-300 font-mono">₹{(cfg.cost.totalCost / 1000).toFixed(0)}</td>
                        <td className="text-right py-2 px-3 font-bold text-sky-300">{overall}</td>
                        <td className="text-center py-2 px-3">
                          {cfg.id !== 'current' && !cfg.id.startsWith('auto-') && (
                            <button onClick={() => removeSavedConfig(cfg.id)} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Temperature comparison chart */}
          <Card title="Indoor Temperature Comparison" tooltip={<InfoTooltip content="Indoor temperature profiles for all configurations over the simulation period." />}>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={tempChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" fontSize={11} label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {allConfigs.map((cfg, i) => (
                  <Line key={cfg.id} type="monotone" dataKey={cfg.name} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Radar chart */}
          <Card title="Multi-Metric Radar Comparison" tooltip={<InfoTooltip content="Radar chart comparing comfort, retention, energy efficiency, solar utilization, cost, and sustainability across configurations." />}>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                {['Comfort', 'Retention', 'Energy', 'Solar', 'Cost', 'Sustain'].map((metric, i) => (
                  <Radar key={metric} name={metric} dataKey={metric} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.1} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}
