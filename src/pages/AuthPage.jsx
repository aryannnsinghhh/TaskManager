import { useState } from 'react'

const MIN_PW = 8

const EyeIcon = ({ open }) =>
  open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const features = [
  { title: 'Organisation-scoped roles', desc: 'Admin or member per workspace — never global.' },
  { title: 'Project access gates', desc: 'Request, approve, reject — full audit trail.' },
  { title: 'Task safety', desc: 'Only approved members can be assigned tasks.' },
]

export default function AuthPage({ onLogin, onSignup }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const switchMode = (next) => {
    setMode(next)
    setErrors({})
    setServerError('')
    setSuccess(false)
    setName('')
    setEmail('')
    setPassword('')
  }

  const validate = () => {
    const e = {}
    if (mode === 'signup' && !name.trim()) e.name = 'Full name is required.'
    if (!email.trim()) {
      e.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = 'Enter a valid email address.'
    }
    if (!password) {
      e.password = 'Password is required.'
    } else if (mode === 'signup' && password.length < MIN_PW) {
      e.password = `Password must be at least ${MIN_PW} characters.`
    }
    return e
  }

  const submit = async (event) => {
    event.preventDefault()
    setServerError('')
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)

    try {
      if (mode === 'signup') {
        await onSignup({ name: name.trim(), email: email.trim().toLowerCase(), password })
      } else {
        await onLogin({ email: email.trim().toLowerCase(), password })
      }
      setSuccess(true)
    } catch (err) {
      setServerError(err?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pwStrength = (() => {
    if (!password || mode === 'login') return null
    if (password.length < 6) return { level: 1, label: 'Weak', color: '#e11d48' }
    if (password.length < MIN_PW) return { level: 2, label: 'Fair', color: '#d97706' }
    if (password.length < 12) return { level: 3, label: 'Good', color: '#0f766e' }
    return { level: 4, label: 'Strong', color: '#059669' }
  })()

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="auth-brand-inner">
          <p className="auth-eyebrow">TeamTaskManager Platform</p>
          <h1 className="auth-headline">
            Workspace access that actually makes sense.
          </h1>
          <p className="auth-subtext">
            Built for real organisations where access control matters as much as execution speed.
          </p>

          <ul className="auth-features">
            {features.map((f) => (
              <li key={f.title} className="auth-feature-item">
                <div>
                  <strong>{f.title}</strong>
                  <span>{f.desc}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="auth-card-head">
            <p className="auth-card-eyebrow">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </p>
            <h2 className="auth-card-title">
              {mode === 'login' ? 'Sign in' : 'Get started'}
            </h2>
          </div>

          {serverError && (
            <div className="auth-server-error" role="alert">
              {serverError}
            </div>
          )}

          {success && (
            <div className="auth-success" role="status">
              <CheckIcon /> {mode === 'signup' ? 'Account created! Redirecting…' : 'Signed in! Redirecting…'}
            </div>
          )}

          <div className="auth-fields">
            {mode === 'signup' && (
              <div className={`auth-field ${errors.name ? 'auth-field-error' : ''}`}>
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: '' })) }}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  disabled={loading || success}
                />
                {errors.name && <span className="auth-field-msg">{errors.name}</span>}
              </div>
            )}

            <div className={`auth-field ${errors.email ? 'auth-field-error' : ''}`}>
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })) }}
                placeholder="you@company.com"
                autoComplete="email"
                disabled={loading || success}
              />
              {errors.email && <span className="auth-field-msg">{errors.email}</span>}
            </div>

            <div className={`auth-field ${errors.password ? 'auth-field-error' : ''}`}>
              <label htmlFor="auth-password">Password</label>
              <div className="auth-pw-wrap">
                <input
                  id="auth-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })) }}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  disabled={loading || success}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <EyeIcon open={showPw} />
                </button>
              </div>
              {pwStrength && (
                <div className="auth-pw-strength">
                  <div className="auth-pw-bars">
                    {[1, 2, 3, 4].map((n) => (
                      <span
                        key={n}
                        className="auth-pw-bar"
                        style={{ background: n <= pwStrength.level ? pwStrength.color : undefined }}
                      />
                    ))}
                  </div>
                  <span style={{ color: pwStrength.color }}>{pwStrength.label}</span>
                </div>
              )}
              {errors.password && <span className="auth-field-msg">{errors.password}</span>}
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading || success}
          >
            {loading ? (
              <span className="auth-spinner" aria-label="Loading" />
            ) : success ? (
              <><CheckIcon /> {mode === 'login' ? 'Signed in' : 'Account created'}</>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>

          <p className="auth-switch">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              className="auth-switch-btn"
              onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
              disabled={loading}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </form>
      </section>
    </main>
  )
}
