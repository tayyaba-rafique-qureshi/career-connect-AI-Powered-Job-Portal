import { useEffect, useState } from 'react'
import { X, FileText } from 'lucide-react'
import { applyToJob } from '../../services/applicationService'
import { useAuth } from '../../context/AuthContext'
import AIMatchBadge from './AIMatchBadge'
import ResumeChangeModal from './ResumeChangeModal'

export default function ApplyModal({ job, matchData, onClose, onSuccess }) {
  const { user, refreshUser } = useAuth()
  const [coverLetter, setCoverLetter]         = useState('')
  const [loading, setLoading]                 = useState(false)
  const [error, setError]                     = useState('')
  const [showResumeChange, setShowResumeChange] = useState(false)
  // Local resume name — updated immediately after user changes resume so modal stays fresh
  const [resumeName, setResumeName] = useState(
    user?.applicantProfile?.resume?.fileName || null
  )

  useEffect(() => {
    // Ensure resume status is accurate even if auth cache was stale.
    setResumeName(user?.applicantProfile?.resume?.fileName || null)
  }, [user])

  useEffect(() => {
    refreshUser?.().then((fresh) => {
      if (fresh?.applicantProfile?.resume?.fileName) {
        setResumeName(fresh.applicantProfile.resume.fileName)
      }
    }).catch(() => {})
  }, [])

  const handleSubmit = async () => {
    setLoading(true); setError('')
    try {
      await applyToJob(job._id, coverLetter)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit application')
    } finally {
      setLoading(false)
    }
  }

  const handleResumeUpdated = (updatedUser) => {
    setResumeName(updatedUser?.applicantProfile?.resume?.fileName || resumeName)
    setShowResumeChange(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg z-10">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4D2D0]">
            <h2 className="text-lg font-bold text-[#1A1A2E]">Apply to {job.title}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Company */}
            <p className="text-sm text-[#595959]">{job.company} · {job.location}</p>

            {/* AI Match */}
            {matchData?.matchScore !== null && matchData?.matchScore !== undefined && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <AIMatchBadge score={matchData.matchScore} size="lg" />
                <span className="text-xs text-[#595959]">
                  {matchData.skillsMatched?.length || 0} of {(matchData.skillsMatched?.length || 0) + (matchData.skillsMissing?.length || 0)} skills matched
                </span>
              </div>
            )}

            {/* Resume — shows current file with functional Change button */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">Resume</label>
              {resumeName ? (
                <div className="flex items-center justify-between border border-[#D4D2D0] rounded px-3 py-2.5 bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText size={16} className="text-[#2557A7] shrink-0" />
                    <span className="text-sm text-[#595959] truncate">{resumeName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResumeChange(true)}
                    className="text-xs text-[#2557A7] hover:underline ml-2 shrink-0 font-medium"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between border border-amber-200 rounded px-3 py-2.5 bg-amber-50">
                  <span className="text-sm text-amber-700">⚠ No resume on file</span>
                  <button
                    type="button"
                    onClick={() => setShowResumeChange(true)}
                    className="text-xs text-[#2557A7] hover:underline ml-2 shrink-0 font-semibold"
                  >
                    Upload now
                  </button>
                </div>
              )}
            </div>

            {/* Cover letter */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
                Cover letter <span className="text-[#595959] font-normal">(optional)</span>
              </label>
              <textarea
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                maxLength={500}
                placeholder="Add a cover letter..."
                className="w-full border border-[#D4D2D0] rounded px-3 py-2 text-sm resize-none h-28 focus:outline-none focus:border-[#2557A7] focus:ring-1 focus:ring-[#2557A7]"
              />
              <p className="text-xs text-[#595959] text-right">{coverLetter.length}/500</p>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#D4D2D0]">
            <button onClick={onClose} className="px-5 py-2 text-sm text-[#595959] border border-[#D4D2D0] rounded hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-[#2557A7] text-white text-sm font-semibold rounded hover:bg-[#1D4589] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>

      {/* Resume change modal — rendered above the apply modal */}
      {showResumeChange && (
        <ResumeChangeModal
          onClose={() => setShowResumeChange(false)}
          onSuccess={handleResumeUpdated}
        />
      )}
    </>
  )
}
