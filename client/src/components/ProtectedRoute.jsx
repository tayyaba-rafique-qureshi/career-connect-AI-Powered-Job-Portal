import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * allowedRoles: optional array e.g. ['admin'] — if omitted, any logged-in user passes
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Wrong role — send them to their own dashboard
    const home = { admin: '/dashboard/admin', recruiter: '/dashboard/recruiter', applicant: '/dashboard/applicant' }
    return <Navigate to={home[user.role] ?? '/dashboard/applicant'} replace />
  }

  return children
}
