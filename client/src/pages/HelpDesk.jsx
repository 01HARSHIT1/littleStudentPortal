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

export default function HelpDesk() {
  const { hasRole } = useAuth()
  const canManage = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'IT_ADMIN')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Software',
    priority: 'Medium',
  })
  const [comment, setComment] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/tickets')
      setRows(asList(data?.data ?? data))
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
      await api.post('/tickets', form)
      toast('Ticket raised', 'success')
      setOpen(false)
      setForm({ title: '', description: '', category: 'Software', priority: 'Medium' })
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tickets/${id}`, { status })
      toast('Ticket updated', 'success')
      load()
      if (detail?._id === id) setDetail((d) => ({ ...d, status }))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const addComment = async (e) => {
    e.preventDefault()
    if (!detail || !comment.trim()) return
    try {
      await api.post(`/tickets/${detail._id}/comments`, { text: comment })
      toast('Comment added', 'success')
      setComment('')
      const { data } = await api.get(`/tickets/${detail._id}`)
      setDetail(data.data || data)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <p className="text-muted text-sm">IT & facilities support tickets</p>
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={16} /> Raise ticket
        </button>
      </div>

      <DataTable
        columns={[
          { header: 'ID', key: 'ticketId' },
          { header: 'Title', key: 'title' },
          { header: 'Category', key: 'category' },
          { header: 'Priority', key: 'priority' },
          { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          { header: 'Created', render: (r) => formatDate(r.createdAt) },
          {
            header: 'Actions',
            render: (r) => (
              <button type="button" className="link-action" onClick={() => setDetail(r)}>
                View
              </button>
            ),
          },
        ]}
        rows={rows}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Raise ticket" footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" form="ticket-form" className="btn btn-primary">Submit</button>
        </>
      }>
        <form id="ticket-form" onSubmit={create}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-control" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['Hardware', 'Software', 'Network', 'Access', 'HR', 'Facilities', 'Other'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select className="form-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.ticketId || 'Ticket'} wide footer={
        <button type="button" className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
      }>
        {detail && (
          <div>
            <div className="flex-between mb-16">
              <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 18 }}>{detail.title}</h3>
              <StatusBadge status={detail.status} />
            </div>
            <p className="text-sm mb-16">{detail.description}</p>
            <p className="text-sm text-muted mb-16">
              {detail.category} · {detail.priority} · {formatDate(detail.createdAt)}
            </p>

            {(canManage || true) && (
              <div className="form-group">
                <label>Update status</label>
                <select
                  className="form-control"
                  value={detail.status}
                  onChange={(e) => updateStatus(detail._id, e.target.value)}
                >
                  {['Open', 'In Progress', 'Resolved', 'Closed', 'Cancelled'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <form onSubmit={addComment} className="mt-16">
              <div className="form-group">
                <label>Add comment</label>
                <textarea className="form-control" value={comment} onChange={(e) => setComment(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Post</button>
            </form>

            {(detail.comments || []).length > 0 && (
              <div className="mt-16">
                <h4 className="fw-600 mb-8">Comments</h4>
                <ul style={{ listStyle: 'none', display: 'grid', gap: 8 }}>
                  {detail.comments.map((c, i) => (
                    <li key={c._id || i} className="panel text-sm" style={{ padding: 12 }}>
                      {c.text}
                      <div className="text-muted mt-8" style={{ fontSize: 11 }}>{formatDate(c.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
