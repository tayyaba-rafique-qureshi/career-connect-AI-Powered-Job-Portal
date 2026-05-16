import { useEffect } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

/**
 * Simple auto-dismissing toast.
 * Usage: <Toast message="Saved!" type="success" onClose={() => setToast(null)} />
 */
export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!message) return null

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-800',
    info:    'bg-blue-50 border-blue-200 text-blue-800',
  }
  const Icon = type === 'success' ? CheckCircle : XCircle

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium max-w-sm ${styles[type] ?? styles.info}`}>
      <Icon size={18} className="flex-shrink-0" />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  )
}
