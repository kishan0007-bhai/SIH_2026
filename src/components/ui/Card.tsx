import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  tooltip?: ReactNode;
}

export function Card({ title, subtitle, children, className = '', action, tooltip }: CardProps) {
  return (
    <div className={`bg-slate-900/60 border border-slate-800 rounded-xl ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
            {tooltip}
          </div>
          {action}
        </div>
      )}
      {subtitle && <p className="px-5 pt-2 text-xs text-slate-500">{subtitle}</p>}
      <div className="p-5">{children}</div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  color?: string;
  tooltip?: ReactNode;
  status?: 'good' | 'warning' | 'critical' | 'neutral';
}

export function StatCard({ label, value, unit, icon, color = '#38bdf8', tooltip, status = 'neutral' }: StatCardProps) {
  const statusColors: Record<string, string> = {
    good: '#10b981',
    warning: '#f59e0b',
    critical: '#ef4444',
    neutral: color,
  };
  const sc = statusColors[status];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon && <span style={{ color: sc }}>{icon}</span>}
          <span className="text-xs text-slate-400 font-medium">{label}</span>
          {tooltip}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-100 tabular-nums">{value}</span>
        {unit && <span className="text-sm text-slate-500">{unit}</span>}
      </div>
      <div className="mt-2 h-1 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: typeof value === 'number' && value <= 100 ? `${value}%` : '100%', backgroundColor: sc }} />
      </div>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

export function Badge({ children, color = 'gray' }: BadgeProps) {
  const colors: Record<string, string> = {
    blue: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    yellow: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
    gray: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[color]}`}>
      {children}
    </span>
  );
}

interface GaugeProps {
  value: number;
  max?: number;
  label: string;
  unit?: string;
  color?: string;
}

export function Gauge({ value, max = 100, label, unit, color = '#38bdf8' }: GaugeProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="130" className="-rotate-90">
        <circle cx="65" cy="65" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={radius} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="-mt-[85px] flex flex-col items-center">
        <span className="text-2xl font-bold text-slate-100 tabular-nums">{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
      <span className="mt-12 text-xs text-slate-400 text-center">{label}</span>
    </div>
  );
}
