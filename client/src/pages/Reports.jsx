import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
import { asList, formatMoney } from '../utils/helpers'
import { BarChart3, Clock, Users, Wallet } from 'lucide-react'

const COLORS = ['#0F766E', '#14B8A6', '#0284C7', '#D97706', '#64748B', '#DC2626']

export default function Reports() {
  const [dash, setDash] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [leaves, setLeaves] = useState([])
  const [payroll, setPayroll] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [d, a, l, p] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get('/reports/attendance').catch(() => api.get('/attendance')),
          api.get('/reports/leave').catch(() => api.get('/leave')),
          api.get('/reports/payroll').catch(() => api.get('/payroll')),
        ])
        if (cancelled) return
        setDash(d.data?.data || {})
        const attData = a.data?.data
        setAttendance(asList(attData?.records ?? attData ?? a.data))
        const leaveData = l.data?.data
        setLeaves(asList(leaveData?.leaves ?? leaveData ?? l.data))
        const payData = p.data?.data
        setPayroll(asList(payData?.payrolls ?? payData ?? p.data))
      } catch (err) {
        toast(getErrorMessage(err), 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const attByStatus = useMemo(() => {
    const map = {}
    attendance.forEach((r) => {
      const s = r.status || 'Unknown'
      map[s] = (map[s] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [attendance])

  const leaveByType = useMemo(() => {
    const map = {}
    leaves.forEach((r) => {
      const t = r.leaveType || 'other'
      map[t] = (map[t] || 0) + (r.days || 1)
    })
    return Object.entries(map).map(([type, days]) => ({ type, days }))
  }, [leaves])

  const payrollTrend = useMemo(() => {
    const map = {}
    payroll.forEach((r) => {
      const key = `${r.year}-${String(r.month).padStart(2, '0')}`
      if (!map[key]) map[key] = { period: key, total: 0, count: 0 }
      map[key].total += Number(r.netSalary ?? r.components?.net ?? 0)
      map[key].count += 1
    })
    return Object.values(map).sort((a, b) => a.period.localeCompare(b.period)).slice(-8)
  }, [payroll])

  if (loading) return <Loading label="Loading reports…" />

  const counts = dash?.counts || {}

  return (
    <div className="animate-slide">
      <div className="stat-grid">
        <StatCard label="Workforce" value={counts.employees ?? 0} icon={Users} tone="teal" />
        <StatCard label="Present today" value={counts.presentToday ?? 0} icon={Clock} tone="green" />
        <StatCard label="Active projects" value={counts.activeProjects ?? 0} icon={BarChart3} tone="blue" />
        <StatCard
          label="Payroll records"
          value={payroll.length}
          icon={Wallet}
          tone="amber"
        />
      </div>

      <div className="chart-grid">
        <div className="chart-box">
          <h3>Attendance by status</h3>
          {attByStatus.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={attByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                  {attByStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">No attendance report data.</p>
          )}
        </div>

        <div className="chart-box">
          <h3>Leave days by type</h3>
          {leaveByType.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={leaveByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="days" fill="#0F766E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">No leave report data.</p>
          )}
        </div>

        <div className="chart-box" style={{ gridColumn: '1 / -1' }}>
          <h3>Payroll net trend</h3>
          {payrollTrend.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <Tooltip formatter={(v) => formatMoney(v)} />
                <Line type="monotone" dataKey="total" stroke="#0F766E" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm">No payroll report data.</p>
          )}
        </div>
      </div>
    </div>
  )
}
