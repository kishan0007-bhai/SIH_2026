import { useState } from 'react';
import { useApp } from '@/store/AppContext';
import { Card, Badge } from '@/components/ui/Card';
import { Button, NumberInput, Select } from '@/components/ui/Controls';
import { MATERIALS, getMaterial, getMaterialsByCategory } from '@/data/materials';
import type { Material } from '@/types';
import { Plus, Trash2, FlaskConical } from 'lucide-react';

export function MaterialsPage() {
  const { shelter, setShelter } = useApp();
  const [customMaterial, setCustomMaterial] = useState<Partial<Material>>({
    id: '',
    name: '',
    category: 'wall',
    thermalConductivity: 0.5,
    density: 1500,
    specificHeat: 1000,
    thickness: 0.2,
    costPerSqm: 1500,
    color: '#94a3b8',
  });
  const [customMaterials, setCustomMaterials] = useState<Material[]>([]);

  const allMaterials = [...MATERIALS, ...customMaterials];

  const addCustomMaterial = () => {
    if (!customMaterial.name || !customMaterial.thermalConductivity) return;
    const id = `custom-${Date.now()}`;
    const mat: Material = {
      id,
      name: customMaterial.name!,
      category: customMaterial.category as Material['category'],
      thermalConductivity: customMaterial.thermalConductivity!,
      density: customMaterial.density ?? 1500,
      specificHeat: customMaterial.specificHeat ?? 1000,
      thickness: customMaterial.thickness ?? 0.2,
      costPerSqm: customMaterial.costPerSqm ?? 1500,
      color: customMaterial.color ?? '#94a3b8',
    };
    setCustomMaterials(prev => [...prev, mat]);
    setCustomMaterial({ ...customMaterial, name: '' });
  };

  const wallMat = getMaterial(shelter.wallMaterialId);
  const roofMat = getMaterial(shelter.roofMaterialId);
  const floorMat = getMaterial(shelter.floorMaterialId);
  const insMat = getMaterial(shelter.insulationMaterialId);

  const categories: Material['category'][] = ['wall', 'roof', 'floor', 'insulation'];
  const categoryLabels: Record<string, string> = { wall: 'Wall Materials', roof: 'Roof Materials', floor: 'Floor Materials', insulation: 'Insulation Materials' };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-100">Material Database</h2>
        <p className="text-sm text-slate-500">Thermal properties for envelope and insulation materials</p>
      </div>

      {/* Selected materials summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[wallMat, roofMat, floorMat, insMat].filter(Boolean).map(mat => (
          <Card key={mat!.id}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{mat!.category}</span>
              <span className="w-4 h-4 rounded" style={{ background: mat!.color }} />
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2">{mat!.name}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500">k (W/m·K)</span>
                <p className="text-slate-300 font-mono">{mat!.thermalConductivity}</p>
              </div>
              <div>
                <span className="text-slate-500">ρ (kg/m³)</span>
                <p className="text-slate-300 font-mono">{mat!.density}</p>
              </div>
              <div>
                <span className="text-slate-500">Cp (J/kg·K)</span>
                <p className="text-slate-300 font-mono">{mat!.specificHeat}</p>
              </div>
              <div>
                <span className="text-slate-500">t (m)</span>
                <p className="text-slate-300 font-mono">{mat!.thickness}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">R = t/(k·A) per m²</span>
                <p className="text-sky-300 font-mono">{(mat!.thickness / mat!.thermalConductivity).toFixed(3)} m²·K/W</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Material tables by category */}
      {categories.map(cat => (
        <Card key={cat} title={categoryLabels[cat]}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 px-2">Material</th>
                  <th className="text-right py-2 px-2">k (W/m·K)</th>
                  <th className="text-right py-2 px-2">ρ (kg/m³)</th>
                  <th className="text-right py-2 px-2">Cp (J/kg·K)</th>
                  <th className="text-right py-2 px-2">t (m)</th>
                  <th className="text-right py-2 px-2">R (m²·K/W)</th>
                  <th className="text-right py-2 px-2">₹/m²</th>
                  <th className="text-center py-2 px-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {allMaterials.filter(m => m.category === cat).map(mat => {
                  const isSelected = shelter.wallMaterialId === mat.id || shelter.roofMaterialId === mat.id || shelter.floorMaterialId === mat.id || shelter.insulationMaterialId === mat.id;
                  return (
                    <tr key={mat.id} className={`border-b border-slate-800/50 ${isSelected ? 'bg-sky-500/5' : ''}`}>
                      <td className="py-2 px-2">
                        <span className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded" style={{ background: mat.color }} />
                          <span className="text-slate-200">{mat.name}</span>
                          {isSelected && <Badge color="green">Selected</Badge>}
                        </span>
                      </td>
                      <td className="text-right py-2 px-2 text-slate-300 font-mono">{mat.thermalConductivity}</td>
                      <td className="text-right py-2 px-2 text-slate-300 font-mono">{mat.density}</td>
                      <td className="text-right py-2 px-2 text-slate-300 font-mono">{mat.specificHeat}</td>
                      <td className="text-right py-2 px-2 text-slate-300 font-mono">{mat.thickness}</td>
                      <td className="text-right py-2 px-2 text-sky-300 font-mono">{mat.thermalConductivity > 0 ? (mat.thickness / mat.thermalConductivity).toFixed(3) : '—'}</td>
                      <td className="text-right py-2 px-2 text-slate-300 font-mono">₹{mat.costPerSqm}</td>
                      <td className="text-center py-2 px-2">
                        <button
                          onClick={() => {
                            if (cat === 'wall') setShelter({ ...shelter, wallMaterialId: mat.id });
                            else if (cat === 'roof') setShelter({ ...shelter, roofMaterialId: mat.id });
                            else if (cat === 'floor') setShelter({ ...shelter, floorMaterialId: mat.id });
                            else if (cat === 'insulation') setShelter({ ...shelter, insulationMaterialId: mat.id });
                          }}
                          className="text-xs px-2 py-1 bg-slate-700 hover:bg-sky-600 text-slate-200 rounded transition-colors"
                        >
                          Use
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {/* Custom material entry */}
      <Card title="Add Custom Material" subtitle="Enter material properties — values will be used in the physics engine">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1 col-span-2">
            <span className="text-xs text-slate-400 font-medium">Name</span>
            <input
              type="text"
              value={customMaterial.name ?? ''}
              onChange={e => setCustomMaterial({ ...customMaterial, name: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-sky-500"
              placeholder="e.g. Hempcrete Panel"
            />
          </label>
          <Select label="Category" value={customMaterial.category ?? 'wall'} onChange={v => setCustomMaterial({ ...customMaterial, category: v as Material['category'] })} options={[
            { value: 'wall', label: 'Wall' },
            { value: 'roof', label: 'Roof' },
            { value: 'floor', label: 'Floor' },
            { value: 'insulation', label: 'Insulation' },
          ]} />
          <NumberInput label="k (W/m·K)" value={customMaterial.thermalConductivity ?? 0.5} onChange={v => setCustomMaterial({ ...customMaterial, thermalConductivity: v })} min={0.001} max={50} step={0.01} />
          <NumberInput label="Density (kg/m³)" value={customMaterial.density ?? 1500} onChange={v => setCustomMaterial({ ...customMaterial, density: v })} min={1} max={10000} step={10} />
          <NumberInput label="Cp (J/kg·K)" value={customMaterial.specificHeat ?? 1000} onChange={v => setCustomMaterial({ ...customMaterial, specificHeat: v })} min={100} max={5000} step={10} />
          <NumberInput label="Thickness (m)" value={customMaterial.thickness ?? 0.2} onChange={v => setCustomMaterial({ ...customMaterial, thickness: v })} min={0.001} max={1} step={0.01} />
          <NumberInput label="Cost (₹/m²)" value={customMaterial.costPerSqm ?? 1500} onChange={v => setCustomMaterial({ ...customMaterial, costPerSqm: v })} min={0} max={10000} step={50} />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={addCustomMaterial} icon={<Plus className="w-4 h-4" />} size="sm">Add Material</Button>
          {customMaterials.length > 0 && (
            <Button onClick={() => setCustomMaterials([])} variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />}>Clear Custom</Button>
          )}
        </div>
      </Card>

      <div className="text-center py-2">
        <p className="text-xs text-slate-600 italic">Prototype material database — values can be replaced with validated project data.</p>
      </div>
    </div>
  );
}
