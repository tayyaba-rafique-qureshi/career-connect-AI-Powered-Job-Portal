import { useState, useRef } from 'react'
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

/**
 * ResumeChangeModal
 *
 * Reuses PATCH /api/users/onboarding (step 5) — the same endpoint used during
 * onboarding — so GridFS upload, old-file deletion, PDF compression, and AI
 * text extraction all happen automatically.
 *
 * Props:
 *   onClose()          — close the modal
 *   onSuccess(user)    — called after upload succeeds, receives fresh user object
 */
export default function ResumeChangeModal({ onClose, onSuccess }) {
  const { refreshUser } = useAuth()
  const inputRef = useRef()

  const [file, setFile]         = useState(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  const handleFile = (f) => {
    setError('')
    if (!f) return
    if (f.type !== 'application/pdf') { setError('Only PDF files are allowed'); return }
    if (f.size > 2 * 1024 * 1024)     { setError('File must be under 2 MB');    return }
    setFile(f)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const formatSize = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB'

  const handleUpload = async () => {
    if (!file) { setError('Please select a PDF file first'); return }
    setUploading(true); setError('')
    try {
      const formData = new FormData()
      formData.append('step', '5')
      formData.append('role', 'applicant')
      formData.append('data', JSON.stringify({})) // no other step-5 fields to change
      formData.append('resume', file)
      await api.patch('/users/onboarding', formData)
      setDone(true)
      const updated = await refreshUser()
      setTimeout(() => { onSuccess?.(updated); onClose() }, 900)
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', backgroundColor: 'var(--cc-surface)',
        borderRadius: '10px', boxShadow: 'var(--cc-shadow-lg)',
        border: '1px solid var(--cc-border)',
        width: '100%', maxWidth: '460px', maxHeight: '86vh', zIndex: 10, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 14px', borderBottom: '1px solid var(--cc-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              backgroundColor: 'var(--cc-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={18} color="var(--cc-blue)" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)', margin: 0 }}>
                Update Resume
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--cc-text-3)', margin: 0 }}>
                PDF only · Max 2 MB
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: 'none', backgroundColor: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cc-text-3)',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-surface-2)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '18px 20px', overflowY: 'auto', maxHeight: 'calc(86vh - 132px)' }}>
          {done ? (
            /* Success state */
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '32px 0', gap: '12px',
            }}>
              <CheckCircle size={48} color="#137333" strokeWidth={1.5} />
              <p style={{ fontSize: '16px', fontWeight: '600', color: '#137333', margin: 0 }}>
                Resume updated!
              </p>
              <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0 }}>
                Your new resume has been saved and processed.
              </p>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              {!file ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => inputRef.current.click()}
                  style={{
                    border: `2px dashed ${dragging ? '#2557A7' : error ? '#D93025' : '#D4D2D0'}`,
                    borderRadius: '10px',
                    padding: '28px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: dragging ? 'var(--cc-blue-light)' : 'var(--cc-surface-2)',
                    transition: 'all 0.15s',
                    marginBottom: '16px',
                  }}
                >
                  <Upload size={32} color={dragging ? '#2557A7' : '#A0A0A0'} style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>
                    Drag & drop your resume here
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: '0 0 12px' }}>
                    or click to browse
                  </p>
                  <span style={{
                    display: 'inline-block', padding: '8px 20px',
                    backgroundColor: 'var(--cc-blue)', color: 'var(--cc-text-4)',
                    borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                  }}>
                    Browse files
                  </span>
                  <input
                    ref={inputRef} type="file" accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                /* File selected */
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  border: '1px solid var(--cc-green-border)', borderRadius: '10px',
                  padding: '12px 14px', backgroundColor: 'var(--cc-green-bg)',
                  marginBottom: '16px',
                }}>
                  <FileText size={28} color="#137333" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--cc-text-3)', margin: 0 }}>
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <button onClick={() => setFile(null)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#D93025', fontSize: '13px', fontWeight: '600',
                    padding: '4px 8px', borderRadius: '4px',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEECEA'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', backgroundColor: '#FEECEA',
                  border: '1px solid #F5C6C2', borderRadius: '6px',
                  marginBottom: '16px',
                }}>
                  <AlertCircle size={16} color="#D93025" />
                  <span style={{ fontSize: '13px', color: '#D93025' }}>{error}</span>
                </div>
              )}

              {/* Info note */}
              <div style={{
                padding: '10px 14px', backgroundColor: 'var(--cc-blue-light)',
                border: '1px solid var(--cc-blue-border)', borderRadius: '6px',
                marginBottom: '14px',
              }}>
                <p style={{ fontSize: '12px', color: '#2557A7', margin: 0, lineHeight: 1.5 }}>
                  Your new resume will be processed to update match scores and skill analysis.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!done && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px',
            padding: '14px 20px', borderTop: '1px solid var(--cc-border)',
          }}>
            <button onClick={onClose} style={{
              padding: '0 20px', height: '40px',
              border: '1px solid var(--cc-border)', borderRadius: '6px',
              backgroundColor: 'var(--cc-surface)', color: 'var(--cc-text-2)',
              fontSize: '14px', fontWeight: '500', cursor: 'pointer',
              transition: 'background 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-surface-2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-surface)'}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                padding: '0 24px', height: '40px',
                backgroundColor: !file || uploading ? 'var(--cc-blue-border)' : 'var(--cc-blue)',
                color: 'var(--cc-text-4)', border: 'none', borderRadius: '6px',
                fontSize: '14px', fontWeight: '600',
                cursor: !file || uploading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (file && !uploading) e.currentTarget.style.backgroundColor = '#1D4589' }}
              onMouseLeave={e => { if (file && !uploading) e.currentTarget.style.backgroundColor = '#2557A7' }}
            >
              {uploading && <Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} />}
              {uploading ? 'Uploading…' : 'Save Resume'}
            </button>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
