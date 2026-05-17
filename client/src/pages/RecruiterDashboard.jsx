import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import EmployerLayout from '../components/employer/EmployerLayout'
import CreditsBadge from '../components/recruiter/CreditsBadge'
import BuyCreditsButton from '../components/recruiter/BuyCreditsButton'
import api from '../services/api'
import { Briefcase, Users, PlusCircle, Eye, BarChart2, CreditCard } from 'lucide-react'

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

// ── Credits card — shown on the dashboard so recruiters always see their balance ──
function CreditsCard() {
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/payments/credits')
      .then(({ data }) => setCredits(data.credits ?? 0))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const isEmpty = credits === 0

  return (
    <div className={`rounded-xl border p-5 mb-8 shadow-sm ${
      isEmpty
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
        : 'bg-white dark:bg-[#1f1f1f] border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: icon + text */}
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isEmpty ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/20'
          }`}>
            <CreditCard size={20} className={isEmpty ? 'text-red-600 dark:text-red-400' : 'text-[#2557A7]'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white mb-0.5">
              Job Post Credits
            </p>
            <p className="text-sm text-[#595959] dark:text-gray-400">
              You have{' '}
              <span className={`text-2xl font-bold ${isEmpty ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {credits}
              </span>
              {' '}credit{credits !== 1 ? 's' : ''} remaining.
            </p>
            {isEmpty ? (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                You have no credits left. Buy more to post jobs.
              </p>
            ) : (
              <p className="text-xs text-[#595959] dark:text-gray-500 mt-1">
                Each job post uses 1 credit.
              </p>
            )}
          </div>
        </div>

        {/* Right: buy button */}
        <div className="sm:flex-shrink-0">
          <BuyCreditsButton />
        </div>
      </div>
    </div>
  )
}

export default function RecruiterDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]               = useState(null)
  const [recentJobs, setRecentJobs]     = useState([])
  const [recentApps, setRecentApps]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats and jobs in parallel
        const [statsRes, jobsRes] = await Promise.all([
          api.get('/jobs/employer/stats'),
          api.get('/jobs/employer/mine'),
        ])
        setStats(statsRes.data)
        const jobs = jobsRes.data ?? []
        setRecentJobs(jobs.slice(0, 5))

        // Fetch recent applications across all jobs (up to 5 most recent)
        if (jobs.length > 0) {
          const appRequests = jobs.slice(0, 5).map(j =>
            api.get(`/jobs/${j._id}/applicants`).then(r =>
              (r.data ?? []).map(a => ({ ...a, jobTitle: j.title, jobId: j._id }))
            ).catch(() => [])
          )
          const nested = await Promise.all(appRequests)
          const all = nested.flat().sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
          )
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
    { label: 'Active Jobs',          value: stats?.activeJobs,         icon: Briefcase, color: 'bg-blue-50 text-[#2557A7]' },
    { label: 'Total Applications',   value: stats?.totalApplications,  icon: Users,     color: 'bg-green-50 text-green-700' },
    { label: 'Interviews Scheduled', value: stats?.interviews,         icon: BarChart2, color: 'bg-purple-50 text-purple-700' },
    { label: 'Total Views',          value: stats?.totalViews,         icon: Eye,       color: 'bg-orange-50 text-orange-700' },
  ]

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <EmployerLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E]">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-[#595959] mt-1 text-sm">
          Here's what's happening with your job postings today.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A2E]">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" />
                ) : (value ?? 0)}
              </p>
              <p className="text-xs text-[#595959] mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/dashboard/recruiter/post-job')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusCircle size={16} />
            Post a New Job
          </button>
          <button
            onClick={() => navigate('/dashboard/recruiter/jobs')}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-[#1A1A2E] text-sm font-medium rounded-lg transition-colors"
          >
            <Briefcase size={16} />
            View My Jobs
          </button>
        </div>
      </div>

      {/* Job Post Credits card */}
      <CreditsCard />

      {/* Two-column bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent job postings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#1A1A2E]">Recent Job Postings</h2>
            <button
              onClick={() => navigate('/dashboard/recruiter/jobs')}
              className="text-xs text-[#2557A7] hover:underline font-medium"
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-[#595959]">No jobs posted yet.</p>
              <button
                onClick={() => navigate('/dashboard/recruiter/post-job')}
                className="mt-3 text-xs text-[#2557A7] hover:underline font-medium"
              >
                Post your first job →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentJobs.map(job => (
                <div key={job._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1A2E]">{job.title}</p>
                    <p className="text-xs text-[#595959]">
                      {job.applicationCount ?? 0} application{job.applicationCount !== 1 ? 's' : ''}
                      {job.location ? ` · ${job.location}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    job.status === 'active' ? 'bg-green-100 text-green-700' :
                    job.status === 'draft'  ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#1A1A2E] mb-4">Recent Applications</h2>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : recentApps.length === 0 ? (
            <div className="text-center py-8">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-[#595959]">No applications yet.</p>
              <p className="text-xs text-gray-400 mt-1">Applications will appear here once candidates apply.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentApps.map(app => (
                <div key={app._id} className="py-3 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A1A2E] truncate">
                      {app.applicant?.name ?? 'Applicant'}
                    </p>
                    <p className="text-xs text-[#595959] truncate">{app.jobTitle}</p>
                    <p className="text-xs text-gray-400">{formatDate(app.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {app.matchScore != null && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColor(app.matchScore)}`}>
                        {app.matchScore}%
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[app.status] ?? STATUS_STYLES.pending}`}>
                      {app.status}
                    </span>
                    <button
                      onClick={() => navigate(`/dashboard/recruiter/jobs/${app.jobId}/applicants`)}
                      className="text-xs text-[#2557A7] hover:underline font-medium"
                    >
                      View
                    </button>
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
