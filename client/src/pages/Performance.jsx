import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, empName } from '../utils/helpers'

export default function Performance() {
  const { hasRole } = useAuth()
  const canWrite = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'TEAM_LEAD', 'EMPLOYEE')
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    employee: '',
    quarter: 1,
    year: new Date().getFullYear(),
    kpiScore: 70,
    attendanceScore: 80,
    managerRating: 3,
    selfAssessment: '',
    feedback: '',
    status: 'Draft',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/performance')
      setRows(asList(data?.data ?? data))
      const emp = await api.get('/employees').catch(() => ({ data: { data: [] } }))
      setEmployees(asList(emp.data?.data ?? emp.data))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const overall = Math.round(
        (Number(form.kpiScore) * 0.5 +
          Number(form.attendanceScore) * 0.2 +
          Number(form.managerRating) * 20 * 0.3)
      )
      await api.post('/performance', {
        ...form,
        quarter: Number(form.quarter),
        year: Number(form.year),
        kpiScore: Number(form.kpiScore),
        attendanceScore: Number(form.attendanceScore),
        managerRating: Number(form.managerRating),
        overall,
      })
      toast('Review created', 'success')
      setOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <p className="text-muted text-sm">Performance reviews and ratings</p>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Create review
          </button>
        )}
      </div>

      <DataTable
        columns={[
          { header: 'Employee', render: (r) => empName(r.employee) },
          { header: 'Period', render: (r) => `Q${r.quarter} ${r.year}` },
          { header: 'KPI', key: 'kpiScore' },
          { header: 'Manager', render: (r) => `${r.managerRating || 0}/5` },
          { header: 'Overall', key: 'overall' },
          { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={rows}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create performance review"
        wide
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" form="perf-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="perf-form" onSubmit={save}>
          <div className="form-group">
            <label>Employee</label>
            <select className="form-control" required value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })}>
              <option value="">Select…</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>{empName(e)}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Quarter</label>
              <select className="form-control" value={form.quarter} onChange={(e) => setForm({ ...form, quarter: e.target.value })}>
                {[1, 2, 3, 4].map((q) => <option key={q} value={q}>Q{q}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Year</label>
              <input className="form-control" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>KPI score (0–100)</label>
              <input className="form-control" type="number" min={0} max={100} value={form.kpiScore} onChange={(e) => setForm({ ...form, kpiScore: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Attendance score</label>
              <input className="form-control" type="number" min={0} max={100} value={form.attendanceScore} onChange={(e) => setForm({ ...form, attendanceScore: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Manager rating (0–5)</label>
            <input className="form-control" type="number" min={0} max={5} step={0.5} value={form.managerRating} onChange={(e) => setForm({ ...form, managerRating: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Self assessment</label>
            <textarea className="form-control" value={form.selfAssessment} onChange={(e) => setForm({ ...form, selfAssessment: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Feedback</label>
            <textarea className="form-control" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
