import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import api from '../../services/api'

/**
 * BuyCreditsButton
 * Initiates the mock payment gateway flow.
 * On success saves the order_id to localStorage and redirects to the gateway.
 */
export default function BuyCreditsButton({ className = '' }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleBuy = async (e) => {
    e.preventDefault()   // prevent any parent form from submitting
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/payments/init')

      if (!data.payment_url) {
        // Show the actual reason from the server (includes gatewayResponse for debugging)
        setError(data.detail || data.message || 'No payment URL returned from gateway.')
        setLoading(false)
        return
      }

      // Persist order_id so PaymentSuccess can reference it
      localStorage.setItem('pending_order_id', data.order_id)

      console.log('[BuyCredits] redirecting to:', data.payment_url)
      // Hard redirect — user leaves the app to complete payment
      window.location.href = data.payment_url
    } catch (err) {
      const serverMsg = err.response?.data?.detail || err.response?.data?.message || err.message
      setError(serverMsg || 'Failed to start payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleBuy}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors ${className}`}
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" />Redirecting to payment…</>
          : <><CreditCard size={15} />Buy 5 Credits — PKR 999</>
        }
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
