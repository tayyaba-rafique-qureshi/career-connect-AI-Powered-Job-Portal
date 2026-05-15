import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_HOME = {
  admin:     '/dashboard/admin',
  recruiter: '/dashboard/recruiter',
  employer:  '/dashboard/recruiter',
  applicant: '/dashboard/applicant',
}

const ONBOARDING_ROUTES = ['/onboarding/applicant', '/onboarding/employer']

/**
 * allowedRoles: optional array e.g. ['admin'] — if omitted, any logged-in user passes
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  // ── Onboarding guard ──────────────────────────────────────────────────────
  // If user has already completed onboarding and tries to visit an onboarding
  // page (e.g. by typing the URL directly), redirect them to their dashboard.
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(location.pathname)
  const onboardingDone = user.onboardingComplete || user.isProfileComplete

  if (isOnboardingRoute && onboardingDone) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/dashboard/applicant'} replace />
  }

  // ── Role guard ────────────────────────────────────────────────────────────
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] ?? '/dashboard/applicant'} replace />
  }

  return children
}
