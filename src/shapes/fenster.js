/**
 * Fensterscheibe 4-teilig – Nut & Feder über volle Länge
 *
 * Viertelscheibe: Nut entlang beider Innenkanten (volle Länge)
 * Schienen verbinden je 2 Scheiben entlang der gesamten Naht
 *
 * ZIP: Viertelscheibe.stl (4×) · Schiene_V.stl (2×) · Schiene_H.stl (2×)
 *
 * Montage:
 *   1. Vertikalschienen einschieben (volle Höhe)
 *   2. Horizontalschienen von außen einschieben (stoppen an Vertikalschiene)
 */

import { primitives, booleans, transforms } from '@jscad/modeling'
import * as THREE from 'three'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'

const { cuboid } = primitives
const { subtract } = booleans
const { translate } = transforms

/**
 * Konvertiert JSCAD → Three.js und rotiert die Geometrie so,
 * dass sie FLACH auf dem Druckbett liegt (XZ-Ebene = Druckbett).
 * Stärke zeigt nach oben (Y-Achse).
 */
function toFlatGeo(jscadGeom, thickness) {
  const geo = jscadToThreeGeometry(jscadGeom)
  // JSCAD: Panels in XY-Ebene, Z = Stärke
  // Nach rotateX(-90°): Panels in XZ-Ebene (flach), Y = Stärke
  geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  // Auf Druckbett legen (Y = 0 ist Bett)
  geo.translate(0, thickness / 2, 0)
  return geo
}

function buildPanel(pW, pH, t, gDep, gW, cl, sx, sy) {
  let p = translate([sx*pW/2, sy*pH/2, 0], cuboid({size:[pW, pH, t]}))

  // Nut an innerer Vertikalkante (x=0), volle Höhe
  p = subtract(p, translate(
    [sx*gDep/2, sy*pH/2, 0],
    cuboid({size:[gDep + 0.1, pH + 0.1, gW + cl]})
  ))

  // Nut an innerer Horizontalkante (y=0), volle Breite
  p = subtract(p, translate(
    [sx*pW/2, sy*gDep/2, 0],
    cuboid({size:[pW + 0.1, gDep + 0.1, gW + cl]})
  ))

  return p
}

function buildVerticalRail(pH, gDep, gW, cl) {
  const w = 2 * gDep - cl
  const h = pH - cl
  const d = gW - cl
  return translate([0, -h/2, 0], cuboid({size:[w, h, d]}))
}

function buildHorizontalRail(pW, gDep, gW, cl) {
  const railLen = pW - gDep - cl / 2
  const w = gW - cl
  const h = 2 * gDep - cl
  return translate([-(railLen/2 + gDep), 0, 0], cuboid({size:[railLen, h, w]}))
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

    const q1 = toFlatGeo(buildPanel(pW, pH, t, gD, gW, cl, -1, -1), t)
    const q2 = toFlatGeo(buildPanel(pW, pH, t, gD, gW, cl, +1, -1), t)
    const q3 = toFlatGeo(buildPanel(pW, pH, t, gD, gW, cl, -1, +1), t)
    const q4 = toFlatGeo(buildPanel(pW, pH, t, gD, gW, cl, +1, +1), t)
    const sV  = toFlatGeo(buildVerticalRail(pH, gD, gW, cl), gW - cl)
    const sHL = toFlatGeo(buildHorizontalRail(pW, gD, gW, cl), gW - cl)
    const sHR = toFlatGeo(buildHorizontalRail(pW, gD, gW, cl), gW - cl)

    const previewParts = [
      { geometry: q1,  label: 'Q1', previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: q2,  label: 'Q2', previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: q3,  label: 'Q3', previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: q4,  label: 'Q4', previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: sV,  label: 'SV_unten',  previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: sV,  label: 'SV_oben',   previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: sHL, label: 'SH_links',  previewOffsetX: 0, previewOffsetY: 0 },
      { geometry: sHR, label: 'SH_rechts', previewOffsetX: 0, previewOffsetY: 0 },
    ]

    const downloadParts = [
      { geometry: q1,  label: 'Viertelscheibe' },
      { geometry: sV,  label: 'Schiene_V'      },
      { geometry: sHL, label: 'Schiene_H'      },
    ]

    const railLenV = Math.round(pH - cl)
    const railLenH = Math.round(pW - gD - cl / 2)

    return {
      parts: previewParts,
      downloadParts,
      numSeg: 3,
      info: `${window_width}×${window_height}mm · Schiene_V: ${railLenV}mm (2×) · Schiene_H: ${railLenH}mm (2×) · Viertelscheibe 4×`,
    }
  },

  calcVolume({ window_width, window_height, thickness }) {
    return window_width * window_height * thickness
  },
}
