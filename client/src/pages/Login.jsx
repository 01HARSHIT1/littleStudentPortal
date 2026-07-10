import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('employee@acme.com')
  const [password, setPassword] = useState('Secure@123')
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email.trim(), password)
    if (result.ok) navigate('/')
    else setError(result.message)
  }

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="login-brand">
          <div className="logo-row">
            <div className="logo-mark">G</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600 }}>
              GPro
            </span>
          </div>
          <h1>Workforce clarity for modern enterprises.</h1>
          <p>
            One platform for people, attendance, payroll, and performance — built for HR teams that
            move with purpose.
          </p>
        </div>
      </div>
      <div className="login-form-side">
        <div className="login-card">
          <h2>Sign in</h2>
          <p className="subtitle">Access your GPro workspace</p>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="email">Work email</label>
              <input
                id="email"
                className="form-control"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="form-control"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="demo-hint">
            <strong>Demo credentials</strong>
            employee@acme.com / Secure@123
            <br />
            Also try: hr@acme.com, manager@acme.com, finance@acme.com, it@acme.com, admin@acme.com
          </div>
        </div>
      </div>
    </div>
  )
}
