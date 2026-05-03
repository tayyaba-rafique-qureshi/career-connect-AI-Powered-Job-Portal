import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import EmployerLayout from '../../components/employer/EmployerLayout'
import Toast from '../../components/employer/Toast'
import api from '../../services/api'
import {
  Briefcase, PlusCircle, Pencil, Trash2, Users, XCircle,
  Loader2, AlertTriangle, Eye
} from 'lucide-react'

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  draft:  'bg-gray-100 text-gray-600',
  closed: 'bg-red-100 text-red-700',
}

const TABS = ['all', 'active', 'draft', 'closed']

export default function MyJobs() {
  const navigate  = useNavigate()
  const location  = useLocation()

  const [jobs, setJobs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [toast, setToast]         = useState(
    location.state?.toast ? { message: location.state.toast, type: 'success' } : null
  )
  // Per-job action loading: { [jobId]: 'closing' | 'deleting' | null }
  const [actionLoading, setActionLoading] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/jobs/employer/mine')
      setJobs(data ?? [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  // Filter jobs by active tab
  const visibleJobs = activeTab === 'all'
    ? jobs
    : jobs.filter(j => j.status === activeTab)

  // Tab counts
  const counts = jobs.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1
    return acc
  }, {})

  const closeJob = async (jobId) => {
    setActionLoading(s => ({ ...s, [jobId]: 'closing' }))
    try {
      await api.patch(`/jobs/${jobId}/status`, { status: 'closed' })
      setJobs(js => js.map(j => j._id === jobId ? { ...j, status: 'closed' } : j))
      setToast({ message: 'Job closed successfully.', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to close job.', type: 'error' })
    } finally {
      setActionLoading(s => ({ ...s, [jobId]: null }))
    }
  }

  const deleteJob = async (jobId) => {
    setConfirmDelete(null)
    setActionLoading(s => ({ ...s, [jobId]: 'deleting' }))
    try {
      await api.delete(`/jobs/${jobId}`)
      setJobs(js => js.filter(j => j._id !== jobId))
      setToast({ message: 'Job deleted.', type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete job.', type: 'error' })
    } finally {
      setActionLoading(s => ({ ...s, [jobId]: null }))
    }
  }

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <EmployerLayout>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle size={22} className="text-red-500 flex-shrink-0" />
              <h3 className="text-base font-semibold text-[#1A1A2E]">Delete Job?</h3>
            </div>
            <p className="text-sm text-[#595959] mb-5">
              This will permanently delete the job and all its applications. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-[#595959] border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteJob(confirmDelete)}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">My Jobs</h1>
          <p className="text-[#595959] text-sm mt-1">Manage your job postings</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/recruiter/post-job')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <PlusCircle size={16} />
          Post a Job
        </button>
      </div>

      {/* Filter tabs */}
      {!loading && jobs.length > 0 && (
        <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
          {TABS.map(tab => {
            const count = tab === 'all' ? jobs.length : (counts[tab] || 0)
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-white text-[#1A1A2E] shadow-sm'
                    : 'text-[#595959] hover:text-[#1A1A2E]'
                }`}
              >
                {tab}
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeTab === tab ? 'bg-gray-100 text-[#595959]' : 'bg-gray-200 text-[#595959]'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
          <button onClick={fetchJobs} className="ml-3 underline font-medium">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        /* Empty state — no jobs at all */
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <Briefcase size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">No jobs posted yet</h3>
          <p className="text-sm text-[#595959] mb-5">Create your first job posting to start receiving applications.</p>
          <button
            onClick={() => navigate('/dashboard/recruiter/post-job')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <PlusCircle size={16} />
            Post Your First Job
          </button>
        </div>
      ) : visibleJobs.length === 0 ? (
        /* Empty state — no jobs in this tab */
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
          <Briefcase size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-[#595959]">No <span className="capitalize">{activeTab}</span> jobs.</p>
        </div>
      ) : (
        /* Job list */
        <div className="space-y-3">
          {visibleJobs.map(job => {
            const busy = actionLoading[job._id]
            return (
              <div key={job._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  {/* Left: info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#1A1A2E]">{job.title}</h3>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${STATUS_STYLES[job.status] ?? STATUS_STYLES.draft}`}>
                        {job.status}
                      </span>
                      {job.status === 'draft' && (
                        <span className="text-xs text-[#595959] italic">— not visible to applicants</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-[#595959]">
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {job.applicationCount ?? 0} application{job.applicationCount !== 1 ? 's' : ''}
                      </span>
                      {job.location && <span>{job.location}</span>}
                      {job.workMode && <span className="capitalize">{job.workMode}</span>}
                      <span>Posted {formatDate(job.createdAt)}</span>
                    </div>
                    {job.requiredSkills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.requiredSkills.slice(0, 5).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-[#2557A7] border border-blue-100">
                            {s}
                          </span>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <span className="text-xs text-[#595959]">+{job.requiredSkills.length - 5} more</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/applicants`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2557A7] border border-[#2557A7] rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye size={13} />
                      Applicants ({job.applicationCount ?? 0})
                    </button>
                    <button
                      onClick={() => navigate(`/dashboard/recruiter/jobs/${job._id}/edit`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#595959] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    {job.status !== 'closed' && (
                      <button
                        onClick={() => closeJob(job._id)}
                        disabled={!!busy}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 disabled:opacity-50 transition-colors"
                      >
                        {busy === 'closing' ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                        Close
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(job._id)}
                      disabled={!!busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {busy === 'deleting' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </EmployerLayout>
  )
}
