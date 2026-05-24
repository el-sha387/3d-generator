/**
 * Fensterscheibe 4-teilig – Rahmen-Prinzip (neu)
 *
 * KONZEPT:
 *   Die Scheiben sind einfache, glatte Rechtecke (keine Nuten).
 *   Die Schienen formen einen H-Profil-Rahmen, der die Scheibenkanten
 *   von außen greift – wie ein Bilderrahmen-System.
 *
 * ZIP:
 *   Viertelscheibe.stl  (4×)  – exakt W/2 × H/2 × Stärke
 *   Schiene_H.stl       (2×)  – Horizontal-Schiene, greift obere+untere Kante
 *   Schiene_V.stl       (2×)  – Vertikal-Schiene (V-Schienen sind durchgehend)
 *
 * MONTAGE:
 *   1. V-Schienen auf linke/rechte Innenkanten der Scheiben schieben
 *   2. H-Schienen von oben/unten auf horizontale Innenkanten schieben
 *   3. H-Schienen ggf. an der Kreuzungsstelle etwas kürzen
 *
 * DRUCKORIENTIERUNG: alle Teile liegen flach auf dem Druckbett
 */

import * as THREE from 'three'

// ── Viertelscheibe: einfaches, flaches Rechteck ──────────────────────────────
function buildPanelGeo(pW, pH, t) {
  const geo = new THREE.BoxGeometry(pW, t, pH)
  geo.translate(0, t / 2, 0)  // Unterkante auf Y=0 (Druckbett)
  return geo
}

// ── H-Profil Schienen-Querschnitt ─────────────────────────────────────────────
// Außenrechteck mit zwei Aussparungen (oben + unten) = H-Profil
// Die Aussparungen greifen die Scheibenkanten von beiden Seiten.
//
//      ┌─────────────────────┐  ← Schienenhöhe (bar_height)
//      │  ┌───────────────┐  │
//      │  │  Scheibenkante│  │  ← Grifftiefe (grip_depth)
//      │  └───────────────┘  │
//      │  Massivteil         │  ← Verbindungssteg
//      │  ┌───────────────┐  │
//      │  │  Scheibenkante│  │  ← Grifftiefe (grip_depth)
//      │  └───────────────┘  │
//      └─────────────────────┘
//      ↕ total = bar_height + 2×grip_depth
//
function buildBarProfile(glassT, wallT, barH, gripD, cl) {
  const totW = glassT + cl + 2 * wallT   // Schienen-Breite (Richtung Scheibendicke)
  const totH = barH + 2 * gripD          // Schienen-Höhe gesamt
  const cW   = glassT + cl               // Kanalbreite (Scheibe + Spielmaß)

  // Außenrechteck
  const shape = new THREE.Shape()
  shape.moveTo(-totW / 2, -totH / 2)
  shape.lineTo( totW / 2, -totH / 2)
  shape.lineTo( totW / 2,  totH / 2)
  shape.lineTo(-totW / 2,  totH / 2)
  shape.closePath()

  // Oberer Kanal (Scheibenkante von oben einlegen)
  const upper = new THREE.Path()
  upper.moveTo(-cW / 2,  barH / 2)
  upper.lineTo( cW / 2,  barH / 2)
  upper.lineTo( cW / 2,  totH / 2)
  upper.lineTo(-cW / 2,  totH / 2)
  upper.closePath()
  shape.holes.push(upper)

  // Unterer Kanal (Scheibenkante von unten einlegen)
  const lower = new THREE.Path()
  lower.moveTo(-cW / 2, -totH / 2)
  lower.lineTo( cW / 2, -totH / 2)
  lower.lineTo( cW / 2, -barH / 2)
  lower.lineTo(-cW / 2, -barH / 2)
  lower.closePath()
  shape.holes.push(lower)

  return { shape, totW, totH, cW }
}

// ── Schienen-Geometrie (flach druckbar) ──────────────────────────────────────
function buildBarGeo(length, glassT, wallT, barH, gripD, cl) {
  const { shape, totW, totH } = buildBarProfile(glassT, wallT, barH, gripD, cl)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: length,
    bevelEnabled: false,
    curveSegments: 1,
  })

  // Nach ExtrudeGeometry: X=totW (dünn), Y=totH (sichtbar), Z=Länge
  // Rotation -90° um Z: X→Y, Y→-X → X=totH, Y=totW
  geo.applyMatrix4(new THREE.Matrix4().makeRotationZ(-Math.PI / 2))
  // Auf Druckbett legen (dünne Seite zeigt nach oben)
  geo.translate(0, totW / 2, 0)

  return geo
}

// ── Export ────────────────────────────────────────────────────────────────────
export const fenster_viertel = {
  label: 'Fensterscheibe 4-teilig + H-Profil Rahmen',
  shortLabel: 'Fensterscheibe',
  icon: '⊞',
  group: 'Spezialteile',
  type: 'multi',
  fields: [
    { id: 'window_width',  label: 'Fensterbreite',   min: 100, max: 2000, default: 400, step: 10  },
    { id: 'window_height', label: 'Fensterhöhe',     min: 100, max: 2000, default: 400, step: 10  },
    { id: 'glass_thickness',label: 'Scheiben-Stärke',min: 1,   max: 10,  default: 3,   step: 0.5 },
    { id: 'bar_height',    label: 'Steg-Höhe',       min: 5,   max: 40,  default: 12              },
    { id: 'grip_depth',    label: 'Grifftiefe',      min: 4,   max: 30,  default: 8               },
    { id: 'wall_thickness',label: 'Wandstärke',      min: 1,   max: 8,   default: 2.5, step: 0.5 },
    { id: 'clearance',     label: 'Spielmaß',        min: 0.1, max: 1,   default: 0.3, step: 0.05},
  ],

  buildParts({ window_width, window_height, glass_thickness, bar_height, grip_depth, wall_thickness, clearance }) {
    const pW = window_width  / 2
    const pH = window_height / 2
    const t  = glass_thickness
    const bH = bar_height
    const gD = grip_depth
    const wT = wall_thickness
    const cl = clearance

    const { totW, totH } = buildBarProfile(t, wT, bH, gD, cl)

    // Geometrien
    const panelGeo = buildPanelGeo(pW, pH, t)
    const hBarGeo  = buildBarGeo(pW, t, wT, bH, gD, cl)
    const vBarGeo  = buildBarGeo(pH, t, wT, bH, gD, cl)

    // Vorschau: Teile nebeneinander (Drucklayout)
    const colGap = 20
    const rowGap = 20
    const previewParts = [
      // Scheiben nebeneinander
      { geometry: panelGeo, label: 'Panel_1',    previewOffsetX: -(pW/2 + colGap/2), previewOffsetY: 0 },
      { geometry: panelGeo, label: 'Panel_2',    previewOffsetX:  (pW/2 + colGap/2), previewOffsetY: 0 },
      // H-Schienen darunter
      { geometry: hBarGeo,  label: 'H-Schiene_1',previewOffsetX: -(pW/2 + colGap/2), previewOffsetY: -(t + rowGap + totW/2) },
      { geometry: hBarGeo,  label: 'H-Schiene_2',previewOffsetX:  (pW/2 + colGap/2), previewOffsetY: -(t + rowGap + totW/2) },
      // V-Schienen nochmal darunter
      { geometry: vBarGeo,  label: 'V-Schiene_1',previewOffsetX: -(pH/2 + colGap/2), previewOffsetY: -(t + rowGap*2 + totW*1.5) },
      { geometry: vBarGeo,  label: 'V-Schiene_2',previewOffsetX:  (pH/2 + colGap/2), previewOffsetY: -(t + rowGap*2 + totW*1.5) },
    ]

    const downloadParts = [
      { geometry: panelGeo, label: 'Viertelscheibe' },  // 4×
      { geometry: hBarGeo,  label: 'Schiene_H' },        // 2×
      { geometry: vBarGeo,  label: 'Schiene_V' },        // 2×
    ]

    const barW = Math.round(totW * 10) / 10
    const barHtot = Math.round(totH * 10) / 10
    const isSquare = pW === pH

    return {
      parts: previewParts,
      downloadParts,
      numSeg: 3,
      info: [
        `Scheibe: ${pW}×${pH}×${t}mm (4×)`,
        `Schiene: ${barW}mm breit · ${barHtot}mm hoch · Kanal ${t+cl}mm`,
        isSquare
          ? `Schiene_H = Schiene_V (${pW}mm) → gleiche STL, 4× drucken`
          : `Schiene_H: ${pW}mm (2×) · Schiene_V: ${pH}mm (2×)`,
      ].join(' · '),
    }
  },

  calcVolume({ window_width, window_height, glass_thickness, bar_height, grip_depth, wall_thickness, clearance }) {
    const pW = window_width / 2, pH = window_height / 2, t = glass_thickness
    const { totW, totH, cW } = buildBarProfile(t, wall_thickness, bar_height, grip_depth, clearance)
    const panelVol = 4 * pW * pH * t
    const barArea  = totW * totH - 2 * (cW * grip_depth)  // H-Profil Querschnittsfläche
    const barVol   = 2 * barArea * pW + 2 * barArea * pH   // 2 H + 2 V bars
    return panelVol + barVol
  },
}
