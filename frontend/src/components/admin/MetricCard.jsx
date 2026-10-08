export function MetricCard({ title, value, colorClass }) {
  return (
    <div className={`metric-card ${colorClass}`}>
      <h3>{title}</h3>
      <p className="value">{value}</p>
    </div>
  )
}