/**
 * Built-in Preset-Bibliothek
 * Eigene Presets werden in localStorage gespeichert (key: '3dgen_presets')
 */
export const BUILTIN_PRESETS = [

  // ── Abdeckungen ─────────────────────────────────────────────────────────────
  {
    id: 'wandabdeckung_80',
    label: 'Wandabdeckung Ø80',
    description: 'Abdeckkappe für 80mm Wanddurchführung',
    group: 'Abdeckungen',
    shape: 'abdeckkappe',
    params: { outer_diameter: 90, wall_thickness: 2.5, lip_height: 10, top_thickness: 2.5 },
  },
  {
    id: 'wandabdeckung_50',
    label: 'Wandabdeckung Ø50',
    description: 'Abdeckkappe für 50mm Wanddurchführung',
    group: 'Abdeckungen',
    shape: 'abdeckkappe',
    params: { outer_diameter: 60, wall_thickness: 2, lip_height: 8, top_thickness: 2 },
  },

  // ── Distanzscheiben ──────────────────────────────────────────────────────────
  {
    id: 'distanz_m8_5',
    label: 'Distanzscheibe M8 · 5mm',
    group: 'Distanzscheiben',
    shape: 'hollow_cylinder',
    params: { outer_diameter: 20, inner_diameter: 8.5, height: 5 },
  },
  {
    id: 'distanz_m8_10',
    label: 'Distanzscheibe M8 · 10mm',
    group: 'Distanzscheiben',
    shape: 'hollow_cylinder',
    params: { outer_diameter: 20, inner_diameter: 8.5, height: 10 },
  },
  {
    id: 'distanz_m6_3',
    label: 'Distanzscheibe M6 · 3mm',
    group: 'Distanzscheiben',
    shape: 'hollow_cylinder',
    params: { outer_diameter: 14, inner_diameter: 6.4, height: 3 },
  },
  {
    id: 'distanz_m5_2',
    label: 'Distanzscheibe M5 · 2mm',
    group: 'Distanzscheiben',
    shape: 'hollow_cylinder',
    params: { outer_diameter: 10, inner_diameter: 5.3, height: 2 },
  },

  // ── Muttern & Bolzen ─────────────────────────────────────────────────────────
  {
    id: 'm8_mutter',
    label: 'M8 Sechskantmutter',
    group: 'Muttern & Bolzen',
    shape: 'sechskant_mutter',
    params: { width_across_flats: 13, thread_diameter: 8.4, height: 6.5 },
  },
  {
    id: 'm6_mutter',
    label: 'M6 Sechskantmutter',
    group: 'Muttern & Bolzen',
    shape: 'sechskant_mutter',
    params: { width_across_flats: 10, thread_diameter: 6.4, height: 5 },
  },
  {
    id: 'm5_mutter',
    label: 'M5 Sechskantmutter',
    group: 'Muttern & Bolzen',
    shape: 'sechskant_mutter',
    params: { width_across_flats: 8, thread_diameter: 5.3, height: 4 },
  },

  // ── Flansche ─────────────────────────────────────────────────────────────────
  {
    id: 'flansch_50_20',
    label: 'Flansch Ø50 / Rohr Ø20',
    group: 'Flansche',
    shape: 'flansch',
    params: { flange_diameter: 50, pipe_diameter: 20, wall_thickness: 2.5, flange_thickness: 4, pipe_height: 20 },
  },

  // ── Rohre ─────────────────────────────────────────────────────────────────────
  {
    id: 'rohr_22mm',
    label: 'Hülse Ø22mm (Lenker)',
    description: 'Passend für Fahrrad-Lenker Ø22mm',
    group: 'Rohre',
    shape: 'rohr',
    params: { outer_diameter: 25, inner_diameter: 22, height: 30 },
  },
]

// ── Gespeicherte Presets (localStorage) ──────────────────────────────────────

const STORAGE_KEY = '3dgen_presets'

export function loadSavedPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function savePreset(preset) {
  const saved = loadSavedPresets()
  const updated = [...saved.filter(p => p.id !== preset.id), preset]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}

export function deletePreset(id) {
  const saved = loadSavedPresets()
  const updated = saved.filter(p => p.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}
