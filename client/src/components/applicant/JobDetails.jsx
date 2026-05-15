import { MapPin, Briefcase, ExternalLink, Bookmark, ThumbsDown, Share2, Star, DollarSign, Flag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatSalary } from '../../utils/formatSalary'
import ShareJobModal from './ShareJobModal'
import ReportJobModal from './ReportJobModal'
import CompanyReviews from './CompanyReviews'

// ── Color tiers for AI match ─────────────────────────────────────────────
function matchTier(score) {
  if (score >= 80) return { bg: '#E7F5E8', border: '#A8D5AD', color: '#137333', label: 'Great match!', chipBg: '#C8E6C9', chipText: '#1B5E20' }
  if (score >= 60) return { bg: '#FFF4E0', border: '#F5C97B', color: '#B45309', label: 'Good match',   chipBg: '#FFE0A0', chipText: '#7C3D00' }
  return            { bg: '#F0F0F0',  border: '#D4D2D0', color: '#767676', label: 'Partial match', chipBg: '#E0E0E0', chipText: '#595959' }
}

export default function JobDetails({ job, matchData, matchLoading, onApply, onSave, saved, applied }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  if (!job) return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#767676',
    }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
          <circle cx="60" cy="60" r="56" fill="#EDF3FC" />
          <rect x="38" y="32" width="44" height="56" rx="4" fill="#C5D8FA" />
          <rect x="44" y="42" width="32" height="4" rx="2" fill="#2557A7" opacity="0.5" />
          <rect x="44" y="52" width="24" height="4" rx="2" fill="#2557A7" opacity="0.3" />
          <rect x="44" y="62" width="28" height="4" rx="2" fill="#2557A7" opacity="0.3" />
          <circle cx="82" cy="80" r="16" fill="#2557A7" />
          <path d="M76 80l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ fontWeight: '600', color: '#2D2D2D', marginBottom: '4px', fontSize: '15px' }}>Select a job to view details</p>
        <p style={{ fontSize: '13px', color: '#767676', margin: 0 }}>Click any job on the left to read the full description</p>
      </div>
    </div>
  )

  const skills = job.requiredSkills || job.skills || []
  const resumeScore = matchData?.resumeScore ?? matchData?.matchScore
  const skillScore = matchData?.skillScore
  const score = resumeScore
  const tier = score != null ? matchTier(score) : null
  const salaryText = formatSalary(job.salaryMin, job.salaryMax, job.salaryType)

  return (
    <div className="job-details-scroll" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
      <style>{`
        @media (max-width: 768px) {
          .job-details-scroll { padding: 16px !important; }
        }
      `}</style>

      {/* Content (extra bottom padding so the sticky footer doesn't cover text) */}
      <div style={{ paddingBottom: '88px' }}>
      {/* ── Job Title ── */}
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#2D2D2D', margin: '0 0 8px', lineHeight: 1.35 }}>
        {job.title}
      </h1>

      {/* Company row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
        <a href="#" style={{ fontSize: '14px', color: '#2557A7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {job.company} <ExternalLink size={12} />
        </a>
        <span style={{ color: '#D4D2D0' }}>·</span>
        <a href="#company-reviews" style={{ display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          <Star size={13} fill="#F5A623" color="#F5A623" />
          <span style={{ fontSize: '13px', color: '#595959', fontWeight: '600' }}>Company Reviews</span>
        </a>
      </div>
      <p style={{ fontSize: '13px', color: '#595959', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <MapPin size={13} style={{ color: '#767676', flexShrink: 0 }} />
        {job.location}
      </p>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {applied ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 20px', height: '40px', backgroundColor: '#E7F5E8',
            color: '#137333', borderRadius: '6px', fontSize: '14px', fontWeight: '600',
            border: '1px solid #A8D5AD',
          }}>✓ Applied</span>
        ) : (
          <button onClick={onApply} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 20px', height: '40px', backgroundColor: '#2557A7',
            color: 'white', borderRadius: '6px', border: 'none',
            fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            transition: 'background 0.15s', whiteSpace: 'nowrap',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1D4589'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2557A7'}
          >
            Apply now
          </button>
        )}
        <ActionIconBtn onClick={onSave} title={saved ? 'Remove from saved' : 'Save job'}>
          <Bookmark size={18} fill={saved ? '#2557A7' : 'none'} color={saved ? '#2557A7' : '#595959'} />
        </ActionIconBtn>
        <ActionIconBtn title="Not interested">
          <ThumbsDown size={18} color="#595959" />
        </ActionIconBtn>
        <ActionIconBtn onClick={() => setShareOpen(true)} title="Share job">
          <Share2 size={18} color="#595959" />
        </ActionIconBtn>
        <ActionIconBtn onClick={() => setReportOpen(true)} title="Report job">
          <Flag size={18} color="#595959" />
        </ActionIconBtn>
      </div>

      {/* Modals */}
      {shareOpen && <ShareJobModal job={job} onClose={() => setShareOpen(false)} />}
      {reportOpen && <ReportJobModal job={job} onClose={() => setReportOpen(false)} onSuccess={() => setReportOpen(false)} />}

      {/* ── AI Match Section ── */}
      {matchLoading ? (
        <div style={{
          backgroundColor: '#F0F7FF', border: '1px solid #D0E4FF',
          borderRadius: '8px', padding: '20px', marginBottom: '24px',
        }}>
          {[{ w: '100px', h: '64px' }, { w: '160px', h: '13px' }, { w: '220px', h: '12px' }].map((b, i) => (
            <div key={i} style={{
              height: b.h, width: b.w, backgroundColor: '#C5D8FA',
              borderRadius: '6px', marginBottom: '12px',
              animation: 'matchPulse 1.4s ease-in-out infinite',
            }} />
          ))}
          <style>{`@keyframes matchPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      ) : score != null && tier ? (
        <div style={{
          backgroundColor: '#F0F7FF', border: '1px solid #D0E4FF',
          borderRadius: '8px', padding: '20px', marginBottom: '24px',
        }}>
          {/* Score badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '12px',
              backgroundColor: tier.bg, border: `1px solid ${tier.border}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: tier.color, lineHeight: 1 }}>{score}%</span>
              <span style={{ fontSize: '9px', fontWeight: '600', color: tier.color, lineHeight: 1, marginTop: '2px' }}>MATCH</span>
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700', color: tier.color, margin: '0 0 4px' }}>{tier.label}</p>
              <p style={{ fontSize: '13px', color: '#595959', margin: 0, lineHeight: 1.5 }}>
                Here's how your resume aligns with this job's requirements.
              </p>
              <button style={{
                fontSize: '13px', color: '#2557A7', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, marginTop: '6px',
                fontFamily: 'inherit',
              }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                How is this calculated?
              </button>
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
              backgroundColor: '#E7F5E8', color: '#137333'
            }}>
              Resume match: {resumeScore?.toFixed(2)}%
            </div>
            {skillScore != null && (
              <div style={{
                padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
                backgroundColor: '#FFF4E0', color: '#B45309'
              }}>
                Skill match: {skillScore.toFixed(2)}%
              </div>
            )}
          </div>

          {/* Skills columns */}
          {(matchData.skillsMatched?.length > 0 || matchData.skillsMissing?.length > 0) && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
              {matchData.skillsMatched?.length > 0 && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#137333', margin: '0 0 10px' }}>Skills matched</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {matchData.skillsMatched.map(s => (
                      <SkillChip key={s} icon="✓" bg="#E7F5E8" color="#137333">{s}</SkillChip>
                    ))}
                  </div>
                </div>
              )}
              {matchData.skillsMissing?.length > 0 && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: '#D93025', margin: '0 0 10px' }}>Missing skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {matchData.skillsMissing.map(s => (
                      <SkillChip key={s} icon="✗" bg="#FEECEA" color="#D93025">{s}</SkillChip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upgrade prompt */}
          {matchData.skillsMissing?.length > 0 && (
            <div style={{
              marginTop: '16px', paddingTop: '16px',
              borderTop: '1px solid #D0E4FF',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <p style={{ fontSize: '13px', color: '#595959', margin: 0 }}>
                Adding {matchData.skillsMissing.length} skill{matchData.skillsMissing.length !== 1 ? 's' : ''} could improve your match to{' '}
                <strong style={{ color: '#137333' }}>{Math.min(score + matchData.skillsMissing.length * 5, 99)}%</strong>
              </p>
              <a href="/profile" style={{
                fontSize: '13px', color: '#2557A7', fontWeight: '600',
                textDecoration: 'none',
              }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
              >
                Update your profile →
              </a>
            </div>
          )}

          {/* ATS recommendations */}
          {matchData.atsRecommendations?.length > 0 && (
            <div style={{
              marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #D0E4FF'
            }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: '#1A1A2E', margin: '0 0 8px' }}>
                ATS tips to improve your resume
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#595959', fontSize: '13px' }}>
                {matchData.atsRecommendations.map((tip) => (
                  <li key={tip} style={{ marginBottom: '6px' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Job Details Box ── */}
      <div style={{ border: '1px solid #E4E2E0', borderRadius: '8px', padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#2D2D2D', margin: '0 0 4px' }}>Job details</h2>
        <p style={{ fontSize: '13px', color: '#767676', margin: '0 0 16px' }}>
          Here's how the job details align with your{' '}
          <a href="/profile" style={{ color: '#2557A7', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >profile</a> ↗
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {salaryText && (
            <DetailRow icon={<DollarSign size={18} />} label="Pay">
              {salaryText}
            </DetailRow>
          )}
          {job.jobType?.length > 0 && (
            <DetailRow icon={<Briefcase size={18} />} label="Job type">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {job.jobType.map(t => (
                  <span key={t} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '4px 12px', backgroundColor: '#E7F5E8', color: '#137333',
                    borderRadius: '4px', fontSize: '13px', fontWeight: '500',
                  }}>
                    ✓ {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                ))}
              </div>
            </DetailRow>
          )}
          {job.location && (
            <DetailRow icon={<MapPin size={18} />} label="Location">
              {job.location}{job.workMode ? ` · ${job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}` : ''}
            </DetailRow>
          )}
        </div>
      </div>

      {/* ── Company Reviews ── */}
      {job.company && <CompanyReviews companyName={job.company} />}

      {/* ── Required Skills ── */}
      {skills.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#2D2D2D', margin: '0 0 12px' }}>Required skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map(s => (
              <span key={s} style={{
                padding: '6px 14px', backgroundColor: '#F7F9FC',
                border: '1px solid #E4E2E0', borderRadius: '20px',
                fontSize: '13px', color: '#595959',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Full Description ── */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#2D2D2D', margin: '0 0 12px' }}>Full job description</h2>
        <div style={{ fontSize: '14px', color: '#595959', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
          {job.description}
        </div>
      </div>
      </div>

      {/* Sticky footer (keeps the end of scroll looking intentional) */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        marginTop: '24px',
        background: 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0.85) 100%)',
        paddingTop: '16px',
      }}>
        <div style={{
          border: '1px solid #E4E2E0',
          borderRadius: '10px',
          padding: '12px 12px',
          backgroundColor: 'white',
          boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', color: '#767676' }}>Ready to apply?</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: '#2D2D2D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '420px' }}>
              {job.company} · {job.location}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {applied ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '0 16px', height: '40px', backgroundColor: '#E7F5E8',
                color: '#137333', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                border: '1px solid #A8D5AD',
                whiteSpace: 'nowrap',
              }}>
                ✓ Applied
              </span>
            ) : (
              <button
                onClick={onApply}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 18px', height: '40px',
                  backgroundColor: '#2557A7', color: 'white',
                  borderRadius: '8px', border: 'none',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1D4589'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2557A7'}
              >
                Apply now
              </button>
            )}

            <button
              onClick={onSave}
              style={{
                height: '40px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1px solid #E4E2E0',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: saved ? '#2557A7' : '#2D2D2D',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#2557A7'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E4E2E0'}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */
function SkillChip({ icon, bg, color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      height: '28px', padding: '0 10px', borderRadius: '14px',
      backgroundColor: bg, color, fontSize: '13px', fontWeight: '500',
    }}>
      <span style={{ fontSize: '11px', fontWeight: '700' }}>{icon}</span>
      {children}
    </span>
  )
}

function DetailRow({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ color: '#767676', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: '#2D2D2D', margin: '0 0 4px' }}>{label}</p>
        <div style={{ fontSize: '13px', color: '#595959' }}>{children}</div>
      </div>
    </div>
  )
}

function ActionIconBtn({ onClick, title, children }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '1px solid #E4E2E0', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer',
        backgroundColor: hov ? '#F7F9FC' : 'white', transition: 'all 0.15s', flexShrink: 0,
      }}>
      {children}
    </button>
  )
}
