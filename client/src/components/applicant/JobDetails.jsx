import { MapPin, Briefcase, ExternalLink, Bookmark, ThumbsDown, Share2, Star, DollarSign, Flag } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatSalary } from '../../utils/formatSalary'
import ShareJobModal from './ShareJobModal'
import ReportJobModal from './ReportJobModal'
import CompanyReviews from './CompanyReviews'
import AIScoreModal from './AIScoreModal'

// ── Color tiers for AI match ─────────────────────────────────────────────
function matchTier(score) {
  if (score >= 80) return { bg: 'var(--cc-green-bg)', border: 'var(--cc-green-border)', color: 'var(--cc-green)', label: 'Great match!', chipBg: 'var(--cc-green-bg)', chipText: 'var(--cc-green)' }
  if (score >= 60) return { bg: 'var(--cc-amber-bg)', border: 'var(--cc-amber)', color: 'var(--cc-amber)', label: 'Good match',   chipBg: 'var(--cc-amber-bg)', chipText: 'var(--cc-amber)' }
  return            { bg: 'var(--cc-surface-2)',  border: 'var(--cc-border)', color: 'var(--cc-text-3)', label: 'Partial match', chipBg: 'var(--cc-surface-2)', chipText: 'var(--cc-text-2)' }
}

export default function JobDetails({ job, matchData, matchLoading, onApply, onSave, saved, applied, onDislike, disliked, allJobs = [], onSelectJob }) {
  const [shareOpen, setShareOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [scoreModalOpen, setScoreModalOpen] = useState(false)

  if (!job) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cc-text-3)' }}>
      <div style={{ textAlign: 'center' }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" style={{ margin: '0 auto 16px', display: 'block' }}>
          <circle cx="60" cy="60" r="56" fill="var(--cc-blue-light)" />
          <rect x="38" y="32" width="44" height="56" rx="4" fill="var(--cc-blue-border)" />
          <rect x="44" y="42" width="32" height="4" rx="2" fill="var(--cc-blue)" opacity="0.5" />
          <rect x="44" y="52" width="24" height="4" rx="2" fill="var(--cc-blue)" opacity="0.3" />
          <rect x="44" y="62" width="28" height="4" rx="2" fill="var(--cc-blue)" opacity="0.3" />
          <circle cx="82" cy="80" r="16" fill="var(--cc-blue)" />
          <path d="M76 80l4 4 8-8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p style={{ fontWeight: '600', color: 'var(--cc-text-1)', marginBottom: '4px', fontSize: '15px' }}>Select a job to view details</p>
        <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: 0 }}>Click any job on the left to read the full description</p>
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
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 8px', lineHeight: 1.35 }}>
        {job.title}
      </h1>

      {/* Company row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
        <a href="#" style={{ fontSize: '14px', color: 'var(--cc-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {job.company} <ExternalLink size={12} />
        </a>
        <span style={{ color: 'var(--cc-border)' }}>·</span>
        <a href="#company-reviews" style={{ display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
        >
          <Star size={13} fill="var(--cc-amber)" color="var(--cc-amber)" />
          <span style={{ fontSize: '13px', color: 'var(--cc-text-2)', fontWeight: '600' }}>Company Reviews</span>
        </a>
      </div>
      <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <MapPin size={13} style={{ color: 'var(--cc-text-3)', flexShrink: 0 }} />
        {job.location}
      </p>

      {/* ── Action Buttons ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {applied ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 20px', height: '40px', backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)', borderRadius: '6px', fontSize: '14px', fontWeight: '600', border: '1px solid var(--cc-green-border)' }}>✓ Applied</span>
        ) : (
          <button onClick={onApply} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 20px', height: '40px', backgroundColor: 'var(--cc-blue)', color: 'white', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue)'}
          >Apply now</button>
        )}
        <ActionIconBtn onClick={onSave} title={saved ? 'Remove from saved' : 'Save job'}>
          <Bookmark size={18} fill={saved ? 'var(--cc-blue)' : 'none'} color={saved ? 'var(--cc-blue)' : 'var(--cc-text-2)'} />
        </ActionIconBtn>
        <ActionIconBtn onClick={onDislike} title={disliked ? 'Undo hide' : 'Not interested'}>
          <ThumbsDown size={18} color={disliked ? 'var(--cc-red)' : 'var(--cc-text-2)'} fill={disliked ? 'var(--cc-red)' : 'none'} />
        </ActionIconBtn>
        <ActionIconBtn onClick={() => setShareOpen(true)} title="Share job">
          <Share2 size={18} color="var(--cc-text-2)" />
        </ActionIconBtn>
        <ActionIconBtn onClick={() => setReportOpen(true)} title="Report job">
          <Flag size={18} color="var(--cc-text-2)" />
        </ActionIconBtn>
      </div>

      {/* Modals */}
      {shareOpen && <ShareJobModal job={job} onClose={() => setShareOpen(false)} />}
      {reportOpen && <ReportJobModal job={job} onClose={() => setReportOpen(false)} onSuccess={() => setReportOpen(false)} />}
      {scoreModalOpen && <AIScoreModal onClose={() => setScoreModalOpen(false)} />}

      {/* ── AI Match Section ── */}
      {matchLoading ? (
        <div style={{
          backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)',
          borderRadius: '8px', padding: '20px', marginBottom: '24px',
        }}>
          {[{ w: '100px', h: '64px' }, { w: '160px', h: '13px' }, { w: '220px', h: '12px' }].map((b, i) => (
            <div key={i} style={{
              height: b.h, width: b.w, backgroundColor: 'var(--cc-blue-border)',
              borderRadius: '6px', marginBottom: '12px',
              animation: 'matchPulse 1.4s ease-in-out infinite',
            }} />
          ))}
          <style>{`@keyframes matchPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      ) : score != null && tier ? (
        <div style={{
          backgroundColor: 'var(--cc-blue-light)', border: '1px solid var(--cc-blue-border)',
          borderRadius: '8px', padding: '20px', marginBottom: '24px',
        }}>
          {/* Score badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '8px' }}>
            <div style={{
              width: '80px', height: '72px', borderRadius: '12px',
              backgroundColor: tier.bg, border: `1px solid ${tier.border}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px',
              flexShrink: 0, overflow: 'hidden',
            }}>
              <span style={{ fontSize: '16px', fontWeight: '800', color: tier.color, lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap', display: 'block' }}>{Math.round(score)}%</span>
              <span style={{ fontSize: '10px', fontWeight: '600', color: tier.color, lineHeight: 1, letterSpacing: '0.05em', textAlign: 'center', display: 'block' }}>MATCH</span>
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: '700', color: tier.color, margin: '0 0 4px' }}>{tier.label}</p>
              <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0, lineHeight: 1.5 }}>
                Here's how your resume aligns with this job's requirements.
              </p>
              <button style={{
                fontSize: '13px', color: 'var(--cc-blue)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, marginTop: '6px',
                fontFamily: 'inherit',
              }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                onClick={() => setScoreModalOpen(true)}
              >
                How is this calculated?
              </button>
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
            <div style={{
              padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
              backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)'
            }}>
              Resume match: {Math.round(resumeScore)}%
            </div>
            {skillScore != null && (
              <div style={{
                padding: '6px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '700',
                backgroundColor: 'var(--cc-amber-bg)', color: 'var(--cc-amber)'
              }}>
                Skill match: {Math.round(skillScore)}%
              </div>
            )}
          </div>

          {/* Skills columns */}
          {(matchData.skillsMatched?.length > 0 || matchData.skillsMissing?.length > 0) && (
            <div style={{ display: 'flex', gap: '20px', marginTop: '16px' }}>
              {matchData.skillsMatched?.length > 0 && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-green)', margin: '0 0 10px' }}>Skills matched</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {matchData.skillsMatched.map(s => {
                      // Handle both new {skill, source} shape and legacy plain strings
                      const skillName = typeof s === 'object' && s !== null ? s.skill : s
                      const source    = typeof s === 'object' && s !== null ? s.source : null
                      return (
                        <SkillChip
                          key={skillName}
                          icon="✓"
                          bg="var(--cc-green-bg)"
                          color="var(--cc-green)"
                          source={source}
                        >
                          {skillName}
                        </SkillChip>
                      )
                    })}
                  </div>
                </div>
              )}
              {matchData.skillsMissing?.length > 0 && (
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-red)', margin: '0 0 10px' }}>Missing skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {matchData.skillsMissing.map(s => (
                      <SkillChip key={s} icon="✗" bg="var(--cc-red-bg)" color="var(--cc-red)">{s}</SkillChip>
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
              borderTop: '1px solid var(--cc-blue-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <p style={{ fontSize: '13px', color: 'var(--cc-text-2)', margin: 0 }}>
                Adding {matchData.skillsMissing.length} skill{matchData.skillsMissing.length !== 1 ? 's' : ''} could improve your match to{' '}
                <strong style={{ color: 'var(--cc-green)' }}>{parseFloat(Math.min(score + matchData.skillsMissing.length * 5, 99)).toFixed(1)}%</strong>
              </p>
              <a href="/profile" style={{
                fontSize: '13px', color: 'var(--cc-blue)', fontWeight: '600',
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
              marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed var(--cc-blue-border)'
            }}>
              <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 8px' }}>
                ATS tips to improve your resume
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--cc-text-2)', fontSize: '13px' }}>
                {matchData.atsRecommendations.map((tip) => (
                  <li key={tip} style={{ marginBottom: '6px' }}>{tip}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* ── Job Details Box ── */}
      <div style={{ border: '1px solid var(--cc-border)', borderRadius: '8px', padding: '20px', marginBottom: '24px', backgroundColor: 'var(--cc-surface)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>Job details</h2>
        <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: '0 0 16px' }}>
          Here's how the job details align with your{' '}
          <a href="/profile" style={{ color: 'var(--cc-blue)', textDecoration: 'none' }}
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
                    padding: '4px 12px', backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)',
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
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 12px' }}>Required skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map(s => (
              <span key={s} style={{
                padding: '6px 14px', backgroundColor: 'var(--cc-surface-2)',
                border: '1px solid var(--cc-border)', borderRadius: '20px',
                fontSize: '13px', color: 'var(--cc-text-2)',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Full Description ── */}
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 12px' }}>Full job description</h2>
        <div style={{ fontSize: '14px', color: 'var(--cc-text-2)', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>
          {job.description}
        </div>
      </div>
      </div>

      {/* ── Similar Jobs ── */}
      {(() => {
        if (!allJobs.length || !onSelectJob) return null
        const jobSkills = new Set((job.requiredSkills || job.skills || []).map(s => s.toLowerCase()))
        const similar = allJobs
          .filter(j => j._id !== job._id)
          .map(j => {
            const jSkills = (j.requiredSkills || j.skills || []).map(s => s.toLowerCase())
            const skillOverlap = jSkills.filter(s => jobSkills.has(s)).length
            const sameCompany  = j.company?.toLowerCase() === job.company?.toLowerCase() ? 3 : 0
            const titleWords   = job.title?.toLowerCase().split(/\s+/) || []
            const titleMatch   = titleWords.some(w => w.length > 3 && j.title?.toLowerCase().includes(w)) ? 2 : 0
            return { job: j, score: skillOverlap + sameCompany + titleMatch }
          })
          .filter(x => x.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)

        if (!similar.length) return null
        return (
          <div style={{ marginTop: '28px', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>More jobs like this</span>
              <span style={{ fontSize: '12px', color: 'var(--cc-text-4)', fontWeight: '400' }}>— you might like these</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {similar.map(({ job: sj }) => (
                <button key={sj._id} onClick={() => onSelectJob(sj)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '9px',
                    border: '1px solid var(--cc-border)', backgroundColor: 'var(--cc-surface)',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cc-blue)'; e.currentTarget.style.backgroundColor = 'var(--cc-blue-light)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--cc-border)'; e.currentTarget.style.backgroundColor = 'var(--cc-surface)' }}
                >
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--cc-blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '15px', fontWeight: '700', color: 'var(--cc-blue)' }}>
                    {(sj.company || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sj.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cc-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sj.company} · {sj.location}</p>
                  </div>
                  {sj.jobType?.[0] && (
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--cc-blue)', backgroundColor: 'var(--cc-blue-light)', padding: '2px 8px', borderRadius: '10px', flexShrink: 0 }}>
                      {sj.jobType[0]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Sticky footer (keeps the end of scroll looking intentional) */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        marginTop: '24px',
        background: 'linear-gradient(to top, var(--cc-surface) 70%, rgba(255,255,255,0))',
        paddingTop: '16px',
      }}>
        <div style={{
          border: '1px solid var(--cc-border)',
          borderRadius: '10px',
          padding: '12px 12px',
          backgroundColor: 'var(--cc-surface)',
          boxShadow: 'var(--cc-shadow-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap',
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--cc-text-3)' }}>Ready to apply?</p>
            <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, color: 'var(--cc-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '420px' }}>
              {job.company} · {job.location}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {applied ? (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '0 16px', height: '40px', backgroundColor: 'var(--cc-green-bg)',
                color: 'var(--cc-green)', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
                border: '1px solid var(--cc-green-border)',
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
                  backgroundColor: 'var(--cc-blue)', color: 'var(--cc-text-4)',
                  borderRadius: '8px', border: 'none',
                  fontSize: '14px', fontWeight: '600', cursor: 'pointer',
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue)'}
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
                border: '1px solid var(--cc-border)',
                backgroundColor: 'var(--cc-surface)',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                color: saved ? 'var(--cc-blue)' : 'var(--cc-text-1)',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--cc-blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--cc-border)'}
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

// Source badge config — only shown for resume-sourced and both-sourced skills.
// Onboarding skills show no badge (they are the baseline expectation).
const SOURCE_BADGE = {
  resume: { label: 'Resume', bg: 'rgba(20,115,51,0.12)', color: 'var(--cc-green)' },
  both:   { label: 'Both',   bg: 'rgba(180,83,9,0.12)',  color: 'var(--cc-amber)' },
}

function SkillChip({ icon, bg, color, source, children }) {
  // Only render a badge for resume/both — not for onboarding (no badge = cleaner UI)
  const badge = source && SOURCE_BADGE[source] ? SOURCE_BADGE[source] : null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      height: '28px', padding: '0 10px', borderRadius: '14px',
      backgroundColor: bg, color, fontSize: '13px', fontWeight: '500',
    }}>
      <span style={{ fontSize: '11px', fontWeight: '700' }}>{icon}</span>
      {children}
      {badge && (
        <span style={{
          fontSize: '10px', fontWeight: '700',
          padding: '1px 5px', borderRadius: '6px',
          backgroundColor: badge.bg, color: badge.color,
          marginLeft: '2px', letterSpacing: '0.02em',
        }}>
          {badge.label}
        </span>
      )}
    </span>
  )
}

function DetailRow({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
      <div style={{ color: 'var(--cc-text-3)', flexShrink: 0, marginTop: '1px' }}>{icon}</div>
      <div>
        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>{label}</p>
        <div style={{ fontSize: '13px', color: 'var(--cc-text-2)' }}>{children}</div>
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
        border: '1px solid var(--cc-border)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', cursor: 'pointer',
        backgroundColor: hov ? 'var(--cc-surface-2)' : 'var(--cc-surface)', transition: 'all 0.15s', flexShrink: 0,
      }}>
      {children}
    </button>
  )
}
