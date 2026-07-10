export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading-wrap">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}
