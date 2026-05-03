import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Users, CalendarCheck, Eye, PlusCircle, ArrowRight, TrendingUp } from 'lucide-react'
import EmployerLayout from '../../components/employer/EmployerLayout'
import api from '../../services/api'

const STATUS_COLORS = {
  pending:     'bg-yellow-100 text-yellow-700',
  reviewed:    'bg-blue-100 text-blue-700',
  shortlisted: 'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
  accepted:    'bg-emerald-100 text-emerald-700',
}

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        {loading ? (
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold text-[#1A1A2E]">{value}</p>
        )}
        <p className="text-sm text-[#595959]">{label}</p>
      </div>
    </div>
  )
}

export default function EmployerDashboard() {
  const [stats, setStats]   = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          api.get('/jobs/employer/stats'),
          api.get('/jobs/employer/mine')
        ])
        setStats(statsRes.data)

        // Fetch recent applications across all jobs (up to 3 jobs, 5 apps each)
        const topJobs = jobsRes.data.slice(0, 3)
        const appPromises = topJobs.map(j =>
          api.get(`/jobs/${j._id}/applicants`).then(r => r.data).catch(() => [])
        )
        const allApps = (await Promise.all(appPromises)).flat()
        allApps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        setRecent(allApps.slice(0, 8))
      } catch (err) {
        setError('Failed to load dashboard data.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = [
    { icon: Briefcase,    label: 'Active Jobs',          value: stats?.activeJobs       ?? 0, color: 'bg-[#2557A7]' },
    { icon: Users,        label: 'Total Applications',   value: stats?.totalApplications ?? 0, color: 'bg-emerald-500' },
    { icon: CalendarCheck,label: 'Interviews Scheduled', value: stats?.interviews        ?? 0, color: 'bg-violet-500' },
    { icon: Eye,          label: 'Total Views',          value: stats?.totalViews        ?? 0, color: 'bg-orange-400' },
  ]

  return (
    <EmployerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Employer Dashboard</h1>
          <p className="text-sm text-[#595959] mt-0.5">Manage your job postings and applicants</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/employer/jobs"
            className="flex items-center gap-2 px-4 py-2.5 border border-[#2557A7] text-[#2557A7] rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
          >
            <Briefcase size={16} />
            View All Jobs
          </Link>
          <Link
            to="/employer/post-job"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2557A7] text-white rounded-lg text-sm font-semibold hover:bg-[#1a4283] transition-colors"
          >
            <PlusCircle size={16} />
            Post a Job
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <StatCard key={card.label} {...card} loading={loading} />
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#2557A7]" />
            <h2 className="font-semibold text-[#1A1A2E]">Recent Applications</h2>
          </div>
          <Link to="/employer/jobs" className="text-sm text-[#2557A7] hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-[#595959] font-medium">No applications yet</p>
            <p className="text-sm text-gray-400 mt-1">Post a job to start receiving applications</p>
            <Link
              to="/employer/post-job"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#2557A7] text-white rounded-lg text-sm font-semibold hover:bg-[#1a4283] transition-colors"
            >
              <PlusCircle size={16} /> Post a Job
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#595959] uppercase tracking-wide">Applicant</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#595959] uppercase tracking-wide">Job Title</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#595959] uppercase tracking-wide">Match Score</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#595959] uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-[#595959] uppercase tracking-wide">Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map(app => (
                  <tr key={app._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2557A7]/10 flex items-center justify-center text-[#2557A7] font-bold text-xs flex-shrink-0">
                          {app.applicant?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-[#1A1A2E]">{app.applicant?.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[#595959]">{app.job?.title || '—'}</td>
                    <td className="px-6 py-3.5">
                      <MatchBadge score={app.matchScore} />
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-600'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-[#595959]">
                      {new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </EmployerLayout>
  )
}

function MatchBadge({ score }) {
  if (score == null) return <span className="text-gray-400 text-xs">—</span>
  const color = score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      {Math.round(score)}%
    </span>
  )
}
