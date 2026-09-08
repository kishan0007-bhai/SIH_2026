import type { Material } from '@/types';

// Prototype material database — values can be replaced with validated project data.

export const MATERIALS: Material[] = [
  // ---- WALLS ----
  { id: 'wall-brick', name: 'Brick (230mm)', category: 'wall', thermalConductivity: 0.81, density: 1700, specificHeat: 800, thickness: 0.23, costPerSqm: 1800, color: '#b45309' },
  { id: 'wall-aac', name: 'AAC Block (200mm)', category: 'wall', thermalConductivity: 0.16, density: 550, specificHeat: 1000, thickness: 0.20, costPerSqm: 2200, color: '#d6d3d1' },
  { id: 'wall-concrete', name: 'Concrete (200mm)', category: 'wall', thermalConductivity: 1.74, density: 2300, specificHeat: 1000, thickness: 0.20, costPerSqm: 2800, color: '#9ca3af' },
  { id: 'wall-mud', name: 'Mud / Earth (300mm)', category: 'wall', thermalConductivity: 0.55, density: 1600, specificHeat: 1200, thickness: 0.30, costPerSqm: 900, color: '#a16207' },
  { id: 'wall-insulated-panel', name: 'Insulated Panel (100mm)', category: 'wall', thermalConductivity: 0.035, density: 40, specificHeat: 1400, thickness: 0.10, costPerSqm: 3500, color: '#fbbf24' },

  // ---- ROOF ----
  { id: 'roof-rcc', name: 'RCC Slab (150mm)', category: 'roof', thermalConductivity: 1.58, density: 2300, specificHeat: 1000, thickness: 0.15, costPerSqm: 2500, color: '#6b7280' },
  { id: 'roof-metal', name: 'Metal Sheet (0.5mm)', category: 'roof', thermalConductivity: 50, density: 7850, specificHeat: 480, thickness: 0.0005, costPerSqm: 800, color: '#94a3b8' },
  { id: 'roof-insulated-metal', name: 'Insulated Metal (50mm PUF)', category: 'roof', thermalConductivity: 0.025, density: 35, specificHeat: 1400, thickness: 0.05, costPerSqm: 2200, color: '#cbd5e1' },
  { id: 'roof-cool', name: 'Cool Roof (RCC + Reflective)', category: 'roof', thermalConductivity: 1.0, density: 2300, specificHeat: 1000, thickness: 0.15, costPerSqm: 3200, color: '#e0f2fe' },

  // ---- FLOOR ----
  { id: 'floor-concrete', name: 'Concrete Floor (100mm)', category: 'floor', thermalConductivity: 1.28, density: 2100, specificHeat: 1000, thickness: 0.10, costPerSqm: 1500, color: '#a8a29e' },
  { id: 'floor-stone', name: 'Stone Floor (40mm)', category: 'floor', thermalConductivity: 2.1, density: 2700, specificHeat: 800, thickness: 0.04, costPerSqm: 3000, color: '#78716c' },
  { id: 'floor-insulated', name: 'Insulated Floor (75mm EPS)', category: 'floor', thermalConductivity: 0.035, density: 30, specificHeat: 1400, thickness: 0.075, costPerSqm: 2800, color: '#fde68a' },

  // ---- INSULATION ----
  { id: 'ins-none', name: 'None', category: 'insulation', thermalConductivity: 99, density: 0, specificHeat: 0, thickness: 0, costPerSqm: 0, color: '#f3f4f6' },
  { id: 'ins-mineral-wool', name: 'Mineral Wool (50mm)', category: 'insulation', thermalConductivity: 0.038, density: 50, specificHeat: 1030, thickness: 0.05, costPerSqm: 600, color: '#e2e8f0' },
  { id: 'ins-eps', name: 'EPS (50mm)', category: 'insulation', thermalConductivity: 0.034, density: 20, specificHeat: 1400, thickness: 0.05, costPerSqm: 450, color: '#f1f5f9' },
  { id: 'ins-xps', name: 'XPS (50mm)', category: 'insulation', thermalConductivity: 0.028, density: 35, specificHeat: 1400, thickness: 0.05, costPerSqm: 800, color: '#dbeafe' },
];

export function getMaterial(id: string): Material | undefined {
  return MATERIALS.find(m => m.id === id);
}

export function getMaterialsByCategory(category: Material['category']): Material[] {
  return MATERIALS.filter(m => m.category === category);
}

// Shading reduction factors (fraction of solar gain blocked)
export const SHADING_FACTORS: Record<string, number> = {
  none: 0,
  overhang: 0.25,
  external: 0.45,
  louvers: 0.55,
  vegetation: 0.35,
};

export const VENTILATION_ACH: Record<string, number> = {
  natural: 0.5,
  cross: 2.0,
  mechanical: 4.0,
  hybrid: 3.0,
};

export const SHADING_LABELS: Record<string, string> = {
  none: 'None',
  overhang: 'Roof Overhang',
  external: 'External Shading',
  louvers: 'Louvers',
  vegetation: 'Vegetation',
};

export const VENTILATION_LABELS: Record<string, string> = {
  natural: 'Natural',
  cross: 'Cross Ventilation',
  mechanical: 'Mechanical',
  hybrid: 'Hybrid',
};
