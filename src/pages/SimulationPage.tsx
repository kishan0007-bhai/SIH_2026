import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { Card, StatCard, Badge, Gauge } from '@/components/ui/Card';
import { Button, Select, NumberInput, ProgressBar } from '@/components/ui/Controls';
import { InfoTooltip, CalcLogicDrawer } from '@/components/ui/Tooltip';
import { getComfortColor, getComfortCategory } from '@/engine/comfortEngine';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Area, AreaChart, BarChart, Bar,
} from 'recharts';
import { Play, Activity, Clock, RefreshCw, Thermometer, TrendingDown, TrendingUp, Sun } from 'lucide-react';

const DURATION_OPTIONS = [
  { value: '6', label: '6 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours' },
  { value: '48', label: '48 hours' },
  { value: '72', label: '72 hours' },
];

const TIMESTEP_OPTIONS = [
  { value: '5', label: '5 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
];

export function SimulationPage() {
  const { climate, shelter, simConfig, setSimConfig, simResult, runSim } = useApp();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRun = () => {
    setRunning(true);
    setProgress(0);
    // Simulate progress for visual feedback
    let p = 0;
    const interval = setInterval(() => {
      p += 10;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        runSim();
        setRunning(false);
      }
    }, 80);
  };

  const points = simResult?.points ?? [];
  const chartData = points.map(p => ({
    time: p.time,
    indoor: p.indoorTemp,
    ambient: p.ambientTemp,
    solarGain: p.solarGain,
    conduction: p.conductionGain,
    ventilation: p.ventilationGain,
    totalGain: p.totalHeatGain,
    totalLoss: p.totalHeatLoss,
  }));

  const m = simResult?.metrics;
  const comfortScore = m?.comfortScore ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Thermal Simulation</h2>
          <p className="text-sm text-slate-500">Physics-based transient thermal approximation — validation with ANSYS/field measurements required.</p>
        </div>
        <CalcLogicDrawer
          title="Transient Thermal Model"
          formula={`C × dT_inside/dt = Q_solar + Q_conduction + Q_ventilation + Q_internal

Where:
  C = thermal capacitance (J/K)
  Q_solar = solar_radiation × opening_area × SHGC × (1 - shading_factor)
  Q_conduction = ΔT / R,  R = thickness / (k × area)
  Q_ventilation = ACH × V × ρ × Cp × ΔT
  Q_internal = occupancy + equipment heat gain`}
          factors={
            <div className="space-y-2">
              <p><strong className="text-sky-300">Thermal Resistance:</strong> R = thickness / (k × area). Lower k and greater thickness = better insulation.</p>
              <p><strong className="text-sky-300">Thermal Mass:</strong> C = Σ(density × volume × specific_heat). Higher mass buffers temperature swings.</p>
              <p><strong className="text-sky-300">Ventilation:</strong> Air changes per hour (ACH) drives heat exchange with outdoor air.</p>
              <p><strong className="text-sky-300">Solar Gain:</strong> Reduced by shading factor and orientation relative to sun path.</p>
            </div>
          }
        />
      </div>

      {/* Config panel */}
      <Card title="Simulation Configuration">
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Duration" value={String(simConfig.durationHours)} onChange={v => setSimConfig({ ...simConfig, durationHours: parseInt(v) })} options={DURATION_OPTIONS} />
          <Select label="Time Step" value={String(simConfig.timeStepMinutes)} onChange={v => setSimConfig({ ...simConfig, timeStepMinutes: parseInt(v) })} options={TIMESTEP_OPTIONS} />
          <NumberInput label="Internal Heat Gain (W)" value={simConfig.internalHeatGain} onChange={v => setSimConfig({ ...simConfig, internalHeatGain: v })} min={0} max={2000} step={50} />
          <NumberInput label="Initial Indoor Temp (°C)" value={simConfig.initialIndoorTemp} onChange={v => setSimConfig({ ...simConfig, initialIndoorTemp: v })} min={-20} max={50} step={1} />
          <Button onClick={handleRun} disabled={running} size="lg" icon={running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}>
            {running ? 'Simulating...' : 'RUN SIMULATION'}
          </Button>
        </div>

        {running && (
          <div className="mt-4 space-y-2">
            <ProgressBar value={progress} label="Simulation Progress" />
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-sky-400" /> Status: Running</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-sky-400" /> Iterations: {Math.round((progress / 100) * climate.data.length)}</span>
              <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-sky-400" /> Time: {((progress / 100) * simConfig.durationHours).toFixed(1)}h</span>
            </div>
          </div>
        )}

        {!running && simResult && (
          <div className="mt-4 flex items-center gap-3 text-sm">
            <Badge color="green">Simulation Complete</Badge>
            <span className="text-slate-400">{points.length} data points • {simConfig.durationHours}h • {simConfig.timeStepMinutes}min step</span>
          </div>
        )}
      </Card>

      {simResult && m && (
        <>
          {/* Key results */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Peak Indoor" value={m.peakIndoor} unit="°C" icon={<TrendingUp className="w-4 h-4" />} color="#ef4444" />
            <StatCard label="Min Indoor" value={m.minIndoor} unit="°C" icon={<TrendingDown className="w-4 h-4" />} color="#0ea5e9" />
            <StatCard label="Avg Indoor" value={m.avgIndoor} unit="°C" icon={<Thermometer className="w-4 h-4" />} color="#f59e0b" />
            <StatCard label="Temp Fluctuation" value={m.temperatureFluctuation} unit="°C" icon={<Activity className="w-4 h-4" />} status={m.temperatureFluctuation < 5 ? 'good' : m.temperatureFluctuation < 10 ? 'warning' : 'critical'} />
            <StatCard label="Total Heat Gain" value={m.totalHeatGain} unit="kWh" icon={<TrendingUp className="w-4 h-4" />} color="#f59e0b" />
            <StatCard label="Total Heat Loss" value={m.totalHeatLoss} unit="kWh" icon={<TrendingDown className="w-4 h-4" />} color="#ef4444" />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Indoor vs Outdoor Temperature" tooltip={<InfoTooltip content="Compares the simulated indoor temperature against the ambient outdoor temperature over the simulation period." />}>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis stroke="#64748b" fontSize={11} label={{ value: '°C', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="indoor" stroke="#38bdf8" strokeWidth={2.5} dot={false} name="Indoor Temp" />
                  <Line type="monotone" dataKey="ambient" stroke="#f59e0b" strokeWidth={2} dot={false} name="Outdoor Temp" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Heat Gain vs Heat Loss" tooltip={<InfoTooltip content="Total heat gain (solar + conduction inward + ventilation inward + internal) vs total heat loss (conduction outward + ventilation outward) at each time step." />}>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis stroke="#64748b" fontSize={11} label={{ value: 'W', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="totalGain" stroke="#f59e0b" fill="#f59e0b33" strokeWidth={2} name="Heat Gain (W)" />
                  <Area type="monotone" dataKey="totalLoss" stroke="#ef4444" fill="#ef444433" strokeWidth={2} name="Heat Loss (W)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Solar Heat Gain Over Time" tooltip={<InfoTooltip content="Solar radiation entering through openings, adjusted for shading and orientation. Higher values in cold climates are beneficial; in hot climates they increase cooling load." />}>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis stroke="#64748b" fontSize={11} label={{ value: 'W', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Area type="monotone" dataKey="solarGain" stroke="#eab308" fill="#eab30833" strokeWidth={2} name="Solar Gain (W)" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Heat Flow Breakdown" tooltip={<InfoTooltip content="Breakdown of heat transfer components: conduction through envelope, ventilation/infiltration, solar gain, and internal heat gain." />}>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                  <YAxis stroke="#64748b" fontSize={11} label={{ value: 'W', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="conduction" stackId="a" fill="#6366f1" name="Conduction (W)" />
                  <Bar dataKey="ventilation" stackId="a" fill="#06b6d4" name="Ventilation (W)" />
                  <Bar dataKey="solarGain" stackId="a" fill="#eab308" name="Solar (W)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Comfort + retention */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card title="Comfort Score" tooltip={<InfoTooltip content="Prototype comfort index. NOT an official PMV/PPD certification." />}>
              <div className="flex flex-col items-center py-2">
                <Gauge value={comfortScore} label={getComfortCategory(comfortScore)} unit="/ 100" color={getComfortColor(comfortScore)} />
              </div>
            </Card>
            <Card title="Thermal Retention Index" tooltip={<InfoTooltip content="Measures how well the shelter buffers outdoor temperature swings. 100 = perfect buffering, 0 = indoor tracks outdoor exactly." />}>
              <div className="flex flex-col items-center py-2">
                <Gauge value={m.thermalRetentionIndex} label="Retention" unit="/ 100" color="#f97316" />
              </div>
            </Card>
            <Card title="Energy Demand Index" tooltip={<InfoTooltip content="Indicates how much active heating/cooling energy would be needed. Lower is better — means the passive design handles comfort." />}>
              <div className="flex flex-col items-center py-2">
                <Gauge value={m.energyDemandIndex} label="Energy Demand" unit="/ 100" color={m.energyDemandIndex < 30 ? '#10b981' : m.energyDemandIndex < 60 ? '#f59e0b' : '#ef4444'} />
              </div>
            </Card>
          </div>
        </>
      )}

      {!simResult && !running && (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <Sun className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">No simulation data yet. Configure parameters above and click RUN SIMULATION.</p>
          </div>
        </Card>
      )}
    </div>
  );
}
