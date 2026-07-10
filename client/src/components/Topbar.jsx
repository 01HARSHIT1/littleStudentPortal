import { Link, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Topbar({ title, onMenu, unread = 0 }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const name =
    user?.employee?.personal?.firstName ||
    user?.email?.split('@')[0] ||
    'User'
  const initials = name.slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button type="button" className="menu-toggle" onClick={onMenu} aria-label="Menu">
          <Menu size={22} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <Link to="/notifications" className="icon-btn" aria-label="Notifications">
          <Bell size={20} />
          {unread > 0 && <span className="badge-dot" />}
        </Link>
        <Link to="/profile" className="user-chip">
          <span className="avatar">{initials}</span>
          <span className="user-meta">
            <span className="name">{name}</span>
            <span className="role">{user?.role?.replace(/_/g, ' ')}</span>
          </span>
        </Link>
        <button type="button" className="icon-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
