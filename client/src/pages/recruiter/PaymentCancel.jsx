import { useNavigate } from 'react-router-dom'
import { XCircle } from 'lucide-react'

/**
 * PaymentCancel
 * Shown when the user cancels the payment on the mock gateway page.
 */
export default function PaymentCancel() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-sm p-8 text-center">
        <XCircle size={48} className="text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-[#1A1A2E] dark:text-white mb-2">
          Payment Cancelled
        </h2>
        <p className="text-sm text-[#595959] dark:text-gray-400 mb-6">
          Your payment was cancelled. Your credits were not charged.
        </p>
        <button
          onClick={() => navigate('/dashboard/recruiter')}
          className="px-5 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}
