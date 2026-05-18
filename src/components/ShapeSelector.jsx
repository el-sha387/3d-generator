import { useState, useEffect } from 'react'
import { SHAPES } from '../shapes/registry'

const CATEGORIES = [
  { id: 'Grundformen',    label: 'Grundformen',    icon: '⬡' },
  { id: 'Rohre & Hülsen', label: 'Rohre & Hülsen', icon: '⭕' },
  { id: 'Verbindungen',   label: 'Verbindungen',   icon: '⟂' },
  { id: 'Abdeckungen',    label: 'Abdeckungen',    icon: '⊓' },
  { id: 'Halterungen',    label: 'Halterungen',    icon: '⌐' },
  { id: 'Griffe & Knöpfe',label: 'Griffe',         icon: '◎' },
  { id: 'Spezialteile',   label: 'Spezial',        icon: '⚙' },
]

export function ShapeSelector({ shapeKey, onShapeChange }) {
  const shapesByGroup = {}
  Object.entries(SHAPES).forEach(([key, shape]) => {
    const g = shape.group || 'Sonstiges'
    if (!shapesByGroup[g]) shapesByGroup[g] = []
    shapesByGroup[g].push({ key, ...shape })
  })

  const initialCat = SHAPES[shapeKey]?.group || CATEGORIES[0].id
  const [activeCategory, setActiveCategory] = useState(initialCat)

  useEffect(() => {
    const group = SHAPES[shapeKey]?.group
    if (group) setActiveCategory(group)
  }, [shapeKey])

  const shapes = shapesByGroup[activeCategory] || []

  return (
    <div className="shape-selector card">
      {/* Category Tabs */}
      <div className="cat-tabs">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            <span className="cat-icon">{cat.icon}</span>
            <span className="cat-label">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Shape Cards */}
      <div className="shape-cards">
        {shapes.map(shape => (
          <button
            key={shape.key}
            className={`shape-card ${shapeKey === shape.key ? 'active' : ''}`}
            onClick={() => onShapeChange(shape.key)}
          >
            <span className="shape-icon">{shape.icon || '⬡'}</span>
            <span className="shape-name">{shape.shortLabel || shape.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
