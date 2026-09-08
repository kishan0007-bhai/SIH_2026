import { useApp } from '@/store/AppContext';
import { Card, StatCard, Gauge, Badge } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { CLIMATE_TYPE_LABELS, CLIMATE_TYPE_COLORS } from '@/data/climatePresets';
import { getComfortColor, getComfortCategory } from '@/engine/comfortEngine';
import {
  Thermometer, Sun, Droplets, Wind, Gauge as GaugeIcon,
  Flame, TrendingDown, TrendingUp, Zap, Award, Activity,
  Cloud, FlaskConical, GitCompareArrows, Lightbulb, ArrowRight,
} from 'lucide-react';
import type { PageId } from '@/components/Layout';

export function OverviewPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { climate, shelter, simResult, cost, sustainability } = useApp();

  const avgOutdoor = climate.data.length > 0
    ? climate.data.reduce((s, d) => s + d.ambientTemperature, 0) / climate.data.length
    : 0;
  const peakSolar = Math.max(...climate.data.map(d => d.solarRadiation), 0);
  const avgHumidity = climate.data.length > 0
    ? climate.data.reduce((s, d) => s + d.relativeHumidity, 0) / climate.data.length
    : 0;
  const avgWind = climate.data.length > 0
    ? climate.data.reduce((s, d) => s + d.windSpeed, 0) / climate.data.length
    : 0;

  const m = simResult?.metrics;
  const comfortScore = m?.comfortScore ?? 0;
  const comfortColor = getComfortColor(comfortScore);
  const comfortCat = getComfortCategory(comfortScore);

  const designScore = m
    ? Math.round(
        0.35 * comfortScore +
        0.20 * m.thermalRetentionIndex +
        0.20 * (100 - m.energyDemandIndex) +
        0.15 * sustainability.sustainabilityScore +
        0.10 * (100 - Math.min(100, cost.costPerSqm / 80))
      )
    : 0;

  const pipelineSteps = [
    { label: 'CLIMATE', icon: <Cloud className="w-4 h-4" />, page: 'climate' as PageId, done: true },
    { label: 'DIGITAL TWIN', icon: <FlaskConical className="w-4 h-4" />, page: 'shelter' as PageId, done: true },
    { label: 'SIMULATION', icon: <Activity className="w-4 h-4" />, page: 'simulation' as PageId, done: !!simResult },
    { label: 'COMPARISON', icon: <GitCompareArrows className="w-4 h-4" />, page: 'compare' as PageId, done: false },
    { label: 'OPTIMIZATION', icon: <Zap className="w-4 h-4" />, page: 'optimization' as PageId, done: false },
    { label: 'RECOMMENDATION', icon: <Lightbulb className="w-4 h-4" />, page: 'recommendation' as PageId, done: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Engineering Dashboard</h2>
          <p className="text-sm text-slate-500">Preliminary Physics-Based Simulation — Zone Zero • SIH 2026</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="blue">{CLIMATE_TYPE_LABELS[climate.climateType]}</Badge>
          <Badge color={simResult ? 'green' : 'gray'}>{simResult ? 'Simulated' : 'Not Simulated'}</Badge>
        </div>
      </div>

      {/* Climate summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          label="Selected Region"
          value={climate.location.split(' / ')[0]}
          icon={<Cloud className="w-4 h-4" />}
          color={CLIMATE_TYPE_COLORS[climate.climateType]}
        />
        <StatCard
          label="Climate Type"
          value={CLIMATE_TYPE_LABELS[climate.climateType]}
          icon={<Cloud className="w-4 h-4" />}
          color={CLIMATE_TYPE_COLORS[climate.climateType]}
        />
        <StatCard
          label="Avg Outdoor Temp"
          value={avgOutdoor.toFixed(1)}
          unit="°C"
          icon={<Thermometer className="w-4 h-4" />}
          color="#f59e0b"
        />
        <StatCard
          label="Peak Solar"
          value={peakSolar}
          unit="W/m²"
          icon={<Sun className="w-4 h-4" />}
          color="#eab308"
        />
        <StatCard
          label="Avg Humidity"
          value={avgHumidity.toFixed(0)}
          unit="%"
          icon={<Droplets className="w-4 h-4" />}
          color="#06b6d4"
        />
        <StatCard
          label="Avg Wind"
          value={avgWind.toFixed(1)}
          unit="m/s"
          icon={<Wind className="w-4 h-4" />}
          color="#0ea5e9"
        />
      </div>

      {/* Key metrics with gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Thermal Comfort Score" tooltip={<InfoTooltip label="Comfort Score" content="Prototype comfort index based on indoor temperature, humidity, and air movement. Not an official PMV/PPD certification." />}>
          <div className="flex flex-col items-center py-2">
            <Gauge value={comfortScore} label={comfortCat} unit="/ 100" color={comfortColor} />
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              <div className="text-center">
                <div className="text-xs text-slate-500">Avg Indoor</div>
                <div className="text-lg font-bold text-slate-200">{m?.avgIndoor?.toFixed(1) ?? '—'}°C</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Avg Outdoor</div>
                <div className="text-lg font-bold text-slate-200">{avgOutdoor.toFixed(1)}°C</div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Thermal Performance" tooltip={<InfoTooltip label="Thermal Performance" content="Key thermal metrics from the physics-based transient simulation. Heat gain and loss are cumulative over the simulation period." />}>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Heat Loss" value={m?.totalHeatLoss?.toFixed(1) ?? '—'} unit="kWh" icon={<TrendingDown className="w-4 h-4" />} color="#ef4444" />
            <StatCard label="Solar Heat Gain" value={m?.solarHeatGain?.toFixed(1) ?? '—'} unit="kWh" icon={<TrendingUp className="w-4 h-4" />} color="#f59e0b" />
            <StatCard label="Thermal Retention" value={m?.thermalRetentionIndex ?? '—'} unit="/100" icon={<Flame className="w-4 h-4" />} color="#f97316" />
            <StatCard label="Energy Demand" value={m?.energyDemandIndex ?? '—'} unit="/100" icon={<Zap className="w-4 h-4" />} color="#eab308" />
          </div>
        </Card>

        <Card title="Overall Design Score" tooltip={<InfoTooltip label="Design Score" content="Weighted combination of comfort (35%), thermal retention (20%), energy efficiency (20%), sustainability (15%), and cost (10%)." />}>
          <div className="flex flex-col items-center py-2">
            <Gauge value={designScore} label="Design Score" unit="/ 100" color={designScore >= 75 ? '#10b981' : designScore >= 50 ? '#f59e0b' : '#ef4444'} />
            <div className="mt-4 grid grid-cols-2 gap-3 w-full">
              <div className="text-center">
                <div className="text-xs text-slate-500">Peak Indoor</div>
                <div className="text-lg font-bold text-slate-200">{m?.peakIndoor?.toFixed(1) ?? '—'}°C</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">Min Indoor</div>
                <div className="text-lg font-bold text-slate-200">{m?.minIndoor?.toFixed(1) ?? '—'}°C</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Predicted Indoor Temp" value={m?.avgIndoor?.toFixed(1) ?? '—'} unit="°C" icon={<Thermometer className="w-4 h-4" />} />
        <StatCard label="Temp Fluctuation" value={m?.temperatureFluctuation?.toFixed(1) ?? '—'} unit="°C" icon={<Activity className="w-4 h-4" />} status={m && m.temperatureFluctuation < 5 ? 'good' : m && m.temperatureFluctuation < 10 ? 'warning' : 'critical'} />
        <StatCard label="Ventilation Effectiveness" value={m?.ventilationEffectiveness ?? '—'} unit="/100" icon={<Wind className="w-4 h-4" />} />
        <StatCard label="Est. Total Cost" value={`₹${(cost.totalCost / 1000).toFixed(0)}k`} unit="" icon={<Award className="w-4 h-4" />} color="#8b5cf6" />
      </div>

      {/* Pipeline visualization */}
      <Card title="Analysis Pipeline" tooltip={<InfoTooltip content="The THERMOSHELTER-X pipeline flows from climate data through simulation to ranked recommendation. Click any stage to navigate." />}>
        <div className="flex flex-wrap items-center gap-2 py-2">
          {pipelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <button
                onClick={() => onNavigate(step.page)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:scale-105 ${
                  step.done
                    ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-500'
                }`}
              >
                {step.icon}
                {step.label}
                {step.done && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
              {i < pipelineSteps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-600" />}
            </div>
          ))}
        </div>
      </Card>

      {/* Shelter summary */}
      <Card title="Current Shelter Configuration">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-xs text-slate-500">Dimensions</span>
            <p className="text-slate-200">{shelter.geometry.length}m × {shelter.geometry.width}m × {shelter.geometry.height}m</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Orientation</span>
            <p className="text-slate-200">{shelter.geometry.orientation}°</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Ventilation</span>
            <p className="text-slate-200 capitalize">{shelter.ventilation}</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Shading</span>
            <p className="text-slate-200 capitalize">{shelter.shading}</p>
          </div>
        </div>
      </Card>

      <div className="text-center py-2">
        <p className="text-xs text-slate-600 italic">
          {climate.source}
        </p>
      </div>
    </div>
  );
}
