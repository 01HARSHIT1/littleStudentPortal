import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, formatDate } from '../utils/helpers'

const TABS = ['Departments', 'Designations', 'Holidays', 'Shifts']

export default function Organization() {
  const { hasRole } = useAuth()
  const canWrite = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER')
  const [tab, setTab] = useState('Departments')
  const [loading, setLoading] = useState(true)
  const [depts, setDepts] = useState([])
  const [designations, setDesignations] = useState([])
  const [holidays, setHolidays] = useState([])
  const [shifts, setShifts] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [d, des, h] = await Promise.all([
        api.get('/departments'),
        api.get('/designations'),
        api.get('/leave/holidays'),
      ])
      setDepts(asList(d.data?.data ?? d.data))
      setDesignations(asList(des.data?.data ?? des.data))
      setHolidays(asList(h.data?.data ?? h.data))
      // Shifts have no dedicated API — show seeded info from org settings fallback
      setShifts([
        { _id: 'general', name: 'General Shift', startTime: '09:00', endTime: '18:00', isActive: true },
      ])
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditing(null)
    if (tab === 'Departments') setForm({ name: '', code: '', status: 'Active' })
    if (tab === 'Designations') setForm({ title: '', level: 1, department: '' })
    if (tab === 'Holidays') setForm({ name: '', date: '', type: 'Company' })
    if (tab === 'Shifts') setForm({ name: '', startTime: '09:00', endTime: '18:00' })
    setOpen(true)
  }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (tab === 'Departments') {
        if (editing) await api.put(`/departments/${editing._id}`, form)
        else await api.post('/departments', form)
      } else if (tab === 'Designations') {
        const payload = { ...form, level: Number(form.level) || 1 }
        if (editing) await api.put(`/designations/${editing._id}`, payload)
        else await api.post('/designations', payload)
      } else if (tab === 'Holidays') {
        await api.post('/leave/holidays', form)
      } else if (tab === 'Shifts') {
        setShifts((s) => [
          ...s,
          { _id: `local-${Date.now()}`, ...form, isActive: true },
        ])
        toast('Shift saved locally (no shifts API on server)', 'info')
        setOpen(false)
        setSaving(false)
        return
      }
      toast('Saved successfully', 'success')
      setOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (type, id) => {
    if (!confirm('Delete this record?')) return
    try {
      if (type === 'dept') await api.delete(`/departments/${id}`)
      if (type === 'des') await api.delete(`/designations/${id}`)
      toast('Deleted', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <p className="text-muted text-sm">Manage organizational structure and calendars.</p>
        {canWrite && tab !== 'Shifts' && (
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add {tab.slice(0, -1)}
          </button>
        )}
        {canWrite && tab === 'Shifts' && (
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Plus size={16} /> Add shift
          </button>
        )}
      </div>

      {tab === 'Departments' && (
        <DataTable
          columns={[
            { header: 'Name', key: 'name' },
            { header: 'Code', key: 'code' },
            { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ...(canWrite
              ? [
                  {
                    header: 'Actions',
                    render: (r) => (
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="link-action"
                          onClick={() => {
                            setEditing(r)
                            setForm({ name: r.name, code: r.code, status: r.status })
                            setOpen(true)
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className="link-action" onClick={() => remove('dept', r._id)}>
                          Delete
                        </button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          rows={depts}
        />
      )}

      {tab === 'Designations' && (
        <DataTable
          columns={[
            { header: 'Title', key: 'title' },
            { header: 'Level', key: 'level' },
            {
              header: 'Department',
              render: (r) => r.department?.name || '—',
            },
            ...(canWrite
              ? [
                  {
                    header: 'Actions',
                    render: (r) => (
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="link-action"
                          onClick={() => {
                            setEditing(r)
                            setForm({
                              title: r.title,
                              level: r.level,
                              department: r.department?._id || r.department || '',
                            })
                            setOpen(true)
                          }}
                        >
                          Edit
                        </button>
                        <button type="button" className="link-action" onClick={() => remove('des', r._id)}>
                          Delete
                        </button>
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
          rows={designations}
        />
      )}

      {tab === 'Holidays' && (
        <DataTable
          columns={[
            { header: 'Name', key: 'name' },
            { header: 'Date', render: (r) => formatDate(r.date) },
            { header: 'Type', key: 'type' },
          ]}
          rows={holidays}
        />
      )}

      {tab === 'Shifts' && (
        <DataTable
          columns={[
            { header: 'Name', key: 'name' },
            { header: 'Start', key: 'startTime' },
            { header: 'End', key: 'endTime' },
            {
              header: 'Active',
              render: (r) => <StatusBadge status={r.isActive ? 'Active' : 'Archived'} />,
            },
          ]}
          rows={shifts}
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${editing ? 'Edit' : 'Add'} ${tab.slice(0, -1)}`}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="org-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="org-form" onSubmit={save}>
          {tab === 'Departments' && (
            <>
              <div className="form-group">
                <label>Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Code</label>
                <input
                  className="form-control"
                  required
                  value={form.code || ''}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={form.status || 'Active'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </>
          )}
          {tab === 'Designations' && (
            <>
              <div className="form-group">
                <label>Title</label>
                <input
                  className="form-control"
                  required
                  value={form.title || ''}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Level</label>
                <input
                  className="form-control"
                  type="number"
                  value={form.level || 1}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  className="form-control"
                  value={form.department || ''}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  <option value="">Select…</option>
                  {depts.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          {tab === 'Holidays' && (
            <>
              <div className="form-group">
                <label>Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  className="form-control"
                  type="date"
                  required
                  value={form.date || ''}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-control"
                  value={form.type || 'Company'}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>National</option>
                  <option>Company</option>
                  <option>Optional</option>
                </select>
              </div>
            </>
          )}
          {tab === 'Shifts' && (
            <>
              <div className="form-group">
                <label>Name</label>
                <input
                  className="form-control"
                  required
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start</label>
                  <input
                    className="form-control"
                    type="time"
                    value={form.startTime || '09:00'}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End</label>
                  <input
                    className="form-control"
                    type="time"
                    value={form.endTime || '18:00'}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
