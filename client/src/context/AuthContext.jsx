import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import api, { getErrorMessage } from '../api/axios'

const AuthContext = createContext(null)

const readUser = () => {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      const payload = data.data
      localStorage.setItem('accessToken', payload.accessToken)
      localStorage.setItem('refreshToken', payload.refreshToken)
      localStorage.setItem('user', JSON.stringify(payload.user))
      setUser(payload.user)
      return { ok: true }
    } catch (err) {
      return { ok: false, message: getErrorMessage(err, 'Login failed') }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      /* ignore */
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  const updateUser = useCallback((next) => {
    setUser(next)
    localStorage.setItem('user', JSON.stringify(next))
  }, [])

  const hasRole = useCallback(
    (...roles) => {
      if (!user?.role) return false
      return roles.includes(user.role)
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user && localStorage.getItem('accessToken')),
      login,
      logout,
      updateUser,
      hasRole,
    }),
    [user, loading, login, logout, updateUser, hasRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
