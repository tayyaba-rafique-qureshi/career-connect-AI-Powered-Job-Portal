/**
 * ResumeStatusCard.jsx
 * --------------------
 * Reusable card shown on the Dashboard and Profile page.
 *
 * States:
 *   loading  — fetching resume data
 *   no-resume — user has not built a CareerCONNECT resume yet → CTA
 *   has-resume — show summary + View / Download buttons
 *
 * Props:
 *   compact  — boolean (default false)
 *              true  → slim horizontal strip for dashboard sidebar
 *              false → full card for profile page
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Wand2, Eye, Download, Loader2,
  CheckCircle, User, Zap, Briefcase, Pencil, Sparkles
} from 'lucide-react'
import api from '../../services/api'
import ResumePreviewModal from './ResumePreviewModal'

// ── tiny skeleton line ────────────────────────────────────────────────────────
const Skel = ({ w = '60%', h = '12px' }) => (
  <div style={{
    width: w, height: h, borderRadius: '4px',
    backgroundColor: '#E4E2E0',
    animation: 'skelPulse 1.4s ease-in-out infinite',
  }} />
)

export default function ResumeStatusCard({ compact = false }) {
  const navigate = useNavigate()
  const [status,      setStatus]      = useState('loading') // 'loading' | 'none' | 'has'
  const [resumeData,  setResumeData]  = useState(null)
  const [aiSource,    setAiSource]    = useState('none')    // 'built' | 'uploaded' | 'none'
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [dlMsg,       setDlMsg]       = useState('')

  // Compose the resume object that ATSPreview / modal expects
  const resumeForPreview = resumeData ? {
    personalInfo: {
      fullName: resumeData.fullName || '',
      email:    resumeData.email    || '',
      phone:    resumeData.phone    || '',
      linkedin: resumeData.linkedin || '',
      location: resumeData.location || '',
    },
    summary:        resumeData.summary        || '',
    skills:         resumeData.skills         || [],
    workExperience: resumeData.workExperience || [],
    projects:       resumeData.projects       || [],
    education:      resumeData.education      || [],
    certifications: resumeData.certifications || [],
  } : null

  useEffect(() => {
    api.get('/users/resume-data')
      .then(({ data }) => {
        const rd = data.resumeData
        setAiSource(data.aiSource || 'none')
        if (rd && (rd.fullName || rd.summary || rd.skills?.length)) {
          setResumeData(rd)
          setStatus('has')
        } else {
          setStatus('none')
        }
      })
      .catch(() => setStatus('none'))
  }, [])

  const handleDownload = async () => {
    setDownloading(true)
    setDlMsg('')
    try {
      const response = await api.post('/users/resume-pdf', {}, { responseType: 'blob' })
      const firstName = resumeData?.fullName?.split(' ')[0] || 'Resume'
      const lastName  = resumeData?.fullName?.split(' ').slice(1).join('_') || ''
      const filename  = lastName
        ? `${firstName}_${lastName}_CareerCONNECT_Resume.pdf`
        : `${firstName}_CareerCONNECT_Resume.pdf`
      const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url; link.download = filename
      document.body.appendChild(link); link.click()
      document.body.removeChild(link); URL.revokeObjectURL(url)
      setDlMsg('Downloaded!')
    } catch {
      setDlMsg('Download failed')
    } finally {
      setDownloading(false)
      setTimeout(() => setDlMsg(''), 3000)
    }
  }

  // ── LOADING ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={cardStyle(compact)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: compact ? '14px 16px' : '20px' }}>
          <Skel w="45%" h="14px" />
          <Skel w="70%" h="11px" />
          <Skel w="55%" h="11px" />
        </div>
        <style>{`@keyframes skelPulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    )
  }

  // ── NO RESUME → CTA ───────────────────────────────────────────────────────
  if (status === 'none') {
    if (compact) {
      return (
        <div style={{
          ...cardStyle(true),
          background: 'linear-gradient(135deg, #EDF3FC 0%, #E8F0FE 100%)',
          border: '1px solid #BFDBFE',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FileText size={17} color="#2557A7" />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1D4ED8' }}>No CareerCONNECT Resume</p>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#6B7280' }}>Build an ATS resume to boost applications</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/resume-builder')}
            style={btnStyle('primary')}
          >
            <Wand2 size={13} /> Build Now
          </button>
          <style>{`@keyframes skelPulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
        </div>
      )
    }

    return (
      <div style={{
        ...cardStyle(false),
        background: 'linear-gradient(135deg, #F0F7FF 0%, #EDF3FC 100%)',
        border: '1.5px dashed #93C5FD',
        textAlign: 'center', padding: '32px 28px',
      }}>
        <div style={{
          width: '56px', height: '56px', borderRadius: '14px',
          backgroundColor: '#DBEAFE', margin: '0 auto 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FileText size={28} color="#2557A7" />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1D4ED8' }}>
          No CareerCONNECT Resume Yet
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>
          Build an ATS-friendly resume using your profile data.<br />
          It takes less than 5 minutes and dramatically improves your applications.
        </p>
        {aiSource === 'uploaded' && (
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <AISourcePill source="uploaded" compact={false} />
          </div>
        )}
        <button
          onClick={() => navigate('/resume-builder')}
          style={{
            ...btnStyle('primary'),
            padding: '10px 24px', fontSize: '14px',
          }}
        >
          <Wand2 size={15} /> Build My Resume
        </button>
        <style>{`@keyframes skelPulse{0%,100%{opacity:1}50%{opacity:0.45}}`}</style>
      </div>
    )
  }

  // ── HAS RESUME ────────────────────────────────────────────────────────────
  const rd = resumeData
  const skillsPreview = rd.skills?.slice(0, 4) || []
  const hasExp  = rd.workExperience?.some(e => e.jobTitle || e.company)
  const lastSaved = rd.lastSaved ? new Date(rd.lastSaved).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null

  if (compact) {
    return (
      <>
        <div style={{
          ...cardStyle(true),
          display: 'flex', alignItems: 'center',
          padding: '12px 16px', gap: '12px',
          border: '1px solid #D1FAE5', backgroundColor: '#F0FDF4',
        }}>
          {/* Icon */}
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#DCFCE7', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={18} color="#16A34A" />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#15803D' }}>
              CareerCONNECT Resume
            </p>
            <p style={{ margin: 0, fontSize: '11.5px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rd.fullName}{lastSaved ? ` · Saved ${lastSaved}` : ''}
            </p>
          </div>

          {/* AI source pill */}
          <AISourcePill source={aiSource} compact />

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => navigate('/resume-builder')} style={btnStyle('outline-sm')} title="Edit in Resume Builder">
              <Pencil size={12} /> Edit
            </button>
            <button onClick={() => setPreviewOpen(true)} style={btnStyle('outline-sm')}>
              <Eye size={13} /> View
            </button>
            <button onClick={handleDownload} disabled={downloading} style={btnStyle('primary-sm')}>
              {downloading
                ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                : <Download size={12} />
              }
              {downloading ? '' : 'PDF'}
            </button>
          </div>
        </div>

        {dlMsg && (
          <p style={{ fontSize: '12px', color: dlMsg.includes('fail') ? '#DC2626' : '#16A34A', margin: '4px 0 0', textAlign: 'right' }}>
            {dlMsg}
          </p>
        )}

        {previewOpen && resumeForPreview && (
          <ResumePreviewModal resume={resumeForPreview} onClose={() => setPreviewOpen(false)} />
        )}
        <style>{`@keyframes skelPulse{0%,100%{opacity:1}50%{opacity:0.45}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </>
    )
  }

  // Full card (profile page)
  return (
    <>
      <div style={cardStyle(false)}>
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #F0F0F0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} color="#16A34A" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1A1A2E' }}>CareerCONNECT Resume</h3>
                <AISourcePill source={aiSource} compact={false} />
              </div>
              {lastSaved && <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF' }}>Last saved {lastSaved}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => navigate('/resume-builder')} style={btnStyle('outline')}>
              <Wand2 size={13} /> Edit
            </button>
            <button onClick={() => setPreviewOpen(true)} style={btnStyle('outline')}>
              <Eye size={13} /> View
            </button>
            <button onClick={handleDownload} disabled={downloading} style={btnStyle('primary')}>
              {downloading
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                : <><Download size={13} /> Download PDF</>
              }
            </button>
          </div>
        </div>

        {/* ── Summary strip ── */}
        <div style={{ padding: '16px 20px' }}>
          {/* Name + headline row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: '#2557A7', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '700', color: 'white',
            }}>
              {(rd.fullName || '?')[0].toUpperCase()}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1A1A2E' }}>{rd.fullName}</p>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#6B7280' }}>
                {[rd.email, rd.location].filter(Boolean).join('  ·  ')}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            {skillsPreview.length > 0 && (
              <Stat icon={Zap} label="Skills" value={`${rd.skills?.length || 0} added`} />
            )}
            {hasExp && (
              <Stat icon={Briefcase} label="Experience" value={`${rd.workExperience?.filter(e => e.jobTitle || e.company).length} role${rd.workExperience?.filter(e => e.jobTitle || e.company).length !== 1 ? 's' : ''}`} />
            )}
            {rd.summary && (
              <Stat icon={FileText} label="Summary" value="Written" />
            )}
          </div>

          {/* Skills chips preview */}
          {skillsPreview.length > 0 && (
            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skillsPreview.map(s => (
                <span key={s} style={{
                  padding: '3px 10px', borderRadius: '20px',
                  backgroundColor: '#EDF3FC', border: '1px solid #BFDBFE',
                  color: '#1D4ED8', fontSize: '12px', fontWeight: '500',
                }}>{s}</span>
              ))}
              {rd.skills?.length > 4 && (
                <span style={{ padding: '3px 10px', fontSize: '12px', color: '#6B7280' }}>
                  +{rd.skills.length - 4} more
                </span>
              )}
            </div>
          )}

          {dlMsg && (
            <p style={{ margin: '10px 0 0', fontSize: '12.5px', color: dlMsg.includes('fail') ? '#DC2626' : '#16A34A' }}>
              {dlMsg}
            </p>
          )}
        </div>
      </div>

      {previewOpen && resumeForPreview && (
        <ResumePreviewModal resume={resumeForPreview} onClose={() => setPreviewOpen(false)} />
      )}
      <style>{`
        @keyframes skelPulse{0%,100%{opacity:1}50%{opacity:0.45}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
    </>
  )
}

// ── AI source pill ─────────────────────────────────────────────────────────
function AISourcePill({ source, compact }) {
  if (source === 'none') return null

  const isBuilt = source === 'built'
  const label   = isBuilt ? 'AI matching: CareerCONNECT resume' : 'AI matching: uploaded resume'
  const shortLabel = isBuilt ? 'AI: Built resume' : 'AI: Uploaded resume'

  return (
    <div title={label} style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: compact ? '2px 7px' : '3px 9px',
      borderRadius: '20px',
      backgroundColor: isBuilt ? '#EDE9FE' : '#E0F2FE',
      border: `1px solid ${isBuilt ? '#C4B5FD' : '#BAE6FD'}`,
      color: isBuilt ? '#6D28D9' : '#0369A1',
      fontSize: compact ? '10.5px' : '11.5px',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}>
      <Sparkles size={compact ? 10 : 11} />
      {compact ? shortLabel : label}
    </div>
  )
}

// ── Mini stat pill ─────────────────────────────────────────────────────────
function Stat({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '5px 11px', borderRadius: '6px',
      backgroundColor: '#F7F9FC', border: '1px solid #E4E2E0',
      fontSize: '12.5px', color: '#2D2D2D',
    }}>
      <Icon size={13} color="#2557A7" />
      <span style={{ color: '#767676' }}>{label}:</span>
      <span style={{ fontWeight: '600' }}>{value}</span>
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function cardStyle(compact) {
  return {
    backgroundColor: 'white',
    borderRadius: '10px',
    border: '1px solid #E4E2E0',
    overflow: 'hidden',
    marginBottom: compact ? '0' : '16px',
    fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
  }
}

function btnStyle(variant) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
    fontWeight: '600', border: 'none', transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  }
  const variants = {
    primary:    { ...base, padding: '7px 14px', fontSize: '13px', backgroundColor: '#2557A7', color: 'white' },
    'primary-sm': { ...base, padding: '5px 11px', fontSize: '12px', backgroundColor: '#2557A7', color: 'white' },
    outline:    { ...base, padding: '7px 13px', fontSize: '13px', backgroundColor: 'white', color: '#595959', border: '1px solid #E4E2E0' },
    'outline-sm': { ...base, padding: '5px 10px', fontSize: '12px', backgroundColor: 'white', color: '#595959', border: '1px solid #E4E2E0' },
  }
  return variants[variant] || variants.primary
}
