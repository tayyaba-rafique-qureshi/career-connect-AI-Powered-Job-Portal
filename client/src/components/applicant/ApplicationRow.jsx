import { useState } from 'react'
import { Archive, MessageSquare, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AIMatchBadge from './AIMatchBadge'

const STATUS_STYLES = {
  pending:     'bg-blue-50 text-blue-700 border-blue-200',
  reviewed:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  shortlisted: 'bg-purple-50 text-purple-700 border-purple-200',
  accepted:    'bg-green-50 text-green-700 border-green-200',
  rejected:    'bg-red-50 text-red-600 border-red-200',
  archived:    'bg-gray-50 text-gray-500 border-gray-200',
}

const STATUS_LABELS = {
  pending:     'Applied',
  reviewed:    'Reviewed',
  shortlisted: 'Shortlisted',
  accepted:    'Accepted',
  rejected:    'Not selected',
  archived:    'Archived',
}

const formatDate = (d) => {
  if (!d) return 'Unknown date'
  const date = new Date(d)
  if (isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ApplicationRow({ application, onArchive, onUnarchive }) {
  const { user } = useAuth()
  const [archiving, setArchiving] = useState(false)
  const [unarchiving, setUnarchiving] = useState(false)
  const job = application.job || {}
  const status = application.status || 'pending'
  const employerId = job.postedBy?._id || job.postedBy

  const handleArchive = async (e) => {
    e.stopPropagation()
    if (!onArchive || archiving) return
    setArchiving(true)
    try {
      await onArchive(application._id)
    } finally {
      setArchiving(false)
    }
  }

  const handleUnarchive = async (e) => {
    e.stopPropagation()
    if (!onUnarchive || unarchiving) return
    setUnarchiving(true)
    try {
      await onUnarchive(application._id)
    } finally {
      setUnarchiving(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 border-b border-[#D4D2D0] hover:bg-gray-50 transition-colors">
      {/* Company logo placeholder */}
      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-[#2557A7] font-bold text-sm shrink-0">
        {(job.company || 'C').slice(0, 2).toUpperCase()}
      </div>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[#1A1A2E] text-sm truncate">{job.title || 'Unknown Job'}</h3>
        <p className="text-sm text-[#595959]">{job.company}</p>
        <p className="text-xs text-[#595959] mt-0.5">Applied on {formatDate(application.appliedAt || application.createdAt)}</p>
      </div>

      {/* Status + score + archive */}
      <div className="flex items-center gap-3 shrink-0">
        {employerId && (
          <Link
            to={`/messages?jobId=${job._id}&applicantId=${user?.id || user?._id}&employerId=${employerId}`}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#595959] hover:text-[#2557A7] hover:bg-blue-50 rounded transition-colors"
            title="Message employer"
          >
            <MessageSquare size={13} />
            Message
          </Link>
        )}
        {application.aiScore !== null && application.aiScore !== undefined && (
          <AIMatchBadge score={Math.round(application.aiScore * 100)} />
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
        {onArchive && status !== 'archived' && (
          <button
            onClick={handleArchive}
            disabled={archiving}
            title="Archive application"
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#595959] hover:text-[#2557A7] hover:bg-blue-50 rounded transition-colors disabled:opacity-40"
          >
            <Archive size={13} />
            {archiving ? '...' : 'Archive'}
          </button>
        )}
        {onUnarchive && status === 'archived' && (
          <button
            onClick={handleUnarchive}
            disabled={unarchiving}
            title="Unarchive application"
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#595959] hover:text-[#137333] hover:bg-green-50 rounded transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} />
            {unarchiving ? '...' : 'Unarchive'}
          </button>
        )}
      </div>
    </div>
  )
}
