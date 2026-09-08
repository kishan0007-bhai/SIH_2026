import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard, Cloud, Home, Layers, FlaskConical,
  GitCompareArrows, Lightbulb, Award, Leaf, FileText,
  Menu, X, Zap, ShieldCheck,
} from 'lucide-react';

export type PageId =
  | 'overview' | 'climate' | 'shelter' | 'materials'
  | 'simulation' | 'compare' | 'optimization' | 'recommendation'
  | 'sustainability' | 'report';

interface NavItem {
  id: PageId;
  label: string;
  icon: ReactNode;
  group: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" />, group: 'Dashboard' },
  { id: 'climate', label: 'Climate Profile', icon: <Cloud className="w-4 h-4" />, group: 'Data Layer' },
  { id: 'shelter', label: 'Shelter Model', icon: <Home className="w-4 h-4" />, group: 'Digital Twin' },
  { id: 'materials', label: 'Materials', icon: <Layers className="w-4 h-4" />, group: 'Digital Twin' },
  { id: 'simulation', label: 'Simulation', icon: <FlaskConical className="w-4 h-4" />, group: 'Analysis' },
  { id: 'compare', label: 'Compare', icon: <GitCompareArrows className="w-4 h-4" />, group: 'Analysis' },
  { id: 'optimization', label: 'Optimization', icon: <Zap className="w-4 h-4" />, group: 'Decision' },
  { id: 'recommendation', label: 'Recommendation', icon: <Lightbulb className="w-4 h-4" />, group: 'Decision' },
  { id: 'sustainability', label: 'Sustainability', icon: <Leaf className="w-4 h-4" />, group: 'Impact' },
  { id: 'report', label: 'Report', icon: <FileText className="w-4 h-4" />, group: 'Output' },
];

interface LayoutProps {
  current: PageId;
  onNavigate: (page: PageId) => void;
  children: ReactNode;
  onLoadDemo: () => void;
  onRunLadakh: () => void;
}

export function Layout({ current, onNavigate, children, onLoadDemo, onRunLadakh }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const groups = [...new Set(NAV_ITEMS.map(n => n.group))];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800
        flex flex-col transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-6 h-6 text-sky-400" />
            <span className="text-sm font-bold text-slate-100 tracking-tight">THERMOSHELTER-X</span>
          </div>
          <div className="text-[10px] text-slate-500 leading-relaxed">
            Zone Zero • SIH 2026<br />
            PS: SIH26051
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {groups.map(group => (
            <div key={group} className="mb-1">
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-slate-600 font-semibold">{group}</div>
              {NAV_ITEMS.filter(n => n.group === group).map(item => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                    ${current === item.id
                      ? 'bg-sky-500/10 text-sky-300 border-l-2 border-sky-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-2 border-transparent'}
                  `}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-slate-800 space-y-2">
          <button
            onClick={onLoadDemo}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Zap className="w-3.5 h-3.5" /> LOAD DEMO
          </button>
          <button
            onClick={onRunLadakh}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs font-medium rounded-lg transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" /> RUN LADAKH CASE STUDY
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden text-slate-400 hover:text-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-base font-semibold text-slate-100">
                  THERMOSHELTER-X
                  <span className="ml-2 text-xs font-normal text-slate-500">Area-Specific Digital Twin & Optimization Platform</span>
                </h1>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Zone Zero
              </div>
              <div className="text-slate-500">SIH 2026</div>
              <div className="px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">SIH26051</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {children}
        </main>

        <footer className="px-4 lg:px-6 py-3 border-t border-slate-800 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <span>"Design the shelter for the climate — not the climate for the shelter."</span>
          <span className="text-slate-700">Physics-based transient thermal approximation — validation with ANSYS/field measurements required.</span>
        </footer>
      </div>
    </div>
  );
}
