import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import api from '../../services/api'
 
/**
 * PaymentSuccess
 * Landing page after the mock gateway redirects back on a completed payment.
 * Reads payment_id from the URL, calls /api/payments/verify, then shows
 * success or error state.
 */
export default function PaymentSuccess() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const [status, setStatus]   = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('')
  const hasVerified = useRef(false) // ← CRITICAL: prevents double call in React 18 strict mode
 
  useEffect(() => {
    if (hasVerified.current) return // already running — bail out
    hasVerified.current = true      // lock immediately before any async work
 
    const verify = async () => {
      // Log all params so we can see exactly what the gateway sends back
      const allParams = Object.fromEntries(searchParams)
      console.log('[PaymentSuccess] URL params from gateway:', allParams)
 
      // Try every possible param name the gateway might use
      const paymentId =
        searchParams.get('payment_id')    ||
        searchParams.get('paymentId')     ||
        searchParams.get('id')            ||
        searchParams.get('pid')           ||
        searchParams.get('transaction_id')||
        localStorage.getItem('pending_order_id')
 
      if (!paymentId) {
        console.error('[PaymentSuccess] No payment ID found in URL params:', allParams)
        setStatus('error')
        setMessage('No payment ID found. Please contact support.')
        return
      }
 
      // Prevent re-crediting if user refreshes the success page
      const lastVerified = localStorage.getItem('last_verified_payment')
      if (lastVerified === paymentId) {
        console.log('[PaymentSuccess] Already verified this payment, skipping.')
        setStatus('success')
        setMessage('Payment already processed. Credits have been added.')
        setTimeout(() => navigate('/dashboard/recruiter'), 3000)
        return
      }
 
      try {
        console.log('[PaymentSuccess] Calling verify with payment_id:', paymentId)
        const { data } = await api.post('/payments/verify', { payment_id: paymentId })
        console.log('[PaymentSuccess] Verify response:', data)
 
        if (data.success) {
          // Lock this payment_id so a page refresh cannot re-verify
          localStorage.setItem('last_verified_payment', paymentId)
          localStorage.removeItem('pending_order_id')
          setStatus('success')
          setMessage(data.message || '5 credits added to your account.')
          setTimeout(() => navigate('/dashboard/recruiter'), 3000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Payment could not be verified.')
        }
      } catch (err) {
        console.error('[PaymentSuccess] Verify error:', err)
        setStatus('error')
        setMessage(err.response?.data?.message || 'Verification failed. Please contact support.')
      }
    }
 
    verify()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
 
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-sm p-8 text-center">
 
        {status === 'verifying' && (
          <>
            <Loader2 size={48} className="animate-spin text-[#2557A7] mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#1A1A2E] dark:text-white mb-2">
              Verifying your payment…
            </h2>
            <p className="text-sm text-[#595959] dark:text-gray-400">
              Please wait while we confirm your transaction.
            </p>
          </>
        )}
 
        {status === 'success' && (
          <>
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#1A1A2E] dark:text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-sm text-[#595959] dark:text-gray-400 mb-4">{message}</p>
            <p className="text-xs text-[#595959] dark:text-gray-500">
              Redirecting to Dashboard in 3 seconds…
            </p>
          </>
        )}
 
        {status === 'error' && (
          <>
            <XCircle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-[#1A1A2E] dark:text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-sm text-[#595959] dark:text-gray-400 mb-6">{message}</p>
            <button
              onClick={() => navigate('/dashboard/recruiter')}
              className="px-5 py-2.5 bg-[#2557A7] hover:bg-[#1a4480] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </>
        )}
 
      </div>
    </div>
  )
}