import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import { ToastHost } from './components/Toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Organization from './pages/Organization'
import Recruitment from './pages/Recruitment'
import Attendance from './pages/Attendance'
import Leave from './pages/Leave'
import Payroll from './pages/Payroll'
import Performance from './pages/Performance'
import Projects from './pages/Projects'
import Assets from './pages/Assets'
import HelpDesk from './pages/HelpDesk'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'

function PublicOnly({ children }) {
  const { user } = useAuth()
  if (user && localStorage.getItem('accessToken')) {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <>
      <ToastHost />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="employees/:id" element={<EmployeeDetail />} />
            <Route path="organization" element={<Organization />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="performance" element={<Performance />} />
            <Route path="projects" element={<Projects />} />
            <Route path="assets" element={<Assets />} />
            <Route path="helpdesk" element={<HelpDesk />} />
            <Route path="documents" element={<Documents />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
