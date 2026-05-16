import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, Eye, Download, Loader2, Wand2, Edit3,
  CheckCircle, Mail, Phone, MapPin, Globe, Lock, RefreshCw,
  Briefcase, Award, User
} from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import ResumeChangeModal from '../../components/applicant/ResumeChangeModal'
import ChangePasswordModal from '../../components/applicant/ChangePasswordModal'
import EditProfileModal from '../../components/applicant/EditProfileModal'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [profile,          setProfile]          = useState(null)
  const [loading,          setLoading]          = useState(true)
  const [showResumeModal,  setShowResumeModal]  = useState(false)
  const [showPasswordModal,setShowPasswordModal]= useState(false)
  const [showEditModal,    setShowEditModal]    = useState(false)
  const [resumeUpdated,    setResumeUpdated]    = useState(false)
  const [pdfAction,        setPdfAction]        = useState(null)
  const [pdfMsg,           setPdfMsg]           = useState('')
  const [aiPref,           setAiPref]           = useState('uploaded')
  const [aiSwitching,      setAiSwitching]      = useState(false)
  const [hasBuiltResume,   setHasBuiltResume]   = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [fresh, rdRes] = await Promise.all([
          refreshUser(),
          api.get('/users/resume-data').catch(() => null),
        ])
        setProfile(fresh || user)
        if (rdRes?.data) {
          setAiPref(rdRes.data.aiPreference || 'uploaded')
          setHasBuiltResume(rdRes.data.hasBuilt || false)
        }
      } catch {
        setProfile(user)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleResumeSuccess = async (updatedUser) => {
    setProfile(updatedUser || profile)
    setShowResumeModal(false)
    setResumeUpdated(true)
    setTimeout(() => setResumeUpdated(false), 3000)
  }

  const handleUploadedPDF = async (action, fileId, fileName) => {
    setPdfAction(action)
    setPdfMsg('')
    try {
      const response = await api.get(`/users/resume/${fileId}`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url  = URL.createObjectURL(blob)
      if (action === 'view') {
        window.open(url, '_blank', 'noopener,noreferrer')
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      } else {
        const link = document.createElement('a')
        link.href = url
        link.download = 'Uploaded_Resume.pdf'
        document.body.appendChild(link); link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setPdfMsg('Downloaded!')
        setTimeout(() => setPdfMsg(''), 3000)
      }
    } catch {
      setPdfMsg('Failed — try again')
      setTimeout(() => setPdfMsg(''), 4000)
    } finally {
      setPdfAction(null)
    }
  }

  const handleSwitchAiSource = async (source) => {
    if (source === aiPref || aiSwitching) return
    setAiSwitching(true)
    try {
      await api.patch('/users/ai-source', { source })
      setAiPref(source)
    } catch (err) {
      setPdfMsg(err?.response?.data?.message || 'Failed to switch')
      setTimeout(() => setPdfMsg(''), 4000)
    } finally {
      setAiSwitching(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cc-bg)', fontFamily: '"Noto Sans", Arial, sans-serif' }}>
        <Navbar />
        <div style={{ paddingTop: '80px', display: 'flex', justifyContent: 'center' }}>
          <Loader2 size={24} color="var(--cc-blue)" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      </div>
    )
  }

  const p      = profile?.applicantProfile || {}
  const bi     = p.basicInfo || {}
  const pi     = p.professionalInfo || {}
  const pr     = p.preferences || {}
  const resume = p.resume || {}

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cc-bg)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
    }}>
      <Navbar />

      <div style={{ paddingTop: '76px', maxWidth: '680px', margin: '0 auto', padding: '76px 20px 60px' }}>

        {/* ── Success toast ── */}
        {resumeUpdated && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', backgroundColor: 'var(--cc-green-bg)',
            border: '1px solid var(--cc-green-border)', borderRadius: '8px',
            marginBottom: '14px', fontSize: '13px', color: 'var(--cc-green)',
          }}>
            <CheckCircle size={15} />
            Resume updated successfully!
          </div>
        )}

        {/* ── Hero card ── */}
        <div style={{
          backgroundColor: 'var(--cc-surface)', borderRadius: '12px',
          border: '1px solid var(--cc-border)', overflow: 'hidden',
          marginBottom: '12px',
          boxShadow: 'var(--cc-shadow)',
        }}>
          <div style={{ height: '64px', background: 'linear-gradient(90deg, var(--cc-blue) 0%, var(--cc-blue-hover) 100%)' }} />
          <div style={{ padding: '0 20px 18px', display: 'flex', alignItems: 'flex-end', gap: '14px', marginTop: '-32px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--cc-blue)', border: '3px solid var(--cc-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cc-text-4)', fontSize: '22px', fontWeight: '700', flexShrink: 0,
            }}>
              {(profile?.name || 'U')[0].toUpperCase()}
            </div>
            <div style={{ paddingBottom: '4px', flex: 1 }}>
              <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--cc-text-1)', margin: '8px 0 2px' }}>
                {profile?.name}
              </h1>
              {pi.currentTitle && (
                <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0 }}>{pi.currentTitle}</p>
              )}
            </div>
            <div style={{ paddingBottom: '6px', flexShrink: 0 }}>
              <Btn onClick={() => setShowEditModal(true)} icon={<Edit3 size={13} />} variant="ghost" small>
                Edit Profile
              </Btn>
            </div>
          </div>
        </div>

        {/* ── Resume card ── */}
        <div style={{
          backgroundColor: 'var(--cc-surface)', borderRadius: '10px',
          border: '1px solid var(--cc-border)', marginBottom: '12px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '13px 18px', borderBottom: '1px solid var(--cc-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-1)' }}>Resume</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Btn onClick={() => navigate('/resume-builder')} icon={<Wand2 size={12} />} variant="ghost">
                Resume Builder
              </Btn>
            </div>
          </div>

          <div style={{ padding: '14px 18px' }}>

            {/* Uploaded PDF row */}
            {resume.fileId ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 12px', backgroundColor: 'var(--cc-surface-2)',
                border: '1px solid var(--cc-border)', borderRadius: '8px',
                marginBottom: '10px',
              }}>
                <FileText size={18} color="var(--cc-blue)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 1px' }}>
                    Uploaded Resume
                  </p>
                  {resume.uploadedAt && (
                    <p style={{ fontSize: '11px', color: 'var(--cc-text-3)', margin: 0 }}>
                      {new Date(resume.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {resume.storedSize ? ` · ${(resume.storedSize / 1024).toFixed(0)} KB` : ''}
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
                  <Btn
                    onClick={() => handleUploadedPDF('view', resume.fileId, resume.fileName)}
                    disabled={!!pdfAction} icon={pdfAction === 'view' ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Eye size={11} />}
                    variant="ghost" small
                  >View</Btn>
                  <Btn
                    onClick={() => handleUploadedPDF('download', resume.fileId, resume.fileName)}
                    disabled={!!pdfAction} icon={pdfAction === 'download' ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={11} />}
                    variant="primary" small
                  >Save</Btn>
                  <Btn
                    onClick={() => setShowResumeModal(true)}
                    icon={<RefreshCw size={11} />}
                    variant="ghost" small
                  >Change</Btn>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '14px', backgroundColor: 'var(--cc-amber-bg)',
                border: '1px dashed var(--cc-amber)', borderRadius: '8px',
                textAlign: 'center', marginBottom: '10px',
              }}>
                <p style={{ fontSize: '13px', color: 'var(--cc-amber)', margin: '0 0 8px' }}>No resume uploaded yet</p>
                <Btn onClick={() => setShowResumeModal(true)} variant="primary" small>Upload Resume</Btn>
              </div>
            )}

            {/* CareerCONNECT resume indicator */}
            {hasBuiltResume && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', backgroundColor: 'var(--cc-blue-light)',
                border: '1px solid var(--cc-blue-border)', borderRadius: '8px',
                marginBottom: '10px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Wand2 size={14} color="var(--cc-blue)" />
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--cc-blue)' }}>CareerCONNECT Resume</span>
                </div>
                <Btn onClick={() => navigate('/resume-builder')} variant="ghost" small>Edit →</Btn>
              </div>
            )}

            {/* AI source toggle */}
            {hasBuiltResume && resume.fileId && (
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)',
                borderRadius: '8px',
              }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--cc-blue)', margin: '0 0 7px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI job matching uses
                </p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { val: 'uploaded', label: 'Uploaded PDF' },
                    { val: 'built',    label: 'Builder Resume' },
                  ].map(opt => {
                    const active = aiPref === opt.val
                    return (
                      <button key={opt.val} onClick={() => handleSwitchAiSource(opt.val)}
                        disabled={aiSwitching}
                        style={{
                          flex: 1, padding: '5px 8px', borderRadius: '6px',
                          fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s',
                          border: active ? '2px solid var(--cc-blue)' : '1px solid var(--cc-border)',
                          backgroundColor: active ? 'var(--cc-blue-light)' : 'var(--cc-surface)',
                          color: active ? 'var(--cc-blue)' : 'var(--cc-text-3)',
                          opacity: aiSwitching ? 0.6 : 1,
                        }}>
                        {active ? '✓ ' : ''}{opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {pdfMsg && (
              <p style={{ fontSize: '12px', margin: '6px 0 0', color: pdfMsg.includes('fail') || pdfMsg.includes('Failed') ? 'var(--cc-red)' : 'var(--cc-green)' }}>
                {pdfMsg}
              </p>
            )}

            {resume.rawText && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px', fontSize: '11.5px', color: 'var(--cc-green)' }}>
                <CheckCircle size={12} color="var(--cc-green)" />
                AI text extracted · ready for matching
              </div>
            )}
          </div>
        </div>

        {/* ── Contact & account card ── */}
        <div style={{
          backgroundColor: 'var(--cc-surface)', borderRadius: '10px',
          border: '1px solid var(--cc-border)', marginBottom: '12px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--cc-border)' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-1)' }}>Account</span>
          </div>
          <div style={{ padding: '14px 18px' }}>

            {/* Contact rows */}
            {[
              { icon: Mail,    label: profile?.email },
              { icon: Phone,   label: bi.phone },
              { icon: MapPin,  label: bi.location },
              { icon: Globe,   label: p.linkedinUrl },
            ].filter(r => r.label).map(({ icon: Icon, label }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Icon size={14} color="var(--cc-text-3)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--cc-text-1)' }}>{label}</span>
              </div>
            ))}

            {/* Professional summary line */}
            {pi.currentTitle && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Edit3 size={14} color="var(--cc-text-3)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--cc-text-1)' }}>
                  {pi.currentTitle}{pi.yearsOfExp ? ` · ${pi.yearsOfExp} exp` : ''}{pi.industry ? ` · ${pi.industry}` : ''}
                </span>
              </div>
            )}

            {/* Change password */}
            {!profile?.googleId && (
              <div style={{ paddingTop: '10px', marginTop: '4px', borderTop: '1px solid var(--cc-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Lock size={14} color="var(--cc-text-3)" />
                  <span style={{ fontSize: '13px', color: 'var(--cc-text-2)' }}>Password</span>
                </div>
                <Btn onClick={() => setShowPasswordModal(true)} variant="ghost" small>Change</Btn>
              </div>
            )}
          </div>
        </div>

        {/* ── Skills (compact) ── */}
        {(p.skills?.length > 0 || p.tools?.length > 0) && (
          <div style={{
            backgroundColor: 'var(--cc-surface)', borderRadius: '10px',
            border: '1px solid var(--cc-border)', marginBottom: '12px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '13px 18px', borderBottom: '1px solid var(--cc-border)' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-1)' }}>Skills</span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[...(p.skills || []).map(s => (typeof s === 'string' ? s : s.name)),
                 ...(p.tools  || [])
               ].filter(Boolean).map((s, i) => (
                <span key={i} style={{
                  padding: '4px 10px', borderRadius: '4px',
                  backgroundColor: 'var(--cc-surface-2)', color: 'var(--cc-text-2)',
                  fontSize: '12px', fontWeight: '500',
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Professional details */}
        {(pi.currentTitle || pi.yearsOfExp || pi.industry || pi.educationLevel || pi.fieldOfStudy) && (
          <ProfileCard title="Professional Details" icon={<Briefcase size={14} color="var(--cc-blue)" />}>
            <InfoLine label="Current Title" value={pi.currentTitle} />
            <InfoLine label="Experience" value={pi.yearsOfExp} />
            <InfoLine label="Industry" value={pi.industry} />
            <InfoLine label="Education" value={pi.educationLevel} />
            <InfoLine label="Field of Study" value={pi.fieldOfStudy} />
          </ProfileCard>
        )}

        {/* Job preferences */}
        {(pr.jobType?.length > 0 || pr.workMode || pr.preferredLocations?.length > 0 || pr.salaryMin || pr.salaryMax) && (
          <ProfileCard title="Job Preferences" icon={<Briefcase size={14} color="var(--cc-blue)" />}>
            {pr.jobType?.length > 0 && (
              <ChipGroup label="Job Type" items={pr.jobType} />
            )}
            {pr.workMode && (
              <ChipGroup label="Work Mode" items={[pr.workMode]} />
            )}
            {pr.preferredLocations?.length > 0 && (
              <ChipGroup label="Preferred Locations" items={pr.preferredLocations} />
            )}
            {(pr.salaryMin || pr.salaryMax) && (
              <InfoLine
                label="Expected Salary"
                value={`PKR ${pr.salaryMin?.toLocaleString?.() || pr.salaryMin || '0'} - ${pr.salaryMax?.toLocaleString?.() || pr.salaryMax || '0'} / month`}
              />
            )}
          </ProfileCard>
        )}

        {/* Certifications */}
        {p.certifications?.length > 0 && (
          <ProfileCard title="Certifications" icon={<Award size={14} color="var(--cc-blue)" />}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {p.certifications.map((cert, i) => {
                const label = typeof cert === 'string'
                  ? cert
                  : [cert.name, cert.issuer, cert.year].filter(Boolean).join(' - ')
                return (
                  <span key={i} style={{
                    padding: '4px 10px', borderRadius: '4px',
                    backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)',
                    fontSize: '12px', fontWeight: '600',
                  }}>{label}</span>
                )
              })}
            </div>
          </ProfileCard>
        )}

        {/* Profile summary */}
        {p.profileSummary && (
          <ProfileCard title="About" icon={<User size={14} color="var(--cc-blue)" />}>
            <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', lineHeight: 1.7, margin: 0 }}>
              {p.profileSummary}
            </p>
          </ProfileCard>
        )}

      </div>

      {showResumeModal && (
        <ResumeChangeModal onClose={() => setShowResumeModal(false)} onSuccess={handleResumeSuccess} />
      )}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}
      {showEditModal && (
        <EditProfileModal
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            const fresh = await refreshUser()
            setProfile(fresh || profile)
          }}
        />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  )
}

/* ── Minimal button primitive ─────────────────────────────────────────────── */
function Btn({ onClick, children, icon, variant = 'ghost', small, disabled }) {
  const [hov, setHov] = useState(false)
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: small ? '4px 9px' : '6px 14px',
    borderRadius: '6px', fontSize: small ? '12px' : '13px',
    fontWeight: '600', cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit', transition: 'all 0.15s',
    border: 'none', opacity: disabled ? 0.5 : 1,
  }
  const styles = {
    primary: { ...base, backgroundColor: hov ? 'var(--cc-blue-hover)' : 'var(--cc-blue)', color: 'var(--cc-text-4)' },
    ghost:   { ...base, backgroundColor: hov ? 'var(--cc-surface-2)' : 'var(--cc-surface)', color: 'var(--cc-text-2)', border: '1px solid var(--cc-border)' },
  }
  return (
    <button onClick={disabled ? undefined : onClick} style={styles[variant]}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {icon}{children}
    </button>
  )
}

function ProfileCard({ title, icon, children }) {
  return (
    <div style={{
      backgroundColor: 'var(--cc-surface)', borderRadius: '10px',
      border: '1px solid var(--cc-border)', marginBottom: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '13px 18px', borderBottom: '1px solid var(--cc-border)',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        {icon}
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-1)' }}>{title}</span>
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  )
}

function InfoLine({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '9px' }}>
      <span style={{ fontSize: '12px', color: 'var(--cc-text-3)', fontWeight: '600' }}>{label}</span>
      <span style={{ fontSize: '13px', color: 'var(--cc-text-1)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function ChipGroup({ label, items }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <p style={{ fontSize: '12px', color: 'var(--cc-text-3)', margin: '0 0 7px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {items.filter(Boolean).map(item => (
          <span key={item} style={{
            padding: '4px 10px', borderRadius: '4px',
            backgroundColor: 'var(--cc-blue-light)', color: 'var(--cc-blue)',
            fontSize: '12px', fontWeight: '600',
          }}>{item}</span>
        ))}
      </div>
    </div>
  )
}
