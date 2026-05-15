import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import api from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [status, setStatus]   = useState('idle')   // idle | loading | sent | error
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return setError('Please enter your email address')
    setError('')
    setStatus('loading')
    try {
      const response = await api.post('/auth/forgot-password', { email })
      
      console.log('Forgot password response:', response.data)
      
      setStatus('sent')
    } catch (err) {
      console.log('Forgot password error:', err.response?.data)
      
      const errorMessage = err.response?.data?.message || 'Something went wrong. Please try again.'
      setError(errorMessage)
      setStatus('error')
    }
  }

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
        width: '100%', maxWidth: '420px',
        padding: '40px 36px',
      }}>

        {/* Back link */}
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '13px', color: '#595959', textDecoration: 'none',
          marginBottom: '28px', transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#2557A7'}
          onMouseLeave={e => e.currentTarget.style.color = '#595959'}
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>

        {status === 'sent' ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: '#E7F5E8', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle size={32} color="#137333" />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#1A1A2E', margin: '0 0 10px' }}>
              Check your inbox
            </h1>
            <p style={{ fontSize: '14px', color: '#595959', lineHeight: 1.6, margin: '0 0 8px' }}>
              We sent a password reset link to
            </p>
            <p style={{ fontSize: '14px', fontWeight: '700', color: '#2557A7', margin: '0 0 24px' }}>
              {email}
            </p>
            <p style={{ fontSize: '13px', color: '#767676', lineHeight: 1.6, margin: '0 0 28px' }}>
              The link expires in <strong>15 minutes</strong>. Check your spam folder if you don't see it.
            </p>
            <button
              onClick={() => { setStatus('idle'); setEmail('') }}
              style={{
                width: '100%', height: '44px', backgroundColor: 'white',
                border: '1px solid #E4E2E0', borderRadius: '8px',
                fontSize: '14px', color: '#595959', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2557A7'; e.currentTarget.style.color = '#2557A7' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E2E0'; e.currentTarget.style.color = '#595959' }}
            >
              Try a different email
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Icon */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '12px',
              backgroundColor: '#EDF3FC', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
            }}>
              <Mail size={24} color="#2557A7" />
            </div>

            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A2E', margin: '0 0 8px' }}>
              Forgot your password?
            </h1>
            <p style={{ fontSize: '14px', color: '#595959', lineHeight: 1.6, margin: '0 0 28px' }}>
              No worries. Enter your email and we'll send you a reset link.
            </p>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 14px', backgroundColor: '#FEECEA',
                border: '1px solid #F5C6C2', borderRadius: '8px',
                marginBottom: '16px', fontSize: '13px', color: '#D93025',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2D2D2D', marginBottom: '6px' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  autoFocus
                  style={{
                    width: '100%', height: '48px', padding: '0 14px',
                    border: `1px solid ${error ? '#D93025' : '#D4D2D0'}`,
                    borderRadius: '8px', fontSize: '15px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.15s, box-shadow 0.15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#2557A7'; e.target.style.boxShadow = '0 0 0 3px rgba(37,87,167,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = error ? '#D93025' : '#D4D2D0'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%', height: '48px',
                  backgroundColor: status === 'loading' ? '#6B8EC7' : '#2557A7',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '15px', fontWeight: '600', cursor: status === 'loading' ? 'wait' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = '#1D4589' }}
                onMouseLeave={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = '#2557A7' }}
              >
                {status === 'loading' ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending link…</>
                ) : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
