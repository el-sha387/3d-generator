import * as THREE from 'three'
import { geometries } from '@jscad/modeling'

/**
 * Konvertiert eine JSCAD geom3-Geometrie in eine Three.js BufferGeometry.
 * Ermöglicht CSG-Operationen (union, subtract, intersect) mit Three.js-Rendering.
 */
export function jscadToThreeGeometry(jscadGeom) {
  const polygons = geometries.geom3.toPolygons(jscadGeom)
  const verts = []

  for (const poly of polygons) {
    const pts = poly.vertices
    // Fan-Triangulation (funktioniert für konvexe Polygone)
    for (let i = 1; i < pts.length - 1; i++) {
      verts.push(
        pts[0][0],   pts[0][1],   pts[0][2],
        pts[i][0],   pts[i][1],   pts[i][2],
        pts[i+1][0], pts[i+1][1], pts[i+1][2],
      )
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  geo.computeVertexNormals()
  return geo
}
