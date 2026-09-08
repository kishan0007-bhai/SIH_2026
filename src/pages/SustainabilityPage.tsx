import { useApp } from '@/store/AppContext';
import { Card, StatCard, Gauge, Badge } from '@/components/ui/Card';
import { InfoTooltip, CalcLogicDrawer } from '@/components/ui/Tooltip';
import { CLIMATE_TYPE_LABELS } from '@/data/climatePresets';
import {
  Leaf, Sun, Zap, Wind, TrendingDown, Activity, Cloud,
} from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis,
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

export function SustainabilityPage() {
  const { sustainability, simResult, climate } = useApp();

  const s = sustainability;

  const radialData = [
    { name: 'Passive Contribution', value: s.passiveContribution, fill: '#10b981' },
    { name: 'Solar Utilization', value: s.solarUtilization, fill: '#f59e0b' },
    { name: 'Thermal Efficiency', value: s.thermalEfficiency, fill: '#38bdf8' },
    { name: 'Sustainability Score', value: s.sustainabilityScore, fill: '#8b5cf6' },
  ];

  const barData = [
    { name: 'Passive', value: s.passiveContribution, fill: '#10b981' },
    { name: 'Active Burden', value: s.activeBurden, fill: '#ef4444' },
    { name: 'Energy Demand', value: s.energyDemandIndex, fill: '#eab308' },
    { name: 'Solar Util', value: s.solarUtilization, fill: '#f59e0b' },
    { name: 'Thermal Eff', value: s.thermalEfficiency, fill: '#38bdf8' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Sustainability Analysis</h2>
          <p className="text-sm text-slate-500">Passive design contribution, energy demand, and environmental impact indicators</p>
        </div>
        <CalcLogicDrawer
          title="Sustainability Metrics"
          formula={`Passive Contribution = 100 - Energy Demand Index
Solar Utilization = (Solar Heat Gain / Total Heat Gain) × 100
Thermal Efficiency = 0.5 × Retention + 0.5 × (100 - Energy Demand)
CO₂ Impact = Daily Energy × Heating Days × 0.82 kg/kWh
Sustainability Score = weighted combination of all metrics`}
          factors={<p>CO₂ values use India's grid average emission factor (0.82 kg CO₂/kWh) and are indicative estimates only.</p>}
        />
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Passive Contribution" value={s.passiveContribution} unit="/100" icon={<Leaf className="w-4 h-4" />} status={s.passiveContribution > 60 ? 'good' : s.passiveContribution > 30 ? 'warning' : 'critical'} />
        <StatCard label="Energy Demand Index" value={s.energyDemandIndex} unit="/100" icon={<Zap className="w-4 h-4" />} status={s.energyDemandIndex < 30 ? 'good' : s.energyDemandIndex < 60 ? 'warning' : 'critical'} />
        <StatCard label="Solar Utilization" value={s.solarUtilization} unit="/100" icon={<Sun className="w-4 h-4" />} color="#f59e0b" />
        <StatCard label="Thermal Efficiency" value={s.thermalEfficiency} unit="/100" icon={<Activity className="w-4 h-4" />} color="#38bdf8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sustainability score gauge */}
        <Card title="Sustainability Score" tooltip={<InfoTooltip content="Weighted combination of passive contribution, energy efficiency, solar utilization, thermal efficiency, and CO₂ impact. Higher is better." />}>
          <div className="flex justify-center py-4">
            <Gauge value={s.sustainabilityScore} label="Sustainability" unit="/ 100" color={s.sustainabilityScore > 70 ? '#10b981' : s.sustainabilityScore > 50 ? '#f59e0b' : '#ef4444'} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <Cloud className="w-5 h-5 text-slate-500 mx-auto mb-1" />
              <div className="text-xs text-slate-500">CO₂ Impact (indicative)</div>
              <div className="text-lg font-bold text-slate-200">{s.co2Impact} kg/yr</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <TrendingDown className="w-5 h-5 text-slate-500 mx-auto mb-1" />
              <div className="text-xs text-slate-500">Active Burden</div>
              <div className="text-lg font-bold text-slate-200">{s.activeBurden}/100</div>
            </div>
          </div>
        </Card>

        {/* Radial chart */}
        <Card title="Sustainability Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart innerRadius="20%" outerRadius="90%" data={radialData} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={6} />
              <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bar chart */}
      <Card title="Sustainability Metrics Comparison" tooltip={<InfoTooltip content="Comparison of all sustainability indicators. Higher passive contribution, solar utilization, and thermal efficiency are better. Lower active burden and energy demand are better." />}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
            <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={90} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Passive vs Active */}
      <Card title="Passive vs Active Energy Strategy">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-300">Passive Design Contribution</span>
            </div>
            <div className="text-3xl font-bold text-emerald-200">{s.passiveContribution}%</div>
            <p className="text-xs text-slate-400 mt-2">Fraction of thermal comfort achieved through passive strategies (insulation, thermal mass, shading, ventilation) without active heating/cooling.</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-red-400" />
              <span className="text-sm font-semibold text-red-300">Active Energy Burden</span>
            </div>
            <div className="text-3xl font-bold text-red-200">{s.activeBurden}%</div>
            <p className="text-xs text-slate-400 mt-2">Estimated fraction requiring active heating/cooling systems. Lower is better — indicates the passive design handles most of the thermal load.</p>
          </div>
        </div>
      </Card>

      {/* Climate context */}
      <Card title="Climate Context">
        <div className="flex items-center gap-3">
          <Wind className="w-5 h-5 text-sky-400" />
          <span className="text-sm text-slate-300">
            Current climate: <strong className="text-slate-100">{CLIMATE_TYPE_LABELS[climate.climateType]}</strong> ({climate.location})
          </span>
          <Badge color="blue">{simResult ? 'Simulated' : 'Not simulated'}</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Sustainability metrics are climate-dependent. The same shelter design will have different passive contributions in cold vs hot climates. This demonstrates the area-specific nature of the THERMOSHELTER-X framework.
        </p>
      </Card>

      <div className="text-center py-2">
        <p className="text-xs text-slate-600 italic">CO₂ values are indicative estimates based on India grid average emission factor. Actual values require local energy mix and operational data.</p>
      </div>
    </div>
  );
}

