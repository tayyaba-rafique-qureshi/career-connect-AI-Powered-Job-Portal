import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, BriefcaseBusiness, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { loginUser, registerUser } from '../../services/authService'

export default function EmployerAuthModal({ onClose }) {
  const { login, register, logout, user } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab]         = useState('login')   // 'login' | 'register'
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // Login form
  const [loginForm, setLoginForm]   = useState({ email: '', password: '' })
  const [showLoginPw, setShowLoginPw] = useState(false)

  // Register form
  const [regForm, setRegForm]     = useState({ name: '', email: '', password: '', confirm: '' })
  const [showRegPw, setShowRegPw] = useState(false)
  const [showRegCf, setShowRegCf] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!loginForm.email || !loginForm.password) return setError('Please fill in all fields')
    setLoading(true)
    try {
      const data = await login(loginForm.email, loginForm.password)
      onClose()
      const role = data.user.role
      if (!data.user.onboardingComplete) {
        navigate('/onboarding/employer', { replace: true })
      } else if (['employer', 'recruiter'].includes(role)) {
        navigate('/dashboard/recruiter', { replace: true })
      } else {
        // Logged in but not an employer role
        setError('This account is not registered as an employer.')
        logout()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!regForm.name || !regForm.email || !regForm.password) return setError('Please fill in all fields')
    if (regForm.password.length < 6) return setError('Password must be at least 6 characters')
    if (!/[A-Z]/.test(regForm.password)) return setError('Password must contain at least one uppercase letter')
    if (!/[0-9]/.test(regForm.password)) return setError('Password must contain at least one number')
    if (regForm.password !== regForm.confirm) return setError('Passwords do not match')

    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(regForm.email)) return setError('Please enter a valid email address')

    setLoading(true)
    try {
      await register({ name: regForm.name, email: regForm.email, password: regForm.password, role: 'employer' })
      onClose()
      navigate('/onboarding/employer', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = () => {
    logout()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 200 }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: '420px',
        backgroundColor: '#fff',
        borderRadius: '16px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        zIndex: 201,
        overflow: 'hidden',
        fontFamily: '"Noto Sans", Arial, sans-serif',
      }}>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1A1A2E 0%, #2557A7 100%)',
          padding: '22px 22px 18px',
          color: 'white',
          position: 'relative',
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer',
            color: 'white', borderRadius: '6px', padding: '4px',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BriefcaseBusiness size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', opacity: 0.75, fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                CareerConnect
              </p>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>For Employers</h2>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.85 }}>
            Post jobs and find the best candidates with AI-powered matching.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          {[['login', 'Sign In'], ['register', 'Create Account']].map(([id, label]) => (
            <button key={id} onClick={() => { setTab(id); setError('') }} style={{
              flex: 1, padding: '11px 0', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: tab === id ? '700' : '500',
              color: tab === id ? '#2557A7' : '#595959',
              borderBottom: tab === id ? '2px solid #2557A7' : '2px solid transparent',
              background: 'none', fontFamily: 'inherit', transition: 'color 0.15s',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div style={{ padding: '20px 22px' }}>
          {error && (
            <div style={{
              marginBottom: '14px', padding: '10px 13px',
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '7px', fontSize: '13px', color: '#b91c1c',
            }}>
              {error}
            </div>
          )}

          {/* ── Login tab ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="email" value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="employer@company.com" required
                    style={{
                      width: '100%', height: '42px', paddingLeft: '36px', paddingRight: '12px',
                      border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type={showLoginPw ? 'text' : 'password'} value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Your password" required
                    style={{
                      width: '100%', height: '42px', paddingLeft: '36px', paddingRight: '40px',
                      border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  <button type="button" onClick={() => setShowLoginPw(v => !v)} style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280',
                    display: 'flex', alignItems: 'center',
                  }}>
                    {showLoginPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', height: '42px', backgroundColor: loading ? '#6b9de0' : '#2557A7',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '700', cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                transition: 'background 0.15s',
              }}>
                {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Signing in…' : 'Sign In as Employer'}
              </button>
            </form>
          )}

          {/* ── Register tab ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="text" value={regForm.name}
                    onChange={e => setRegForm({ ...regForm, name: e.target.value })}
                    placeholder="Your full name" required
                    style={{
                      width: '100%', height: '42px', paddingLeft: '36px', paddingRight: '12px',
                      border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Work Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type="email" value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="you@company.com" required
                    style={{
                      width: '100%', height: '42px', paddingLeft: '36px', paddingRight: '12px',
                      border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type={showRegPw ? 'text' : 'password'} value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Min 6 chars, 1 uppercase, 1 number" required
                    style={{
                      width: '100%', height: '42px', paddingLeft: '36px', paddingRight: '40px',
                      border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  <button type="button" onClick={() => setShowRegPw(v => !v)} style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280',
                    display: 'flex', alignItems: 'center',
                  }}>
                    {showRegPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '5px' }}>Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input
                    type={showRegCf ? 'text' : 'password'} value={regForm.confirm}
                    onChange={e => setRegForm({ ...regForm, confirm: e.target.value })}
                    placeholder="Repeat password" required
                    style={{
                      width: '100%', height: '42px', paddingLeft: '36px', paddingRight: '40px',
                      border: `1px solid ${regForm.confirm && regForm.confirm !== regForm.password ? '#fca5a5' : '#d1d5db'}`,
                      borderRadius: '8px', fontSize: '14px',
                      outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                  <button type="button" onClick={() => setShowRegCf(v => !v)} style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280',
                    display: 'flex', alignItems: 'center',
                  }}>
                    {showRegCf ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{
                width: '100%', height: '42px', backgroundColor: loading ? '#6b9de0' : '#2557A7',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '14px', fontWeight: '700', cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                transition: 'background 0.15s',
              }}>
                {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Creating account…' : 'Create Employer Account'}
              </button>
            </form>
          )}
        </div>

        {/* Sign out divider (only when a user is already logged in) */}
        {user && (
          <div style={{
            padding: '0 22px 18px',
            borderTop: '1px solid #f3f4f6',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0 12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
              <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '500' }}>currently signed in as {user.name}</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', height: '38px',
                backgroundColor: '#f9fafb',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '13px', fontWeight: '700', cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </>
  )
}
