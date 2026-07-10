import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, empName, formatMoney } from '../utils/helpers'

export default function Payroll() {
  const { hasRole } = useAuth()
  const canWrite = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'FINANCE', 'HR_MANAGER')
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [genOpen, setGenOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    bonus: 0,
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/payroll')
      setRows(asList(data?.data ?? data))
      if (canWrite) {
        const emp = await api.get('/employees')
        setEmployees(asList(emp.data?.data ?? emp.data))
      }
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const generate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/payroll/generate', {
        ...form,
        month: Number(form.month),
        year: Number(form.year),
        bonus: Number(form.bonus) || 0,
      })
      toast('Payroll generated', 'success')
      setGenOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const generateBulk = async () => {
    setSaving(true)
    try {
      await api.post('/payroll/generate-bulk', {
        month: Number(form.month),
        year: Number(form.year),
      })
      toast('Bulk payroll processed', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const markPaid = async (id) => {
    try {
      await api.put(`/payroll/${id}/pay`)
      toast('Marked as paid', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const openDetail = async (row) => {
    try {
      const { data } = await api.get(`/payroll/${row._id}`)
      setDetail(data.data || data)
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <p className="text-muted text-sm">Payslips and payroll runs</p>
        {canWrite && (
          <div className="flex gap-8">
            <button type="button" className="btn btn-secondary" onClick={generateBulk} disabled={saving}>
              Generate bulk
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setGenOpen(true)}>
              Generate payroll
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={[
          { header: 'Employee', render: (r) => empName(r.employee) },
          { header: 'Period', render: (r) => `${r.month}/${r.year}` },
          { header: 'Net', render: (r) => formatMoney(r.netSalary ?? r.components?.net) },
          { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            header: 'Actions',
            render: (r) => (
              <div className="actions-cell">
                <button type="button" className="link-action" onClick={() => openDetail(r)}>
                  View
                </button>
                {canWrite && r.status !== 'Paid' && (
                  <button type="button" className="link-action" onClick={() => markPaid(r._id)}>
                    Mark paid
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={rows}
      />

      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Generate payroll"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setGenOpen(false)}>Cancel</button>
            <button type="submit" form="pay-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Generating…' : 'Generate'}
            </button>
          </>
        }
      >
        <form id="pay-form" onSubmit={generate}>
          <div className="form-group">
            <label>Employee</label>
            <select className="form-control" required value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
              <option value="">Select…</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {empName(e)} ({e.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Month</label>
              <input className="form-control" type="number" min={1} max={12} value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input className="form-control" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Bonus</label>
            <input className="form-control" type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title="Payslip detail" footer={
        <button type="button" className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
      }>
        {detail && (
          <div className="text-sm" style={{ display: 'grid', gap: 10 }}>
            <div className="flex-between"><span className="text-muted">Employee</span><strong>{empName(detail.employee)}</strong></div>
            <div className="flex-between"><span className="text-muted">Period</span><strong>{detail.month}/{detail.year}</strong></div>
            <div className="flex-between"><span className="text-muted">Status</span><StatusBadge status={detail.status} /></div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
            {detail.components &&
              Object.entries(detail.components).map(([k, v]) => (
                <div key={k} className="flex-between">
                  <span className="text-muted">{k}</span>
                  <span>{typeof v === 'number' ? formatMoney(v) : String(v)}</span>
                </div>
              ))}
            <div className="flex-between mt-8">
              <strong>Net salary</strong>
              <strong>{formatMoney(detail.netSalary ?? detail.components?.net)}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
