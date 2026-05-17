import * as THREE from 'three'

/**
 * Exportiert ein Three.js Mesh als ASCII-STL Datei
 */
export function exportSTL(mesh, filename = 'part') {
  if (!mesh) return

  const geo = mesh.geometry.clone()
  geo.applyMatrix4(mesh.matrixWorld)
  const nonIdx = geo.index ? geo.toNonIndexed() : geo
  const pos = nonIdx.attributes.position

  const vA = new THREE.Vector3()
  const vB = new THREE.Vector3()
  const vC = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const n  = new THREE.Vector3()

  let stl = 'solid part\n'
  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i)
    vB.fromBufferAttribute(pos, i + 1)
    vC.fromBufferAttribute(pos, i + 2)
    ab.subVectors(vB, vA)
    ac.subVectors(vC, vA)
    n.crossVectors(ab, ac).normalize()
    stl += `  facet normal ${n.x.toFixed(6)} ${n.y.toFixed(6)} ${n.z.toFixed(6)}\n`
    stl += `    outer loop\n`
    stl += `      vertex ${vA.x.toFixed(4)} ${vA.y.toFixed(4)} ${vA.z.toFixed(4)}\n`
    stl += `      vertex ${vB.x.toFixed(4)} ${vB.y.toFixed(4)} ${vB.z.toFixed(4)}\n`
    stl += `      vertex ${vC.x.toFixed(4)} ${vC.y.toFixed(4)} ${vC.z.toFixed(4)}\n`
    stl += `    endloop\n  endfacet\n`
  }
  stl += 'endsolid part\n'

  const safeName = filename.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 50)
  const blob = new Blob([stl], { type: 'application/octet-stream' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = safeName + '.stl'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
