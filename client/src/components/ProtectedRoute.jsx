import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { user } = useAuth()
  const token = localStorage.getItem('accessToken')

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
