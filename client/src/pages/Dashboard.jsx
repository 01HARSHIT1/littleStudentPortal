import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Clock,
  CalendarDays,
  Ticket,
  FolderKanban,
  UserPlus,
  Laptop,
  Building2,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api, { getErrorMessage } from '../api/axios'
import StatCard from '../components/StatCard'
import Loading from '../components/Loading'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import { asList, empName, formatMoney } from '../utils/helpers'

const COLORS = ['#0F766E', '#14B8A6', '#0284C7', '#D97706', '#64748B', '#DC2626']

export default function Dashboard() {
  const { user, hasRole } = useAuth()
  const [data, setData] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [dash, att, leaveRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/attendance').catch(() => ({ data: { data: [] } })),
          api.get('/leave').catch(() => ({ data: { data: [] } })),
        ])
        if (cancelled) return
        setData(dash.data?.data || {})
        setAttendance(asList(att.data?.data ?? att.data))
        setLeaves(asList(leaveRes.data?.data ?? leaveRes.data))

        if (hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'AUDITOR')) {
          const rec = await api.get('/recruitment').catch(() => ({ data: { data: [] } }))
          if (!cancelled) setCandidates(asList(rec.data?.data ?? rec.data))
        }
      } catch (err) {
        toast(getErrorMessage(err, 'Failed to load dashboard'), 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hasRole])

  const attendanceTrend = useMemo(() => {
    const map = {}
    attendance.forEach((r) => {
      const key = new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      if (!map[key]) map[key] = { day: key, present: 0, absent: 0, late: 0 }
      if (['Present', 'Half Day'].includes(r.status)) map[key].present += 1
      else if (r.status === 'Late') map[key].late += 1
      else if (r.status === 'Absent') map[key].absent += 1
    })
    return Object.values(map).slice(-14)
  }, [attendance])

  const leaveSummary = useMemo(() => {
    const map = {}
    leaves.forEach((l) => {
      const k = l.status || 'Unknown'
      map[k] = (map[k] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [leaves])

  const funnel = useMemo(() => {
    const order = ['Applied', 'Screening', 'Technical', 'HR Interview', 'Offer', 'Accepted', 'Joined']
    const map = {}
    candidates.forEach((c) => {
      map[c.status] = (map[c.status] || 0) + 1
    })
    return order.filter((s) => map[s]).map((s) => ({ stage: s, count: map[s] }))
  }, [candidates])

  if (loading) return <Loading label="Loading dashboard…" />

  const counts = data?.counts || {}
  const name = user?.employee?.personal?.firstName || user?.email?.split('@')[0] || 'there'

  return (
    <div className="animate-slide">
      <div className="mb-24">
        <h2 style={{ fontSize: 26, marginBottom: 4 }}>Welcome back, {name}</h2>
        <p className="text-muted">Here is what is happening across your workforce today.</p>
      </div>

      <div className="stat-grid">
        <StatCard label="Employees" value={counts.employees ?? 0} icon={Users} tone="teal" delay={0} />
        <StatCard label="Present today" value={counts.presentToday ?? 0} icon={Clock} tone="green" delay={40} />
        <StatCard label="Pending leaves" value={counts.pendingLeaves ?? 0} icon={CalendarDays} tone="amber" delay={80} />
        <StatCard label="Open tickets" value={counts.openTickets ?? 0} icon={Ticket} tone="rose" delay={120} />
        <StatCard label="Active projects" value={counts.activeProjects ?? 0} icon={FolderKanban} tone="blue" delay={160} />
        <StatCard label="Departments" value={counts.departments ?? 0} icon={Building2} tone="slate" delay={200} />
        {counts.activeCandidates != null && (
          <StatCard label="Candidates" value={counts.activeCandidates} icon={UserPlus} tone="teal" delay={240} />
        )}
        {counts.assetsAssigned != null && (
          <StatCard label="Assets assigned" value={counts.assetsAssigned} icon={Laptop} tone="blue" delay={280} />
        )}
      </div>

      <div className="chart-grid">
        <div className="chart-box">
          <h3>Attendance trend</h3>
          {attendanceTrend.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="present" fill="#0F766E" radius={[4, 4, 0, 0]} />
                <Bar dataKey="late" fill="#D97706" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#DC2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">No attendance data yet.</p>
          )}
        </div>

        <div className="chart-box">
          <h3>Leave summary</h3>
          {leaveSummary.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={leaveSummary} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {leaveSummary.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">No leave records yet.</p>
          )}
        </div>

        {funnel.length > 0 && (
          <div className="chart-box">
            <h3>Recruitment funnel</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="stage" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#14B8A6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Quick actions</h3>
          </div>
          <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
            <Link to="/attendance" className="btn btn-primary btn-sm">Clock in / out</Link>
            <Link to="/leave" className="btn btn-secondary btn-sm">Apply leave</Link>
            <Link to="/helpdesk" className="btn btn-secondary btn-sm">Raise ticket</Link>
            {hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER') && (
              <Link to="/employees" className="btn btn-secondary btn-sm">Manage employees</Link>
            )}
            {hasRole('SUPER_ADMIN', 'ORG_ADMIN', 'FINANCE', 'HR_MANAGER') && (
              <Link to="/payroll" className="btn btn-secondary btn-sm">Payroll</Link>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Recent payroll</h3>
          </div>
          {(data?.recentPayrolls || []).length === 0 ? (
            <p className="text-muted text-sm">No recent payslips.</p>
          ) : (
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data.recentPayrolls || []).slice(0, 5).map((p) => (
                <li key={p._id} className="flex-between text-sm">
                  <span>
                    {empName(p.employee)} · {p.month}/{p.year}
                  </span>
                  <strong>{formatMoney(p.netSalary ?? p.components?.net)}</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
