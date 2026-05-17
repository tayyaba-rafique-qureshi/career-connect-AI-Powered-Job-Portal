import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import api from '../../services/api'

/**
 * CreditsBadge
 * Shows the recruiter's remaining job-post credits.
 * Exposes a `refresh()` method via the optional `onRef` prop so parent
 * components (e.g. PostJob) can trigger a re-fetch after a successful post.
 */
export default function CreditsBadge({ onRef }) {
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchCredits = useCallback(async () => {
    try {
      const { data } = await api.get('/payments/credits')
      setCredits(data.credits ?? 0)
    } catch {
      // silently ignore — badge just won't show
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCredits()
    // Expose refresh to parent via callback ref pattern
    if (onRef) onRef({ refresh: fetchCredits })
  }, [fetchCredits, onRef])

  if (loading || credits === null) return null

  const isEmpty = credits === 0

  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
        isEmpty
          ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
      }`}>
        <Wallet size={12} />
        <span>Credits: {credits}</span>
      </div>
      <Link
        to="/payment/buy"
        className="text-xs font-medium text-[#2557A7] dark:text-blue-400 hover:underline whitespace-nowrap"
      >
        Buy More
      </Link>
    </div>
  )
}
