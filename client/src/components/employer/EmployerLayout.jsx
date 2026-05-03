import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Briefcase, PlusCircle, Menu, X, LogOut, ChevronRight
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',    href: '/dashboard/recruiter',      icon: LayoutDashboard },
  { label: 'Post a Job',   href: '/dashboard/recruiter/post-job', icon: PlusCircle },
  { label: 'My Jobs',      href: '/dashboard/recruiter/jobs', icon: Briefcase },
]

export default function EmployerLayout({ children }) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="text-[#1A1A2E]">Career</span>
          <span className="text-[#2557A7]">Connect</span>
        </Link>
        <p className="text-xs text-[#595959] mt-0.5">Employer Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          // Exact match for dashboard, prefix match for sub-sections
          const active = href === '/dashboard/recruiter'
            ? location.pathname === href
            : location.pathname.startsWith(href)
          return (
            <Link
              key={href}
              to={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#2557A7] text-white'
                  : 'text-[#595959] hover:bg-blue-50 hover:text-[#2557A7]'
              }`}
            >
              <Icon size={18} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#2557A7] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'E'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A2E] truncate">{user?.name}</p>
            <p className="text-xs text-[#595959] capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-[#595959] hover:text-red-500 transition-colors w-full px-2 py-1.5 rounded hover:bg-red-50"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white h-full z-50 shadow-xl">
            <button
              className="absolute top-4 right-4 text-[#595959]"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-[#1A1A2E]">
            <Menu size={22} />
          </button>
          <Link to="/" className="text-lg font-bold">
            <span className="text-[#1A1A2E]">Career</span>
            <span className="text-[#2557A7]">Connect</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#2557A7] flex items-center justify-center text-white text-sm font-bold">
            {user?.name?.[0]?.toUpperCase() || 'E'}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
