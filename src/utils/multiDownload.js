import * as THREE from 'three'
import JSZip from 'jszip'

function geometryToSTL(geometry) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry
  const pos = geo.attributes.position
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3()
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3()
  let stl = 'solid part\n'
  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i)
    vB.fromBufferAttribute(pos, i + 1)
    vC.fromBufferAttribute(pos, i + 2)
    ab.subVectors(vB, vA); ac.subVectors(vC, vA)
    n.crossVectors(ab, ac).normalize()
    stl += `  facet normal ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)}\n    outer loop\n`
    stl += `      vertex ${vA.x.toFixed(4)} ${vA.y.toFixed(4)} ${vA.z.toFixed(4)}\n`
    stl += `      vertex ${vB.x.toFixed(4)} ${vB.y.toFixed(4)} ${vB.z.toFixed(4)}\n`
    stl += `      vertex ${vC.x.toFixed(4)} ${vC.y.toFixed(4)} ${vC.z.toFixed(4)}\n`
    stl += '    endloop\n  endfacet\n'
  }
  stl += 'endsolid part\n'
  return stl
}

/**
 * Erstellt eine ZIP-Datei mit je einer STL pro Teil und lädt sie herunter.
 * @param {Array<{geometry, label}>} parts
 * @param {string} baseName
 */
export async function downloadMultiSTL(parts, baseName = 'export') {
  const zip = new JSZip()
  const folder = zip.folder(baseName)

  parts.forEach(({ geometry, label }, i) => {
    const stl = geometryToSTL(geometry)
    folder.file(`${label || `Teil_${i + 1}`}.stl`, stl)
  })

  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = baseName + '.zip'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
