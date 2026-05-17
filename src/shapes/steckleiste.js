import { primitives, booleans, transforms } from '@jscad/modeling'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'

const { cuboid } = primitives
const { subtract, union } = booleans
const { translate } = transforms

const BAMBU_MAX = 256  // Bambu X1/P1/A1 Bauraum in mm

/**
 * Baut eine segmentierte Steckleiste.
 * Gibt ein Array von Parts zurück – jedes mit Three.js-Geometry, Label und Vorschau-Offset.
 */
export function buildSteckleiste({ total_length, width, thickness, clearance }) {
  const numSeg  = Math.ceil(total_length / BAMBU_MAX)
  const segLen  = total_length / numSeg
  const pinLen  = Math.min(15, segLen * 0.06)
  const pinW    = width * 0.45
  const pinH    = thickness * 0.45

  const parts = []

  for (let i = 0; i < numSeg; i++) {
    const isFirst = i === 0
    const isLast  = i === numSeg - 1

    // Hauptkörper – zentriert um Origin
    let body = cuboid({ size: [segLen, width, thickness] })

    // ── Zapfen (rechtes Ende, außer letztes Segment) ──────────────────────────
    if (!isLast) {
      const pin = translate(
        [segLen / 2 + pinLen / 2, 0, 0],
        cuboid({ size: [pinLen, pinW, pinH] })
      )
      body = union(body, pin)
    }

    // ── Nut (linkes Ende, außer erstes Segment) ───────────────────────────────
    if (!isFirst) {
      // Nut etwas größer als Zapfen (Spielmaß) + 0.2mm damit Schnitt sauber durch Fläche geht
      const slot = translate(
        [-(segLen / 2) + (pinLen + 0.2) / 2, 0, 0],
        cuboid({ size: [pinLen + 0.2, pinW + clearance, pinH + clearance] })
      )
      body = subtract(body, slot)
    }

    parts.push({
      geometry: jscadToThreeGeometry(body),
      label:    `Segment_${String(i + 1).padStart(2, '0')}`,
      // Vorschau: Segmente nebeneinander mit 20mm Lücke
      previewOffsetX: i * (segLen + 20),
      previewOffsetY: thickness / 2,  // auf Grid-Ebene
    })
  }

  return { parts, numSeg, segLen: Math.round(segLen * 10) / 10 }
}

/**
 * Shape-Config-Objekt passend zum Registry-Format
 */
export const steckleiste = {
  label: 'Steckleiste (segmentiert)',
  group: 'Verbinder',
  type: 'multi',
  fields: [
    { id: 'total_length', label: 'Gesamtlänge',  min: 50,  max: 5000, default: 600, step: 10  },
    { id: 'width',        label: 'Breite',        min: 5,   max: 200,  default: 30,  step: 1   },
    { id: 'thickness',    label: 'Stärke',        min: 2,   max: 100,  default: 10,  step: 0.5 },
    { id: 'clearance',    label: 'Spielmaß',      min: 0.1, max: 1.5,  default: 0.3, step: 0.05},
  ],
  buildParts(params) {
    return buildSteckleiste(params)
  },
  calcVolume({ total_length, width, thickness }) {
    // Annäherung: Zapfen/Nuten heben sich weitgehend auf
    return total_length * width * thickness
  },
}
