import * as THREE from 'three'
import { steckleiste } from './steckleiste.js'

// mergeBufferGeometries – inline, Three.js r128 kompatibel
function mergeBufferGeometries(geos) {
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

function ringShape(outerR, innerR = 0) {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, outerR, 0, Math.PI * 2, false)
  if (innerR > 0) {
    const hole = new THREE.Path()
    hole.absarc(0, 0, innerR, 0, Math.PI * 2, true)
    shape.holes.push(hole)
  }
  return shape
}

function extrudeUpright(shape, height, curveSegments = 64) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments })
  geo.rotateX(-Math.PI / 2)
  return geo
}

function hexShape(circumR, holeR = 0) {
  const shp = new THREE.Shape()
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6
    i === 0 ? shp.moveTo(circumR * Math.cos(a), circumR * Math.sin(a))
             : shp.lineTo(circumR * Math.cos(a), circumR * Math.sin(a))
  }
  shp.closePath()
  if (holeR > 0) {
    const hole = new THREE.Path()
    hole.absarc(0, 0, holeR, 0, Math.PI * 2, true)
    shp.holes.push(hole)
  }
  return shp
}

export const SHAPES = {

  box: {
    label: 'Quader / Würfel', group: 'Grundformen',
    fields: [
      { id: 'width',  label: 'Breite', min: 1, max: 500, default: 40 },
      { id: 'height', label: 'Höhe',   min: 1, max: 500, default: 40 },
      { id: 'depth',  label: 'Tiefe',  min: 1, max: 500, default: 40 },
    ],
    buildGeometry({ width, height, depth }) {
      return { geometry: new THREE.BoxGeometry(width, height, depth), positionY: height/2, cameraR: Math.max(width, height, depth) * 3.2 }
    },
    calcVolume({ width, height, depth }) { return width * height * depth },
  },

  cylinder: {
    label: 'Zylinder (massiv)', group: 'Grundformen',
    fields: [
      { id: 'diameter', label: 'Durchmesser', min: 1, max: 500, default: 25 },
      { id: 'height',   label: 'Höhe',        min: 1, max: 500, default: 60 },
    ],
    buildGeometry({ diameter, height }) {
      return { geometry: new THREE.CylinderGeometry(diameter/2, diameter/2, height, 64), positionY: height/2, cameraR: Math.max(diameter, height) * 3.5 }
    },
    calcVolume({ diameter, height }) { return Math.PI * Math.pow(diameter/2, 2) * height },
  },

  sphere: {
    label: 'Kugel', group: 'Grundformen',
    fields: [{ id: 'diameter', label: 'Durchmesser', min: 1, max: 500, default: 35 }],
    buildGeometry({ diameter }) {
      return { geometry: new THREE.SphereGeometry(diameter/2, 64, 32), positionY: diameter/2, cameraR: diameter * 3.5 }
    },
    calcVolume({ diameter }) { return (4/3) * Math.PI * Math.pow(diameter/2, 3) },
  },

  kegel: {
    label: 'Kegelstumpf / Konus', group: 'Grundformen',
    fields: [
      { id: 'diameter_bottom', label: 'Ø unten', min: 1, max: 500, default: 40 },
      { id: 'diameter_top',    label: 'Ø oben',  min: 0, max: 500, default: 20 },
      { id: 'height',          label: 'Höhe',    min: 1, max: 500, default: 30 },
    ],
    buildGeometry({ diameter_bottom, diameter_top, height }) {
      return { geometry: new THREE.CylinderGeometry(diameter_top/2, diameter_bottom/2, height, 64), positionY: height/2, cameraR: Math.max(diameter_bottom, diameter_top, height) * 3.2 }
    },
    calcVolume({ diameter_bottom, diameter_top, height }) {
      const r1 = diameter_bottom/2, r2 = diameter_top/2
      return (Math.PI/3) * (r1*r1 + r1*r2 + r2*r2) * height
    },
  },

  hollow_cylinder: {
    label: 'Hohlzylinder / Distanzscheibe', group: 'Rohre & Hülsen',
    fields: [
      { id: 'outer_diameter', label: 'Außen-Ø',        min: 2,   max: 500, default: 30 },
      { id: 'inner_diameter', label: 'Innen-Ø (Loch)', min: 1,   max: 499, default: 8  },
      { id: 'height',         label: 'Höhe / Stärke',  min: 0.5, max: 500, default: 5  },
    ],
    buildGeometry({ outer_diameter, inner_diameter, height }) {
      return { geometry: extrudeUpright(ringShape(outer_diameter/2, Math.min(inner_diameter/2, outer_diameter/2-0.5)), height), positionY: 0, cameraR: Math.max(outer_diameter, height) * 4 }
    },
    calcVolume({ outer_diameter, inner_diameter, height }) {
      return Math.PI * (Math.pow(outer_diameter/2, 2) - Math.pow(inner_diameter/2, 2)) * height
    },
  },

  rohr: {
    label: 'Rohr / Langstutzen', group: 'Rohre & Hülsen',
    fields: [
      { id: 'outer_diameter', label: 'Außen-Ø', min: 4,   max: 500,  default: 20  },
      { id: 'inner_diameter', label: 'Innen-Ø', min: 1,   max: 499,  default: 16  },
      { id: 'height',         label: 'Länge',   min: 1,   max: 1000, default: 100 },
    ],
    buildGeometry({ outer_diameter, inner_diameter, height }) {
      return { geometry: extrudeUpright(ringShape(outer_diameter/2, Math.min(inner_diameter/2, outer_diameter/2-0.5)), height), positionY: 0, cameraR: Math.max(outer_diameter, height) * 3 }
    },
    calcVolume({ outer_diameter, inner_diameter, height }) {
      return Math.PI * (Math.pow(outer_diameter/2, 2) - Math.pow(inner_diameter/2, 2)) * height
    },
  },

  abdeckkappe: {
    label: 'Abdeckkappe (Deckel mit Lippe)', group: 'Abdeckungen',
    fields: [
      { id: 'outer_diameter', label: 'Außen-Ø',      min: 4,   max: 500, default: 90  },
      { id: 'wall_thickness', label: 'Wandstärke',   min: 0.5, max: 50,  default: 2.5 },
      { id: 'lip_height',     label: 'Lippenhöhe',   min: 1,   max: 200, default: 10  },
      { id: 'top_thickness',  label: 'Deckelstärke', min: 0.5, max: 50,  default: 2.5 },
    ],
    buildGeometry({ outer_diameter, wall_thickness, lip_height, top_thickness }) {
      const oR = outer_diameter/2, iR = Math.max(oR - wall_thickness, 1)
      const discGeo = extrudeUpright(ringShape(oR), top_thickness)
      const lipGeo  = extrudeUpright(ringShape(oR, iR), lip_height)
      lipGeo.translate(0, top_thickness, 0)
      return { geometry: mergeBufferGeometries([discGeo, lipGeo]), positionY: 0, cameraR: Math.max(outer_diameter, lip_height + top_thickness) * 3 }
    },
    calcVolume({ outer_diameter, wall_thickness, lip_height, top_thickness }) {
      const oR = outer_diameter/2, iR = Math.max(oR - wall_thickness, 0)
      return Math.PI * oR * oR * top_thickness + Math.PI * (oR*oR - iR*iR) * lip_height
    },
  },

  flansch: {
    label: 'Flansch', group: 'Verbinder',
    fields: [
      { id: 'flange_diameter',  label: 'Flansch-Ø',    min: 4,   max: 500, default: 80 },
      { id: 'pipe_diameter',    label: 'Rohr-Ø außen', min: 2,   max: 499, default: 40 },
      { id: 'wall_thickness',   label: 'Wandstärke',   min: 0.5, max: 50,  default: 3  },
      { id: 'flange_thickness', label: 'Flanschstärke',min: 0.5, max: 100, default: 5  },
      { id: 'pipe_height',      label: 'Rohrhöhe',     min: 1,   max: 500, default: 30 },
    ],
    buildGeometry({ flange_diameter, pipe_diameter, wall_thickness, flange_thickness, pipe_height }) {
      const fR = flange_diameter/2, pOR = Math.min(pipe_diameter/2, flange_diameter/2), pIR = Math.max(pOR - wall_thickness, 1)
      const flangeGeo = extrudeUpright(ringShape(fR, pIR), flange_thickness)
      const pipeGeo   = extrudeUpright(ringShape(pOR, pIR), pipe_height)
      pipeGeo.translate(0, flange_thickness, 0)
      return { geometry: mergeBufferGeometries([flangeGeo, pipeGeo]), positionY: 0, cameraR: Math.max(flange_diameter, pipe_height + flange_thickness) * 2.8 }
    },
    calcVolume({ flange_diameter, pipe_diameter, wall_thickness, flange_thickness, pipe_height }) {
      const fR = flange_diameter/2, pOR = pipe_diameter/2, pIR = Math.max(pOR - wall_thickness, 0)
      return Math.PI * (fR*fR - pIR*pIR) * flange_thickness + Math.PI * (pOR*pOR - pIR*pIR) * pipe_height
    },
  },

  sechskant: {
    label: 'Sechskant-Bolzen / Standoff', group: 'Sechskant',
    fields: [
      { id: 'width_across_flats', label: 'Schlüsselweite', min: 2, max: 200, default: 13 },
      { id: 'height',             label: 'Höhe',           min: 1, max: 500, default: 20 },
    ],
    buildGeometry({ width_across_flats, height }) {
      const r = (width_across_flats/2) / Math.cos(Math.PI/6)
      return { geometry: extrudeUpright(hexShape(r), height), positionY: 0, cameraR: Math.max(width_across_flats, height) * 3.5 }
    },
    calcVolume({ width_across_flats, height }) { return (Math.sqrt(3)/2) * Math.pow(width_across_flats, 2) * height },
  },

  sechskant_mutter: {
    label: 'Sechskantmutter (mit Loch)', group: 'Sechskant',
    fields: [
      { id: 'width_across_flats', label: 'Schlüsselweite', min: 2,  max: 200, default: 13  },
      { id: 'thread_diameter',    label: 'Gewinde-Ø',      min: 1,  max: 199, default: 8   },
      { id: 'height',             label: 'Höhe',           min: 1,  max: 100, default: 6.5 },
    ],
    buildGeometry({ width_across_flats, thread_diameter, height }) {
      const r = (width_across_flats/2) / Math.cos(Math.PI/6)
      return { geometry: extrudeUpright(hexShape(r, Math.min(thread_diameter/2, r-0.5)), height), positionY: 0, cameraR: Math.max(width_across_flats, height) * 4 }
    },
    calcVolume({ width_across_flats, thread_diameter, height }) {
      return ((Math.sqrt(3)/2) * Math.pow(width_across_flats, 2) - Math.PI * Math.pow(thread_diameter/2, 2)) * height
    },
  },

  steckleiste,
}
