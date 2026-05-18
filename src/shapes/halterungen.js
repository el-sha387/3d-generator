import { primitives, booleans, transforms } from '@jscad/modeling'
import * as THREE from 'three'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'

const { cylinder, cuboid } = primitives
const { subtract, union } = booleans
const { translate, rotateX } = transforms

function toThree(jscadGeom, posY = 0, camR = 150) {
  return { geometry: jscadToThreeGeometry(jscadGeom), positionY: posY, cameraR: camR }
}

// ── Wandhalterung (L-Bracket) ────────────────────────────────────────────────
export const wandhalterung = {
  label: 'Wandhalterung (L-Winkel)',
  shortLabel: 'Wandhalterung',
  icon: '⌐',
  group: 'Halterungen',
  fields: [
    { id: 'width',      label: 'Breite',        min: 10, max: 200, default: 60  },
    { id: 'height',     label: 'Plattenhöhe',   min: 20, max: 300, default: 80  },
    { id: 'arm_depth',  label: 'Armtiefe',      min: 10, max: 300, default: 60  },
    { id: 'thickness',  label: 'Materialstärke',min: 2,  max: 20,  default: 4   },
    { id: 'screw_dia',  label: 'Schrauben-Ø',  min: 2,  max: 10,  default: 4.5 },
  ],
  buildGeometry({ width, height, arm_depth, thickness, screw_dia }) {
    const w = width, h = height, d = arm_depth, t = thickness

    // Wandplatte (vertikal, in XY-Ebene)
    let bracket = translate([0, h / 2, 0], cuboid({ size: [w, h, t] }))

    // Arm (horizontal, in XZ-Ebene, unten an der Platte)
    const arm = translate([0, t / 2, (d + t) / 2], cuboid({ size: [w, t, d] }))
    bracket = union(bracket, arm)

    // Befestigungslöcher in der Wandplatte (durch Z)
    const hole = cylinder({ radius: screw_dia / 2, height: t + 0.2, segments: 16 })
    bracket = subtract(bracket, translate([0, h * 0.25, 0], hole))
    bracket = subtract(bracket, translate([0, h * 0.75, 0], hole))

    const geo = jscadToThreeGeometry(bracket)
    return { geometry: geo, positionY: 0, cameraR: Math.max(w, h, d) * 2.5 }
  },
  calcVolume({ width, height, arm_depth, thickness }) {
    return width * (height + arm_depth) * thickness
  },
}

// ── Kabelklemme ───────────────────────────────────────────────────────────────
export const kabelklemme = {
  label: 'Kabelklemme / Kabelhalter',
  shortLabel: 'Kabelklemme',
  icon: '⊂',
  group: 'Halterungen',
  fields: [
    { id: 'cable_diameter', label: 'Kabel-Ø',     min: 2,  max: 30,  default: 8  },
    { id: 'wall',           label: 'Wandstärke',  min: 1,  max: 10,  default: 3  },
    { id: 'base_thickness', label: 'Basisstärke', min: 2,  max: 15,  default: 4  },
    { id: 'length',         label: 'Länge',       min: 10, max: 100, default: 30 },
    { id: 'screw_dia',      label: 'Schrauben-Ø',min: 2,  max: 8,   default: 3.5},
  ],
  buildGeometry({ cable_diameter, wall, base_thickness, length, screw_dia }) {
    const cr = cable_diameter / 2
    const totalW = cable_diameter + 2 * wall
    const totalH = cr + wall + base_thickness

    // Hauptblock
    let clip = translate([0, totalH / 2, 0], cuboid({ size: [totalW, totalH, length] }))

    // Kabelkanal (Halbzylinder von oben)
    const channel = rotateX(Math.PI / 2, cylinder({ radius: cr, height: length + 0.2, segments: 32 }))
    clip = subtract(clip, translate([0, totalH - 0.1, 0], channel))

    // Montageloch durch Basis
    const mHole = rotateX(Math.PI / 2, cylinder({ radius: screw_dia / 2, height: base_thickness + 0.2, segments: 16 }))
    clip = subtract(clip, translate([0, base_thickness / 2, 0], mHole))

    const geo = jscadToThreeGeometry(clip)
    return { geometry: geo, positionY: 0, cameraR: Math.max(totalW, totalH, length) * 3 }
  },
  calcVolume({ cable_diameter, wall, base_thickness, length }) {
    const totalW = cable_diameter + 2 * wall
    const totalH = cable_diameter / 2 + wall + base_thickness
    return totalW * totalH * length * 0.7 // Näherung (Kanal subtrahiert)
  },
}
