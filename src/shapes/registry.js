import * as THREE from 'three'

/**
 * SHAPE REGISTRY
 * Neue Form hinzufügen = neuen Eintrag hier einfügen.
 * Jede Form definiert: label, fields, buildGeometry(), calcVolume()
 */
export const SHAPES = {

  box: {
    label: 'Quader / Würfel',
    fields: [
      { id: 'width',  label: 'Breite', min: 1, max: 500, default: 40 },
      { id: 'height', label: 'Höhe',   min: 1, max: 500, default: 40 },
      { id: 'depth',  label: 'Tiefe',  min: 1, max: 500, default: 40 },
    ],
    buildGeometry({ width, height, depth }) {
      return {
        geometry: new THREE.BoxGeometry(width, height, depth),
        positionY: height / 2,
        cameraR: Math.max(width, height, depth) * 3.2,
      }
    },
    calcVolume({ width, height, depth }) {
      return width * height * depth
    },
  },

  cylinder: {
    label: 'Zylinder (massiv)',
    fields: [
      { id: 'diameter', label: 'Durchmesser', min: 1, max: 500, default: 25 },
      { id: 'height',   label: 'Höhe',        min: 1, max: 500, default: 60 },
    ],
    buildGeometry({ diameter, height }) {
      return {
        geometry: new THREE.CylinderGeometry(diameter / 2, diameter / 2, height, 64),
        positionY: height / 2,
        cameraR: Math.max(diameter, height) * 3.5,
      }
    },
    calcVolume({ diameter, height }) {
      return Math.PI * Math.pow(diameter / 2, 2) * height
    },
  },

  hollow_cylinder: {
    label: 'Hohlzylinder / Distanzscheibe / Hülse',
    fields: [
      { id: 'outer_diameter', label: 'Außen-Ø',        min: 2,  max: 500, default: 30 },
      { id: 'inner_diameter', label: 'Innen-Ø (Loch)', min: 1,  max: 499, default: 8  },
      { id: 'height',         label: 'Höhe / Stärke',  min: 0.5, max: 500, default: 5 },
    ],
    buildGeometry({ outer_diameter, inner_diameter, height }) {
      const oR = outer_diameter / 2
      const iR = Math.min(inner_diameter / 2, oR - 0.5)
      const shape = new THREE.Shape()
      shape.absarc(0, 0, oR, 0, Math.PI * 2, false)
      const hole = new THREE.Path()
      hole.absarc(0, 0, iR, 0, Math.PI * 2, true)
      shape.holes.push(hole)
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
        curveSegments: 80,
      })
      geo.translate(0, 0, -height / 2)
      geo.rotateX(-Math.PI / 2)
      return {
        geometry: geo,
        positionY: height / 2,
        cameraR: Math.max(outer_diameter, height) * 4,
      }
    },
    calcVolume({ outer_diameter, inner_diameter, height }) {
      return Math.PI * (Math.pow(outer_diameter / 2, 2) - Math.pow(inner_diameter / 2, 2)) * height
    },
  },

  sphere: {
    label: 'Kugel',
    fields: [
      { id: 'diameter', label: 'Durchmesser', min: 1, max: 500, default: 35 },
    ],
    buildGeometry({ diameter }) {
      return {
        geometry: new THREE.SphereGeometry(diameter / 2, 64, 32),
        positionY: diameter / 2,
        cameraR: diameter * 3.5,
      }
    },
    calcVolume({ diameter }) {
      return (4 / 3) * Math.PI * Math.pow(diameter / 2, 3)
    },
  },

  // ── Hier neue Formen einfügen ──────────────────────────────────────────────
  // Beispiel: L-Profil, Rohr, Halterung, Abdeckung mit Lippe, ...

}
