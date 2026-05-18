/**
 * Scharnier (2-teilig + Stift)
 *
 * ZIP: Scharnier_A.stl (1×, 2 Knöchel) · Scharnier_B.stl (1×, 1 Knöchel) · Stift.stl (1×)
 *
 * Montage: Knöchel ineinandergreifen, Stift durchschieben.
 * Druck: Flachseite auf Druckbett, Knöchel stehen senkrecht.
 */

import { primitives, booleans, transforms } from '@jscad/modeling'
import * as THREE from 'three'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'

const { cylinder, cuboid } = primitives
const { subtract, union } = booleans
const { translate, rotateX } = transforms

function toThreeGeo(jscadGeom) {
  return jscadToThreeGeometry(jscadGeom)
}

function makeKnuckle(kr, pr, h, cl) {
  let k = cylinder({ radius: kr, height: h, segments: 32 })
  k = subtract(k, cylinder({ radius: pr + cl, height: h + 0.2, segments: 16 }))
  return k
}

function buildPart(wingW, hingeLen, wingT, kr, pr, cl, isPartA) {
  // Flügel in XZ-Ebene (flach druckbar): X=Breite, Z=Länge, Y=Dicke
  let wing = translate([wingW / 2, wingT / 2, 0], cuboid({ size: [wingW, wingT, hingeLen] }))

  // Befestigungslöcher im Flügel (durch Y=Dicke)
  const mHole = rotateX(Math.PI / 2, cylinder({ radius: pr, height: wingT + 0.2, segments: 16 }))
  wing = subtract(wing, translate([wingW * 0.3, wingT / 2,  hingeLen * 0.25], mHole))
  wing = subtract(wing, translate([wingW * 0.3, wingT / 2, -hingeLen * 0.25], mHole))

  // Knöchel: Zylinder entlang Z-Achse, an X=0 (Scharnierkante)
  const kH = hingeLen / 3  // Knöchelhöhe = je ein Drittel

  if (isPartA) {
    // Part A: Knöchel oben (z=+1/3) und unten (z=-1/3)
    const kA = makeKnuckle(kr, pr, kH, cl)
    const k1 = translate([0, 0,  hingeLen / 3], kA)
    const k2 = translate([0, 0, -hingeLen / 3], kA)
    return union(wing, k1, k2)
  } else {
    // Part B: Knöchel mittig (z=0)
    const kB = makeKnuckle(kr, pr, kH, cl)
    return union(wing, translate([0, 0, 0], kB))
  }
}

export const scharnier = {
  label: 'Scharnier (2-teilig + Stift)',
  shortLabel: 'Scharnier',
  icon: '⟂',
  group: 'Verbindungen',
  type: 'multi',
  fields: [
    { id: 'wing_width',    label: 'Flügelbreite',  min: 10, max: 100, default: 30  },
    { id: 'hinge_length',  label: 'Scharnierlänge',min: 20, max: 150, default: 50  },
    { id: 'wing_thickness',label: 'Flügelstärke',  min: 1,  max: 10,  default: 3   },
    { id: 'knuckle_dia',   label: 'Knöchel-Ø',    min: 5,  max: 25,  default: 8   },
    { id: 'pin_dia',       label: 'Stift-Ø',      min: 2,  max: 15,  default: 4   },
    { id: 'clearance',     label: 'Spielmaß',      min: 0.1, max: 1,  default: 0.3, step: 0.05 },
  ],

  buildParts({ wing_width, hinge_length, wing_thickness, knuckle_dia, pin_dia, clearance }) {
    const wW = wing_width, hL = hinge_length, wT = wing_thickness
    const kR = knuckle_dia / 2, pR = pin_dia / 2, cl = clearance

    const partAJscad = buildPart(wW, hL, wT, kR, pR, cl, true)
    const partBJscad = buildPart(wW, hL, wT, kR, pR, cl, false)
    const pinJscad   = cylinder({ radius: pR - 0.1, height: hL + 1, segments: 16 })

    const geoA   = toThreeGeo(partAJscad)
    const geoB   = toThreeGeo(partBJscad)
    const geoPin = toThreeGeo(pinJscad)

    // Vorschau: A links, B rechts, Stift in der Mitte
    const previewParts = [
      { geometry: geoA,   label: 'A',    previewOffsetX: -(wW + 5), previewOffsetY: 0 },
      { geometry: geoB,   label: 'B',    previewOffsetX:  (wW + 5), previewOffsetY: 0 },
      { geometry: geoPin, label: 'Stift',previewOffsetX: 0,          previewOffsetY: 0 },
    ]

    const downloadParts = [
      { geometry: geoA,   label: 'Scharnier_A' },
      { geometry: geoB,   label: 'Scharnier_B' },
      { geometry: geoPin, label: 'Stift'        },
    ]

    return {
      parts: previewParts,
      downloadParts,
      numSeg: 3,
      info: `ZIP: Scharnier_A.stl (1×) · Scharnier_B.stl (1×) · Stift.stl (1×)`,
    }
  },

  calcVolume({ wing_width, hinge_length, wing_thickness, knuckle_dia, pin_dia }) {
    const wingVol    = wing_width * hinge_length * wing_thickness * 2
    const knuckleVol = Math.PI * Math.pow(knuckle_dia / 2, 2) * hinge_length
    const pinVol     = Math.PI * Math.pow(pin_dia / 2, 2) * (hinge_length + 1)
    return wingVol + knuckleVol + pinVol
  },
}
