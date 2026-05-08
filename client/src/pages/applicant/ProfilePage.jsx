import { useState, useEffect } from 'react'
import {
  User, FileText, Briefcase, MapPin, Phone, Mail, Globe,
  Award, Wrench, Settings, CheckCircle, ChevronDown, Edit3
} from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import ResumeChangeModal from '../../components/applicant/ResumeChangeModal'
import ChangePasswordModal from '../../components/applicant/ChangePasswordModal'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, icon: Icon, children, action }) {
  return (
    <div style={{
      backgroundColor: 'white', borderRadius: '10px',
      border: '1px solid #E4E2E0', overflow: 'hidden', marginBottom: '16px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #F0F0F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {Icon && (
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              backgroundColor: '#EDF3FC', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={16} color="#2557A7" />
            </div>
          )}
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A2E', margin: 0 }}>{title}</h2>
        </div>
        {action}
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

/* ── Chip ────────────────────────────────────────────────────────────────── */
function Chip({ children, color = '#595959', bg = '#F0F0F0' }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 12px', borderRadius: '20px',
      backgroundColor: bg, color, fontSize: '13px', fontWeight: '500',
    }}>{children}</span>
  )
}

/* ── Info row ─────────────────────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
      <Icon size={16} color="#767676" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 1px' }}>{label}</p>
        <p style={{ fontSize: '14px', color: '#2D2D2D', margin: 0, fontWeight: '500' }}>{value}</p>
      </div>
    </div>
  )
}

/* ── Skill badge ──────────────────────────────────────────────────────────── */
function SkillBadge({ name, level }) {
  const levelColors = {
    beginner:     { bg: '#F0F0F0', color: '#595959' },
    intermediate: { bg: '#E8F0FE', color: '#1558D6' },
    advanced:     { bg: '#E7F5E8', color: '#137333' },
    expert:       { bg: '#F3E8FF', color: '#7E22CE' },
  }
  const c = levelColors[level?.toLowerCase()] || levelColors.beginner
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '5px 12px', borderRadius: '6px',
      border: '1px solid #E4E2E0', backgroundColor: 'white',
      fontSize: '13px', color: '#2D2D2D',
    }}>
      {name}
      {level && (
        <span style={{
          fontSize: '11px', fontWeight: '600',
          color: c.color, backgroundColor: c.bg,
          padding: '1px 7px', borderRadius: '10px',
        }}>{level}</span>
      )}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const [profile, setProfile]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [showResumeModal, setShowResumeModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [resumeUpdated, setResumeUpdated] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const fresh = await refreshUser()
        setProfile(fresh || user)
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F9FC', fontFamily: '"Noto Sans", Arial, sans-serif' }}>
        <Navbar />
        <div style={{ paddingTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: '#2557A7',
                animation: `bounce 0.9s ${i * 0.15}s infinite`,
              }} />
            ))}
          </div>
          <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
        </div>
      </div>
    )
  }

  const p  = profile?.applicantProfile || {}
  const bi = p.basicInfo || {}
  const pi = p.professionalInfo || {}
  const pr = p.preferences || {}
  const resume = p.resume || {}

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #EDF3FC 0%, #F7F9FC 50%, #FFFFFF 100%)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
    }}>
      <Navbar />

      <div className="profile-container" style={{ paddingTop: '60px', maxWidth: '860px', margin: '0 auto', padding: '60px 24px 60px' }}>

        {/* ── Hero banner ── */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px',
          border: '1px solid #E4E2E0', overflow: 'hidden',
          marginBottom: '20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          {/* Blue top strip */}
          <div style={{ height: '80px', background: 'linear-gradient(90deg, #2557A7 0%, #1D4589 100%)' }} />

          <div className="profile-hero-row" style={{ padding: '0 24px 24px', display: 'flex', alignItems: 'flex-end', gap: '20px', marginTop: '-40px' }}>
            {/* Avatar */}
            <div className="profile-hero-avatar" style={{
              width: '80px', height: '80px', borderRadius: '50%',
              backgroundColor: '#2557A7', border: '4px solid white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '28px', fontWeight: '700', flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37,87,167,0.3)',
            }}>
              {(profile?.name || 'U')[0].toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingBottom: '4px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#1A1A2E', margin: '8px 0 2px' }}>
                {profile?.name}
              </h1>
              {pi.currentTitle && (
                <p style={{ fontSize: '14px', color: '#595959', margin: '0 0 2px' }}>{pi.currentTitle}</p>
              )}
              {bi.location && (
                <p style={{ fontSize: '13px', color: '#767676', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {bi.location}
                </p>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .profile-container { padding: 60px 16px 40px !important; }
            .profile-hero-row { flex-direction: column; align-items: flex-start !important; gap: 12px !important; padding: 0 16px 16px !important; margin-top: -32px !important; }
            .profile-hero-avatar { width: 64px !important; height: 64px !important; font-size: 22px !important; }
          }
        `}</style>

        {/* Resume updated toast */}
        {resumeUpdated && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', backgroundColor: '#E7F5E8',
            border: '1px solid #A8D5AD', borderRadius: '8px',
            marginBottom: '16px', fontSize: '14px', color: '#137333',
          }}>
            <CheckCircle size={18} />
            Resume updated and processed successfully!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* ── LEFT COLUMN ── */}
          <div>
            {/* Account / Contact */}
            <Section title="Account" icon={Settings}>
              <InfoRow icon={Mail}  label="Email"  value={profile?.email} />
              <InfoRow icon={Phone} label="Phone"  value={bi.phone} />
              <InfoRow icon={MapPin} label="Location" value={bi.location} />
              {p.linkedinUrl && (
                <InfoRow icon={Globe} label="LinkedIn" value={p.linkedinUrl} />
              )}
              {p.portfolioUrl && (
                <InfoRow icon={Globe} label="Portfolio / GitHub" value={p.portfolioUrl} />
              )}

              {/* ── Change password ── */}
              {!profile?.googleId && (
                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F0F0F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A2E', margin: '0 0 2px' }}>Password</p>
                      <p style={{ fontSize: '12px', color: '#767676', margin: 0 }}>Last changed: unknown</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        padding: '5px 12px', backgroundColor: 'white',
                        border: '1px solid #E4E2E0', borderRadius: '6px',
                        color: '#595959', fontSize: '12px', fontWeight: '600',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2557A7'; e.currentTarget.style.color = '#2557A7' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#E4E2E0'; e.currentTarget.style.color = '#595959' }}
                    >
                      🔒 Change Password
                    </button>
                  </div>
                </div>
              )}

              {/* ── Resume section inside Account ── */}              <div style={{
                marginTop: '16px', paddingTop: '16px',
                borderTop: '1px solid #F0F0F0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A2E', margin: 0 }}>
                    Resume
                  </p>
                  <button
                    onClick={() => setShowResumeModal(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 12px', backgroundColor: 'white',
                      border: '1px solid #2557A7', borderRadius: '6px',
                      color: '#2557A7', fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#EDF3FC' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white' }}
                  >
                    <Edit3 size={12} /> Change Resume
                  </button>
                </div>

                {resume.fileName ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', backgroundColor: '#F7F9FC',
                    border: '1px solid #E4E2E0', borderRadius: '8px',
                  }}>
                    <FileText size={20} color="#2557A7" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: '13px', fontWeight: '600', color: '#1A1A2E',
                        margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {resume.fileName.replace(/^resume_[^_]+_\d+_/, '') || resume.fileName}
                      </p>
                      {resume.uploadedAt && (
                        <p style={{ fontSize: '11px', color: '#767676', margin: 0 }}>
                          Uploaded {new Date(resume.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {resume.storedSize && ` · ${(resume.storedSize / 1024).toFixed(0)} KB`}
                        </p>
                      )}
                    </div>
                    {resume.wasCompressed && (
                      <span style={{
                        fontSize: '11px', color: '#137333', backgroundColor: '#E7F5E8',
                        padding: '2px 8px', borderRadius: '10px', fontWeight: '600',
                      }}>Compressed</span>
                    )}
                  </div>
                ) : (
                  <div style={{
                    padding: '14px', backgroundColor: '#FFF9EC',
                    border: '1px dashed #F5C97B', borderRadius: '8px',
                    textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '13px', color: '#B45309', margin: '0 0 8px', fontWeight: '500' }}>
                      No resume uploaded yet
                    </p>
                    <button
                      onClick={() => setShowResumeModal(true)}
                      style={{
                        fontSize: '12px', color: '#2557A7', background: 'none',
                        border: 'none', cursor: 'pointer', fontWeight: '600',
                        textDecoration: 'underline',
                      }}
                    >
                      Upload your resume →
                    </button>
                  </div>
                )}

                {/* AI processing indicator */}
                {resume.rawText && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    marginTop: '8px', fontSize: '12px', color: '#2557A7',
                  }}>
                    <CheckCircle size={13} color="#137333" />
                    <span style={{ color: '#137333' }}>AI text extracted · ready for matching</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Preferences */}
            {(pr.jobType?.length > 0 || pr.workMode || pr.preferredLocations?.length > 0) && (
              <Section title="Job Preferences" icon={Briefcase}>
                {pr.jobType?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 6px', fontWeight: '600' }}>JOB TYPE</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {pr.jobType.map(t => <Chip key={t}>{t}</Chip>)}
                    </div>
                  </div>
                )}
                {pr.workMode && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 6px', fontWeight: '600' }}>WORK MODE</p>
                    <Chip bg="#E8F0FE" color="#1558D6">{pr.workMode}</Chip>
                  </div>
                )}
                {pr.preferredLocations?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 6px', fontWeight: '600' }}>PREFERRED LOCATIONS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {pr.preferredLocations.map(l => (
                        <Chip key={l} bg="#F3E8FF" color="#7E22CE">
                          <MapPin size={11} style={{ marginRight: '3px' }} />{l}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
                {(pr.salaryMin || pr.salaryMax) && (
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 4px', fontWeight: '600' }}>EXPECTED SALARY</p>
                    <p style={{ fontSize: '14px', color: '#137333', fontWeight: '600', margin: 0 }}>
                      PKR {pr.salaryMin?.toLocaleString()} – {pr.salaryMax?.toLocaleString()} / month
                    </p>
                  </div>
                )}
              </Section>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div>
            {/* Professional Info */}
            <Section title="Professional Info" icon={Briefcase}>
              <InfoRow icon={Briefcase} label="Current Title"      value={pi.currentTitle} />
              <InfoRow icon={User}      label="Years of Experience" value={pi.yearsOfExp} />
              <InfoRow icon={Briefcase} label="Industry"           value={pi.industry} />
              <InfoRow icon={Award}     label="Education"          value={pi.educationLevel} />
              {pi.fieldOfStudy && (
                <InfoRow icon={Award} label="Field of Study" value={pi.fieldOfStudy} />
              )}
            </Section>

            {/* Skills */}
            {(p.skills?.length > 0 || p.tools?.length > 0 || p.certifications?.length > 0) && (
              <Section title="Skills & Tools" icon={Award}>
                {p.skills?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 8px', fontWeight: '600' }}>PRIMARY SKILLS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {p.skills.map((s, i) => (
                        <SkillBadge key={i} name={typeof s === 'string' ? s : s.name} level={s.level} />
                      ))}
                    </div>
                  </div>
                )}
                {p.tools?.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 8px', fontWeight: '600' }}>TOOLS & TECHNOLOGIES</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.tools.map(t => <Chip key={t} bg="#E8F0FE" color="#1558D6">{t}</Chip>)}
                    </div>
                  </div>
                )}
                {p.certifications?.length > 0 && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 8px', fontWeight: '600' }}>CERTIFICATIONS</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {p.certifications.map(c => (
                        <Chip key={c} bg="#E7F5E8" color="#137333">
                          <CheckCircle size={11} style={{ marginRight: '4px' }} />{c}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </Section>
            )}

            {/* Profile Summary */}
            {p.profileSummary && (
              <Section title="About Me" icon={User}>
                <p style={{ fontSize: '14px', color: '#595959', lineHeight: 1.7, margin: 0 }}>
                  {p.profileSummary}
                </p>
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* Resume change modal */}
      {showResumeModal && (
        <ResumeChangeModal
          onClose={() => setShowResumeModal(false)}
          onSuccess={handleResumeSuccess}
        />
      )}

      {/* Change password modal */}
      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D4D2D0; border-radius: 3px; }
      `}</style>
    </div>
  )
}
