import { useEffect, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, empName, formatDate } from '../utils/helpers'

export default function Leave() {
  const { hasRole } = useAuth()
  const canApprove = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'TEAM_LEAD')
  const [balance, setBalance] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [b, l] = await Promise.all([
        api.get('/leave/balance'),
        api.get('/leave'),
      ])
      setBalance(b.data?.data || b.data)
      setRows(asList(l.data?.data ?? l.data))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const apply = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/leave', form)
      toast('Leave applied', 'success')
      setOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const review = async (id, status) => {
    try {
      await api.put(`/leave/${id}/review`, { status })
      toast(`Leave ${status.toLowerCase()}`, 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const cancel = async (id) => {
    try {
      await api.put(`/leave/${id}/cancel`)
      toast('Leave cancelled', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  const balances = balance?.balances || balance || {}
  const pending = rows.filter((r) => r.status === 'Pending')

  return (
    <div className="animate-slide">
      <div className="stat-grid">
        {['casual', 'sick', 'earned', 'unpaid'].map((k, i) => (
          <StatCard
            key={k}
            label={`${k} leave`}
            value={balances[k] ?? 0}
            icon={CalendarDays}
            tone={['teal', 'amber', 'green', 'slate'][i]}
            delay={i * 40}
          />
        ))}
      </div>

      <div className="toolbar">
        <h3 className="panel-title">Leave requests</h3>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Apply leave
        </button>
      </div>

      {canApprove && pending.length > 0 && (
        <div className="panel mb-24">
          <h3 className="panel-title mb-16">Pending approvals</h3>
          <DataTable
            columns={[
              { header: 'Employee', render: (r) => empName(r.employee) },
              { header: 'Type', key: 'leaveType' },
              { header: 'From', render: (r) => formatDate(r.startDate) },
              { header: 'To', render: (r) => formatDate(r.endDate) },
              { header: 'Days', key: 'days' },
              {
                header: 'Actions',
                render: (r) => (
                  <div className="actions-cell">
                    <button type="button" className="link-action" onClick={() => review(r._id, 'Approved')}>
                      Approve
                    </button>
                    <button type="button" className="link-action" onClick={() => review(r._id, 'Rejected')}>
                      Reject
                    </button>
                  </div>
                ),
              },
            ]}
            rows={pending}
          />
        </div>
      )}

      <DataTable
        columns={[
          { header: 'Employee', render: (r) => empName(r.employee) },
          { header: 'Type', key: 'leaveType' },
          { header: 'From', render: (r) => formatDate(r.startDate) },
          { header: 'To', render: (r) => formatDate(r.endDate) },
          { header: 'Days', key: 'days' },
          { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            header: 'Actions',
            render: (r) =>
              r.status === 'Pending' ? (
                <button type="button" className="link-action" onClick={() => cancel(r._id)}>
                  Cancel
                </button>
              ) : (
                '—'
              ),
          },
        ]}
        rows={rows}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Apply leave"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="leave-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit'}
            </button>
          </>
        }
      >
        <form id="leave-form" onSubmit={apply}>
          <div className="form-group">
            <label>Type</label>
            <select className="form-control" value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })}>
              {['casual', 'sick', 'earned', 'unpaid', 'maternity', 'paternity', 'comp-off'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start</label>
              <input className="form-control" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End</label>
              <input className="form-control" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea className="form-control" required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
