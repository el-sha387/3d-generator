export function StatsBar({ stats }) {
  if (!stats) return null
  return (
    <div className="stats-bar">
      <div className="stat">
        <div className="stat-label">Volumen</div>
        <div className="stat-val">{stats.cm3} cm³</div>
      </div>
      <div className="stat">
        <div className="stat-label">Gewicht PLA</div>
        <div className="stat-val">{stats.grams} g</div>
      </div>
      <div className="stat">
        <div className="stat-label">Material ~20€/kg</div>
        <div className="stat-val">{stats.cost} €</div>
      </div>
    </div>
  )
}
