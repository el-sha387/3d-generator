import { useState, useCallback, useRef, useEffect } from 'react'
import { SHAPES } from './shapes/registry'
import { Canvas3D } from './components/Canvas3D'
import { FormPanel } from './components/FormPanel'
import { StatsBar } from './components/StatsBar'
import { exportSTL } from './utils/stlExporter'
import { downloadMultiSTL } from './utils/multiDownload'
import { calcFilament } from './utils/filamentCalc'
import { BUILTIN_PRESETS, loadSavedPresets, savePreset, deletePreset } from './presets/library'

const DEFAULT_SHAPE = 'hollow_cylinder'

function getDefaultParams(key) {
  return Object.fromEntries(SHAPES[key].fields.map(f => [f.id, f.default]))
}

function groupPresets(presets) {
  const groups = {}
  presets.forEach(p => {
    const g = p.group || 'Sonstige'
    if (!groups[g]) groups[g] = []
    groups[g].push(p)
  })
  return groups
}

export default function App() {
  const [shapeKey,     setShapeKey]     = useState(DEFAULT_SHAPE)
  const [params,       setParams]       = useState(getDefaultParams(DEFAULT_SHAPE))
  const [filename,     setFilename]     = useState('')
  const [buildResult,  setBuildResult]  = useState(null)
  const [savedPresets, setSavedPresets] = useState(() => loadSavedPresets())
  const [showPresets,  setShowPresets]  = useState(false)
  const [speech,       setSpeech]       = useState({ listening: false, loading: false, error: '' })
  const [chatHistory,  setChatHistory]  = useState([])
  const meshRef = useRef(null)

  const shapeConfig = SHAPES[shapeKey]
  const isMulti     = shapeConfig?.type === 'multi'
  const volume      = shapeConfig?.calcVolume(params) ?? 0
  const stats       = calcFilament(volume)

  // Multi-Part Shapes neu berechnen wenn params sich ändern
  useEffect(() => {
    if (!isMulti) { setBuildResult(null); return }
    const result = shapeConfig.buildParts(params)
    setBuildResult(result)
  }, [shapeKey, params, isMulti])

  const handleShapeChange = useCallback(key => {
    setShapeKey(key); setParams(getDefaultParams(key)); setChatHistory([])
  }, [])

  const handleParamChange = useCallback((id, value) => {
    setParams(prev => ({ ...prev, [id]: value }))
  }, [])

  const handlePresetLoad = useCallback(preset => {
    setShapeKey(preset.shape)
    setParams(preset.params)
    setFilename(preset.label)
    setShowPresets(false)
  }, [])

  const handlePresetSave = useCallback(() => {
    const name = filename.trim() || `${shapeConfig.label} – ${new Date().toLocaleDateString('de')}`
    const preset = {
      id: `user_${Date.now()}`,
      label: name,
      group: 'Eigene',
      shape: shapeKey,
      params: { ...params },
    }
    setSavedPresets(savePreset(preset))
  }, [shapeKey, params, filename, shapeConfig])

  const handlePresetDelete = useCallback(id => {
    setSavedPresets(deletePreset(id))
  }, [])

  const handleDownload = async () => {
    const name = filename.trim() || shapeConfig?.label?.replace(/\s*[\/·].*/,'') || 'part'
    if (isMulti && buildResult) {
      const parts = buildResult.downloadParts || buildResult.parts
      await downloadMultiSTL(parts, name)
    } else {
      if (meshRef.current) exportSTL(meshRef.current, name)
    }
  }

  // ── Spracheingabe ────────────────────────────────────────────────────────────
  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setSpeech(s => ({ ...s, error: 'Spracheingabe nicht verfügbar (Chrome/Edge empfohlen)' })); return }
    const rec = new SR(); rec.lang = 'de-DE'
    rec.onstart  = () => setSpeech(s => ({ ...s, listening: true,  error: '' }))
    rec.onend    = () => setSpeech(s => ({ ...s, listening: false }))
    rec.onerror  = () => setSpeech(s => ({ ...s, listening: false, error: 'Mikrofon-Fehler' }))
    rec.onresult = async e => await parseSpeech(e.results[0][0].transcript)
    rec.start()
  }

  const parseSpeech = async (text) => {
    setSpeech(s => ({ ...s, loading: true, error: '' }))
    const newHistory = [...chatHistory, { role: 'user', content: text }]
    setChatHistory(newHistory)
    try {
      const resp = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory }),
      })
      const data = await resp.json()
      if (data.error) throw new Error(data.error)
      const raw    = data.content?.filter(b => b.type === 'text').map(b => b.text).join('') || ''
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim())
      setChatHistory(h => [...h, { role: 'assistant', content: raw }])
      if (parsed.type === 'shape' && SHAPES[parsed.kind]) {
        setShapeKey(parsed.kind)
        setParams({ ...getDefaultParams(parsed.kind), ...parsed.params })
        setFilename(parsed.summary || '')
      } else if (parsed.type === 'question') {
        setSpeech(s => ({ ...s, error: `❓ ${parsed.question}` }))
      }
    } catch (err) {
      setSpeech(s => ({ ...s, error: 'Fehler: ' + err.message }))
    } finally {
      setSpeech(s => ({ ...s, loading: false }))
    }
  }

  const allPresets   = [...BUILTIN_PRESETS, ...savedPresets]
  const presetGroups = groupPresets(allPresets)
  const multiInfo    = isMulti && buildResult ? (buildResult.info || `${buildResult.numSeg} Teile`) : null

  return (
    <div className="layout">
      <header className="header">
        <div className="header-row">
          <div>
            <h1 className="title">⬡ 3D Generator</h1>
            <p className="subtitle">Maße eingeben → 3D-Vorschau → STL für Bambu herunterladen</p>
          </div>
          <button className="btn btn-outline" onClick={() => setShowPresets(v => !v)}>
            {showPresets ? '✕ Schließen' : '⊞ Presets'}
          </button>
        </div>
      </header>

      {/* Preset Panel */}
      {showPresets && (
        <div className="preset-panel card">
          <div className="preset-panel-header">
            <span className="field-label" style={{fontSize:13}}>Preset laden</span>
            <button className="btn btn-sm btn-outline" onClick={handlePresetSave}>
              + Aktuell speichern
            </button>
          </div>
          {Object.entries(presetGroups).map(([group, items]) => (
            <div key={group} className="preset-group">
              <div className="preset-group-label">{group}</div>
              <div className="preset-chips">
                {items.map(p => (
                  <div key={p.id} className="preset-chip">
                    <button className="preset-chip-btn" onClick={() => handlePresetLoad(p)} title={p.description || p.label}>
                      {p.label}
                    </button>
                    {p.id.startsWith('user_') && (
                      <button className="preset-chip-del" onClick={() => handlePresetDelete(p.id)}>✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Canvas3D
        shapeKey={shapeKey}
        params={params}
        shapeConfig={isMulti ? null : shapeConfig}
        multiParts={buildResult?.parts || null}
        onMeshReady={mesh => { meshRef.current = mesh }}
      />

      {multiInfo && (
        <div className="multi-info">
          <span>📐 {multiInfo}</span>
        </div>
      )}

      <FormPanel
        shapeKey={shapeKey}
        params={params}
        onShapeChange={handleShapeChange}
        onParamChange={handleParamChange}
      />

      <StatsBar stats={stats} />

      <div className="actions">
        <div className="field-group" style={{ flex: 1, minWidth: 160 }}>
          <label className="field-label">Dateiname</label>
          <input
            type="text"
            className="input"
            placeholder="z.B. fenster_wohnzimmer"
            value={filename}
            onChange={e => setFilename(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDownload()}
          />
        </div>
        <button className="btn btn-primary" onClick={handleDownload} style={{ alignSelf: 'flex-end' }}>
          ⬇ {isMulti ? 'ZIP herunterladen' : 'STL herunterladen'}
        </button>
      </div>

      <div className="speech-bar">
        <button
          className={`btn btn-speech ${speech.listening ? 'listening' : ''} ${speech.loading ? 'loading' : ''}`}
          onClick={handleVoice}
          disabled={speech.loading}
        >
          {speech.loading ? '⏳ Analysiere…' : speech.listening ? '🔴 Höre zu…' : '🎙 Spracheingabe'}
        </button>
        {speech.error
          ? <span className="speech-error">{speech.error}</span>
          : <span className="speech-hint">Sag z.B. "Distanzscheibe 30mm Außen, 5mm hoch, 8mm Loch"</span>
        }
      </div>
    </div>
  )
}
