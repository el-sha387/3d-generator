import { SHAPES } from '../shapes/registry'

// Shapes nach Gruppe gruppieren
function getGroups() {
  const groups = {}
  Object.entries(SHAPES).forEach(([key, shape]) => {
    const g = shape.group || 'Sonstiges'
    if (!groups[g]) groups[g] = []
    groups[g].push({ key, ...shape })
  })
  return groups
}

export function FormPanel({ shapeKey, params, onShapeChange, onParamChange }) {
  const shape  = SHAPES[shapeKey]
  const groups = getGroups()
  const cols   = Math.min(shape?.fields?.length ?? 1, 3)

  return (
    <div className="card">
      {/* Shape selector mit Gruppen */}
      <div className="field-group">
        <label className="field-label">Formtyp</label>
        <select
          className="select"
          value={shapeKey}
          onChange={e => onShapeChange(e.target.value)}
        >
          {Object.entries(groups).map(([groupName, shapes]) => (
            <optgroup key={groupName} label={groupName}>
              {shapes.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Dynamische Parameter-Felder */}
      {shape && (
        <div className={`fields cols-${cols}`}>
          {shape.fields.map(field => (
            <div key={field.id} className="field-group">
              <label className="field-label">{field.label}</label>
              <div className="input-unit">
                <input
                  type="number"
                  className="input"
                  min={field.min}
                  max={field.max}
                  step={field.step || 0.5}
                  value={params[field.id] ?? field.default}
                  onChange={e => onParamChange(field.id, parseFloat(e.target.value) || field.min)}
                />
                <span className="unit-label">mm</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
