import { useState } from 'react'
import { Archive, MessageSquare, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import AIMatchBadge from './AIMatchBadge'

const STATUS_STYLES = {
  pending:     { backgroundColor: 'var(--cc-blue-light)', color: 'var(--cc-blue)', borderColor: 'var(--cc-blue-border)' },
  reviewed:    { backgroundColor: 'var(--cc-amber-bg)', color: 'var(--cc-amber)', borderColor: 'var(--cc-amber)' },
  shortlisted: { backgroundColor: 'var(--cc-blue-light)', color: 'var(--cc-blue)', borderColor: 'var(--cc-blue-border)' },
  accepted:    { backgroundColor: 'var(--cc-green-bg)', color: 'var(--cc-green)', borderColor: 'var(--cc-green-border)' },
  rejected:    { backgroundColor: 'var(--cc-red-bg)', color: 'var(--cc-red)', borderColor: 'var(--cc-red)' },
  archived:    { backgroundColor: 'var(--cc-surface-2)', color: 'var(--cc-text-3)', borderColor: 'var(--cc-border)' },
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
    <div className="flex items-center gap-4 p-4 border-b border-[var(--cc-border)] hover:bg-[var(--cc-surface-2)] transition-colors">
      {/* Company logo placeholder */}
      <div className="w-12 h-12 rounded-lg bg-[var(--cc-blue-light)] flex items-center justify-center text-[var(--cc-blue)] font-bold text-sm shrink-0">
        {(job.company || 'C').slice(0, 2).toUpperCase()}
      </div>

      {/* Job info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--cc-text-1)] text-sm truncate">{job.title || 'Unknown Job'}</h3>
        <p className="text-sm text-[var(--cc-text-2)]">{job.company}</p>
        <p className="text-xs text-[var(--cc-text-2)] mt-0.5">Applied on {formatDate(application.appliedAt || application.createdAt)}</p>
      </div>

      {/* Status + score + archive */}
      <div className="flex items-center gap-3 shrink-0">
        {employerId && (
          <Link
            to={`/messages?jobId=${job._id}&applicantId=${user?.id || user?._id}&employerId=${employerId}`}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--cc-text-2)] hover:text-[var(--cc-blue)] hover:bg-[var(--cc-blue-light)] rounded transition-colors"
            title="Message employer"
          >
            <MessageSquare size={13} />
            Message
          </Link>
        )}
        {application.aiScore !== null && application.aiScore !== undefined && (
          <AIMatchBadge score={Math.round(application.aiScore * 100)} />
        )}
        <span className="text-xs px-2.5 py-1 rounded-full border font-semibold" style={STATUS_STYLES[status]}>
          {STATUS_LABELS[status]}
        </span>
        {onArchive && status !== 'archived' && (
          <button
            onClick={handleArchive}
            disabled={archiving}
            title="Archive application"
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--cc-text-2)] hover:text-[var(--cc-blue)] hover:bg-[var(--cc-blue-light)] rounded transition-colors disabled:opacity-40"
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
            className="flex items-center gap-1 px-2 py-1 text-xs text-[var(--cc-text-2)] hover:text-[var(--cc-green)] hover:bg-[var(--cc-green-bg)] rounded transition-colors disabled:opacity-40"
          >
            <RefreshCw size={13} />
            {unarchiving ? '...' : 'Unarchive'}
          </button>
        )}
      </div>
    </div>
  )
}
