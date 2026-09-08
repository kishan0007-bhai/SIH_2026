import type { ShelterModel } from '@/types';
import { getMaterial } from '@/data/materials';
import { SHADING_LABELS, VENTILATION_LABELS } from '@/data/materials';

interface Props {
  shelter: ShelterModel;
}

export function ShelterDiagram({ shelter }: Props) {
  const { length, width, height, orientation } = shelter.geometry;
  const wallMat = getMaterial(shelter.wallMaterialId);
  const roofMat = getMaterial(shelter.roofMaterialId);
  const insMat = getMaterial(shelter.insulationMaterialId);

  // Scale to fit in viewBox
  const maxDim = Math.max(length, width);
  const scale = 180 / maxDim;
  const w = width * scale;
  const l = length * scale;
  const h = height * scale * 0.6;

  // Isometric-ish projection
  const cx = 200;
  const cy = 130;
  const angle = (orientation * Math.PI) / 180;

  // Roof color
  const roofColor = roofMat?.color ?? '#6b7280';
  const wallColor = wallMat?.color ?? '#b45309';
  const insColor = insMat && insMat.id !== 'ins-none' ? insMat.color : 'transparent';

  // Window visualization
  const windowRatio = shelter.openings.windowRatio;
  const winW = w * 0.3 * Math.sqrt(windowRatio / 0.15);
  const winH = h * 0.5 * Math.sqrt(windowRatio / 0.15);

  // Shading visualization
  const hasOverhang = shelter.shading === 'overhang' || shelter.shading === 'external';
  const hasLouvers = shelter.shading === 'louvers';
  const hasVegetation = shelter.shading === 'vegetation';

  // Orientation arrow
  const arrowLen = 30;
  const ax = cx + Math.sin(angle) * arrowLen;
  const ay = cy - Math.cos(angle) * arrowLen;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 260" className="w-full max-w-md">
        {/* Ground */}
        <ellipse cx="200" cy="230" rx="170" ry="20" fill="#1e293b" opacity="0.5" />

        {/* Orientation compass */}
        <g transform="translate(340, 40)">
          <circle cx="0" cy="0" r="28" fill="none" stroke="#334155" strokeWidth="1.5" />
          <line x1="0" y1="-22" x2="0" y2="22" stroke="#334155" strokeWidth="0.5" />
          <line x1="-22" y1="0" x2="22" y2="0" stroke="#334155" strokeWidth="0.5" />
          <text x="0" y="-16" textAnchor="middle" fill="#64748b" fontSize="8">N</text>
          <text x="0" y="20" textAnchor="middle" fill="#64748b" fontSize="8">S</text>
          <text x="-18" y="3" textAnchor="middle" fill="#64748b" fontSize="8">W</text>
          <text x="18" y="3" textAnchor="middle" fill="#64748b" fontSize="8">E</text>
          {/* Orientation arrow */}
          <line x1="0" y1="0" x2={ax - 340} y2={ay - 40} stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#38bdf8" />
            </marker>
          </defs>
        </g>

        {/* Building — isometric box */}
        {/* Back wall */}
        <polygon
          points={`${cx - w / 2},${cy - h} ${cx + w / 2},${cy - h} ${cx + w / 2},${cy} ${cx - w / 2},${cy}`}
          fill={wallColor}
          stroke="#475569"
          strokeWidth="1.5"
          opacity="0.85"
        />
        {/* Right side wall (depth) */}
        <polygon
          points={`${cx + w / 2},${cy - h} ${cx + w / 2 + l * 0.3},${cy - h - l * 0.15} ${cx + w / 2 + l * 0.3},${cy - l * 0.15} ${cx + w / 2},${cy}`}
          fill={wallColor}
          stroke="#475569"
          strokeWidth="1.5"
          opacity="0.65"
        />
        {/* Roof */}
        <polygon
          points={`${cx - w / 2},${cy - h} ${cx + w / 2},${cy - h} ${cx + w / 2 + l * 0.3},${cy - h - l * 0.15} ${cx - w / 2 + l * 0.3},${cy - h - l * 0.15}`}
          fill={roofColor}
          stroke="#475569"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Insulation layer (if present) */}
        {insColor !== 'transparent' && (
          <polygon
            points={`${cx - w / 2 + 3},${cy - h + 3} ${cx + w / 2 - 3},${cy - h + 3} ${cx + w / 2 - 3},${cy - 3} ${cx - w / 2 + 3},${cy - 3}`}
            fill={insColor}
            stroke="none"
            opacity="0.3"
          />
        )}

        {/* Overhang shading */}
        {hasOverhang && (
          <polygon
            points={`${cx - w / 2 - 15},${cy - h} ${cx + w / 2 + 15},${cy - h} ${cx + w / 2 + 15},${cy - h - 4} ${cx - w / 2 - 15},${cy - h - 4}`}
            fill="#475569"
            opacity="0.6"
          />
        )}

        {/* Louvers */}
        {hasLouvers && (
          <>
            {[0, 1, 2, 3].map(i => (
              <line
                key={i}
                x1={cx - w / 2 + 5}
                y1={cy - h + 8 + i * (h / 5)}
                x2={cx + w / 2 - 5}
                y2={cy - h + 8 + i * (h / 5)}
                stroke="#64748b"
                strokeWidth="2"
                opacity="0.5"
              />
            ))}
          </>
        )}

        {/* Vegetation */}
        {hasVegetation && (
          <>
            <circle cx={cx - w / 2 - 12} cy={cy - h * 0.4} r="10" fill="#166534" opacity="0.6" />
            <circle cx={cx - w / 2 - 18} cy={cy - h * 0.5} r="8" fill="#14532d" opacity="0.5" />
            <circle cx={cx + w / 2 + 15} cy={cy - h * 0.35} r="9" fill="#166534" opacity="0.6" />
          </>
        )}

        {/* Window */}
        <rect
          x={cx - winW / 2}
          y={cy - h * 0.65}
          width={winW}
          height={winH}
          fill="#7dd3fc"
          stroke="#0ea5e9"
          strokeWidth="1"
          opacity="0.5"
          rx="2"
        />

        {/* Door */}
        <rect
          x={cx - 10}
          y={cy - h * 0.55}
          width="20"
          height={h * 0.55}
          fill="#78350f"
          stroke="#451a03"
          strokeWidth="1"
          opacity="0.8"
          rx="1"
        />

        {/* Dimension labels */}
        <text x={cx} y={cy + 18} textAnchor="middle" fill="#94a3b8" fontSize="9" className="font-mono">
          {length}m × {width}m × {height}m
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#64748b" fontSize="8">
          Orientation: {orientation}°
        </text>
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400 justify-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: wallColor }} /> Wall: {wallMat?.name}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded" style={{ background: roofColor }} /> Roof: {roofMat?.name}
        </span>
        {insColor !== 'transparent' && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: insColor }} /> Ins: {insMat?.name}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-sky-300/50 border border-sky-400" /> Windows: {(windowRatio * 100).toFixed(0)}%
        </span>
        <span className="text-slate-500">Shading: {SHADING_LABELS[shelter.shading]}</span>
        <span className="text-slate-500">Ventilation: {VENTILATION_LABELS[shelter.ventilation]}</span>
      </div>
    </div>
  );
}
