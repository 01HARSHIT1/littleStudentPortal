import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import Loading from '../components/Loading'
import StatusBadge from '../components/StatusBadge'
import { toast } from '../components/Toast'
import { empName, formatDate, formatMoney } from '../utils/helpers'

export default function EmployeeDetail() {
  const { id } = useParams()
  const [emp, setEmp] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/employees/${id}`)
        if (!cancelled) setEmp(data.data || data)
      } catch (err) {
        toast(getErrorMessage(err), 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <Loading />
  if (!emp) {
    return (
      <div className="empty-state panel">
        <h3>Employee not found</h3>
        <Link to="/employees" className="btn btn-secondary mt-16">
          Back to list
        </Link>
      </div>
    )
  }

  const p = emp.personal || {}
  const pr = emp.professional || {}

  return (
    <div className="animate-slide">
      <Link to="/employees" className="link-action flex gap-8 mb-16" style={{ display: 'inline-flex' }}>
        <ArrowLeft size={16} /> Back to employees
      </Link>

      <div className="panel mb-24">
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div className="flex gap-16" style={{ alignItems: 'center' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: 20 }}>
              {(p.firstName || '?')[0]}
              {(p.lastName || '')[0] || ''}
            </div>
            <div>
              <h2 style={{ fontSize: 24 }}>{empName(emp)}</h2>
              <p className="text-muted text-sm">
                {emp.employeeId} · {pr.designation?.title || '—'} · {pr.department?.name || '—'}
              </p>
            </div>
          </div>
          <StatusBadge status={emp.status} />
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <h3 className="panel-title mb-16">Personal</h3>
          <dl className="text-sm" style={{ display: 'grid', gap: 10 }}>
            <div className="flex-between">
              <dt className="text-muted">Email</dt>
              <dd>{p.email || '—'}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">Mobile</dt>
              <dd>{p.mobile || '—'}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">Gender</dt>
              <dd>{p.gender || '—'}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">Date of birth</dt>
              <dd>{formatDate(p.dob)}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">City</dt>
              <dd>{p.address?.city || '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="panel">
          <h3 className="panel-title mb-16">Professional</h3>
          <dl className="text-sm" style={{ display: 'grid', gap: 10 }}>
            <div className="flex-between">
              <dt className="text-muted">Employment</dt>
              <dd>{pr.employmentType || '—'}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">Joined</dt>
              <dd>{formatDate(pr.joiningDate)}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">Manager</dt>
              <dd>{empName(pr.manager)}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">Basic salary</dt>
              <dd>{formatMoney(pr.basicSalary)}</dd>
            </div>
            <div className="flex-between">
              <dt className="text-muted">Login</dt>
              <dd>{emp.user?.email || '—'} ({emp.user?.role || '—'})</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
