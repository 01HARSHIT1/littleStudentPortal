import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import AIAssistant from './AIAssistant'
import api from '../api/axios'

const TITLES = {
  '/': 'Dashboard',
  '/employees': 'Employees',
  '/organization': 'Organization',
  '/recruitment': 'Recruitment',
  '/attendance': 'Attendance',
  '/leave': 'Leave',
  '/payroll': 'Payroll',
  '/performance': 'Performance',
  '/projects': 'Projects',
  '/assets': 'Assets',
  '/helpdesk': 'Help Desk',
  '/documents': 'Documents',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const location = useLocation()

  const title =
    TITLES[location.pathname] ||
    (location.pathname.startsWith('/employees/') ? 'Employee Detail' : 'GPro')

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    api
      .get('/notifications')
      .then((res) => {
        if (cancelled) return
        const list = res.data?.data || res.data || []
        const items = Array.isArray(list) ? list : list.notifications || []
        setUnread(items.filter((n) => !n.isRead && !n.read).length)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  return (
    <div className="app-shell">
      <div className="layout">
        <div
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="main-area">
          <Topbar title={title} onMenu={() => setSidebarOpen(true)} unread={unread} />
          <main className="page-content">
            <Outlet />
          </main>
        </div>
      </div>
      <AIAssistant />
    </div>
  )
}
