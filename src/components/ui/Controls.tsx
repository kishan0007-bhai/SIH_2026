import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}

export function Select({ value, onChange, options, label, className = '' }: SelectProps) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer"
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      </div>
    </label>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function NumberInput({ value, onChange, label, unit, min, max, step = 1, className = '' }: NumberInputProps) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      {label && <span className="text-xs text-slate-400 font-medium">{label}</span>}
      <div className="relative">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
            else if (e.target.value === '') onChange(0);
          }}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500 transition-colors tabular-nums"
        />
        {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">{unit}</span>}
      </div>
    </label>
  );
}

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  color?: string;
}

export function Slider({ value, onChange, label, min = 0, max = 100, step = 1, unit, color = '#38bdf8' }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="flex flex-col gap-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{label}</span>
          <span className="text-xs text-slate-300 tabular-nums">{value}{unit}</span>
        </div>
      )}
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, ${color} ${pct}%, #1e293b ${pct}%)` }}
      />
    </label>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, className = '', icon }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-sky-600 hover:bg-sky-500 text-white',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  };
  const sizes: Record<string, string> = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 font-medium rounded-lg transition-all ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

interface CollapsibleProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/60 hover:bg-slate-800/60 transition-colors"
      >
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
}

export function ProgressBar({ value, max = 100, label }: ProgressBarProps) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-slate-400">{label}</span>
          <span className="text-xs text-slate-300 tabular-nums">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full bg-sky-500 rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
