/**
 * Fensterscheibe 4-teilig – Nut & Feder über volle Länge
 *
 * Jede Viertelscheibe hat eine Nut entlang BEIDER Innenkanten (volle Länge).
 * Separate Schienen verbinden je 2 benachbarte Scheiben entlang der gesamten Naht.
 *
 * ZIP enthält:
 *   Viertelscheibe.stl  – 4× drucken
 *   Schiene_V.stl       – 2× drucken (vertikale Naht, volle Höhe)
 *   Schiene_H.stl       – 2× drucken (horizontale Naht, stoppt an Vertikalschiene)
 *
 * Montage:
 *   1. Vertikalschienen in vertikale Nuten schieben
 *   2. Horizontalschienen von außen einschieben (stoppen an Vertikalschiene)
 */

import { primitives, booleans, transforms } from '@jscad/modeling'
import * as THREE from 'three'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'

const { cuboid } = primitives
const { subtract } = booleans
const { translate } = transforms

/**
 * Baut eine Viertelscheibe mit Nuten entlang beider Innenkanten.
 * sx/sy: +1 oder -1 – bestimmt den Quadranten.
 *
 * Koordinaten: X = Breite, Y = Höhe, Z = Stärke
 * Innenkante vertikal:   bei x=0
 * Innenkante horizontal: bei y=0
 */
function buildPanel(pW, pH, t, gDep, gW, cl, sx, sy) {
  // Hauptkörper
  let p = translate([sx*pW/2, sy*pH/2, 0], cuboid({size:[pW, pH, t]}))

  // Nut an der inneren Vertikalkante (x=0), läuft volle Höhe pH
  p = subtract(p, translate(
    [sx*gDep/2, sy*pH/2, 0],
    cuboid({size:[gDep + 0.1, pH + 0.1, gW + cl]})
  ))

  // Nut an der inneren Horizontalkante (y=0), läuft volle Breite pW
  p = subtract(p, translate(
    [sx*pW/2, sy*gDep/2, 0],
    cuboid({size:[pW + 0.1, gDep + 0.1, gW + cl]})
  ))

  return p
}

/**
 * Vertikalschiene: verbindet linke und rechte Viertelscheiben.
 * Läuft die volle halbe Fensterhöhe (pH).
 * Sitzt in der vertikalen Nut beider Scheiben gleichzeitig.
 */
function buildVerticalRail(pH, gDep, gW, cl) {
  // Breite: 2×Nuttiefe (beide Seiten), Höhe: volle pH, Stärke: Nutbreite
  const w = 2 * gDep - cl
  const h = pH - cl
  const d = gW  - cl
  return translate([0, -h/2, 0], cuboid({size:[w, h, d]}))
}

/**
 * Horizontalschiene: verbindet obere und untere Viertelscheiben.
 * Kürzer als halbe Fensterbreite – stoppt an der Vertikalschiene im Zentrum.
 * Wird von außen (linke/rechte Außenkante) eingeschoben.
 */
function buildHorizontalRail(pW, pH, gDep, gW, cl) {
  // Länge: pW minus eine Nuttiefe (Platz für Vertikalschiene am Zentrum)
  const railLen = pW - gDep - cl / 2
  const w = gW  - cl          // Stärke (passt in Nut)
  const h = 2 * gDep - cl     // Höhe (beide Nuten)
  // Schiene liegt links vom Zentrum (für linke Hälfte); center-x = -(railLen/2 + gDep)
  return translate([-(railLen/2 + gDep), 0, 0], cuboid({size:[railLen, h, w]}))
}

/**
 * Three.js Geometrie aus JSCAD, korrekt positioniert für Vorschau.
 */
function toGeo(jscadGeom) {
  return jscadToThreeGeometry(jscadGeom)
}

export const fenster_viertel = {
  label: 'Fensterscheibe 4-teilig + Nut & Feder',
  group: 'Verbinder',
  type: 'multi',
  fields: [
    { id: 'window_width',  label: 'Fensterbreite',   min: 100, max: 2000, default: 400, step: 10   },
    { id: 'window_height', label: 'Fensterhöhe',     min: 100, max: 2000, default: 400, step: 10   },
    { id: 'thickness',     label: 'Stärke (PETG)',   min: 2,   max: 15,   default: 4,   step: 0.5  },
    { id: 'groove_depth',  label: 'Nuttiefe',        min: 3,   max: 30,   default: 8              },
    { id: 'groove_width',  label: 'Nutbreite',       min: 1,   max: 10,   default: 2.5, step: 0.5 },
    { id: 'clearance',     label: 'Spielmaß',        min: 0.1, max: 1,    default: 0.3, step: 0.05 },
  ],

  buildParts({ window_width, window_height, thickness, groove_depth, groove_width, clearance }) {
    const pW = window_width  / 2
    const pH = window_height / 2
    const t  = thickness
    const gD = groove_depth
    const gW = groove_width
    const cl = clearance

    // ── Viertelscheiben ──────────────────────────────────────────────────────
    const q1 = toGeo(buildPanel(pW, pH, t, gD, gW, cl, -1, -1))
    const q2 = toGeo(buildPanel(pW, pH, t, gD, gW, cl, +1, -1))
    const q3 = toGeo(buildPanel(pW, pH, t, gD, gW, cl, -1, +1))
    const q4 = toGeo(buildPanel(pW, pH, t, gD, gW, cl, +1, +1))

    // ── Schienen ──────────────────────────────────────────────────────────────
    // Vertikalschienen (x=0 Naht, links und rechts je eine → gleiche Geo)
    const sV = toGeo(buildVerticalRail(pH, gD, gW, cl))

    // Horizontalschienen (y=0 Naht, jeweils von links und rechts)
    const sHL = toGeo(buildHorizontalRail(pW, pH, gD, gW, cl))    // linke Seite
    // Rechte Seite = Spiegel der linken (in X), nutze gleiche Geo + Versatz in Vorschau
    const sHR = toGeo(buildHorizontalRail(pW, pH, gD, gW, cl))

    // ── Vorschau: alle Teile montiert ────────────────────────────────────────
    const previewParts = [
      { geometry: q1, label: 'Q1', previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: q2, label: 'Q2', previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: q3, label: 'Q3', previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: q4, label: 'Q4', previewOffsetX: 0, previewOffsetY: 0 },
      // Vertikalschienen: x=0, untere Hälfte und obere Hälfte
      { geometry: sV, label: 'SV_unten', previewOffsetX:  0, previewOffsetY: 0 },
      { geometry: sV, label: 'SV_oben',  previewOffsetX:  0, previewOffsetY: 0 },
      // Horizontalschienen: y=0, linke und rechte Seite
      { geometry: sHL, label: 'SH_links',  previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: sHR, label: 'SH_rechts', previewOffsetX: 0, previewOffsetY: 0 },
    ]

    // ── Download: 3 STL-Typen ────────────────────────────────────────────────
    const downloadParts = [
      { geometry: q1,  label: 'Viertelscheibe'  },  // 4× drucken
      { geometry: sV,  label: 'Schiene_V'       },  // 2× drucken (volle Höhe)
      { geometry: sHL, label: 'Schiene_H'       },  // 2× drucken (etwas kürzer)
    ]

    const railLenV = Math.round(pH - cl)
    const railLenH = Math.round(pW - gD - cl / 2)
    const note = window_width === window_height
      ? `Quadratisch · Schiene_V: ${railLenV}mm (2×) · Schiene_H: ${railLenH}mm (2×)`
      : `Schiene_V: ${railLenV}mm (2×) · Schiene_H: ${railLenH}mm (2×)`

    return {
      parts:        previewParts,
      downloadParts,
      numSeg:       3,
      info:         `${window_width}×${window_height}mm · ZIP: 3 STL · ${note} · Viertelscheibe 4× drucken`,
    }
  },

  calcVolume({ window_width, window_height, thickness }) {
    return window_width * window_height * thickness  // Näherung
  },
}
