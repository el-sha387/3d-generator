import { SHAPES } from '../shapes/registry'

export function FormPanel({ shapeKey, params, onParamChange }) {
  const shape = SHAPES[shapeKey]
  if (!shape) return null
  const cols = Math.min(shape.fields.length, 3)

  return (
    <div className="card">
      <div className="form-shape-title">
        <span>{shape.icon || '⬡'}</span>
        <span>{shape.label}</span>
      </div>
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
                onFocus={e => e.target.select()}
              />
              <span className="unit-label">mm</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
