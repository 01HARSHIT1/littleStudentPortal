/** Normalize API list payloads */
export function asList(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.results)) return data.results
  return []
}

export function empName(emp) {
  if (!emp) return '—'
  if (typeof emp === 'string') return emp
  const p = emp.personal
  if (p) return `${p.firstName || ''} ${p.lastName || ''}`.trim() || emp.employeeId || '—'
  return emp.employeeId || emp.name || '—'
}

export function formatDate(d) {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function formatMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n))
}
