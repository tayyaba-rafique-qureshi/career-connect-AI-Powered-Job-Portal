import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import EmployerLayout from '../../components/employer/EmployerLayout'
import ScheduleInterviewModal from '../../components/employer/ScheduleInterviewModal'
import ApplicantProfileModal from '../../components/employer/ApplicantProfileModal'
import Toast from '../../components/employer/Toast'
import api from '../../services/api'
import {
  ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown,
  Calendar, UserCheck, UserX, User, Loader2, Users
} from 'lucide-react'

const STATUS_STYLES = {
  pending:    'bg-gray-100 text-gray-600',
  reviewed:   'bg-blue-100 text-blue-700',
  shortlisted:'bg-green-100 text-green-700',
  rejected:   'bg-red-100 text-red-700',
  accepted:   'bg-emerald-100 text-emerald-700',
}

const scoreColor = (score) =>
  score >= 80 ? 'bg-green-100 text-green-700' :
  score >= 60 ? 'bg-yellow-100 text-yellow-700' :
  'bg-red-100 text-red-700'

export default function JobApplicants() {
  const { jobId }  = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()

  const [job, setJob]                   = useState(null)
  const [applicants, setApplicants]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [sortDir, setSortDir]           = useState('desc') // 'asc' | 'desc'
  const [toast, setToast]               = useState(null)
  const [actionLoading, setActionLoading] = useState({}) // { [appId]: 'shortlisting'|'rejecting'|'scheduling' }
  const [interviewModal, setInterviewModal] = useState(null) // application object
  const [profileModal, setProfileModal]     = useState(null) // application object

  const employerAddress = user?.employerProfile?.location?.headquarters || ''

  const fetchApplicants = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [jobRes, appsRes] = await Promise.all([
        api.get(`/jobs/${jobId}`),
        api.get(`/jobs/${jobId}/applicants`),
      ])
      setJob(jobRes.data)
      setApplicants(appsRes.data ?? [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants.')
    } finally {
      setLoading(false)
    }
  }, [jobId])

  useEffect(() => { fetchApplicants() }, [fetchApplicants])

  const sorted = [...applicants].sort((a, b) =>
    sortDir === 'desc'
      ? (b.matchScore ?? 0) - (a.matchScore ?? 0)
      : (a.matchScore ?? 0) - (b.matchScore ?? 0)
  )

  const updateStatus = async (appId, status) => {
    const key = status === 'shortlisted' ? 'shortlisting' : 'rejecting'
    setActionLoading(s => ({ ...s, [appId]: key }))
    try {
      await api.patch(`/applications/${appId}/status`, { status })
      setApplicants(apps => apps.map(a => a._id === appId ? { ...a, status } : a))
      setToast({ message: `Applicant ${status}.`, type: 'success' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || `Failed to update status.`, type: 'error' })
    } finally {
      setActionLoading(s => ({ ...s, [appId]: null }))
    }
  }

  const handleInterviewSuccess = (appId) => {
    setInterviewModal(null)
    setApplicants(apps => apps.map(a =>
      a._id === appId ? { ...a, status: 'shortlisted', interview: { scheduledAt: new Date() } } : a
    ))
    setToast({ message: 'Interview invitation sent!', type: 'success' })
  }

  const initials = (name) =>
    (name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const SortIcon = sortDir === 'desc' ? ArrowDown : ArrowUp

  return (
    <EmployerLayout>
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      {interviewModal && (
        <ScheduleInterviewModal
          application={interviewModal}
          employerAddress={employerAddress}
          onClose={() => setInterviewModal(null)}
          onSuccess={handleInterviewSuccess}
        />
      )}

      {profileModal && (
        <ApplicantProfileModal
          application={profileModal}
          onClose={() => setProfileModal(null)}
        />
      )}

      {/* Back + header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/recruiter/jobs')}
          className="flex items-center gap-1.5 text-sm text-[#595959] hover:text-[#1A1A2E] mb-3 transition-colors"
        >
          <ArrowLeft size={15} />Back to My Jobs
        </button>
        {job && (
          <>
            <h1 className="text-2xl font-bold text-[#1A1A2E]">{job.title}</h1>
            <p className="text-[#595959] text-sm mt-1">
              {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
              {job.location ? ` · ${job.location}` : ''}
              {job.workMode ? ` · ${job.workMode}` : ''}
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
          <button onClick={fetchApplicants} className="ml-3 underline font-medium">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">No applicants yet</h3>
          <p className="text-sm text-[#595959]">Applications will appear here once candidates apply.</p>
        </div>
      ) : (
        <>
          {/* Sort control */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-[#595959]">Sorted by AI match score</p>
            <button
              onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-1.5 text-xs font-medium text-[#2557A7] hover:underline"
            >
              <SortIcon size={13} />
              {sortDir === 'desc' ? 'Highest first' : 'Lowest first'}
            </button>
          </div>

          {/* Applicant cards */}
          <div className="space-y-3">
            {sorted.map(app => {
              const busy = actionLoading[app._id]
              const name = app.applicant?.name || 'Unknown'
              const profile = app.applicant?.applicantProfile || {}
              const pro = profile.professionalInfo || {}

              return (
                <div key={app._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar + info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#2557A7] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {app.applicant?.avatar
                          ? <img src={app.applicant.avatar} alt={name} className="w-full h-full rounded-full object-cover" />
                          : initials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#1A1A2E]">{name}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLES[app.status] ?? STATUS_STYLES.pending}`}>
                            {app.status}
                          </span>
                          {app.interview && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                              Interview Scheduled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#595959] mt-0.5">
                          {pro.currentTitle || 'No title'}
                          {pro.yearsOfExp ? ` · ${pro.yearsOfExp} yrs exp` : ''}
                        </p>

                        {/* Skills matched */}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {app.matchScore != null && (
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${scoreColor(app.matchScore)}`}>
                              {app.matchScore}% match
                            </span>
                          )}
                          {app.totalSkills > 0 && (
                            <span className="text-xs text-[#595959] bg-gray-50 px-2 py-0.5 rounded-full">
                              {app.skillsMatched}/{app.totalSkills} skills
                            </span>
                          )}
                        </div>

                        {/* Missing skills */}
                        {app.missingSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {app.missingSkills.slice(0, 4).map(s => (
                              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                -{s}
                              </span>
                            ))}
                            {app.missingSkills.length > 4 && (
                              <span className="text-xs text-[#595959]">+{app.missingSkills.length - 4} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      <button
                        onClick={() => setProfileModal(app)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#595959] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <User size={13} />
                        Profile
                      </button>
                      <button
                        onClick={() => setInterviewModal(app)}
                        disabled={!!busy || app.status === 'rejected'}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2557A7] border border-[#2557A7] rounded-lg hover:bg-blue-50 disabled:opacity-40 transition-colors"
                      >
                        <Calendar size={13} />
                        Schedule
                      </button>
                      <button
                        onClick={() => updateStatus(app._id, 'shortlisted')}
                        disabled={!!busy || app.status === 'shortlisted' || app.status === 'rejected'}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-40 transition-colors"
                      >
                        {busy === 'shortlisting' ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
                        Shortlist
                      </button>
                      <button
                        onClick={() => updateStatus(app._id, 'rejected')}
                        disabled={!!busy || app.status === 'rejected'}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
                      >
                        {busy === 'rejecting' ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </EmployerLayout>
  )
}
