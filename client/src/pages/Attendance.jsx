import { useEffect, useState } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import StatusBadge from '../components/StatusBadge'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { asList, empName, formatDate } from '../utils/helpers'

export default function Attendance() {
  const [today, setToday] = useState(null)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [corrOpen, setCorrOpen] = useState(false)
  const [corr, setCorr] = useState({ date: '', reason: '', requestedClockIn: '', requestedClockOut: '' })

  const load = async () => {
    setLoading(true)
    try {
      const [t, h] = await Promise.all([
        api.get('/attendance/today').catch(() => ({ data: { data: null } })),
        api.get('/attendance'),
      ])
      setToday(t.data?.data ?? t.data ?? null)
      setRows(asList(h.data?.data ?? h.data))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const clockIn = async () => {
    setBusy(true)
    try {
      await api.post('/attendance/clock-in')
      toast('Clocked in', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const clockOut = async () => {
    setBusy(true)
    try {
      await api.post('/attendance/clock-out')
      toast('Clocked out', 'success')
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setBusy(false)
    }
  }

  const submitCorrection = async (e) => {
    e.preventDefault()
    try {
      await api.post('/attendance/correction', corr)
      toast('Correction requested', 'success')
      setCorrOpen(false)
      load()
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const formatTime = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <Loading />

  const clockedIn = Boolean(today?.clockIn && !today?.clockOut)
  const done = Boolean(today?.clockIn && today?.clockOut)

  return (
    <div className="animate-slide">
      <div className="panel mb-24 animate-scale">
        <div className="panel-header">
          <h3 className="panel-title">Today&apos;s status</h3>
          <StatusBadge status={today?.status || 'Absent'} />
        </div>
        <p className="text-sm text-muted mb-16">
          In: {formatTime(today?.clockIn)} · Out: {formatTime(today?.clockOut)}
          {today?.workHours != null ? ` · ${today.workHours} hrs` : ''}
        </p>
        <div className="clock-actions">
          <button type="button" className="clock-btn in" onClick={clockIn} disabled={busy || clockedIn || done}>
            <LogIn size={28} />
            Clock In
          </button>
          <button type="button" className="clock-btn out" onClick={clockOut} disabled={busy || !clockedIn}>
            <LogOut size={28} />
            Clock Out
          </button>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCorrOpen(true)}>
          Request correction
        </button>
      </div>

      <div className="panel-header">
        <h3 className="panel-title">History</h3>
      </div>
      <DataTable
        columns={[
          { header: 'Date', render: (r) => formatDate(r.date) },
          { header: 'Employee', render: (r) => empName(r.employee) },
          { header: 'In', render: (r) => formatTime(r.clockIn) },
          { header: 'Out', render: (r) => formatTime(r.clockOut) },
          { header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
        ]}
        rows={rows}
      />

      <Modal
        open={corrOpen}
        onClose={() => setCorrOpen(false)}
        title="Attendance correction"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCorrOpen(false)}>Cancel</button>
            <button type="submit" form="corr-form" className="btn btn-primary">Submit</button>
          </>
        }
      >
        <form id="corr-form" onSubmit={submitCorrection}>
          <div className="form-group">
            <label>Date</label>
            <input className="form-control" type="date" required value={corr.date} onChange={(e) => setCorr({ ...corr, date: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Requested clock in</label>
              <input className="form-control" type="datetime-local" value={corr.requestedClockIn} onChange={(e) => setCorr({ ...corr, requestedClockIn: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Requested clock out</label>
              <input className="form-control" type="datetime-local" value={corr.requestedClockOut} onChange={(e) => setCorr({ ...corr, requestedClockOut: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label>Reason</label>
            <textarea className="form-control" required value={corr.reason} onChange={(e) => setCorr({ ...corr, reason: e.target.value })} />
          </div>
        </form>
      </Modal>
    </div>
  )
}
