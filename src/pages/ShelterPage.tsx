import { useApp } from '@/store/AppContext';
import { Card, Badge } from '@/components/ui/Card';
import { Select, NumberInput, Slider } from '@/components/ui/Controls';
import { ShelterDiagram } from '@/components/ShelterDiagram';
import { getMaterialsByCategory, SHADING_LABELS, VENTILATION_LABELS } from '@/data/materials';
import type { ShelterModel, VentilationType, ShadingType } from '@/types';
import { Home, Compass, DoorOpen } from 'lucide-react';

const ORIENTATION_OPTIONS = [
  { value: '0', label: '0° (North)' },
  { value: '45', label: '45° (NE)' },
  { value: '90', label: '90° (East)' },
  { value: '135', label: '135° (SE)' },
  { value: '180', label: '180° (South)' },
  { value: '225', label: '225° (SW)' },
  { value: '270', label: '270° (West)' },
  { value: '315', label: '315° (NW)' },
];

export function ShelterPage() {
  const { shelter, setShelter } = useApp();

  const update = (patch: Partial<ShelterModel>) => setShelter({ ...shelter, ...patch });

  const updateGeometry = (patch: Partial<ShelterModel['geometry']>) =>
    setShelter({ ...shelter, geometry: { ...shelter.geometry, ...patch } });

  const updateOpenings = (patch: Partial<ShelterModel['openings']>) =>
    setShelter({ ...shelter, openings: { ...shelter.openings, ...patch } });

  const wallMats = getMaterialsByCategory('wall').map(m => ({ value: m.id, label: m.name }));
  const roofMats = getMaterialsByCategory('roof').map(m => ({ value: m.id, label: m.name }));
  const floorMats = getMaterialsByCategory('floor').map(m => ({ value: m.id, label: m.name }));
  const insMats = getMaterialsByCategory('insulation').map(m => ({ value: m.id, label: m.name }));

  const floorArea = shelter.geometry.length * shelter.geometry.width;
  const volume = floorArea * shelter.geometry.height;
  const wallArea = 2 * (shelter.geometry.length + shelter.geometry.width) * shelter.geometry.height;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Parametric Shelter Digital Twin</h2>
        <p className="text-sm text-slate-500">Configure geometry, materials, openings, ventilation, and shading — the diagram updates in real time</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Geometry */}
        <Card title="Geometry" tooltip={<span className="text-xs text-slate-500">Define the shelter's physical dimensions</span>}>
          <div className="space-y-3">
            <NumberInput label="Length (m)" value={shelter.geometry.length} onChange={v => updateGeometry({ length: v })} min={1} max={50} step={0.5} />
            <NumberInput label="Width (m)" value={shelter.geometry.width} onChange={v => updateGeometry({ width: v })} min={1} max={50} step={0.5} />
            <NumberInput label="Height (m)" value={shelter.geometry.height} onChange={v => updateGeometry({ height: v })} min={1} max={10} step={0.25} />
            <Select label="Orientation" value={String(shelter.geometry.orientation)} onChange={v => updateGeometry({ orientation: parseInt(v) })} options={ORIENTATION_OPTIONS} />

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Floor Area</div>
                <div className="text-lg font-bold text-slate-200">{floorArea.toFixed(1)} m²</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500">Volume</div>
                <div className="text-lg font-bold text-slate-200">{volume.toFixed(1)} m³</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 col-span-2">
                <div className="text-xs text-slate-500">Wall Area</div>
                <div className="text-lg font-bold text-slate-200">{wallArea.toFixed(1)} m²</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Center: Diagram */}
        <Card title="Shelter Visualization" className="lg:row-span-2">
          <ShelterDiagram shelter={shelter} />
        </Card>

        {/* Right: Openings */}
        <Card title="Openings" tooltip={<span className="text-xs text-slate-500">Window and door configuration affects solar gain and heat loss</span>}>
          <div className="space-y-3">
            <Slider label="Window-to-Wall Ratio" value={Math.round(shelter.openings.windowRatio * 100)} onChange={v => {
              const ratio = v / 100;
              updateOpenings({ windowRatio: ratio, windowArea: Math.round(wallArea * ratio * 100) / 100 });
            }} min={0} max={40} step={1} unit="%" />
            <NumberInput label="Window Area (m²)" value={shelter.openings.windowArea} onChange={v => updateOpenings({ windowArea: v })} min={0} max={50} step={0.1} />
            <Select label="Window Orientation" value={String(shelter.openings.windowOrientation)} onChange={v => updateOpenings({ windowOrientation: parseInt(v) })} options={ORIENTATION_OPTIONS} />
            <NumberInput label="Door Area (m²)" value={shelter.openings.doorArea} onChange={v => updateOpenings({ doorArea: v })} min={0} max={10} step={0.1} />
          </div>
        </Card>
      </div>

      {/* Bottom row: Materials + Ventilation + Shading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Envelope Materials">
          <div className="space-y-3">
            <Select label="Wall Material" value={shelter.wallMaterialId} onChange={v => update({ wallMaterialId: v })} options={wallMats} />
            <Select label="Roof Material" value={shelter.roofMaterialId} onChange={v => update({ roofMaterialId: v })} options={roofMats} />
            <Select label="Floor Material" value={shelter.floorMaterialId} onChange={v => update({ floorMaterialId: v })} options={floorMats} />
          </div>
        </Card>

        <Card title="Insulation & Ventilation">
          <div className="space-y-3">
            <Select label="Insulation" value={shelter.insulationMaterialId} onChange={v => update({ insulationMaterialId: v })} options={insMats} />
            {shelter.insulationMaterialId !== 'ins-none' && (
              <Slider label="Insulation Thickness" value={shelter.insulationThickness * 1000} onChange={v => update({ insulationThickness: v / 1000 })} min={25} max={150} step={5} unit="mm" color="#fbbf24" />
            )}
            <Select label="Ventilation Strategy" value={shelter.ventilation} onChange={v => update({ ventilation: v as VentilationType })} options={[
              { value: 'natural', label: VENTILATION_LABELS.natural },
              { value: 'cross', label: VENTILATION_LABELS.cross },
              { value: 'mechanical', label: VENTILATION_LABELS.mechanical },
              { value: 'hybrid', label: VENTILATION_LABELS.hybrid },
            ]} />
          </div>
        </Card>

        <Card title="Shading Strategy">
          <div className="space-y-3">
            <Select label="Shading Type" value={shelter.shading} onChange={v => update({ shading: v as ShadingType })} options={[
              { value: 'none', label: SHADING_LABELS.none },
              { value: 'overhang', label: SHADING_LABELS.overhang },
              { value: 'external', label: SHADING_LABELS.external },
              { value: 'louvers', label: SHADING_LABELS.louvers },
              { value: 'vegetation', label: SHADING_LABELS.vegetation },
            ]} />
            <div className="pt-2">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">Shading Reduction Factor</div>
                <div className="text-lg font-bold text-slate-200">
                  {shelter.shading === 'none' ? '0%' : `${Math.round((shelter.shading === 'overhang' ? 0.25 : shelter.shading === 'external' ? 0.45 : shelter.shading === 'louvers' ? 0.55 : 0.35) * 100)}%`}
                </div>
                <p className="text-xs text-slate-600 mt-1">Fraction of solar gain blocked by the shading strategy</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary badges */}
      <Card title="Configuration Summary">
        <div className="flex flex-wrap gap-2">
          <Badge color="blue"><Home className="w-3 h-3 inline mr-1" />{shelter.geometry.length}×{shelter.geometry.width}×{shelter.geometry.height}m</Badge>
          <Badge color="blue"><Compass className="w-3 h-3 inline mr-1" />{shelter.geometry.orientation}°</Badge>
          <Badge color="yellow"><DoorOpen className="w-3 h-3 inline mr-1" />{(shelter.openings.windowRatio * 100).toFixed(0)}% WWR</Badge>
          <Badge color="gray">{shelter.label}</Badge>
          <Badge color="green">{VENTILATION_LABELS[shelter.ventilation]}</Badge>
          <Badge color="green">{SHADING_LABELS[shelter.shading]}</Badge>
        </div>
      </Card>
    </div>
  );
}
