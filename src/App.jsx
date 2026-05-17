import { useState, useCallback, useRef } from 'react'
import { SHAPES } from './shapes/registry'
import { Canvas3D } from './components/Canvas3D'
import { FormPanel } from './components/FormPanel'
import { StatsBar } from './components/StatsBar'
import { exportSTL } from './utils/stlExporter'
import { calcFilament } from './utils/filamentCalc'

const DEFAULT_SHAPE = 'hollow_cylinder'

function getDefaultParams(shapeKey) {
  return Object.fromEntries(
    SHAPES[shapeKey].fields.map(f => [f.id, f.default])
  )
}

export default function App() {
  const [shapeKey,  setShapeKey] = useState(DEFAULT_SHAPE)
  const [params,    setParams]   = useState(getDefaultParams(DEFAULT_SHAPE))
  const [filename,  setFilename] = useState('')
  const meshRef = useRef(null)

  const shapeConfig = SHAPES[shapeKey]
  const volume      = shapeConfig?.calcVolume(params) ?? 0
  const stats       = calcFilament(volume)

  const handleShapeChange = useCallback(key => {
    setShapeKey(key)
    setParams(getDefaultParams(key))
  }, [])

  const handleParamChange = useCallback((id, value) => {
    setParams(prev => ({ ...prev, [id]: value }))
  }, [])

  const handleDownload = () => {
    const mesh = meshRef.current
    if (!mesh) return
    const fallback = shapeConfig?.label?.replace(/\s*\/.*/, '') || 'part'
    exportSTL(mesh, filename.trim() || fallback)
  }

  return (
    <div className="layout">
      <header className="header">
        <h1 className="title">⬡ 3D Generator</h1>
        <p className="subtitle">Maße eingeben → 3D-Vorschau → STL für Bambu herunterladen</p>
      </header>

      <Canvas3D
        shapeKey={shapeKey}
        params={params}
        shapeConfig={shapeConfig}
        onMeshReady={mesh => { meshRef.current = mesh }}
      />

      <FormPanel
        shapeKey={shapeKey}
        params={params}
        onShapeChange={handleShapeChange}
        onParamChange={handleParamChange}
      />

      <StatsBar stats={stats} />

      <div className="actions">
        <div className="field-group" style={{ flex: 1, minWidth: 180 }}>
          <label className="field-label">Dateiname</label>
          <input
            type="text"
            className="input"
            placeholder="z.B. distanzscheibe_m8"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDownload()}
          />
        </div>
        <button className="btn btn-primary" onClick={handleDownload} style={{ alignSelf: 'flex-end' }}>
          ⬇ STL herunterladen
        </button>
      </div>
    </div>
  )
}
