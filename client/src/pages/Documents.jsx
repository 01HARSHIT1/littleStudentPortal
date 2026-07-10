import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, formatDate } from '../utils/helpers'

export default function Documents() {
  const { hasRole } = useAuth()
  const canWrite = hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'IT_ADMIN')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ title: '', category: 'Policy', fileUrl: '', fileName: '' })
  const [file, setFile] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/documents')
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

  const filtered = useMemo(() => {
    return rows.filter((d) => {
      const matchCat = category === 'All' || d.category === category
      const s = q.trim().toLowerCase()
      const matchQ = !s || d.title?.toLowerCase().includes(s) || d.fileName?.toLowerCase().includes(s)
      return matchCat && matchQ
    })
  }, [rows, q, category])

  const create = async (e) => {
    e.preventDefault()
    try {
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', form.title)
        fd.append('category', form.category)
        await api.post('/documents', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/documents', {
          title: form.title,
          category: form.category,
          fileUrl: form.fileUrl || 'https://example.com/doc.pdf',
          fileName: form.fileName || form.title,
        })
      }
      toast('Document added', 'success')
      setOpen(false)
      setFile(null)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <div className="search-input">
          <Search />
          <input className="form-control" placeholder="Search documents…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="form-control" style={{ maxWidth: 160 }} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option>All</option>
          {['Policy', 'Contract', 'ID Proof', 'Certificate', 'Payslip', 'Report', 'Other'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        {canWrite && (
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Upload
          </button>
        )}
      </div>

      <DataTable
        columns={[
          { header: 'Title', key: 'title' },
          { header: 'Category', key: 'category' },
          { header: 'File', key: 'fileName' },
          { header: 'Uploaded', render: (r) => formatDate(r.createdAt) },
          {
            header: 'Link',
            render: (r) =>
              r.fileUrl ? (
                <a className="link-action" href={r.fileUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              ) : (
                '—'
              ),
          },
        ]}
        rows={filtered}
      />

      <Modal open={open} onClose={() => setOpen(false)} title="Add document" footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
          <button type="submit" form="doc-form" className="btn btn-primary">Save</button>
        </>
      }>
        <form id="doc-form" onSubmit={create}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-control" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="form-control" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {['Policy', 'Contract', 'ID Proof', 'Certificate', 'Payslip', 'Report', 'Other'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>File upload</label>
            <input className="form-control" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <p className="form-hint">Or provide a URL below if upload is unavailable.</p>
          </div>
          <div className="form-group">
            <label>File URL (optional)</label>
            <input className="form-control" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
