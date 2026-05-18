import { primitives, booleans, transforms } from '@jscad/modeling'
import * as THREE from 'three'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'

const { cylinder, cuboid } = primitives
const { subtract, union } = booleans
const { translate } = transforms

function toFlat(jscadGeom, h) {
  const geo = jscadToThreeGeometry(jscadGeom)
  geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  geo.translate(0, h / 2, 0)
  return geo
}

export const drehknopf = {
  label: 'Drehknopf / Griffknopf',
  shortLabel: 'Drehknopf',
  icon: '◎',
  group: 'Griffe & Knöpfe',
  fields: [
    { id: 'outer_diameter', label: 'Außen-Ø',   min: 10, max: 100, default: 30 },
    { id: 'height',         label: 'Höhe',        min: 5,  max: 80,  default: 20 },
    { id: 'shaft_diameter', label: 'Wellen-Ø',   min: 2,  max: 30,  default: 6  },
    { id: 'clearance',      label: 'Spielmaß',   min: 0.1, max: 1,  default: 0.2, step: 0.05 },
  ],
  buildGeometry({ outer_diameter, height, shaft_diameter, clearance }) {
    let knob = cylinder({ radius: outer_diameter / 2, height, segments: 64 })
    knob = subtract(knob, cylinder({ radius: shaft_diameter / 2 + clearance, height: height + 0.2, segments: 32 }))
    return { geometry: toFlat(knob, height), positionY: 0, cameraR: Math.max(outer_diameter, height) * 3.5 }
  },
  calcVolume({ outer_diameter, shaft_diameter, height }) {
    return Math.PI * (Math.pow(outer_diameter / 2, 2) - Math.pow(shaft_diameter / 2, 2)) * height
  },
}
