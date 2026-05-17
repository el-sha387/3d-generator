import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const MAT = new THREE.MeshPhongMaterial({ color: 0x2563eb, shininess: 80, specular: 0x4488cc })
const MAT_ALT = new THREE.MeshPhongMaterial({ color: 0x16a34a, shininess: 80, specular: 0x44aa66 })

export function Canvas3D({ shapeKey, params, shapeConfig, multiParts, onMeshReady }) {
  const canvasRef = useRef(null)
  const threeRef  = useRef({})

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(720, 300, false)
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 720/300, 0.1, 5000)
    scene.add(new THREE.AmbientLight(0xffffff, 0.75))
    const d1 = new THREE.DirectionalLight(0xffffff, 0.8); d1.position.set(100,150,80); scene.add(d1)
    const d2 = new THREE.DirectionalLight(0xaaccff, 0.35); d2.position.set(-80,60,-100); scene.add(d2)
    scene.add(new THREE.GridHelper(2000, 60, 0xbbbbbb, 0xdddddd))
    const sph = { theta: Math.PI*0.3, phi: Math.PI*0.3, r: 150 }
    const updateCam = () => {
      camera.position.set(sph.r*Math.sin(sph.phi)*Math.cos(sph.theta), sph.r*Math.cos(sph.phi), sph.r*Math.sin(sph.phi)*Math.sin(sph.theta))
      camera.lookAt(0, 0, 0)
    }
    updateCam()
    threeRef.current = { renderer, scene, camera, sph, updateCam }
    let drag=false, mx=0, my=0
    const onDown = e => { drag=true; mx=e.clientX; my=e.clientY; canvas.style.cursor='grabbing' }
    const onUp   = () => { drag=false; canvas.style.cursor='grab' }
    const onMove = e => {
      if(!drag) return
      sph.theta -= (e.clientX-mx)*0.012; sph.phi = Math.max(0.05, Math.min(Math.PI*0.45, sph.phi+(e.clientY-my)*0.012))
      mx=e.clientX; my=e.clientY; updateCam()
    }
    const onWheel = e => { sph.r=Math.max(20,Math.min(2000,sph.r+e.deltaY*0.4)); updateCam(); e.preventDefault() }
    canvas.addEventListener('mousedown',onDown); window.addEventListener('mouseup',onUp)
    canvas.addEventListener('mousemove',onMove); canvas.addEventListener('wheel',onWheel,{passive:false})
    let lt=null
    canvas.addEventListener('touchstart', e=>{lt=e.touches[0]})
    canvas.addEventListener('touchmove', e=>{
      if(!lt)return; const t=e.touches[0]
      sph.theta-=(t.clientX-lt.clientX)*0.012; sph.phi=Math.max(0.05,Math.min(Math.PI*0.45,sph.phi+(t.clientY-lt.clientY)*0.012))
      lt=t; updateCam(); e.preventDefault()
    },{passive:false})
    let animId
    const animate = () => { animId=requestAnimationFrame(animate); renderer.render(scene,camera) }
    animate()
    return () => {
      cancelAnimationFrame(animId)
      canvas.removeEventListener('mousedown',onDown); window.removeEventListener('mouseup',onUp)
      canvas.removeEventListener('mousemove',onMove); canvas.removeEventListener('wheel',onWheel)
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    const { scene, sph, updateCam } = threeRef.current
    if (!scene) return
    // Clear
    const old = scene.getObjectByName('shapeMesh')
    if (old) {
      old.traverse(o => { if (o.isMesh) { o.geometry.dispose() } })
      scene.remove(old)
    }

    if (multiParts?.length) {
      // Multi-Part (z.B. Steckleiste): alle Segmente nebeneinander
      const group = new THREE.Group(); group.name = 'shapeMesh'
      multiParts.forEach(({ geometry, previewOffsetX = 0, previewOffsetY = 0 }, i) => {
        const mesh = new THREE.Mesh(geometry, i % 2 === 0 ? MAT : MAT_ALT)
        mesh.position.set(previewOffsetX, previewOffsetY, 0)
        group.add(mesh)
      })
      scene.add(group)
      // Kamera auf Mitte der Gruppe ausrichten
      const box = new THREE.Box3().setFromObject(group)
      const center = box.getCenter(new THREE.Vector3())
      const size   = box.getSize(new THREE.Vector3())
      sph.r = Math.max(150, Math.max(size.x, size.y, size.z) * 1.8)
      const target = center
      threeRef.current.camera.lookAt(target)
      updateCam()
      if (onMeshReady) onMeshReady(null, multiParts)
      return
    }

    if (!shapeConfig) return

    const { geometry, positionY, cameraR } = shapeConfig.buildGeometry(params)
    const mesh = new THREE.Mesh(geometry, MAT)
    mesh.name = 'shapeMesh'; mesh.position.y = positionY
    scene.add(mesh)
    sph.r = Math.max(80, cameraR); updateCam()
    if (onMeshReady) onMeshReady(mesh)
  }, [shapeKey, params, shapeConfig, multiParts])

  return (
    <div className="canvas-wrap">
      <canvas ref={canvasRef} width={720} height={300} className="canvas" />
      {!shapeKey && (
        <div className="canvas-placeholder">
          <span className="canvas-icon">⬡</span>
          <span>Formtyp wählen und Maße eingeben</span>
        </div>
      )}
      {shapeKey && <div className="orbit-hint">Drehen: Maus · Zoom: Scroll</div>}
    </div>
  )
}
