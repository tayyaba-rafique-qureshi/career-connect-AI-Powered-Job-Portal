import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login(form.email, form.password)
      // Navigate directly to the role's dashboard so we don't race against
      // the async state update that RoleRedirect depends on.
      const roleHome = {
        admin:     '/dashboard/admin',
        recruiter: '/dashboard/recruiter',
        employer:  '/dashboard/recruiter',
        applicant: '/dashboard/applicant',
      }
      // If onboarding isn't done yet, send to the right onboarding flow
      if (!data.user.onboardingComplete) {
        const onboardingRoute = {
          applicant: '/onboarding/applicant',
          recruiter: '/onboarding/applicant',
          employer:  '/onboarding/employer',
        }
        navigate(onboardingRoute[data.user.role] ?? '/onboarding/applicant')
      } else {
        navigate(roleHome[data.user.role] ?? '/dashboard/applicant')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-sm border border-gray-200 p-8">

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your CareerConnect account</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              name="email" type="email" value={form.email}
              onChange={handleChange} placeholder="john@example.com" required
              className="w-full h-12 px-4 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              name="password" type="password" value={form.password}
              onChange={handleChange} placeholder="Your password" required
              className="w-full h-12 px-4 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 bg-[#2557A7] hover:bg-[#1a4480] disabled:opacity-50 text-white font-semibold rounded text-sm transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#2557A7] font-semibold hover:underline">Create one</Link>
        </p>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400">or</span>
          </div>
        </div>

        <a
          href="http://localhost:5000/api/auth/google"
          className="flex items-center justify-center gap-3 w-full h-12 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
          Continue with Google
        </a>
      </div>
    </div>
  )
}
