import { primitives, booleans, transforms } from '@jscad/modeling'
import * as THREE from 'three'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'
import { mergeBufferGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const { cylinder, cuboid } = primitives
const { subtract, union } = booleans
const { translate } = transforms

function toFlat(jscadGeom, h) {
  const geo = jscadToThreeGeometry(jscadGeom)
  geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
  geo.translate(0, h / 2, 0)
  return geo
}

// Inline merge (Three.js r128)
function merge(geos) {
  const pos = [], nor = []
  geos.forEach(g => {
    const gi = g.index ? g.toNonIndexed() : g
    const p = gi.attributes.position, n = gi.attributes.normal
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i))
      if (n) nor.push(n.getX(i), n.getY(i), n.getZ(i))
    }
  })
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  if (nor.length) out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3))
  else out.computeVertexNormals()
  return out
}

function ringShape(oR, iR = 0) {
  const shp = new THREE.Shape()
  shp.absarc(0, 0, oR, 0, Math.PI * 2, false)
  if (iR > 0) {
    const hole = new THREE.Path()
    hole.absarc(0, 0, iR, 0, Math.PI * 2, true)
    shp.holes.push(hole)
  }
  return shp
}

function extrudeUp(shape, h) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 64 })
  geo.rotateX(-Math.PI / 2)
  return geo
}

// ── Endkappe (passt ÜBER Rohr / Profil) ──────────────────────────────────────
export const endkappe = {
  label: 'Endkappe (für Rohr / Profil)',
  shortLabel: 'Endkappe',
  icon: '⊓',
  group: 'Abdeckungen',
  fields: [
    { id: 'inner_diameter',  label: 'Innen-Ø (Rohr-Außen-Ø)', min: 4,   max: 200, default: 22  },
    { id: 'wall_thickness',  label: 'Wandstärke',              min: 0.5, max: 20,  default: 2.5 },
    { id: 'depth',           label: 'Tiefe (Überdeckung)',     min: 5,   max: 100, default: 15  },
    { id: 'top_thickness',   label: 'Deckelstärke',            min: 0.5, max: 20,  default: 2.5 },
    { id: 'clearance',       label: 'Spielmaß',                min: 0.1, max: 1,   default: 0.3, step: 0.05 },
  ],
  buildGeometry({ inner_diameter, wall_thickness, depth, top_thickness, clearance }) {
    const iR = inner_diameter / 2 + clearance
    const oR = iR + wall_thickness
    const discGeo = extrudeUp(ringShape(oR), top_thickness)
    const lipGeo  = extrudeUp(ringShape(oR, iR), depth)
    lipGeo.translate(0, top_thickness, 0)
    return { geometry: merge([discGeo, lipGeo]), positionY: 0, cameraR: Math.max(oR * 2, depth + top_thickness) * 4 }
  },
  calcVolume({ inner_diameter, wall_thickness, depth, top_thickness, clearance }) {
    const iR = inner_diameter / 2 + clearance
    const oR = iR + wall_thickness
    return Math.PI * oR * oR * top_thickness + Math.PI * (oR * oR - iR * iR) * depth
  },
}

// ── Möbelgleiter (passt ÜBER Tisch-/Stuhlbein) ───────────────────────────────
export const moebelgleiter = {
  label: 'Möbelgleiter (für Rohrbein)',
  shortLabel: 'Möbelgleiter',
  icon: '⊔',
  group: 'Abdeckungen',
  fields: [
    { id: 'leg_diameter',    label: 'Bein-Ø',        min: 10, max: 100, default: 25  },
    { id: 'wall_thickness',  label: 'Wandstärke',    min: 1,  max: 15,  default: 3   },
    { id: 'grip_depth',      label: 'Grifftiefe',    min: 5,  max: 60,  default: 20  },
    { id: 'base_thickness',  label: 'Bodenstärke',   min: 2,  max: 15,  default: 4   },
    { id: 'clearance',       label: 'Spielmaß',      min: 0.1, max: 1,  default: 0.4, step: 0.05 },
  ],
  buildGeometry({ leg_diameter, wall_thickness, grip_depth, base_thickness, clearance }) {
    const iR = leg_diameter / 2 + clearance
    const oR = iR + wall_thickness
    const totalH = grip_depth + base_thickness

    // Becher: Außenzylinder minus Innenhöhlung (oben offen)
    let cup = cylinder({ radius: oR, height: totalH, segments: 64 })
    const cavity = translate([0, 0, -(totalH - grip_depth) / 2],
      cylinder({ radius: iR, height: grip_depth + 0.1, segments: 64 }))
    cup = subtract(cup, cavity)

    return { geometry: toFlat(cup, totalH), positionY: 0, cameraR: Math.max(oR * 2, totalH) * 3.5 }
  },
  calcVolume({ leg_diameter, wall_thickness, grip_depth, base_thickness, clearance }) {
    const iR = leg_diameter / 2 + clearance
    const oR = iR + wall_thickness
    const totalH = grip_depth + base_thickness
    return Math.PI * (oR * oR * totalH - iR * iR * grip_depth)
  },
}
