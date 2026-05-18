import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapPin, Bookmark, MoreHorizontal, ArrowRight } from 'lucide-react'
import Navbar from '../../components/shared/Navbar'
import ApplicationRow from '../../components/applicant/ApplicationRow'
import InterviewCard from '../../components/applicant/InterviewCard'
import { getMyApplications, getSavedJobs, archiveApplication, unarchiveApplication } from '../../services/applicationService'

const TABS = [
  { key: 'saved',      label: 'Saved' },
  { key: 'applied',    label: 'Applied' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'archived',   label: 'Archived' },
]

/* ── SVG Illustrations ── */
const SavedSVG = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
    <ellipse cx="100" cy="140" rx="70" ry="10" fill="var(--cc-blue-light)" />
    <rect x="50" y="20" width="100" height="110" rx="8" fill="var(--cc-blue-border)" />
    <rect x="58" y="30" width="84" height="90" rx="6" fill="var(--cc-surface)" />
    <rect x="66" y="44" width="60" height="8" rx="4" fill="var(--cc-blue)" opacity="0.7" />
    <rect x="66" y="58" width="45" height="6" rx="3" fill="var(--cc-blue-border)" />
    <rect x="66" y="70" width="52" height="6" rx="3" fill="var(--cc-blue-border)" />
    <path d="M130 95 L137 108 L150 110 L140 120 L142 133 L130 126 L118 133 L120 120 L110 110 L123 108 Z" fill="#F5A623" />
  </svg>
)

const AppliedSVG = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
    <ellipse cx="100" cy="145" rx="65" ry="9" fill="var(--cc-blue-light)" />
    <rect x="45" y="30" width="75" height="100" rx="6" fill="var(--cc-blue-light)" />
    <rect x="52" y="38" width="61" height="84" rx="4" fill="white" />
    <rect x="60" y="48" width="45" height="6" rx="3" fill="var(--cc-blue)" opacity="0.6" />
    <rect x="60" y="60" width="35" height="5" rx="2.5" fill="var(--cc-blue-border)" />
    <rect x="60" y="71" width="40" height="5" rx="2.5" fill="var(--cc-blue-border)" />
    <rect x="60" y="82" width="30" height="5" rx="2.5" fill="var(--cc-blue-border)" />
    {/* Paper airplane */}
    <g transform="rotate(-30,130,80)">
      <path d="M110 80 L155 65 L120 90 Z" fill="var(--cc-blue)" />
      <path d="M110 80 L155 65 L130 110 Z" fill="var(--cc-blue-hover)" />
      <path d="M120 90 L130 110 L118 95 Z" fill="var(--cc-blue-hover)" />
    </g>
  </svg>
)

const InterviewSVG = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
    <ellipse cx="100" cy="145" rx="65" ry="9" fill="var(--cc-blue-light)" />
    <rect x="40" y="25" width="120" height="100" rx="8" fill="var(--cc-blue-border)" />
    <rect x="40" y="40" width="120" height="85" rx="0" fill="var(--cc-surface)" />
    <rect x="40" y="40" width="120" height="85" rx="0" fill="var(--cc-surface)" />
    {/* Calendar grid */}
    {[0,1,2,3,4,5].map(col => [0,1,2,3].map(row => (
      <rect key={`${col}-${row}`}
        x={52 + col * 17} y={55 + row * 17}
        width="12" height="12" rx="2"
        fill={col === 2 && row === 1 ? 'var(--cc-blue)' : 'var(--cc-blue-light)'}
      />
    )))}
    {/* Calendar rings */}
    <rect x="62" y="22" width="8" height="16" rx="4" fill="var(--cc-blue)" />
    <rect x="130" y="22" width="8" height="16" rx="4" fill="var(--cc-blue)" />
    <circle cx="150" cy="120" r="22" fill="var(--cc-green-bg)" />
    <path d="M142 120l5 5 11-11" stroke="var(--cc-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ArchivedSVG = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
    <ellipse cx="100" cy="145" rx="65" ry="9" fill="var(--cc-blue-light)" />
    <rect x="45" y="60" width="110" height="75" rx="6" fill="var(--cc-blue-border)" />
    <rect x="50" y="68" width="100" height="67" rx="4" fill="white" />
    <rect x="70" y="45" width="60" height="20" rx="4" fill="var(--cc-blue)" />
    <rect x="60" y="52" width="80" height="15" rx="4" fill="var(--cc-blue-hover)" />
    <rect x="65" y="82" width="70" height="6" rx="3" fill="var(--cc-blue-light)" />
    <rect x="65" y="94" width="55" height="6" rx="3" fill="var(--cc-blue-light)" />
    <rect x="65" y="106" width="62" height="6" rx="3" fill="var(--cc-blue-light)" />
  </svg>
)

function EmptyState({ illustration: Illustration, title, subtitle, cta = 'Find jobs', link = '/dashboard/applicant', extra }) {
  const [hov, setHov] = useState(false)
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center',
    }}>
      <Illustration />
      <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '24px 0 8px' }}>
        {title}
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--cc-text-3)', margin: '0 0 4px', maxWidth: '320px', lineHeight: 1.5 }}>
        {subtitle}
      </p>
      {extra && (
        <button style={{
          fontSize: '13px', color: 'var(--cc-blue)', background: 'none',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: '16px', textDecoration: 'underline', padding: 0,
        }}>
          {extra}
        </button>
      )}
      <Link
        to={link}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          marginTop: extra ? '8px' : '24px',
          padding: '0 24px', height: '44px',
          backgroundColor: hov ? 'var(--cc-blue-hover)' : 'var(--cc-blue)',
          color: 'white', borderRadius: '6px',
          fontSize: '14px', fontWeight: '600',
          textDecoration: 'none', transition: 'background 0.15s',
        }}
      >
        {cta} <ArrowRight size={16} />
      </Link>
    </div>
  )
}

export default function MyJobs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'saved'
  const [applications, setApplications] = useState([])
  const [savedJobs, setSavedJobs]       = useState([])
  const [appliedJobIds, setAppliedJobIds] = useState(new Set())
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [apps, saved] = await Promise.all([getMyApplications(), getSavedJobs()])
        setApplications(apps)
        setSavedJobs(saved)
        // Build set of applied job IDs so saved tab can show "Applied" badge
        setAppliedJobIds(new Set(apps.map(a => (a.job?._id || a.job || '').toString())))
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Filter applications by tab
  const applied    = applications.filter(a => a.status !== 'archived' && !a.interview)
  const interviews = applications.filter(a => a.interview)
  const archived   = applications.filter(a => a.status === 'archived')

  const counts = {
    saved:      savedJobs.length,
    applied:    applied.length,
    interviews: interviews.length,
    archived:   archived.length,
  }

  const handleArchive = async (appId) => {
    await archiveApplication(appId)
    setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: 'archived' } : a))
  }

  const handleUnarchive = async (appId) => {
    await unarchiveApplication(appId)
    setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: 'pending' } : a))
  }

  return (
    <div className="myjobs-root" style={{
      minHeight: '100vh',
      background: 'var(--cc-bg-gradient)',
      fontFamily: '"Noto Sans", "Helvetica Neue", Arial, sans-serif',
    }}>
      <Navbar />

      <div className="myjobs-container" style={{ paddingTop: '60px', maxWidth: '900px', margin: '0 auto', padding: '60px 40px 0' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '32px 0 24px' }}>
          My jobs
        </h1>

        {/* ── Tabs ── */}
        <div className="myjobs-tabs" style={{ borderBottom: '1px solid var(--cc-border)', display: 'flex', marginBottom: '0' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.key
            const count  = counts[tab.key]
            return (
              <button
                key={tab.key}
                onClick={() => setSearchParams({ tab: tab.key })}
                className="myjobs-tabbtn"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '16px 24px', fontSize: '15px',
                  fontWeight: active ? '600' : '400',
                  color: active ? 'var(--cc-blue)' : 'var(--cc-text-2)',
                  background: 'none', border: 'none',
                  borderBottom: active ? '3px solid var(--cc-blue)' : '3px solid transparent',
                  marginBottom: '-1px', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'var(--cc-surface-2)' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{
                    fontSize: '13px',
                    color: active ? 'var(--cc-blue)' : 'var(--cc-text-3)',
                    fontWeight: active ? '700' : '400',
                  }}>
                    ({count})
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Content card ── */}
        <div style={{
          backgroundColor: 'var(--cc-surface)',
          borderRadius: '0 0 8px 8px',
          border: '1px solid var(--cc-border)',
          borderTop: 'none',
          overflow: 'hidden',
          marginBottom: '40px',
        }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--cc-text-3)', fontSize: '14px' }}>
              <div style={{ display: 'inline-flex', gap: '8px' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: 'var(--cc-blue)', opacity: 0.7,
                    animation: `bounce 0.9s ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
              <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}`}</style>
            </div>
          ) : (
            <>
              {/* SAVED */}
              {activeTab === 'saved' && (
                savedJobs.length === 0
                  ? <EmptyState
                      illustration={SavedSVG}
                      title="No saved jobs yet"
                      subtitle="When you save a job, it will appear here so you can apply later."
                      extra="Not seeing a job?"
                    />
                  : <div>
                      {savedJobs.map(s => {
                        const job = s.job || {}
                        const jobId = (job._id || '').toString()
                        const isApplied = appliedJobIds.has(jobId)
                        return (
                          <SavedJobRow key={s._id} job={job} savedAt={s.createdAt} isApplied={isApplied} />
                        )
                      })}
                      <p style={{ textAlign: 'center', padding: '12px', fontSize: '13px', borderTop: '1px solid var(--cc-border)' }}>
                        <a href="#" style={{ color: 'var(--cc-blue)', textDecoration: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >Not seeing a job?</a>
                      </p>
                    </div>
              )}

              {/* APPLIED */}
              {activeTab === 'applied' && (
                applied.length === 0
                  ? <EmptyState
                      illustration={AppliedSVG}
                      title="No applications yet"
                      subtitle="Keep track of job applications here."
                      extra="Not seeing an application?"
                    />
                  : applied.map(a => <ApplicationRow key={a._id} application={a} onArchive={handleArchive} />)
              )}

              {/* INTERVIEWS */}
              {activeTab === 'interviews' && (
                interviews.length === 0
                  ? <InterviewEmpty />
                  : interviews.map(a => <InterviewCard key={a._id} application={a} />)
              )}

              {/* ARCHIVED */}
              {activeTab === 'archived' && (
                archived.length === 0
                  ? <EmptyState
                      illustration={ArchivedSVG}
                      title="Nothing archived yet"
                      subtitle="Applications you archive or jobs that close appear here."
                    />
                  : archived.map(a => <ApplicationRow key={a._id} application={a} onUnarchive={handleUnarchive} />)
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .myjobs-container { padding: 60px 16px 0 !important; }
          .myjobs-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .myjobs-tabbtn { padding: 14px 16px !important; }

          /* ── Saved tab: stack actions below info on mobile ── */
          .saved-job-row {
            flex-wrap: wrap !important;
            gap: 12px !important;
            align-items: flex-start !important;
          }
          .saved-job-row .saved-job-actions {
            width: 100% !important;
            flex-shrink: 0 !important;
            justify-content: flex-start !important;
            padding-left: 64px !important; /* align with text (48px logo + 16px gap) */
            flex-wrap: wrap !important;
            gap: 8px !important;
          }

          /* ── Applied/Archived tab: stack status row below info ── */
          /* The outer row wraps so the right column drops below the info column */
          .app-row-inner {
            flex-wrap: wrap !important;
            align-items: flex-start !important;
          }
          /* The info column must never shrink to zero — give it full width on wrap */
          .app-row-inner .flex-1 {
            min-width: 0 !important;
            /* On wrap, the info column takes the remaining width after the logo */
            flex-basis: calc(100% - 64px) !important;
          }
          /* The right column drops to its own row, left-aligned under the info */
          .app-row-right {
            width: 100% !important;
            flex-shrink: 0 !important;
            display: flex !important;
            flex-wrap: wrap !important;
            align-items: center !important;
            gap: 6px !important;
            padding-left: 64px !important; /* align with text (48px logo + 16px gap) */
          }
        }
      `}</style>
    </div>
  )
}

/* ── Saved Job Row ── */
function SavedJobRow({ job, savedAt, isApplied }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="saved-job-row"
      style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '20px 24px',
        borderBottom: '1px solid var(--cc-border)',
        backgroundColor: hov ? 'var(--cc-surface-2)' : 'var(--cc-surface)',
        transition: 'background 0.12s',
      }}
    >
      {/* Company logo placeholder */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '8px',
        border: '1px solid var(--cc-border)',
        backgroundColor: 'var(--cc-blue-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: '700', color: 'var(--cc-blue)',
        flexShrink: 0,
      }}>
        {(job.company || 'C').slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 2px' }}>{job.title}</h3>
        <p style={{ fontSize: '14px', color: 'var(--cc-text-2)', margin: '0 0 2px' }}>{job.company}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--cc-text-3)' }}>
          <MapPin size={12} />
          <span>{job.location}</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--cc-text-3)', margin: '4px 0 0' }}>
          Saved on {new Date(savedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Actions */}
      <div className="saved-job-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isApplied ? (
          <>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '0 16px', height: '40px',
              backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)',
              borderRadius: '6px', fontSize: '14px', fontWeight: '600',
              border: '1px solid var(--cc-green-border)',
            }}>
              ✓ Applied
            </span>
            <Link to="/my-jobs?tab=applied" style={{
              fontSize: '13px', color: 'var(--cc-blue)', textDecoration: 'none', fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              View application
            </Link>
          </>
        ) : (
          <Link to={`/dashboard/applicant?job=${job._id}`} style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '0 20px', height: '40px',
            backgroundColor: 'var(--cc-blue)', color: 'white',
            borderRadius: '6px', fontSize: '14px', fontWeight: '600',
            textDecoration: 'none', transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue-hover)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--cc-blue)'}
          >
            Apply now
          </Link>
        )}
        <button style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '1px solid var(--cc-border)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--cc-surface)',
          color: 'var(--cc-blue)',
        }}>
          <Bookmark size={16} fill="var(--cc-blue)" color="var(--cc-blue)" />
        </button>
        <button style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '1px solid var(--cc-border)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', backgroundColor: 'var(--cc-surface)',
          color: 'var(--cc-text-2)',
        }}>
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}

/* ── Interviews empty state (special — has "Interview services" card) ── */
function InterviewEmpty() {
  return (
    <div>
      <EmptyState
        illustration={InterviewSVG}
        title="No interviews yet"
        subtitle="Scheduled interviews appear here."
        extra="Not seeing an interview?"
        cta="Find jobs"
      />
      {/* Interview services card */}
      <div style={{ margin: '0 24px 32px', border: '1px solid var(--cc-border)', borderRadius: '8px', padding: '20px', backgroundColor: 'var(--cc-surface)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 16px' }}>Interview services</h3>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px', border: '1px solid var(--cc-border)', borderRadius: '8px',
          backgroundColor: 'var(--cc-surface-2)',
        }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)', margin: '0 0 4px' }}>Setup device for interview</p>
            <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: '0 0 8px' }}>Test your camera and microphone ahead of time.</p>
            <a href="#" style={{
              fontSize: '14px', color: 'var(--cc-blue)', fontWeight: '600',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px',
            }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
            >
              Test your device <ArrowRight size={14} />
            </a>
          </div>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ flexShrink: 0 }}>
            <rect x="18" y="10" width="28" height="44" rx="6" fill="var(--cc-blue-border)" />
            <rect x="22" y="16" width="20" height="30" rx="2" fill="var(--cc-surface)" />
            <circle cx="32" cy="50" r="3" fill="var(--cc-blue)" />
            <circle cx="38" cy="28" r="8" fill="var(--cc-blue)" opacity="0.8" />
            <path d="M35 28l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  )
}
