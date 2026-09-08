import { useState, useCallback } from 'react';
import { useApp } from '@/store/AppContext';
import { Card, Badge } from '@/components/ui/Card';
import { Button, Slider, ProgressBar } from '@/components/ui/Controls';
import { InfoTooltip, CalcLogicDrawer } from '@/components/ui/Tooltip';
import { runOptimization } from '@/engine/optimizationEngine';
import { getMaterial } from '@/data/materials';
import type { OptimizationWeights } from '@/types';
import { Zap, CheckCircle2, Award, RotateCcw } from 'lucide-react';

export function OptimizationPage() {
  const {
    climate, shelter, simConfig, optimizationWeights, setOptimizationWeights,
    optimizationCandidates, setOptimizationCandidates, applyOptimizedDesign,
  } = useApp();

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleOptimize = useCallback(() => {
    setRunning(true);
    setProgress({ current: 0, total: 0 });

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const candidates = runOptimization(
        climate, shelter, simConfig, optimizationWeights,
        (current, total) => setProgress({ current, total }),
      );
      setOptimizationCandidates(candidates);
      setRunning(false);
    }, 50);
  }, [climate, shelter, simConfig, optimizationWeights, setOptimizationCandidates]);

  const updateWeight = (key: keyof OptimizationWeights, value: number) => {
    setOptimizationWeights({ ...optimizationWeights, [key]: value });
  };

  const topCandidates = optimizationCandidates.slice(0, 20);
  const best = optimizationCandidates[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Optimization Engine</h2>
          <p className="text-sm text-slate-500">Multi-objective evaluation of shelter configurations — ranks by weighted design score</p>
        </div>
        <CalcLogicDrawer
          title="Multi-Objective Optimization"
          formula={`Overall Score = (w₁×Comfort + w₂×Retention + w₃×Energy + w₄×Solar + w₅×Cost + w₆×Sustainability) / Σw

Search space:
  Wall materials × Roof materials × Insulation
  × Orientation × Window ratio
  × Ventilation × Shading

Climate-specific filtering reduces the search space
to relevant candidate configurations.`}
          factors={
            <div className="space-y-2">
              <p><strong className="text-sky-300">Climate-aware filtering:</strong> Cold climates prioritize insulation and solar gain; hot climates prioritize shading and ventilation.</p>
              <p><strong className="text-sky-300">Each candidate:</strong> Runs the full transient thermal simulation, then scores comfort, retention, energy, solar utilization, cost, and sustainability.</p>
              <p><strong className="text-sky-300">Ranking:</strong> Configurations are sorted by the weighted overall score. Adjust weights below to re-prioritize objectives.</p>
            </div>
          }
        />
      </div>

      {/* Weight sliders */}
      <Card title="Decision Weights" subtitle="Adjust weights to re-rank candidates. Weights are normalized automatically." tooltip={<InfoTooltip content="These weights determine how the overall design score is calculated. Higher weight = more important objective. Default: Comfort 35%, Retention 20%, Energy 20%, Solar 10%, Cost 10%, Sustainability 5%." />}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Slider label="Thermal Comfort" value={optimizationWeights.comfort} onChange={v => updateWeight('comfort', v)} unit="%" color="#38bdf8" />
          <Slider label="Thermal Retention" value={optimizationWeights.retention} onChange={v => updateWeight('retention', v)} unit="%" color="#f97316" />
          <Slider label="Energy Efficiency" value={optimizationWeights.energy} onChange={v => updateWeight('energy', v)} unit="%" color="#eab308" />
          <Slider label="Solar Utilization" value={optimizationWeights.solar} onChange={v => updateWeight('solar', v)} unit="%" color="#f59e0b" />
          <Slider label="Cost" value={optimizationWeights.cost} onChange={v => updateWeight('cost', v)} unit="%" color="#8b5cf6" />
          <Slider label="Sustainability" value={optimizationWeights.sustainability} onChange={v => updateWeight('sustainability', v)} unit="%" color="#10b981" />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={handleOptimize} disabled={running} size="lg" icon={running ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}>
            {running ? 'Optimizing...' : 'RUN OPTIMIZATION'}
          </Button>
          {optimizationCandidates.length > 0 && !running && (
            <span className="text-sm text-slate-400">{optimizationCandidates.length} configurations evaluated</span>
          )}
        </div>

        {running && (
          <div className="mt-4">
            <ProgressBar value={progress.current} max={progress.total} label={`Evaluating candidates: ${progress.current} / ${progress.total}`} />
          </div>
        )}
      </Card>

      {/* Best candidate highlight */}
      {best && !running && (
        <Card className="border-sky-500/30 bg-sky-500/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <Award className="w-7 h-7 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-slate-100">#1 Recommended Configuration</span>
                  <Badge color="green">Best Score: {best.overallScore}</Badge>
                </div>
                <p className="text-sm text-slate-400">{best.label}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge color="blue">Comfort: {best.scores.comfort}</Badge>
                  <Badge color="blue">Retention: {best.scores.retention}</Badge>
                  <Badge color="blue">Energy: {best.scores.energy}</Badge>
                  <Badge color="blue">Cost: ₹{(best.cost.totalCost / 1000).toFixed(0)}k</Badge>
                  <Badge color="green">Sustain: {best.scores.sustainability}</Badge>
                </div>
              </div>
            </div>
            <Button onClick={() => applyOptimizedDesign(best)} variant="success" size="lg" icon={<CheckCircle2 className="w-4 h-4" />}>
              APPLY OPTIMIZED DESIGN
            </Button>
          </div>
        </Card>
      )}

      {/* Results table */}
      {topCandidates.length > 0 && !running && (
        <Card title="Ranked Configurations" subtitle={`Top ${topCandidates.length} of ${optimizationCandidates.length} evaluated configurations`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 px-2">Rank</th>
                  <th className="text-left py-2 px-2">Design</th>
                  <th className="text-right py-2 px-2">Comfort</th>
                  <th className="text-right py-2 px-2">Energy</th>
                  <th className="text-right py-2 px-2">Heat Loss</th>
                  <th className="text-right py-2 px-2">Cost (₹k)</th>
                  <th className="text-right py-2 px-2">Overall</th>
                  <th className="text-center py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {topCandidates.map((c, i) => {
                  const wallName = getMaterial(c.shelter.wallMaterialId)?.name.split(' ')[0] ?? '?';
                  return (
                    <tr key={c.id} className={`border-b border-slate-800/50 ${i === 0 ? 'bg-sky-500/5' : 'hover:bg-slate-800/30'}`}>
                      <td className="py-2 px-2">
                        <span className={`font-bold ${i === 0 ? 'text-sky-300' : 'text-slate-400'}`}>#{i + 1}</span>
                      </td>
                      <td className="py-2 px-2 text-xs text-slate-300">{c.label}</td>
                      <td className="text-right py-2 px-2 font-mono">
                        <Badge color={c.scores.comfort >= 75 ? 'green' : c.scores.comfort >= 60 ? 'yellow' : 'red'}>{c.scores.comfort}</Badge>
                      </td>
                      <td className="text-right py-2 px-2 font-mono text-slate-300">{c.scores.energy}</td>
                      <td className="text-right py-2 px-2 font-mono text-slate-300">{c.metrics.totalHeatLoss}</td>
                      <td className="text-right py-2 px-2 font-mono text-slate-300">₹{(c.cost.totalCost / 1000).toFixed(0)}</td>
                      <td className="text-right py-2 px-2 font-bold text-sky-300">{c.overallScore}</td>
                      <td className="text-center py-2 px-2">
                        <button
                          onClick={() => applyOptimizedDesign(c)}
                          className="text-xs px-2 py-1 bg-slate-700 hover:bg-sky-600 text-slate-200 rounded transition-colors"
                        >
                          Apply
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {optimizationCandidates.length === 0 && !running && (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <Zap className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">No optimization run yet. Adjust weights above and click RUN OPTIMIZATION to evaluate candidate configurations.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
