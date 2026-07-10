const MAP = {
  Active: 'success',
  Permanent: 'success',
  Present: 'success',
  Approved: 'success',
  Paid: 'success',
  Completed: 'success',
  Closed: 'success',
  Resolved: 'success',
  Joined: 'success',
  Hired: 'success',
  Available: 'success',

  Pending: 'warning',
  Probation: 'warning',
  Late: 'warning',
  'Half Day': 'warning',
  'In Progress': 'warning',
  Interview: 'warning',
  Screening: 'warning',
  'Pending Correction': 'warning',
  Open: 'info',
  New: 'info',
  Draft: 'neutral',
  Generated: 'info',

  Rejected: 'danger',
  Absent: 'danger',
  Cancelled: 'danger',
  Resigned: 'danger',
  Archived: 'danger',
  Failed: 'danger',
  Overdue: 'danger',

  Assigned: 'teal',
  'On Leave': 'info',
  Holiday: 'neutral',
  Offered: 'teal',
}

export default function StatusBadge({ status, tone }) {
  if (!status) return null
  const variant = tone || MAP[status] || 'neutral'
  return <span className={`status-badge ${variant}`}>{status}</span>
}
