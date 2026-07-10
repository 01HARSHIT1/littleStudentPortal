export default function StatCard({ label, value, icon: Icon, tone = 'teal', delay = 0 }) {
  return (
    <div className="stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className={`stat-icon ${tone}`}>{Icon && <Icon size={22} />}</div>
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? '—'}</div>
      </div>
    </div>
  )
}
