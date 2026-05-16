import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wrapper for onboarding pages.
 * - Not logged in → /login
 * - Already completed onboarding → bounce to role's dashboard
 *   (prevents accidentally re-entering the onboarding flow via back button,
 *   direct URL, or stale link)
 */
const ROLE_HOME = {
  admin:     '/dashboard/admin',
  recruiter: '/dashboard/recruiter',
  employer:  '/dashboard/recruiter',
  applicant: '/dashboard/applicant',
}

export default function OnboardingRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  // Admin doesn't have an onboarding flow at all.
  if (user.role === 'admin') {
    return <Navigate to={ROLE_HOME.admin} replace />
  }

  // If onboarding is already complete, send them home.
  if (user.onboardingComplete || user.isProfileComplete) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/dashboard/applicant'} replace />
  }

  return children
}
