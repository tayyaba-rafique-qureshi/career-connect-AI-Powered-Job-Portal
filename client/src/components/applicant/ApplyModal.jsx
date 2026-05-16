import { useEffect, useState } from 'react'
import { X, FileText, CheckCircle, XCircle, Upload } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { applyToJob } from '../../services/applicationService'
import { useAuth } from '../../context/AuthContext'
import ResumeChangeModal from './ResumeChangeModal'

function CircularScore({ score }) {
  const size = 120, stroke = 9
  const radius = (size - stroke) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const tier =
    score >= 80 ? { ring: '#22C55E', fill: 'var(--cc-green-bg)', text: 'var(--cc-green)', label: "You're a strong match!" }
    : score >= 60 ? { ring: '#F59E0B', fill: 'var(--cc-amber-bg)', text: 'var(--cc-amber)', label: "You're a good match!" }
    : { ring: 'var(--cc-text-3)', fill: 'var(--cc-surface-2)', text: 'var(--cc-text-2)', label: 'Partial match' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx={size/2} cy={size/2} r={radius} fill={tier.fill} stroke="var(--cc-border)" strokeWidth={stroke} />
        </svg>
        <svg width={size} height={size} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={tier.ring} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '26px', fontWeight: '800', color: tier.text, lineHeight: 1 }}>{score}%</span>
          <span style={{ fontSize: '10px', fontWeight: '600', color: tier.text, letterSpacing: '0.05em', marginTop: '2px' }}>MATCH</span>
        </div>
      </div>
      <span style={{ fontSize: '13px', fontWeight: '700', color: tier.text }}>{tier.label}</span>
    </div>
  )
}

function SkillRow({ skill, matched }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
      {matched
        ? <CheckCircle size={15} style={{ color: 'var(--cc-green)', flexShrink: 0 }} />
        : <XCircle    size={15} style={{ color: 'var(--cc-red)',   flexShrink: 0 }} />
      }
      <span style={{ fontSize: '13px', color: 'var(--cc-text-2)' }}>{skill}</span>
    </div>
  )
}

export default function ApplyModal({ job, matchData, onClose, onSuccess, onNoResume }) {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [coverLetter, setCoverLetter] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [showResumeChange, setShowResumeChange] = useState(false)
  const [resumeName, setResumeName]   = useState(user?.applicantProfile?.resume?.fileName || null)

  useEffect(() => { setResumeName(user?.applicantProfile?.resume?.fileName || null) }, [user])
  useEffect(() => {
    refreshUser?.().then(f => { if (f?.applicantProfile?.resume?.fileName) setResumeName(f.applicantProfile.resume.fileName) }).catch(() => {})
  }, [])

  const score        = matchData?.matchScore ?? matchData?.resumeScore ?? null
  const matched      = matchData?.skillsMatched || []
  const missing      = matchData?.skillsMissing || []
  const hasSkillData = matched.length > 0 || missing.length > 0

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try { await applyToJob(job._id, coverLetter); onSuccess() }
    catch (err) { setError(err.response?.data?.message || 'Failed to submit application') }
    finally { setLoading(false) }
  }

  const handleCareerConnectResume = () => {
    if (resumeName) { handleSubmit() }
    else { onClose(); if (onNoResume) onNoResume(); else navigate('/profile?tab=resume') }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--cc-overlay)' }} onClick={onClose} />

        <div style={{
          position: 'relative', zIndex: 10,
          backgroundColor: 'var(--cc-surface)', borderRadius: '16px',
          boxShadow: 'var(--cc-shadow-lg)',
          width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
          fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
          border: '1px solid var(--cc-border)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid var(--cc-border)' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: 'var(--cc-text-1)' }}>Apply to {job.title}</h2>
              <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--cc-text-3)' }}>{job.company} · {job.location}</p>
            </div>
            <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: 'none', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--cc-text-3)', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            ><X size={20} /></button>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* AI Match */}
            {score != null && (
              <div style={{ backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <CircularScore score={Math.round(score)} />
                </div>
                {hasSkillData && (
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {matched.length > 0 && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: 'var(--cc-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills matched ({matched.length})</p>
                        <div style={{ backgroundColor: 'var(--cc-green-bg)', borderRadius: '8px', padding: '8px 10px', maxHeight: '140px', overflowY: 'auto' }}>
                          {matched.map(s => <SkillRow key={s} skill={s} matched />)}
                        </div>
                      </div>
                    )}
                    {missing.length > 0 && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: '700', color: 'var(--cc-red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Missing skills ({missing.length})</p>
                        <div style={{ backgroundColor: 'var(--cc-red-bg)', borderRadius: '8px', padding: '8px 10px', maxHeight: '140px', overflowY: 'auto' }}>
                          {missing.map(s => <SkillRow key={s} skill={s} matched={false} />)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Resume */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)' }}>Resume</label>
                {resumeName && (
                  <button type="button" onClick={() => setShowResumeChange(true)}
                    style={{ fontSize: '13px', color: 'var(--cc-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: '600' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  >Change</button>
                )}
              </div>
              {resumeName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', border: '1px solid var(--cc-green-border)', borderRadius: '8px', backgroundColor: 'var(--cc-green-bg)' }}>
                  <FileText size={18} style={{ color: 'var(--cc-blue)', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', color: 'var(--cc-text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resumeName}</span>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--cc-green)', backgroundColor: 'rgba(74,222,128,0.15)', padding: '2px 8px', borderRadius: '999px' }}>Active</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--cc-amber-bg)', borderRadius: '8px', backgroundColor: 'var(--cc-amber-bg)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--cc-amber)' }}>⚠ No resume on file</span>
                  <button type="button" onClick={() => setShowResumeChange(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--cc-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: '600' }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                  ><Upload size={13} /> Upload now</button>
                </div>
              )}
              <button type="button" onClick={handleCareerConnectResume} disabled={loading}
                style={{ marginTop: '10px', width: '100%', padding: '10px', backgroundColor: resumeName ? 'var(--cc-blue-light)' : 'var(--cc-surface-2)', border: `1px solid ${resumeName ? 'var(--cc-blue-border)' : 'var(--cc-border)'}`, borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: resumeName ? 'var(--cc-blue)' : 'var(--cc-text-3)', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.15s' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--cc-surface-2)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = resumeName ? 'var(--cc-blue-light)' : 'var(--cc-surface-2)' }}
              >
                <FileText size={15} />
                {resumeName ? 'Apply with CareerCONNECT Resume' : 'Build your CareerCONNECT resume first →'}
              </button>
            </div>

            {/* Cover letter */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '6px' }}>
                Cover letter <span style={{ fontSize: '13px', fontWeight: '400', color: 'var(--cc-text-3)' }}>(optional)</span>
              </label>
              <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} maxLength={500}
                placeholder="Tell the employer why you're a great fit for this role..."
                style={{ width: '100%', height: '110px', padding: '10px 12px', border: '1px solid var(--cc-input-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--cc-text-1)', backgroundColor: 'var(--cc-input-bg)', resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => e.target.style.borderColor = 'var(--cc-blue)'}
                onBlur={e => e.target.style.borderColor = 'var(--cc-input-border)'}
              />
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: coverLetter.length > 450 ? 'var(--cc-red)' : 'var(--cc-text-3)', textAlign: 'right' }}>{coverLetter.length}/500</p>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: 'var(--cc-red-bg)', border: '1px solid var(--cc-red)', fontSize: '13px', color: 'var(--cc-red)' }}>{error}</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid var(--cc-border)', gap: '12px' }}>
            <button onClick={onClose}
              style={{ padding: '9px 20px', border: '1px solid var(--cc-border)', borderRadius: '8px', backgroundColor: 'var(--cc-surface)', color: 'var(--cc-text-2)', fontSize: '14px', fontWeight: '500', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-surface)'}
            >Cancel</button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ flex: 1, padding: '9px 20px', backgroundColor: loading ? 'var(--cc-text-3)' : 'var(--cc-blue)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--cc-blue-hover)' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = 'var(--cc-blue)' }}
            >{loading ? 'Submitting…' : 'Submit Application'}</button>
          </div>
        </div>
      </div>

      {showResumeChange && (
        <ResumeChangeModal onClose={() => setShowResumeChange(false)} onSuccess={u => { setResumeName(u?.applicantProfile?.resume?.fileName || resumeName); setShowResumeChange(false) }} />
      )}
    </>
  )
}
