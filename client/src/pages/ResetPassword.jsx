import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import api from '../services/api'

// ── Password strength calculator ─────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '#E4E2E0' }
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak',   color: '#D93025' }
  if (score <= 2) return { score, label: 'Fair',   color: '#F5A623' }
  if (score <= 3) return { score, label: 'Good',   color: '#2557A7' }
  return              { score, label: 'Strong', color: '#137333' }
}

function StrengthBar({ password }) {
  const { score, label, color } = getStrength(password)
  if (!password) return null
  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: '4px', borderRadius: '2px',
            backgroundColor: i <= score ? color : '#E4E2E0',
            transition: 'background-color 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: '12px', color, fontWeight: '600', margin: 0 }}>{label}</p>
    </div>
  )
}

function Requirement({ met, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
      {met
        ? <CheckCircle size={13} color="#137333" />
        : <XCircle    size={13} color="#D4D2D0" />
      }
      <span style={{ fontSize: '12px', color: met ? '#137333' : '#767676' }}>{text}</span>
    </div>
  )
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [showCf, setShowCf]       = useState(false)
  const [status, setStatus]       = useState('idle')  // idle | loading | success | error
  const [error, setError]         = useState('')

  // Redirect if no token
  useEffect(() => {
    if (!token || !email) navigate('/forgot-password')
  }, [])

  const reqs = {
    length:  password.length >= 6,
    upper:   /[A-Z]/.test(password),
    number:  /[0-9]/.test(password),
    match:   password === confirm && confirm.length > 0,
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reqs.length) return setError('Password must be at least 6 characters')
    if (!reqs.match)  return setError('Passwords do not match')
    setError('')
    setStatus('loading')
    try {
      await api.post('/auth/reset-password', { token, email, newPassword: password })
      setStatus('success')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Reset failed. The link may have expired.'
      
      // Special handling for admin accounts or invalid requests
      if (errorMessage.toLowerCase().includes('admin') || errorMessage.toLowerCase().includes('invalid')) {
        setError('This reset link is not valid. Admin accounts cannot reset passwords through this form. Please sign in and use the admin dashboard.')
        // Redirect to login after 5 seconds
        setTimeout(() => navigate('/login'), 5000)
      } else {
        setError(errorMessage)
      }
      setStatus('error')
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', height: '48px', padding: '0 44px 0 14px',
    border: `1px solid ${hasError ? '#D93025' : '#D4D2D0'}`,
    borderRadius: '8px', fontSize: '15px', outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #EDF3FC 0%, #F7F9FC 60%, #FFFFFF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
    }}>
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #E4E2E0',
        width: '100%', maxWidth: '420px', padding: '40px 36px',
      }}>

        {status === 'success' ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#E7F5E8', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            }}>
              <CheckCircle size={32} color="#137333" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A2E', margin: '0 0 10px' }}>
              Password reset!
            </h1>
            <p style={{ fontSize: '14px', color: '#595959', lineHeight: 1.6, margin: '0 0 24px' }}>
              Your password has been updated. Redirecting you to sign in…
            </p>
            <Link to="/login" style={{
              display: 'inline-block', padding: '12px 28px',
              backgroundColor: '#2557A7', color: 'white',
              borderRadius: '8px', textDecoration: 'none',
              fontSize: '14px', fontWeight: '600',
            }}>
              Sign In Now
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              backgroundColor: '#EDF3FC', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
            }}>
              <Lock size={24} color="#2557A7" />
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A2E', margin: '0 0 6px' }}>
              Set new password
            </h1>
            <p style={{ fontSize: '13px', color: '#767676', margin: '0 0 28px' }}>
              For <strong style={{ color: '#2D2D2D' }}>{decodeURIComponent(email || '')}</strong>
            </p>

            {error && (
              <div style={{
                padding: '12px 14px', backgroundColor: '#FEECEA',
                border: '1px solid #F5C6C2', borderRadius: '8px',
                marginBottom: '16px', fontSize: '13px', color: '#D93025',
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New password */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2D2D2D', marginBottom: '6px' }}>
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    placeholder="Min 6 characters"
                    style={inputStyle(false)}
                    onFocus={e => { e.target.style.borderColor = '#2557A7'; e.target.style.boxShadow = '0 0 0 3px rgba(37,87,167,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#D4D2D0'; e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#767676', padding: 0,
                  }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <StrengthBar password={password} />
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2D2D2D', marginBottom: '6px' }}>
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCf ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                    placeholder="Repeat your password"
                    style={inputStyle(confirm.length > 0 && !reqs.match)}
                    onFocus={e => { e.target.style.borderColor = '#2557A7'; e.target.style.boxShadow = '0 0 0 3px rgba(37,87,167,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = (confirm.length > 0 && !reqs.match) ? '#D93025' : '#D4D2D0'; e.target.style.boxShadow = 'none' }}
                  />
                  <button type="button" onClick={() => setShowCf(!showCf)} style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#767676', padding: 0,
                  }}>
                    {showCf ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Requirements checklist */}
              <div style={{
                padding: '12px 14px', backgroundColor: '#F7F9FC',
                border: '1px solid #E4E2E0', borderRadius: '8px', marginBottom: '20px',
              }}>
                <Requirement met={reqs.length} text="At least 6 characters" />
                <Requirement met={reqs.upper}  text="One uppercase letter" />
                <Requirement met={reqs.number} text="One number" />
                <Requirement met={reqs.match}  text="Passwords match" />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', height: '48px',
                  backgroundColor: status === 'loading' ? '#6B8EC7' : '#2557A7',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '15px', fontWeight: '600',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = '#1D4589' }}
                onMouseLeave={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = '#2557A7' }}
              >
                {status === 'loading'
                  ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Resetting…</>
                  : 'Reset Password'
                }
              </button>
            </form>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
