import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { CheckCircle, XCircle, Eye, EyeOff, Mail, User, ShieldCheck, BriefcaseBusiness, Sparkles } from 'lucide-react'

function getStrength(pw) {
  if (!pw) return { score: 0, label: '', colorClass: 'text-gray-400', barClass: 'bg-gray-200' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: 'Weak', colorClass: 'text-red-600', barClass: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Fair', colorClass: 'text-amber-600', barClass: 'bg-amber-500' }
  if (score <= 3) return { score, label: 'Good', colorClass: 'text-[#2557A7]', barClass: 'bg-[#2557A7]' }
  return { score, label: 'Strong', colorClass: 'text-green-700', barClass: 'bg-green-600' }
}

function Requirement({ met, text }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle size={14} className="text-green-700" />
      ) : (
        <XCircle size={14} className="text-gray-300" />
      )}
      <span className={`text-xs ${met ? 'text-green-700' : 'text-gray-500'}`}>{text}</span>
    </div>
  )
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'applicant' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const reqs = useMemo(() => ({
    length: form.password.length >= 6,
    upper: /[A-Z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    match: form.password === form.confirm && form.confirm.length > 0,
  }), [form.password, form.confirm])

  const strength = useMemo(() => getStrength(form.password), [form.password])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Email must contain @ and end with a valid domain (.com / .net / .org etc)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(form.email)) return setError('Please enter a valid email address (e.g. name@example.com)')

    if (!reqs.length) return setError('Password must be at least 6 characters')
    if (!reqs.upper) return setError('Password must contain at least one uppercase letter')
    if (!reqs.number) return setError('Password must contain at least one number')
    if (!reqs.match) return setError('Passwords do not match')
    setLoading(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: form.role })
      navigate('/')   // RoleRedirect handles onboarding check
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EDF3FC] via-white to-[#F7F9FC] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_30px_rgba(17,24,39,0.08)]">

        {/* Left: Brand / guidance */}
        <div className="hidden md:block p-10 bg-gradient-to-br from-[#1A1A2E] to-[#2557A7] text-white relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white_0%,transparent_55%)]" />
          <div className="relative">
            <div className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles size={20} className="text-white/90" />
              CareerConnect
            </div>
            <p className="mt-3 text-white/85 leading-relaxed">
              Create an account to unlock AI job matching, saved jobs, and messaging—built with a clean, focused workflow.
            </p>

            <div className="mt-7 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <BriefcaseBusiness size={18} />
                </div>
                <div>
                  <p className="font-semibold">Choose your goal</p>
                  <p className="text-sm text-white/75">Find jobs or hire talent—tailored onboarding.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="font-semibold">Strong password rules</p>
                  <p className="text-sm text-white/75">We guide you to a safer password.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="p-7 sm:p-10">

        {/* Logo / Brand */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create your account</h1>
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
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="name" type="text" value={form.name}
                onChange={handleChange} placeholder="John Doe" required
                className="w-full h-12 pl-10 pr-4 border border-[#D4D2D0] rounded-lg text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="email" type="email" value={form.email}
                onChange={handleChange} placeholder="name@example.com" required
                className="w-full h-12 pl-10 pr-4 border border-[#D4D2D0] rounded-lg text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPw ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => { handleChange(e); setError('') }}
                placeholder="Min 6 characters"
                required
                className="w-full h-12 px-4 pr-11 border border-[#D4D2D0] rounded-lg text-sm focus:outline-none focus:border-[#2557A7] focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {form.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded ${i <= strength.score ? strength.barClass : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-semibold ${strength.colorClass}`}>{strength.label}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                name="confirm"
                type={showCf ? 'text' : 'password'}
                value={form.confirm}
                onChange={(e) => { handleChange(e); setError('') }}
                placeholder="Repeat your password"
                required
                className={`w-full h-12 px-4 pr-11 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  form.confirm.length > 0 && !reqs.match
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-[#D4D2D0] focus:border-[#2557A7] focus:ring-blue-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCf(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
              >
                {showCf ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="p-3 rounded border border-gray-200 bg-gray-50 space-y-1">
            <Requirement met={reqs.length} text="At least 6 characters" />
            <Requirement met={reqs.upper} text="One uppercase letter" />
            <Requirement met={reqs.number} text="One number" />
            <Requirement met={reqs.match} text="Passwords match" />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full h-12 bg-[#2557A7] hover:bg-[#1a4480] disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition-colors mt-2"
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
          className="flex items-center justify-center gap-3 w-full h-12 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" />
          Continue with Google
        </a>

        <p className="text-center text-xs text-gray-400 mt-5">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
        </div>
      </div>
    </div>
  )
}
