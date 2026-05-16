/**
 * ResumePreviewModal.jsx
 * ----------------------
 * Full-screen modal that shows the ATS resume preview with
 * Download PDF and Edit Resume actions.
 *
 * Props:
 *   resume   — resume state object (same shape as ResumeBuilderPage)
 *   onClose  — () => void
 */
import { useEffect, useRef, useState } from 'react'
import { X, Download, Edit3, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ATSPreview from '../../utils/resumeTemplate'
import api from '../../services/api'

export default function ResumePreviewModal({ resume, onClose }) {
  const navigate      = useNavigate()
  const [downloading, setDownloading] = useState(false)
  const [dlError,     setDlError]     = useState('')

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDownload = async () => {
    setDownloading(true)
    setDlError('')
    try {
      // Call server — returns a PDF binary
      const response = await api.post('/users/resume-pdf', {}, { responseType: 'blob' })

      // Build a filename from the resume name
      const firstName = resume?.personalInfo?.fullName?.split(' ')[0] || 'Resume'
      const lastName  = resume?.personalInfo?.fullName?.split(' ').slice(1).join('_') || ''
      const filename  = lastName
        ? `${firstName}_${lastName}_CareerCONNECT_Resume.pdf`
        : `${firstName}_CareerCONNECT_Resume.pdf`

      const url  = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href     = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setDlError('Download failed. Please try again.')
      setTimeout(() => setDlError(''), 4000)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.7)',
          animation: 'fadeInBD 0.2s ease',
        }}
      />

      {/* ── Modal panel ── */}
      <div style={{
        position: 'fixed', inset: '0', zIndex: 1001,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth: '760px',
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          borderRadius: '12px', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
          animation: 'slideUpModal 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}>

          {/* ── Toolbar ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 18px',
            background: resume?.accentColor || 'var(--cc-blue)',
            flexShrink: 0,
          }}>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'white' }}>
                Resume Preview
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.72)' }}>
                ATS-friendly · CareerCONNECT Template
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Edit button */}
              <button
                onClick={() => { onClose(); navigate('/resume-builder') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '7px',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: 'white', fontSize: '13px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              >
                <Edit3 size={14} /> Edit Resume
              </button>

              {/* Download button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 16px', borderRadius: '7px',
                  backgroundColor: downloading ? 'rgba(255,255,255,0.25)' : 'white',
                  border: 'none',
                  color: downloading ? 'rgba(255,255,255,0.7)' : '#2557A7',
                  fontSize: '13px', fontWeight: '700',
                  cursor: downloading ? 'default' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!downloading) e.currentTarget.style.backgroundColor = '#EDF3FC' }}
                onMouseLeave={e => { if (!downloading) e.currentTarget.style.backgroundColor = 'white' }}
              >
                {downloading
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                  : <><Download size={14} /> Download PDF</>
                }
              </button>

              {/* Close */}
              <button
                onClick={onClose}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: 'none', backgroundColor: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'white',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* ── Error bar ── */}
          {dlError && (
            <div style={{
              padding: '10px 18px', backgroundColor: '#FEE2E2',
              borderBottom: '1px solid #FCA5A5',
              fontSize: '13px', color: '#991B1B', flexShrink: 0,
            }}>
              {dlError}
            </div>
          )}

          {/* ── Scrollable preview area ── */}
          <div style={{
            flex: 1, overflowY: 'auto',
            backgroundColor: 'var(--cc-surface-2)',
            padding: '20px',
          }}>
            {/* A4-proportioned white sheet */}
            <div style={{
              maxWidth: '660px', margin: '0 auto',
              backgroundColor: 'white',
              boxShadow: '0 10px 32px rgba(0,0,0,0.24)',
              borderRadius: '2px',
              padding: '34px 42px',
              minHeight: '900px',
            }}>
              <ATSPreview resume={resume} forPrint />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBD   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
