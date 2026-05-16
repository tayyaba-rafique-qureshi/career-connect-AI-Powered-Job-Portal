import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showAdminDialog, setShowAdminDialog] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Check if email is admin before allowing forgot password
  const isAdminEmail = (email) => {
    if (!email) return false
    const normalizedEmail = email.toLowerCase().trim()
    const adminEmails = ['admin@careerconnect.com', 'superadmin@careerconnect.com']
    const adminPatterns = ['admin@', '@admin']
    
    return adminEmails.includes(normalizedEmail) || 
           adminPatterns.some(pattern => normalizedEmail.includes(pattern))
  }

  const handleForgotPassword = (e) => {
    e.preventDefault()
    
    // Check if current email is admin
    if (isAdminEmail(form.email)) {
      setShowAdminDialog(true)
      return // Do NOT redirect to forgot password page
    }
    
    // If not admin, proceed to forgot password page
    navigate('/forgot-password')
  }

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
          recruiter: '/onboarding/employer',
          employer:  '/onboarding/employer',
        }
        navigate(onboardingRoute[data.user.role] ?? '/onboarding/applicant', { replace: true })
      } else {
        navigate(roleHome[data.user.role] ?? '/dashboard/applicant', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EDF3FC] via-white to-[#F7F9FC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]">

        {/* Left: Brand / value prop */}
        <div className="hidden md:block p-10 bg-gradient-to-br from-[#2557A7] to-[#1a4480] text-white relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_55%)]" />
          <div className="relative">
            <div className="text-2xl font-extrabold tracking-tight">
              Career<span className="text-white/90">Connect</span>
            </div>
            <p className="mt-3 text-white/90 leading-relaxed">
              Sign in to manage applications, messages, and AI job matches—designed for fast, focused job search.
            </p>
            <div className="mt-7 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="font-semibold">Secure sign-in</p>
                <p className="text-sm text-white/80">Your session is protected.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-7 sm:p-10">

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to continue</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full h-12 pl-10 pr-4 border border-[#D4D2D0] rounded-lg text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">Password</label>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-[#2557A7] hover:underline font-medium focus:outline-none"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                required
                className="w-full h-12 pl-10 pr-11 border border-[#D4D2D0] rounded-lg text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 bg-[#2557A7] hover:bg-[#1a4480] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors"
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
            <span className="bg-white px-3 text-xs text-gray-400">or continue with</span>
          </div>
        </div>

        <a
          href="http://localhost:5000/api/auth/google"
          className="flex items-center justify-center gap-3 w-full h-12 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
          Continue with Google
        </a>
        </div>
      </div>

      {/* Admin Password Reset Dialog */}
      {showAdminDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Action Restricted
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Admin password cannot be reset via this form. Please contact the system administrator.
            </p>
            <button
              onClick={() => setShowAdminDialog(false)}
              className="w-full bg-[#2557A7] text-white py-2 px-4 rounded-lg hover:bg-[#1a4480] transition-colors font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
