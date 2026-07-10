import { useEffect, useMemo, useState } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, formatDate } from '../utils/helpers'

const STAGES = ['Applied', 'Screening', 'Technical', 'HR Interview', 'Offer', 'Accepted', 'Rejected', 'Joined']

export default function Recruitment() {
  const { hasRole } = useAuth()
  const canWrite = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [view, setView] = useState('board')
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    experience: 0,
    skills: '',
    appliedFor: '',
    status: 'Applied',
    notes: '',
  })
  const [interview, setInterview] = useState({ round: 'Technical', scheduledAt: '', feedback: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/recruitment')
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

  const filtered = useMemo(
    () => (filter === 'All' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  )

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/recruitment', {
        ...form,
        experience: Number(form.experience) || 0,
        skills: form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      toast('Candidate added', 'success')
      setOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/recruitment/${id}`, { status })
      toast('Status updated', 'success')
      load()
      if (detail?._id === id) setDetail((d) => ({ ...d, status }))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const analyze = async (id) => {
    try {
      const { data } = await api.post(`/recruitment/${id}/analyze`)
      toast('AI analysis complete', 'success')
      load()
      setDetail((d) => (d?._id === id ? { ...d, aiAnalysis: data.data?.aiAnalysis || data.data } : d))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const scheduleInterview = async (e) => {
    e.preventDefault()
    if (!detail) return
    try {
      await api.post(`/recruitment/${detail._id}/interviews`, interview)
      toast('Interview scheduled', 'success')
      const { data } = await api.get(`/recruitment/${detail._id}`)
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
        <select className="form-control" style={{ maxWidth: 180 }} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option>All</option>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="flex gap-8">
          <button type="button" className={`btn btn-sm ${view === 'board' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('board')}>
            Board
          </button>
          <button type="button" className={`btn btn-sm ${view === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setView('table')}>
            Table
          </button>
        </div>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Add candidate
          </button>
        )}
      </div>

      {view === 'board' ? (
        <div className="kanban">
          {STAGES.filter((s) => s !== 'Rejected' || filtered.some((c) => c.status === 'Rejected')).map((stage) => {
            const cards = filtered.filter((c) => c.status === stage)
            if (filter !== 'All' && filter !== stage) return null
            return (
              <div key={stage} className="kanban-col">
                <div className="kanban-col-title">
                  <span>{stage}</span>
                  <span>{cards.length}</span>
                </div>
                {cards.map((c) => (
                  <div key={c._id} className="kanban-card" onClick={() => setDetail(c)}>
                    <h4>{c.name}</h4>
                    <p>{c.appliedFor || 'Open role'}</p>
                    <p>{(c.skills || []).slice(0, 3).join(', ')}</p>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        <DataTable
          columns={[
            { header: 'Name', key: 'name' },
            { header: 'Role', key: 'appliedFor' },
            { header: 'Exp', render: (r) => `${r.experience || 0} yrs` },
            { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              header: 'AI score',
              render: (r) => (r.aiAnalysis?.matchScore != null ? `${r.aiAnalysis.matchScore}%` : '—'),
            },
            {
              header: 'Actions',
              render: (r) => (
                <button type="button" className="link-action" onClick={() => setDetail(r)}>
                  View
                </button>
              ),
            },
          ]}
          rows={filtered}
        />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add candidate" footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" form="cand-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </>
      }>
        <form id="cand-form" onSubmit={create}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input className="form-control" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Experience (years)</label>
              <input className="form-control" type="number" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Applied for</label>
            <input className="form-control" value={form.appliedFor} onChange={(e) => setForm({ ...form, appliedFor: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Skills (comma separated)</label>
            <input className="form-control" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea className="form-control" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name || 'Candidate'}
        wide
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setDetail(null)}>Close</button>
        }
      >
        {detail && (
          <div>
            <div className="flex-between mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p className="text-muted text-sm">{detail.email} · {detail.phone || 'No phone'}</p>
                <p className="text-sm mt-8">{detail.appliedFor} · {detail.experience || 0} yrs</p>
              </div>
              <StatusBadge status={detail.status} />
            </div>

            {canWrite && (
              <div className="form-group">
                <label>Pipeline status</label>
                <select
                  className="form-control"
                  value={detail.status}
                  onChange={(e) => updateStatus(detail._id, e.target.value)}
                >
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="panel mb-16" style={{ background: 'var(--slate-100)' }}>
              <div className="flex-between mb-8">
                <h4 className="fw-600">AI analysis</h4>
                {canWrite && (
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => analyze(detail._id)}>
                    <Sparkles size={14} /> Analyze
                  </button>
                )}
              </div>
              {detail.aiAnalysis ? (
                <div className="text-sm">
                  <p><strong>Score:</strong> {detail.aiAnalysis.matchScore ?? '—'}%</p>
                  <p className="mt-8">{detail.aiAnalysis.summary || detail.aiAnalysis.recommendation}</p>
                  {detail.aiAnalysis.strengths?.length > 0 && (
                    <p className="mt-8"><strong>Strengths:</strong> {detail.aiAnalysis.strengths.join(', ')}</p>
                  )}
                </div>
              ) : (
                <p className="text-muted text-sm">No analysis yet.</p>
              )}
            </div>

            {canWrite && (
              <form onSubmit={scheduleInterview}>
                <h4 className="fw-600 mb-8">Schedule interview</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Round</label>
                    <input className="form-control" value={interview.round} onChange={(e) => setInterview({ ...interview, round: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>When</label>
                    <input className="form-control" type="datetime-local" required value={interview.scheduledAt} onChange={(e) => setInterview({ ...interview, scheduledAt: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Schedule</button>
              </form>
            )}

            {(detail.interviews || []).length > 0 && (
              <div className="mt-16">
                <h4 className="fw-600 mb-8">Interviews</h4>
                <ul className="text-sm" style={{ listStyle: 'none', display: 'grid', gap: 8 }}>
                  {detail.interviews.map((iv, i) => (
                    <li key={iv._id || i} className="flex-between">
                      <span>{iv.round} · {formatDate(iv.scheduledAt)}</span>
                      <StatusBadge status={iv.status} />
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
