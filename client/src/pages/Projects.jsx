import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, empName, formatDate } from '../utils/helpers'

const TASK_STATUSES = ['To Do', 'In Progress', 'Review', 'Completed', 'Blocked']

export default function Projects() {
  const { hasRole } = useAuth()
  const isSuperAdmin = hasRole('SUPER_ADMIN')
  const canProject = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'TEAM_LEAD')
  const canTask = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'MANAGER', 'TEAM_LEAD', 'EMPLOYEE')
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [organizations, setOrganizations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [projOpen, setProjOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [projForm, setProjForm] = useState({ name: '', description: '', status: 'Planning', organization: '' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'Medium', status: 'To Do', project: '' })

  const load = async () => {
    setLoading(true)
    try {
      const requests = [api.get('/projects'), api.get('/projects/tasks')]
      if (isSuperAdmin) requests.push(api.get('/organizations'))
      const [p, t, orgRes] = await Promise.all(requests)
      const plist = asList(p.data?.data ?? p.data)
      setProjects(plist)
      setTasks(asList(t.data?.data ?? t.data))
      if (isSuperAdmin) {
        const orgList = asList(orgRes?.data?.data ?? orgRes?.data)
        setOrganizations(orgList)
        if (!projForm.organization && orgList[0]?._id) {
          setProjForm((prev) => ({ ...prev, organization: orgList[0]._id }))
        }
      }
      if (!selected && plist[0]) setSelected(plist[0]._id)
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filteredTasks = useMemo(
    () => (selected ? tasks.filter((t) => (t.project?._id || t.project) === selected) : tasks),
    [tasks, selected]
  )

  const createProject = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...projForm }
      if (!isSuperAdmin) delete payload.organization
      if (isSuperAdmin && !payload.organization) {
        toast('Please select an organization', 'error')
        return
      }
      await api.post('/projects', payload)
      toast('Project created', 'success')
      setProjOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      await api.post('/projects/tasks', { ...taskForm, project: taskForm.project || selected })
      toast('Task created', 'success')
      setTaskOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const updateTaskStatus = async (id, status) => {
    try {
      await api.put(`/projects/tasks/${id}`, { status })
      toast('Task updated', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <select className="form-control" style={{ maxWidth: 260 }} value={selected || ''} onChange={(e) => setSelected(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        <div className="flex gap-8">
          {canTask && (
            <button type="button" className="btn btn-secondary" onClick={() => { setTaskForm({ title: '', description: '', priority: 'Medium', status: 'To Do', project: selected || '' }); setTaskOpen(true) }}>
              <Plus size={16} /> Task
            </button>
          )}
          {canProject && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setProjForm({
                  name: '',
                  description: '',
                  status: 'Planning',
                  organization: isSuperAdmin ? organizations[0]?._id || '' : '',
                })
                setProjOpen(true)
              }}
            >
              <Plus size={16} /> Project
            </button>
          )}
        </div>
      </div>

      <div className="panel mb-24">
        <h3 className="panel-title mb-16">Projects</h3>
        <DataTable
          columns={[
            { header: 'Name', key: 'name' },
            { header: 'Manager', render: (r) => empName(r.manager) },
            { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { header: 'Start', render: (r) => formatDate(r.startDate) },
            {
              header: '',
              render: (r) => (
                <button type="button" className="link-action" onClick={() => setSelected(r._id)}>
                  View tasks
                </button>
              ),
            },
          ]}
          rows={projects}
        />
      </div>

      <h3 className="panel-title mb-16">Task board</h3>
      <div className="kanban">
        {TASK_STATUSES.map((status) => {
          const cards = filteredTasks.filter((t) => t.status === status)
          return (
            <div key={status} className="kanban-col">
              <div className="kanban-col-title">
                <span>{status}</span>
                <span>{cards.length}</span>
              </div>
              {cards.map((t) => (
                <div key={t._id} className="kanban-card">
                  <h4>{t.title}</h4>
                  <p>{t.priority} · {empName(t.assignedTo)}</p>
                  {canTask && (
                    <select
                      className="form-control mt-8"
                      style={{ fontSize: 12, padding: '4px 8px' }}
                      value={t.status}
                      onChange={(e) => updateTaskStatus(t._id, e.target.value)}
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <Modal open={projOpen} onClose={() => setProjOpen(false)} title="New project" footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setProjOpen(false)}>Cancel</button>
          <button type="submit" form="proj-form" className="btn btn-primary">Create</button>
        </>
      }>
        <form id="proj-form" onSubmit={createProject}>
          <div className="form-group">
            <label>Name</label>
            <input className="form-control" required value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={projForm.status} onChange={(e) => setProjForm({ ...projForm, status: e.target.value })}>
              {['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          {isSuperAdmin && (
            <div className="form-group">
              <label>Organization</label>
              <select
                className="form-control"
                required
                value={projForm.organization}
                onChange={(e) => setProjForm({ ...projForm, organization: e.target.value })}
              >
                <option value="">Select…</option>
                {organizations.map((org) => (
                  <option key={org._id} value={org._id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>
      </Modal>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="New task" footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setTaskOpen(false)}>Cancel</button>
          <button type="submit" form="task-form" className="btn btn-primary">Create</button>
        </>
      }>
        <form id="task-form" onSubmit={createTask}>
          <div className="form-group">
            <label>Project</label>
            <select className="form-control" required value={taskForm.project} onChange={(e) => setTaskForm({ ...taskForm, project: e.target.value })}>
              <option value="">Select…</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                {['Low', 'Medium', 'High', 'Critical'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select className="form-control" value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                {TASK_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
