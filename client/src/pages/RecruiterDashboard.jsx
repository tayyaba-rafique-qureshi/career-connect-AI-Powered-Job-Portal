import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import EmployerLayout from '../components/employer/EmployerLayout'
import BuyCreditsButton from '../components/recruiter/BuyCreditsButton'
import MobileNavBar from '../components/mobile/MobileNavBar'
import useIsMobile from '../hooks/useIsMobile'
import api from '../services/api'
import { getNotifications } from '../services/notificationService'
import { Briefcase, Users, PlusCircle, Eye, BarChart2, CreditCard, ChevronRight, Bell, Menu, X, Sun, Moon } from 'lucide-react'

const scoreColor = (score) =>
  score >= 80 ? 'bg-green-100 text-green-700' :
  score >= 60 ? 'bg-yellow-100 text-yellow-700' :
  'bg-red-100 text-red-700'

const STATUS_STYLES = {
  pending:     'bg-gray-100 text-gray-600',
  reviewed:    'bg-blue-100 text-blue-700',
  shortlisted: 'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
  accepted:    'bg-emerald-100 text-emerald-700',
}

// ── Mobile top navbar for recruiter ──────────────────────────────────────────
// Shows: hamburger (opens EmployerLayout sidebar) | CareerConnect logo | Bell | Dark mode
// The sidebar is owned by EmployerLayout — on mobile we trigger it via a custom event
// since we can't pass setSidebarOpen down. Instead we render the full EmployerLayout
// wrapper even on mobile, and override the topbar via CSS to show our custom one.
// Simpler approach: self-contained navbar that opens a local drawer with nav links.
function RecruiterMobileNavbar({ unreadCount, isDark, toggleTheme }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const navItems = [
    { label: 'Dashboard', href: '/dashboard/recruiter' },
    { label: 'Post a Job', href: '/dashboard/recruiter/post-job' },
    { label: 'My Jobs', href: '/dashboard/recruiter/jobs' },
    { label: 'Messages', href: '/employer/messages' },
  ]

  return (
    <>
      {/* Top bar */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: '56px',
        backgroundColor: 'var(--cc-surface)',
        borderBottom: '1px solid var(--cc-border)',
        display: 'flex', alignItems: 'center',
        padding: '0 12px',
        boxShadow: 'var(--cc-shadow)',
        gap: '8px',
      }}>
        {/* Hamburger */}
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cc-text-1)', flexShrink: 0,
          }}
        >
          <Menu size={22} />
        </button>

        {/* Logo — left-aligned, immediately after hamburger */}
        <Link to="/dashboard/recruiter" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--cc-text-1)', letterSpacing: '-0.3px' }}>Career</span>
          <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--cc-blue)', letterSpacing: '-0.3px' }}>Connect</span>
        </Link>

        {/* Spacer — pushes icons to the right */}
        <div style={{ flex: 1 }} />

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cc-text-2)', flexShrink: 0,
          }}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notification bell */}
        <Link to="/notifications" style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--cc-text-2)',
          }}>
            <Bell size={20} />
          </div>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '4px',
              minWidth: '16px', height: '16px', padding: '0 4px',
              backgroundColor: '#D93025', borderRadius: '8px',
              border: '2px solid var(--cc-surface)',
              fontSize: '9px', fontWeight: '700', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
      </header>

      {/* Sidebar drawer */}
      {drawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
          />
          {/* Panel */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0,
            width: '72%', maxWidth: '280px',
            backgroundColor: 'var(--cc-surface)',
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Drawer header */}
            <div style={{
              height: '56px', padding: '0 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid var(--cc-border)',
            }}>
              <Link to="/dashboard/recruiter" onClick={() => setDrawerOpen(false)} style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--cc-text-1)' }}>Career</span>
                <span style={{ fontSize: '17px', fontWeight: '800', color: 'var(--cc-blue)' }}>Connect</span>
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-text-2)', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
              {navItems.map(item => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setDrawerOpen(false)}
                  style={{
                    display: 'block', padding: '11px 14px', borderRadius: '8px',
                    fontSize: '14px', fontWeight: '500', color: 'var(--cc-text-1)',
                    textDecoration: 'none', marginBottom: '2px',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--cc-surface-2)'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Sign out */}
            <div style={{ padding: '12px 8px', borderTop: '1px solid var(--cc-border)' }}>
              <button
                onClick={() => { logout(); navigate('/login') }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: '8px',
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '14px', fontWeight: '500', color: 'var(--cc-red)',
                  textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Credits card (desktop) ────────────────────────────────────────────────────
function CreditsCard() {
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api.get('/payments/credits').then(({ data }) => setCredits(data.credits ?? 0)).catch(() => {}).finally(() => setLoading(false))
  }, [])
  if (loading) return null
  const isEmpty = credits === 0
  return (
    <div className={`rounded-xl border p-5 mb-8 shadow-sm ${isEmpty ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' : 'bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-gray-700'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${isEmpty ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
            <CreditCard size={20} className={isEmpty ? 'text-red-600 dark:text-red-400' : 'text-[#2557A7]'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-0.5">Job Post Credits</p>
            <p className="text-sm text-[#595959] dark:text-gray-400">
              You have <span className={`text-2xl font-bold ${isEmpty ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{credits}</span> credit{credits !== 1 ? 's' : ''} remaining.
            </p>
            {isEmpty
              ? <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">You have no credits left. Buy more to post jobs.</p>
              : <p className="text-xs text-[#595959] dark:text-gray-500 mt-1">Each job post uses 1 credit.</p>}
          </div>
        </div>
        <div className="sm:flex-shrink-0"><BuyCreditsButton /></div>
      </div>
    </div>
  )
}

// ── Mobile credits mini-card ──────────────────────────────────────────────────
function MobileCreditsCard() {
  const [credits, setCredits] = useState(null)
  useEffect(() => {
    api.get('/payments/credits').then(({ data }) => setCredits(data.credits ?? 0)).catch(() => {})
  }, [])
  const isEmpty = credits === 0
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', marginBottom: '16px',
      backgroundColor: isEmpty ? 'var(--cc-red-bg)' : 'var(--cc-blue-light)',
      border: `1px solid ${isEmpty ? 'var(--cc-red)' : 'var(--cc-blue-border)'}`,
      borderRadius: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CreditCard size={18} style={{ color: isEmpty ? 'var(--cc-red)' : 'var(--cc-blue)', flexShrink: 0 }} />
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)' }}>Job Post Credits</p>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--cc-text-2)' }}>
            {credits === null ? '…' : <><span style={{ fontWeight: '700', color: isEmpty ? 'var(--cc-red)' : 'var(--cc-green)', fontSize: '15px' }}>{credits}</span> remaining</>}
          </p>
        </div>
      </div>
      <BuyCreditsButton />
    </div>
  )
}

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [stats, setStats]           = useState(null)
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    getNotifications().then(n => setUnreadCount(n.filter(x => !x.read).length)).catch(() => {})
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          api.get('/jobs/employer/stats'),
          api.get('/jobs/employer/mine'),
        ])
        setStats(statsRes.data)
        const jobs = jobsRes.data ?? []
        setRecentJobs(jobs.slice(0, 5))
        if (jobs.length > 0) {
          const appRequests = jobs.slice(0, 5).map(j =>
            api.get(`/jobs/${j._id}/applicants`).then(r =>
              (r.data ?? []).map(a => ({ ...a, jobTitle: j.title, jobId: j._id }))
            ).catch(() => [])
          )
          const nested = await Promise.all(appRequests)
          const all = nested.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          setRecentApps(all.slice(0, 5))
        }
      } catch (err) {
        console.error('[RecruiterDashboard] Failed to load data:', err.message)
        setError('Could not load dashboard data. The server may still be starting up.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Active Jobs',          value: stats?.activeJobs,        icon: Briefcase, color: 'bg-blue-50 text-[#2557A7]',    mobileColor: { bg: 'var(--cc-blue-light)', color: 'var(--cc-blue)' } },
    { label: 'Total Applications',   value: stats?.totalApplications, icon: Users,     color: 'bg-green-50 text-green-700',   mobileColor: { bg: 'var(--cc-green-bg)',   color: 'var(--cc-green)' } },
    { label: 'Interviews Scheduled', value: stats?.interviews,        icon: BarChart2, color: 'bg-purple-50 text-purple-700', mobileColor: { bg: 'rgba(126,34,206,0.1)', color: '#7C3AED' } },
    { label: 'Total Views',          value: stats?.totalViews,        icon: Eye,       color: 'bg-orange-50 text-orange-700', mobileColor: { bg: 'rgba(234,88,12,0.1)',  color: '#EA580C' } },
  ]

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--cc-bg)',
        fontFamily: '"Noto Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
        paddingBottom: '72px',
      }}>
        {/* Navbar with logo, dark mode, bell, hamburger */}
        <RecruiterMobileNavbar
          unreadCount={unreadCount}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />

        <div style={{ padding: '16px' }}>
          {/* Welcome text — below the navbar */}
          <div style={{ marginBottom: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--cc-text-1)', margin: '0 0 2px' }}>
              Hi, {user?.name?.split(' ')[0] || 'Recruiter'} 👋
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--cc-text-3)', margin: 0 }}>
              Here's your dashboard overview.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: 'var(--cc-amber-bg)', border: '1px solid var(--cc-amber)', borderRadius: '8px', fontSize: '13px', color: 'var(--cc-text-1)' }}>
              {error}
            </div>
          )}

          {/* Credits mini-card */}
          <MobileCreditsCard />

          {/* Stats — 2×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {statCards.map(({ label, value, icon: Icon, mobileColor }) => (
              <div key={label} style={{ backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', boxShadow: 'var(--cc-shadow)' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: mobileColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={18} style={{ color: mobileColor.color }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: 'var(--cc-text-1)', lineHeight: 1 }}>
                    {loading ? <span style={{ display: 'inline-block', width: '28px', height: '20px', backgroundColor: 'var(--cc-border)', borderRadius: '4px' }} /> : (value ?? 0)}
                  </p>
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--cc-text-3)', lineHeight: 1.3 }}>{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Job Postings */}
          <div style={{ backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden', boxShadow: 'var(--cc-shadow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--cc-border)' }}>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--cc-text-1)' }}>Recent Job Postings</p>
              <button onClick={() => navigate('/dashboard/recruiter/jobs')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-blue)', fontSize: '12px', fontWeight: '600', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '2px' }}>
                View all <ChevronRight size={14} />
              </button>
            </div>
            {loading ? (
              <div style={{ padding: '16px' }}>
                {[1,2,3].map(i => <div key={i} style={{ height: '48px', backgroundColor: 'var(--cc-border)', borderRadius: '6px', marginBottom: '8px', opacity: 0.5 }} />)}
              </div>
            ) : recentJobs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Briefcase size={28} style={{ color: 'var(--cc-border)', margin: '0 auto 8px', display: 'block' }} />
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--cc-text-3)' }}>No jobs posted yet.</p>
                <button onClick={() => navigate('/dashboard/recruiter/post-job')} style={{ marginTop: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cc-blue)', fontSize: '13px', fontWeight: '600', fontFamily: 'inherit' }}>Post your first job →</button>
              </div>
            ) : (
              recentJobs.map((job, idx) => (
                <div key={job._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < recentJobs.length - 1 ? '1px solid var(--cc-border)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--cc-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--cc-text-3)' }}>{job.applicationCount ?? 0} applicant{job.applicationCount !== 1 ? 's' : ''}{job.location ? ` · ${job.location}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '10px', backgroundColor: job.status === 'active' ? 'var(--cc-green-bg)' : job.status === 'draft' ? 'var(--cc-surface-2)' : 'var(--cc-red-bg)', color: job.status === 'active' ? 'var(--cc-green)' : job.status === 'draft' ? 'var(--cc-text-3)' : 'var(--cc-red)', textTransform: 'capitalize' }}>{job.status}</span>
                    <button onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/applicants`)} style={{ width: '30px', height: '30px', borderRadius: '6px', border: '1px solid var(--cc-border)', backgroundColor: 'var(--cc-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <ChevronRight size={14} style={{ color: 'var(--cc-text-3)' }} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent Applications */}
          {recentApps.length > 0 && (
            <div style={{ backgroundColor: 'var(--cc-surface)', border: '1px solid var(--cc-border)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--cc-shadow)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--cc-border)' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--cc-text-1)' }}>Recent Applications</p>
              </div>
              {recentApps.map((app, idx) => (
                <div key={app._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: idx < recentApps.length - 1 ? '1px solid var(--cc-border)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600', color: 'var(--cc-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.applicant?.name ?? 'Applicant'}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--cc-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.jobTitle} · {formatDate(app.createdAt)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, marginLeft: '8px' }}>
                    {app.matchScore != null && (
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 6px', borderRadius: '8px', backgroundColor: app.matchScore >= 80 ? 'var(--cc-green-bg)' : app.matchScore >= 60 ? 'var(--cc-amber-bg)' : 'var(--cc-red-bg)', color: app.matchScore >= 80 ? 'var(--cc-green)' : app.matchScore >= 60 ? 'var(--cc-amber)' : 'var(--cc-red)' }}>{app.matchScore}%</span>
                    )}
                    <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 7px', borderRadius: '8px', backgroundColor: 'var(--cc-surface-2)', color: 'var(--cc-text-2)', textTransform: 'capitalize' }}>{app.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FAB — Post a Job */}
        <button
          onClick={() => navigate('/dashboard/recruiter/post-job')}
          style={{ position: 'fixed', bottom: '76px', right: '16px', zIndex: 30, width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--cc-blue)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(37,87,167,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
          title="Post a Job" aria-label="Post a new job"
        >
          <PlusCircle size={24} />
        </button>

        <MobileNavBar variant="recruiter" />
      </div>
    )
  }

  // ── DESKTOP LAYOUT (unchanged) ─────────────────────────────────────────────
  return (
    <EmployerLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-[#595959] mt-1 text-sm">Here's what's happening with your job postings today.</p>
      </div>
      {error && <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg">{error}</div>}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={20} /></div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">{loading ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" /> : (value ?? 0)}</p>
              <p className="text-xs text-[#595959] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/dashboard/recruiter/post-job')} className="flex items-center gap-2 px-4 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] text-white text-sm font-medium rounded-lg transition-colors"><PlusCircle size={16} />Post a New Job</button>
          <button onClick={() => navigate('/dashboard/recruiter/jobs')} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-[#1A1A2E] text-sm font-medium rounded-lg transition-colors"><Briefcase size={16} />View My Jobs</button>
        </div>
      </div>
      <CreditsCard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1A1A2E]">Recent Job Postings</h2>
            <button onClick={() => navigate('/dashboard/recruiter/jobs')} className="text-xs text-[#2557A7] hover:underline font-medium">View all</button>
          </div>
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          : recentJobs.length === 0 ? (
            <div className="text-center py-8"><Briefcase size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-[#595959]">No jobs posted yet.</p><button onClick={() => navigate('/dashboard/recruiter/post-job')} className="mt-3 text-xs text-[#2557A7] hover:underline font-medium">Post your first job →</button></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentJobs.map(job => (
                <div key={job._id} className="py-3 flex items-center justify-between">
                  <div><p className="text-sm font-medium text-[#1A1A2E]">{job.title}</p><p className="text-xs text-[#595959]">{job.applicationCount ?? 0} application{job.applicationCount !== 1 ? 's' : ''}{job.location ? ` · ${job.location}` : ''}</p></div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${job.status === 'active' ? 'bg-green-100 text-green-700' : job.status === 'draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>{job.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Recent Applications</h2>
          {loading ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          : recentApps.length === 0 ? (
            <div className="text-center py-8"><Users size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-[#595959]">No applications yet.</p><p className="text-xs text-gray-400 mt-1">Applications will appear here once candidates apply.</p></div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentApps.map(app => (
                <div key={app._id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-[#1A1A2E] truncate">{app.applicant?.name ?? 'Applicant'}</p><p className="text-xs text-[#595959] truncate">{app.jobTitle}</p><p className="text-xs text-gray-400">{formatDate(app.createdAt)}</p></div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {app.matchScore != null && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(app.matchScore)}`}>{app.matchScore}%</span>}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[app.status] ?? STATUS_STYLES.pending}`}>{app.status}</span>
                    <button onClick={() => navigate(`/dashboard/recruiter/jobs/${app.jobId}/applicants`)} className="text-xs text-[#2557A7] hover:underline font-medium">View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployerLayout>
  )
}
