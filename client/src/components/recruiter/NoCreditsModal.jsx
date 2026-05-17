import { X, Wallet } from 'lucide-react'
import BuyCreditsButton from './BuyCreditsButton'

/**
 * NoCreditsModal
 * Shown when a recruiter tries to post a job but has 0 credits.
 * Triggered by a 403 response with error: "NO_CREDITS" from the server.
 */
export default function NoCreditsModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-xl shadow-xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <Wallet size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1A1A2E] dark:text-white">
                No Credits Remaining
              </h2>
              <p className="text-xs text-[#595959] dark:text-gray-400 mt-0.5">
                Current balance: <span className="font-bold text-red-600 dark:text-red-400">0 credits</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#595959] dark:text-gray-400 hover:text-[#1A1A2E] dark:hover:text-white ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm text-[#595959] dark:text-gray-300 mb-5">
          You've used all your free job posts. Purchase 5 more credits to continue posting jobs on CareerConnect.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <BuyCreditsButton className="w-full justify-center" />
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-[#595959] dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
