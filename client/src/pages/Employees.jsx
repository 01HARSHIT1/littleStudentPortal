import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, empName, formatDate } from '../utils/helpers'

const emptyForm = {
  personal: { firstName: '', lastName: '', email: '', mobile: '', gender: 'Other' },
  professional: {
    department: '',
    designation: '',
    employmentType: 'Full-time',
    basicSalary: '',
    joiningDate: '',
  },
  status: 'Active',
  createUser: true,
  role: 'EMPLOYEE',
  password: 'Secure@123',
}

export default function Employees() {
  const { hasRole } = useAuth()
  const canWrite = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER')
  const [rows, setRows] = useState([])
  const [depts, setDepts] = useState([])
  const [designations, setDesignations] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [emp, d, des] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
        api.get('/designations'),
      ])
      setRows(asList(emp.data?.data ?? emp.data))
      setDepts(asList(d.data?.data ?? d.data))
      setDesignations(asList(des.data?.data ?? des.data))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return rows
    return rows.filter((e) => {
      const name = empName(e).toLowerCase()
      return (
        name.includes(s) ||
        e.employeeId?.toLowerCase().includes(s) ||
        e.personal?.email?.toLowerCase().includes(s)
      )
    })
  }, [rows, q])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  const openEdit = (e) => {
    setEditing(e)
    setForm({
      personal: {
        firstName: e.personal?.firstName || '',
        lastName: e.personal?.lastName || '',
        email: e.personal?.email || '',
        mobile: e.personal?.mobile || '',
        gender: e.personal?.gender || 'Other',
      },
      professional: {
        department: e.professional?.department?._id || e.professional?.department || '',
        designation: e.professional?.designation?._id || e.professional?.designation || '',
        employmentType: e.professional?.employmentType || 'Full-time',
        basicSalary: e.professional?.basicSalary ?? '',
        joiningDate: e.professional?.joiningDate
          ? String(e.professional.joiningDate).slice(0, 10)
          : '',
      },
      status: e.status || 'Active',
      createUser: false,
      role: 'EMPLOYEE',
      password: '',
    })
    setOpen(true)
  }

  const setPersonal = (k, v) => setForm((f) => ({ ...f, personal: { ...f.personal, [k]: v } }))
  const setProf = (k, v) =>
    setForm((f) => ({ ...f, professional: { ...f.professional, [k]: v } }))

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        personal: form.personal,
        professional: {
          ...form.professional,
          basicSalary: Number(form.professional.basicSalary) || 0,
          department: form.professional.department || undefined,
          designation: form.professional.designation || undefined,
        },
        status: form.status,
      }
      if (editing) {
        await api.put(`/employees/${editing._id}`, payload)
        toast('Employee updated', 'success')
      } else {
        await api.post('/employees', {
          ...payload,
          createUser: form.createUser,
          role: form.role,
          password: form.password || 'Secure@123',
        })
        toast('Employee created', 'success')
      }
      setOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { header: 'ID', key: 'employeeId' },
    {
      header: 'Name',
      render: (r) => (
        <Link className="link-action" to={`/employees/${r._id}`}>
          {empName(r)}
        </Link>
      ),
    },
    { header: 'Email', render: (r) => r.personal?.email },
    {
      header: 'Department',
      render: (r) => r.professional?.department?.name || '—',
    },
    {
      header: 'Designation',
      render: (r) => r.professional?.designation?.title || '—',
    },
    { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      header: 'Joined',
      render: (r) => formatDate(r.professional?.joiningDate),
    },
    ...(canWrite
      ? [
          {
            header: 'Actions',
            render: (r) => (
              <button type="button" className="link-action" onClick={() => openEdit(r)}>
                Edit
              </button>
            ),
          },
        ]
      : []),
  ]

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <div className="search-input">
          <Search />
          <input
            className="form-control"
            placeholder="Search employees…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add employee
          </button>
        )}
      </div>

      <DataTable columns={columns} rows={filtered} empty="No employees found" />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit employee' : 'Add employee'}
        wide
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="emp-form" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        }
      >
        <form id="emp-form" onSubmit={save}>
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input
                className="form-control"
                required
                value={form.personal.firstName}
                onChange={(e) => setPersonal('firstName', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input
                className="form-control"
                required
                value={form.personal.lastName}
                onChange={(e) => setPersonal('lastName', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control"
                type="email"
                required
                value={form.personal.email}
                onChange={(e) => setPersonal('email', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mobile</label>
              <input
                className="form-control"
                value={form.personal.mobile}
                onChange={(e) => setPersonal('mobile', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select
                className="form-control"
                value={form.professional.department}
                onChange={(e) => setProf('department', e.target.value)}
              >
                <option value="">Select…</option>
                {depts.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Designation</label>
              <select
                className="form-control"
                value={form.professional.designation}
                onChange={(e) => setProf('designation', e.target.value)}
              >
                <option value="">Select…</option>
                {designations.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Employment type</label>
              <select
                className="form-control"
                value={form.professional.employmentType}
                onChange={(e) => setProf('employmentType', e.target.value)}
              >
                {['Full-time', 'Part-time', 'Contract', 'Intern'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Basic salary</label>
              <input
                className="form-control"
                type="number"
                value={form.professional.basicSalary}
                onChange={(e) => setProf('basicSalary', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Joining date</label>
              <input
                className="form-control"
                type="date"
                value={form.professional.joiningDate}
                onChange={(e) => setProf('joiningDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                className="form-control"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                {['Active', 'Probation', 'Permanent', 'Resigned', 'Archived'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {!editing && (
            <>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.createUser}
                    onChange={(e) => setForm((f) => ({ ...f, createUser: e.target.checked }))}
                  />{' '}
                  Create login account
                </label>
              </div>
              {form.createUser && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      className="form-control"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    >
                      {[
                        'EMPLOYEE',
                        'TEAM_LEAD',
                        'MANAGER',
                        'HR_MANAGER',
                        'FINANCE',
                        'IT_ADMIN',
                        'ORG_ADMIN',
                      ].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Temp password</label>
                    <input
                      className="form-control"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </form>
      </Modal>
    </div>
  )
}
