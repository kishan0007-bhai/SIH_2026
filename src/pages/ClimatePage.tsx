import { useRef, useState } from 'react';
import { useApp } from '@/store/AppContext';
import { Card, Badge } from '@/components/ui/Card';
import { Select, NumberInput, Button } from '@/components/ui/Controls';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { CLIMATE_PRESETS, createClimateProfile, CLIMATE_TYPE_LABELS } from '@/data/climatePresets';
import type { ClimateProfile, ClimateType } from '@/types';
import { Cloud, Upload, FileWarning, CheckCircle2, MapPin } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export function ClimatePage() {
  const { climate, setClimate } = useApp();
  const [selectedPreset, setSelectedPreset] = useState(climate.location);
  const [duration, setDuration] = useState(climate.durationHours);
  const [timeStep, setTimeStep] = useState(climate.timeStepMinutes);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSuccess, setCsvSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleApplyPreset = () => {
    const meta = CLIMATE_PRESETS.find(p => p.location === selectedPreset);
    if (!meta) return;
    const profile = createClimateProfile(meta.location, meta.climateType, duration, timeStep);
    setClimate(profile);
    setCsvError(null);
    setCsvSuccess(false);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.trim().split('\n');
        const header = lines[0].trim().toLowerCase();
        const expected = 'time,ambient_temperature,solar_radiation,wind_speed,relative_humidity';
        if (header !== expected) {
          setCsvError(`Invalid CSV header. Expected: ${expected}. Got: ${header}`);
          setCsvSuccess(false);
          return;
        }
        const data = lines.slice(1).map((line, i) => {
          const cols = line.trim().split(',');
          if (cols.length < 5) throw new Error(`Row ${i + 2}: insufficient columns`);
          const time = parseFloat(cols[0]);
          const ambientTemperature = parseFloat(cols[1]);
          const solarRadiation = parseFloat(cols[2]);
          const windSpeed = parseFloat(cols[3]);
          const relativeHumidity = parseFloat(cols[4]);
          if ([time, ambientTemperature, solarRadiation, windSpeed, relativeHumidity].some(v => isNaN(v))) {
            throw new Error(`Row ${i + 2}: non-numeric value found`);
          }
          if (relativeHumidity < 0 || relativeHumidity > 100) throw new Error(`Row ${i + 2}: humidity must be 0-100`);
          if (solarRadiation < 0) throw new Error(`Row ${i + 2}: solar radiation cannot be negative`);
          return { time, ambientTemperature, solarRadiation, windSpeed, relativeHumidity };
        });
        if (data.length < 2) {
          setCsvError('CSV must contain at least 2 data rows');
          setCsvSuccess(false);
          return;
        }
        const profile: ClimateProfile = {
          location: 'Custom (CSV Import)',
          climateType: climate.climateType,
          durationHours: data[data.length - 1].time - data[0].time,
          timeStepMinutes: Math.round((data[1].time - data[0].time) * 60),
          data,
          source: 'User-uploaded CSV dataset. Illustrative validation dataset.',
        };
        setClimate(profile);
        setCsvError(null);
        setCsvSuccess(true);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : 'Failed to parse CSV');
        setCsvSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  const chartData = climate.data.map(d => ({
    time: d.time,
    ambient: d.ambientTemperature,
    solar: d.solarRadiation,
    wind: d.windSpeed,
    humidity: d.relativeHumidity,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Climate Profile</h2>
        <p className="text-sm text-slate-500">Area-specific climate data input layer — the foundation of the THERMOSHELTER-X framework</p>
      </div>

      {/* Presets */}
      <Card title="Climate Presets" subtitle="Select a region to load an illustrative 24-hour demonstration profile">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CLIMATE_PRESETS.map(preset => (
            <button
              key={preset.location}
              onClick={() => setSelectedPreset(preset.location)}
              className={`text-left p-4 rounded-lg border transition-all ${
                selectedPreset === preset.location
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  {preset.location}
                </span>
                <Badge color="blue">{CLIMATE_TYPE_LABELS[preset.climateType as ClimateType]}</Badge>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{preset.description}</p>
              <div className="mt-2 flex gap-3 text-xs text-slate-600">
                <span>{preset.minTemp}–{preset.maxTemp}°C</span>
                <span>Solar: {preset.peakSolar} W/m²</span>
                <span>RH: {preset.avgHumidity}%</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <NumberInput label="Duration (hours)" value={duration} onChange={setDuration} min={1} max={168} />
          <NumberInput label="Time Step (minutes)" value={timeStep} onChange={setTimeStep} min={5} max={60} step={5} />
          <Button onClick={handleApplyPreset} icon={<Cloud className="w-4 h-4" />}>Apply Climate Profile</Button>
        </div>
      </Card>

      {/* CSV Upload */}
      <Card title="CSV Import" subtitle="Upload a custom climate dataset. CSV format: time, ambient_temperature, solar_radiation, wind_speed, relative_humidity"
        tooltip={<InfoTooltip content="CSV columns: time (hours), ambient_temperature (°C), solar_radiation (W/m²), wind_speed (m/s), relative_humidity (%). The file is validated for correct headers and numeric values." />}
      >
        <div className="flex items-center gap-4">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <Button onClick={() => fileRef.current?.click()} variant="secondary" icon={<Upload className="w-4 h-4" />}>
            Upload CSV
          </Button>
          {csvSuccess && (
            <span className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> CSV loaded successfully
            </span>
          )}
          {csvError && (
            <span className="flex items-center gap-2 text-sm text-red-400">
              <FileWarning className="w-4 h-4" /> {csvError}
            </span>
          )}
        </div>
      </Card>

      {/* Current profile info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <StatCard label="Location" value={climate.location} icon={<MapPin className="w-4 h-4" />} />
        <StatCard label="Climate Type" value={CLIMATE_TYPE_LABELS[climate.climateType]} icon={<Cloud className="w-4 h-4" />} />
        <StatCard label="Data Points" value={climate.data.length} icon={<Cloud className="w-4 h-4" />} />
        <StatCard label="Duration" value={`${climate.durationHours}h`} icon={<Cloud className="w-4 h-4" />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Ambient Temperature Profile (°C)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="ambient" stroke="#f59e0b" strokeWidth={2} dot={false} name="Ambient Temp" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Solar Radiation Profile (W/m²)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="solar" stroke="#eab308" strokeWidth={2} dot={false} name="Solar Radiation" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Wind Speed Profile (m/s)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="wind" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Wind Speed" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Relative Humidity Profile (%)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} label={{ value: 'Time (h)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="humidity" stroke="#06b6d4" strokeWidth={2} dot={false} name="Humidity" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="text-center py-2">
        <p className="text-xs text-slate-600 italic">{climate.source}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sky-400">{icon}</span>
        <span className="text-xs text-slate-400 font-medium">{label}</span>
      </div>
      <div className="text-lg font-bold text-slate-100">{value}</div>
    </div>
  );
}
