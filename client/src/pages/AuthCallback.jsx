import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const { setUserFromOAuth } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const user  = params.get('user')

    if (!token || !user) {
      navigate('/login')
      return
    }

    try {
      const parsed = JSON.parse(decodeURIComponent(user))
      setUserFromOAuth(token, parsed)

      // Send to onboarding if profile not complete, else role dashboard
      if (!parsed.isProfileComplete) {
        navigate('/onboarding')
      } else {
        const home = { admin: '/dashboard/admin', recruiter: '/dashboard/recruiter', applicant: '/dashboard/applicant' }
        navigate(home[parsed.role] ?? '/dashboard/applicant')
      }
    } catch {
      navigate('/login')
    }
  }, [])

  return (
    <div className="auth-container">
      <p>Signing you in...</p>
    </div>
  )
}
