import { useApp } from '@/store/AppContext';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Controls';
import { InfoTooltip } from '@/components/ui/Tooltip';
import { PRIORITY_COLORS } from '@/engine/designAdvisor';
import { getComfortCategory, getComfortColor } from '@/engine/comfortEngine';
import type { PageId } from '@/components/Layout';
import {
  Lightbulb, AlertTriangle, ArrowRight, TrendingUp, Snowflake,
  Wind, Sun, Shield, Thermometer, Zap, Home,
} from 'lucide-react';

const PRIORITY_ICONS: Record<string, React.ReactNode> = {
  high: <AlertTriangle className="w-4 h-4" />,
  medium: <Lightbulb className="w-4 h-4" />,
  low: <Lightbulb className="w-4 h-4" />,
};

export function RecommendationPage({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { recommendations, simResult, shelter, climate, optimizationCandidates, applyOptimizedDesign } = useApp();

  const best = optimizationCandidates[0];
  const comfortScore = simResult?.comfort.score ?? 0;

  // Climate-specific design priorities
  const climatePriorities: Record<string, { title: string; items: string[]; icon: React.ReactNode }> = {
    'high-altitude-cold': {
      title: 'High-Altitude Cold — Design Priorities',
      icon: <Snowflake className="w-5 h-5 text-sky-400" />,
      items: ['Insulation', 'Thermal mass', 'Controlled openings', 'Solar heat utilization', 'Reduced nighttime heat loss', 'Passive solar orientation'],
    },
    cold: {
      title: 'Cold Climate — Design Priorities',
      icon: <Snowflake className="w-5 h-5 text-blue-400" />,
      items: ['Insulation', 'Thermal mass', 'Solar gain', 'Air sealing', 'Passive solar orientation'],
    },
    'warm-humid': {
      title: 'Warm-Humid — Design Priorities',
      icon: <Wind className="w-5 h-5 text-teal-400" />,
      items: ['Cross ventilation', 'Solar shading', 'Reduced solar gain', 'Roof ventilation', 'Moisture-aware design'],
    },
    'hot-dry': {
      title: 'Hot-Dry — Design Priorities',
      icon: <Sun className="w-5 h-5 text-amber-400" />,
      items: ['Thermal mass', 'Shading', 'Night ventilation', 'Reflective roof', 'Controlled openings'],
    },
    composite: {
      title: 'Composite Climate — Design Priorities',
      icon: <Thermometer className="w-5 h-5 text-violet-400" />,
      items: ['Seasonal solar gain', 'Ventilation', 'Insulation', 'Shading', 'Adaptive design'],
    },
  };

  const priorities = climatePriorities[climate.climateType] ?? climatePriorities['composite'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">THERMOSHELTER-X Design Advisor</h2>
        <p className="text-sm text-slate-500">Deterministic rule-based expert recommendation engine — NOT a paid LLM</p>
      </div>

      {/* Status summary */}
      {simResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Comfort Score</div>
                <div className="text-2xl font-bold" style={{ color: getComfortColor(comfortScore) }}>{comfortScore}</div>
                <div className="text-xs text-slate-400">{getComfortCategory(comfortScore)}</div>
              </div>
              <Thermometer className="w-8 h-8 text-slate-700" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Active Recommendations</div>
                <div className="text-2xl font-bold text-slate-200">{recommendations.filter(r => r.priority === 'high').length}</div>
                <div className="text-xs text-slate-400">high priority</div>
              </div>
              <Lightbulb className="w-8 h-8 text-slate-700" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500">Best Optimized Score</div>
                <div className="text-2xl font-bold text-sky-300">{best?.overallScore ?? '—'}</div>
                <div className="text-xs text-slate-400">{best ? 'from optimization' : 'run optimization'}</div>
              </div>
              <Zap className="w-8 h-8 text-slate-700" />
            </div>
          </Card>
        </div>
      )}

      {/* Climate-specific priorities */}
      <Card title={priorities.title}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{priorities.icon}</div>
          <div className="flex flex-wrap gap-2">
            {priorities.items.map(item => (
              <Badge key={item} color="blue">{item}</Badge>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          The recommendation logic adapts to the selected climate type. This demonstrates that the framework is area-specific rather than hard-coded to one shelter design.
        </p>
      </Card>

      {/* Recommendations list */}
      {recommendations.length > 0 ? (
        <div className="space-y-3">
          {recommendations.map(rec => (
            <Card key={rec.id}>
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${PRIORITY_COLORS[rec.priority]}20`, color: PRIORITY_COLORS[rec.priority] }}
                >
                  {PRIORITY_ICONS[rec.priority]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-100">{rec.title}</h4>
                    <Badge color={rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'blue'}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{rec.reason}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-500">Expected Impact:</span>
                    <span className="text-emerald-300">{rec.expectedImpact}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <Lightbulb className="w-12 h-12 text-slate-700 mb-3" />
            <p className="text-slate-400 text-sm">Run a simulation to generate design recommendations.</p>
            <Button onClick={() => onNavigate('simulation')} className="mt-3" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Go to Simulation
            </Button>
          </div>
        </Card>
      )}

      {/* Apply optimized design */}
      {best && (
        <Card title="Apply Best Configuration" className="border-sky-500/20 bg-sky-500/5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">
                The optimization engine identified <strong className="text-sky-300">{best.label}</strong> as the top-ranked configuration with an overall score of <strong className="text-sky-300">{best.overallScore}</strong>.
              </p>
              <p className="text-xs text-slate-500 mt-1">Applying this will update the shelter model with the recommended materials, orientation, ventilation, and shading.</p>
            </div>
            <Button onClick={() => applyOptimizedDesign(best)} variant="success" icon={<Shield className="w-4 h-4" />}>
              APPLY OPTIMIZED DESIGN
            </Button>
          </div>
        </Card>
      )}

      {/* Next steps */}
      <Card title="Next Steps">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onNavigate('optimization')} variant="secondary" size="sm" icon={<Zap className="w-3.5 h-3.5" />}>Run Optimization</Button>
          <Button onClick={() => onNavigate('compare')} variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>Compare Configurations</Button>
          <Button onClick={() => onNavigate('sustainability')} variant="secondary" size="sm" icon={<Home className="w-3.5 h-3.5" />}>View Sustainability</Button>
          <Button onClick={() => onNavigate('report')} variant="secondary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>Generate Report</Button>
        </div>
      </Card>
    </div>
  );
}
