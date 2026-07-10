import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, empName, formatMoney } from '../utils/helpers'

export default function Assets() {
  const { hasRole } = useAuth()
  const canWrite = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'IT_ADMIN', 'HR_MANAGER')
  const [rows, setRows] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(null)
  const [form, setForm] = useState({
    name: '',
    assetTag: '',
    category: 'Laptop',
    status: 'Available',
    purchaseCost: '',
    notes: '',
  })
  const [employeeId, setEmployeeId] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/assets')
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

  const create = async (e) => {
    e.preventDefault()
    try {
      await api.post('/assets', {
        ...form,
        purchaseCost: Number(form.purchaseCost) || 0,
      })
      toast('Asset created', 'success')
      setOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const assign = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/assets/${assignOpen}/assign`, { employeeId })
      toast('Asset assigned', 'success')
      setAssignOpen(null)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const unassign = async (id) => {
    try {
      await api.put(`/assets/${id}`, { assignedTo: null, status: 'Available' })
      toast('Asset unassigned', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <p className="text-muted text-sm">Asset inventory</p>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Add asset
          </button>
        )}
      </div>

      <DataTable
        columns={[
          { header: 'Tag', key: 'assetTag' },
          { header: 'Name', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Assigned to', render: (r) => empName(r.assignedTo) },
          { header: 'Cost', render: (r) => formatMoney(r.purchaseCost) },
          { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          ...(canWrite
            ? [
                {
                  header: 'Actions',
                  render: (r) => (
                    <div className="actions-cell">
                      {r.status === 'Assigned' ? (
                        <button type="button" className="link-action" onClick={() => unassign(r._id)}>
                          Unassign
                        </button>
                      ) : (
                        <button type="button" className="link-action" onClick={() => { setAssignOpen(r._id); setEmployeeId('') }}>
                          Assign
                        </button>
                      )}
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rows={rows}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Add asset" footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" form="asset-form" className="btn btn-primary">Save</button>
        </>
      }>
        <form id="asset-form" onSubmit={create}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Asset tag</label>
              <input className="form-control" required value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Furniture', 'Software', 'Other'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Purchase cost</label>
              <input className="form-control" type="number" value={form.purchaseCost} onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(assignOpen)} onClose={() => setAssignOpen(null)} title="Assign asset" footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setAssignOpen(null)}>Cancel</button>
          <button type="submit" form="assign-form" className="btn btn-primary">Assign</button>
        </>
      }>
        <form id="assign-form" onSubmit={assign}>
          <div className="form-group">
            <label>Employee</label>
            <select className="form-control" required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select…</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>{empName(e)}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  )
}
