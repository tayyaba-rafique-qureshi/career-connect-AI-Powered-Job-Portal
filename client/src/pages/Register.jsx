import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'applicant' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Email must contain @ and end with a valid domain (.com / .net / .org etc)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(form.email)) return setError('Please enter a valid email address (e.g. name@example.com)')

    if (form.password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form)
      navigate('/')   // RoleRedirect handles onboarding check
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md rounded-lg shadow-sm border border-gray-200 p-8">

        {/* Logo / Brand */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 text-sm mt-1">Join CareerConnect — AI-powered job matching</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector — shown first so user picks intent */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'applicant', label: '🔍 Find a Job', sub: 'Browse & apply to jobs' },
                { value: 'employer',  label: '🏢 Hire Talent', sub: 'Post jobs & find candidates' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, role: opt.value })}
                  className={`p-3 rounded border text-left transition-all ${
                    form.role === opt.value
                      ? 'border-[#2557A7] bg-blue-50 ring-1 ring-[#2557A7]'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              name="name" type="text" value={form.name}
              onChange={handleChange} placeholder="John Doe" required
              className="w-full h-12 px-4 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
            />
          </div>

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
              onChange={handleChange} placeholder="Min 6 characters" required
              className="w-full h-12 px-4 border border-[#D4D2D0] rounded text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 bg-[#2557A7] hover:bg-[#1a4480] disabled:opacity-50 text-white font-semibold rounded text-sm transition-colors mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2557A7] font-semibold hover:underline">Sign in</Link>
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

        <p className="text-center text-xs text-gray-400 mt-5">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
