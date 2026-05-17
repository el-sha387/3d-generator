import { SHAPES } from '../shapes/registry'

export function FormPanel({ shapeKey, params, onShapeChange, onParamChange }) {
  const shape = SHAPES[shapeKey]

  return (
    <div className="card">
      {/* Shape selector */}
      <div className="field-group">
        <label className="field-label">Formtyp</label>
        <select
          className="select"
          value={shapeKey}
          onChange={e => onShapeChange(e.target.value)}
        >
          {Object.entries(SHAPES).map(([key, s]) => (
            <option key={key} value={key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Dynamic parameter fields */}
      {shape && (
        <div className={`fields cols-${Math.min(shape.fields.length, 3)}`}>
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
