import { useState } from 'react'
import { X, Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react'
import api from '../../services/api'

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

function Req({ met, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
      {met ? <CheckCircle size={12} color="#137333" /> : <XCircle size={12} color="#D4D2D0" />}
      <span style={{ fontSize: '12px', color: met ? '#137333' : '#767676' }}>{text}</span>
    </div>
  )
}

function PwInput({ label, value, onChange, show, onToggle, placeholder, error }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#2D2D2D', marginBottom: '5px' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%', height: '44px', padding: '0 40px 0 12px',
            border: `1px solid ${error ? '#D93025' : '#D4D2D0'}`,
            borderRadius: '8px', fontSize: '14px', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = '#2557A7'; e.target.style.boxShadow = '0 0 0 3px rgba(37,87,167,0.1)' }}
          onBlur={e => { e.target.style.borderColor = error ? '#D93025' : '#D4D2D0'; e.target.style.boxShadow = 'none' }}
        />
        <button type="button" onClick={onToggle} style={{
          position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: '#767676', padding: 0,
        }}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p style={{ fontSize: '12px', color: '#D93025', margin: '4px 0 0' }}>{error}</p>}
    </div>
  )
}

export default function ChangePasswordModal({ onClose }) {
  const [current, setCurrent]   = useState('')
  const [newPw, setNewPw]       = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showCur, setShowCur]   = useState(false)
  const [showNew, setShowNew]   = useState(false)
  const [showCon, setShowCon]   = useState(false)
  const [errors, setErrors]     = useState({})
  const [status, setStatus]     = useState('idle')  // idle | loading | success
  const [apiError, setApiError] = useState('')

  const strength = getStrength(newPw)

  const reqs = {
    length: newPw.length >= 6,
    upper:  /[A-Z]/.test(newPw),
    number: /[0-9]/.test(newPw),
    match:  newPw === confirm && confirm.length > 0,
    diff:   newPw !== current || !current,
  }

  const validate = () => {
    const e = {}
    if (!current) e.current = 'Current password is required'
    if (!newPw)   e.newPw   = 'New password is required'
    else if (!reqs.length) e.newPw = 'Must be at least 6 characters'
    else if (!reqs.diff)   e.newPw = 'New password must differ from current'
    if (!confirm)          e.confirm = 'Please confirm your new password'
    else if (!reqs.match)  e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setErrors({})
    setApiError('')
    setStatus('loading')
    try {
      await api.patch('/auth/change-password', { currentPassword: current, newPassword: newPw })
      setStatus('success')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to change password')
      setStatus('idle')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      backgroundColor: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        backgroundColor: 'white', borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        width: '100%', maxWidth: '420px',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #F0F0F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: '#EDF3FC', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={18} color="#2557A7" />
            </div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A2E', margin: 0 }}>
              Change Password
            </h2>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#767676', padding: '4px', borderRadius: '6px',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F0F0F0'; e.currentTarget.style.color = '#1A1A2E' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#767676' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {status === 'success' ? (
            /* ── Success state ── */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                backgroundColor: '#E7F5E8', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <ShieldCheck size={28} color="#137333" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A2E', margin: '0 0 8px' }}>
                Password updated!
              </h3>
              <p style={{ fontSize: '14px', color: '#595959', margin: '0 0 24px', lineHeight: 1.6 }}>
                Your password has been changed successfully.
              </p>
              <button onClick={onClose} style={{
                padding: '10px 28px', backgroundColor: '#2557A7', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {apiError && (
                <div style={{
                  padding: '10px 14px', backgroundColor: '#FEECEA',
                  border: '1px solid #F5C6C2', borderRadius: '8px',
                  marginBottom: '16px', fontSize: '13px', color: '#D93025',
                }}>
                  ⚠ {apiError}
                </div>
              )}

              <PwInput
                label="Current password"
                value={current}
                onChange={e => { setCurrent(e.target.value); setErrors(p => ({ ...p, current: '' })) }}
                show={showCur} onToggle={() => setShowCur(!showCur)}
                placeholder="Your current password"
                error={errors.current}
              />

              <PwInput
                label="New password"
                value={newPw}
                onChange={e => { setNewPw(e.target.value); setErrors(p => ({ ...p, newPw: '' })) }}
                show={showNew} onToggle={() => setShowNew(!showNew)}
                placeholder="Min 6 characters"
                error={errors.newPw}
              />

              {/* Strength bar */}
              {newPw && (
                <div style={{ marginTop: '-8px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        backgroundColor: i <= strength.score ? strength.color : '#E4E2E0',
                        transition: 'background-color 0.3s',
                      }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: strength.color, fontWeight: '600', margin: 0 }}>
                    {strength.label}
                  </p>
                </div>
              )}

              <PwInput
                label="Confirm new password"
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })) }}
                show={showCon} onToggle={() => setShowCon(!showCon)}
                placeholder="Repeat new password"
                error={errors.confirm}
              />

              {/* Requirements */}
              {newPw && (
                <div style={{
                  padding: '10px 12px', backgroundColor: '#F7F9FC',
                  border: '1px solid #E4E2E0', borderRadius: '8px', marginBottom: '20px',
                }}>
                  <Req met={reqs.length} text="At least 6 characters" />
                  <Req met={reqs.upper}  text="One uppercase letter" />
                  <Req met={reqs.number} text="One number" />
                  <Req met={reqs.diff}   text="Different from current password" />
                  {confirm && <Req met={reqs.match} text="Passwords match" />}
                </div>
              )}

              {/* Footer */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={onClose} style={{
                  padding: '10px 20px', border: '1px solid #E4E2E0', borderRadius: '8px',
                  fontSize: '14px', color: '#595959', background: 'white',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2557A7'; e.currentTarget.style.color = '#2557A7' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E2E0'; e.currentTarget.style.color = '#595959' }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={status === 'loading'} style={{
                  padding: '10px 24px',
                  backgroundColor: status === 'loading' ? '#6B8EC7' : '#2557A7',
                  color: 'white', border: 'none', borderRadius: '8px',
                  fontSize: '14px', fontWeight: '600',
                  cursor: status === 'loading' ? 'wait' : 'pointer',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = '#1D4589' }}
                  onMouseLeave={e => { if (status !== 'loading') e.currentTarget.style.backgroundColor = '#2557A7' }}
                >
                  {status === 'loading'
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                    : 'Update Password'
                  }
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
