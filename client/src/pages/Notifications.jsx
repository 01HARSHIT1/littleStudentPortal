import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import api, { getErrorMessage } from '../api/axios'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { formatDate } from '../utils/helpers'

export default function Notifications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/notifications')
      const list = data?.data || data
      setRows(Array.isArray(list) ? list : list.notifications || [])
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setRows((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true, read: true } : n)))
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  const markAll = async () => {
    try {
      await api.put('/notifications/read-all')
      setRows((prev) => prev.map((n) => ({ ...n, isRead: true, read: true })))
      toast('All marked as read', 'success')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  return (
    <div className="animate-slide">
      <div className="toolbar">
        <p className="text-muted text-sm">{rows.filter((n) => !n.isRead && !n.read).length} unread</p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={markAll}>
          <CheckCheck size={16} /> Mark all read
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state panel">
          <Bell size={40} />
          <h3>No notifications</h3>
          <p className="text-sm">You are all caught up.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map((n) => {
            const unread = !n.isRead && !n.read
            return (
              <div
                key={n._id}
                className="panel"
                style={{
                  borderLeft: unread ? '3px solid var(--brand)' : undefined,
                  opacity: unread ? 1 : 0.75,
                }}
              >
                <div className="flex-between" style={{ gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div className="fw-600">{n.title || n.type || 'Notification'}</div>
                    <p className="text-sm text-muted mt-8">{n.message || n.body}</p>
                    <p className="text-sm text-muted mt-8" style={{ fontSize: 12 }}>
                      {formatDate(n.createdAt)}
                    </p>
                  </div>
                  {unread && (
                    <button type="button" className="btn btn-sm btn-secondary" onClick={() => markRead(n._id)}>
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
