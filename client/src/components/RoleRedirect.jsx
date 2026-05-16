import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_HOME = {
  admin:     '/dashboard/admin',
  recruiter: '/dashboard/recruiter',
  employer:  '/dashboard/recruiter',
  applicant: '/dashboard/applicant'
}

const ONBOARDING = {
  applicant: '/onboarding/applicant',
  recruiter: '/onboarding/applicant',   // recruiter uses same applicant flow
  employer:  '/onboarding/employer',
  admin:     null                        // admin skips onboarding
}

export default function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  // Send to onboarding if not complete (skip for admin)
  if (!user.onboardingComplete && !user.isProfileComplete && user.role !== 'admin') {
    const dest = ONBOARDING[user.role]
    if (dest) return <Navigate to={dest} replace />
  }

  return <Navigate to={ROLE_HOME[user.role] ?? '/dashboard/applicant'} replace />
}
