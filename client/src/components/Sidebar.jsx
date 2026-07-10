import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  UserPlus,
  Clock,
  CalendarDays,
  Wallet,
  Target,
  FolderKanban,
  Laptop,
  HeadphonesIcon,
  FileText,
  BarChart3,
  Bell,
  UserCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  {
    to: '/employees',
    label: 'Employees',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'TEAM_LEAD', 'FINANCE', 'AUDITOR'],
  },
  {
    to: '/organization',
    label: 'Organization',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER'],
  },
  {
    to: '/recruitment',
    label: 'Recruitment',
    icon: UserPlus,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'AUDITOR'],
  },
  { to: '/attendance', label: 'Attendance', icon: Clock, roles: null },
  { to: '/leave', label: 'Leave', icon: CalendarDays, roles: null },
  {
    to: '/payroll',
    label: 'Payroll',
    icon: Wallet,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'FINANCE', 'EMPLOYEE', 'AUDITOR', 'MANAGER', 'TEAM_LEAD'],
  },
  { to: '/performance', label: 'Performance', icon: Target, roles: null },
  { to: '/projects', label: 'Projects', icon: FolderKanban, roles: null },
  {
    to: '/assets',
    label: 'Assets',
    icon: Laptop,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'IT_ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'MANAGER', 'TEAM_LEAD'],
  },
  { to: '/helpdesk', label: 'Help Desk', icon: HeadphonesIcon, roles: null },
  { to: '/documents', label: 'Documents', icon: FileText, roles: null },
  {
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: ['SUPER_ADMIN', 'ORG_ADMIN', 'HR_MANAGER', 'MANAGER', 'FINANCE', 'AUDITOR', 'IT_ADMIN', 'TEAM_LEAD'],
  },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: null },
  { to: '/profile', label: 'Profile', icon: UserCircle, roles: null },
]

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth()
  const role = user?.role

  const items = NAV.filter((item) => !item.roles || item.roles.includes(role))

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="logo-mark">G</div>
        <div>
          <div className="brand-text">GPro</div>
          <div className="brand-sub">Workforce Platform</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user?.organization?.name || 'Enterprise HR'} · {role?.replace(/_/g, ' ')}
      </div>
    </aside>
  )
}
