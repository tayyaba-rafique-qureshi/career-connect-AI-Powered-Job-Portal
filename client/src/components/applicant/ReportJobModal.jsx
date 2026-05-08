import { useState } from 'react'
import { X, Flag } from 'lucide-react'
import { reportJob } from '../../services/jobService'

export default function ReportJobModal({ job, onClose, onSuccess }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const REASONS = [
    'Scam or fraudulent',
    'Discriminatory',
    'Offensive content',
    'Inaccurate description',
    'Other'
  ]

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason')
      return
    }
    setLoading(true)
    setError('')
    try {
      await reportJob(job._id, reason, description)
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#D4D2D0]">
          <div className="flex items-center gap-2 text-[#D93025]">
            <Flag size={20} />
            <h2 className="text-lg font-bold">Report this job</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <p className="text-sm text-[#595959]">
            Why are you reporting <strong>{job.title}</strong> at <strong>{job.company}</strong>?
          </p>

          <div className="space-y-2">
            {REASONS.map(r => (
              <label key={r} className="flex items-center gap-3 p-2 border border-[#D4D2D0] rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-4 h-4 text-[#2557A7]"
                />
                <span className="text-sm font-medium text-[#2D2D2D]">{r}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1A1A2E] mb-1">
              Additional details (optional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide any additional information to help us investigate..."
              className="w-full border border-[#D4D2D0] rounded px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:border-[#2557A7] focus:ring-1 focus:ring-[#2557A7]"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#D4D2D0] bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#595959] hover:bg-gray-200 rounded font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-[#D93025] text-white text-sm font-semibold rounded hover:bg-[#B32A20] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  )
}
