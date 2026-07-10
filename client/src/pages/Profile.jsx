import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../api/axios'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ firstName: '', lastName: '', mobile: '' })
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/auth/profile')
        const p = data.data || data
        if (cancelled) return
        setProfile(p)
        setForm({
          firstName: p.employee?.personal?.firstName || '',
          lastName: p.employee?.personal?.lastName || '',
          mobile: p.employee?.personal?.mobile || '',
        })
      } catch (err) {
        toast(getErrorMessage(err), 'error')
        setProfile(user)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [user])

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const empId =
        profile?.employee?._id ||
        profile?.employee ||
        user?.employee?._id ||
        user?.employee
      if (empId) {
        await api.put(`/employees/${empId}`, {
          personal: {
            firstName: form.firstName,
            lastName: form.lastName,
            mobile: form.mobile,
            email: profile?.employee?.personal?.email || profile?.email || user?.email,
          },
        })
      }
      const { data } = await api.get('/auth/profile')
      const next = data.data || data
      setProfile(next)
      updateUser({ ...user, ...next })
      toast('Profile updated', 'success')
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (pwd.newPassword !== pwd.confirm) {
      toast('Passwords do not match', 'error')
      return
    }
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      })
      toast('Password changed', 'success')
      setPwd({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast(getErrorMessage(err), 'error')
    }
  }

  if (loading) return <Loading />

  const display = profile || user || {}

  return (
    <div className="animate-slide grid-2">
      <div className="panel">
        <h3 className="panel-title mb-16">Profile</h3>
        <div className="flex gap-16 mb-24" style={{ alignItems: 'center' }}>
          <div className="avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
            {(form.firstName || display.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="fw-600">
              {form.firstName || display.email} {form.lastName}
            </div>
            <div className="text-sm text-muted">{display.email}</div>
            <div className="text-sm text-muted">{display.role?.replace(/_/g, ' ')}</div>
          </div>
        </div>
        <form onSubmit={saveProfile}>
          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input
                className="form-control"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input
                className="form-control"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Mobile</label>
            <input
              className="form-control"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>

      <div className="panel">
        <h3 className="panel-title mb-16">Change password</h3>
        <form onSubmit={changePassword}>
          <div className="form-group">
            <label>Current password</label>
            <input
              className="form-control"
              type="password"
              required
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>New password</label>
            <input
              className="form-control"
              type="password"
              required
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Confirm new password</label>
            <input
              className="form-control"
              type="password"
              required
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Update password
          </button>
        </form>
      </div>
    </div>
  )
}
