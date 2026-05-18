import { primitives, booleans, transforms } from '@jscad/modeling'
import { jscadToThreeGeometry } from '../utils/jscadToThree.js'
import * as THREE from 'three'

const { cuboid } = primitives
const { subtract, union } = booleans
const { translate } = transforms

const BAMBU_MAX = 256

export function buildSteckleiste({ total_length, width, thickness, clearance }) {
  const numSeg = Math.ceil(total_length / BAMBU_MAX)
  const segLen = total_length / numSeg
  const pinLen = Math.min(15, segLen * 0.06)
  const pinW   = width * 0.45
  const pinH   = thickness * 0.45
  const parts  = []

  for (let i = 0; i < numSeg; i++) {
    const isFirst = i === 0
    const isLast  = i === numSeg - 1

    let body = cuboid({ size: [segLen, width, thickness] })

    if (!isLast) {
      body = union(body, translate(
        [segLen / 2 + pinLen / 2, 0, 0],
        cuboid({ size: [pinLen, pinW, pinH] })
      ))
    }

    if (!isFirst) {
      body = subtract(body, translate(
        [-(segLen / 2) + (pinLen + 0.2) / 2, 0, 0],
        cuboid({ size: [pinLen + 0.2, pinW + clearance, pinH + clearance] })
      ))
    }

    const geo = jscadToThreeGeometry(body)
    geo.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
    geo.translate(0, thickness / 2, 0)

    parts.push({
      geometry: geo,
      label: `Segment_${String(i + 1).padStart(2, '0')}`,
      previewOffsetX: i * (segLen + 20),
      previewOffsetY: 0,
    })
  }

  return { parts, numSeg, segLen: Math.round(segLen * 10) / 10 }
}

export const steckleiste = {
  label: 'Steckleiste (segmentiert)',
  shortLabel: 'Steckleiste',
  icon: '═',
  group: 'Verbindungen',
  type: 'multi',
  fields: [
    { id: 'total_length', label: 'Gesamtlänge', min: 50,  max: 5000, default: 600, step: 10   },
    { id: 'width',        label: 'Breite',       min: 5,   max: 200,  default: 30,  step: 1    },
    { id: 'thickness',    label: 'Stärke',       min: 2,   max: 100,  default: 10,  step: 0.5  },
    { id: 'clearance',    label: 'Spielmaß',     min: 0.1, max: 1.5,  default: 0.3, step: 0.05 },
  ],
  buildParts(params) {
    return buildSteckleiste(params)
  },
  calcVolume({ total_length, width, thickness }) {
    return total_length * width * thickness
  },
}
