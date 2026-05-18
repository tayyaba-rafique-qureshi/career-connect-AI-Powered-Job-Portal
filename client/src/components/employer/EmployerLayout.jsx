import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  LayoutDashboard, Briefcase, PlusCircle, Menu, X, LogOut, ChevronRight, MessageSquare, Settings, Sun, Moon
} from 'lucide-react'
import { getUnreadMessageCount } from '../../services/messageService'

const navItems = [
  { label: 'Dashboard',    href: '/dashboard/recruiter',      icon: LayoutDashboard },
  { label: 'Post a Job',   href: '/dashboard/recruiter/post-job', icon: PlusCircle },
  { label: 'My Jobs',      href: '/dashboard/recruiter/jobs', icon: Briefcase },
  { label: 'Messages',     href: '/employer/messages', icon: MessageSquare },
]

export default function EmployerLayout({ children }) {
  const { user, logout } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  useEffect(() => {
    let mounted = true
    const loadUnread = async () => {
      try {
        const count = await getUnreadMessageCount()
        if (mounted) setUnreadMsgs(count)
      } catch {
        // ignore
      }
    }
    loadUnread()
    const interval = setInterval(loadUnread, 10000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="text-[#1A1A2E] dark:text-white">Career</span>
          <span className="text-[#2557A7]">Connect</span>
        </Link>
        <p className="text-xs text-[#595959] dark:text-gray-400 mt-0.5">Employer Portal</p>
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
                  : 'text-[#595959] dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-[#2557A7] dark:hover:text-white'
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {label === 'Messages' && unreadMsgs > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 bg-[#E53935] text-white text-[11px] rounded-full inline-flex items-center justify-center">
                  {unreadMsgs > 9 ? '9+' : unreadMsgs}
                </span>
              )}
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#2557A7] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'E'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white truncate">{user?.name}</p>
            <p className="text-xs text-[#595959] dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 text-sm text-[#595959] dark:text-gray-300 hover:text-[#2557A7] dark:hover:text-white transition-colors w-full px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-gray-700 mb-1"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={() => navigate('/dashboard/recruiter')}
          className="flex items-center gap-2 text-sm text-[#595959] dark:text-gray-300 hover:text-[#2557A7] dark:hover:text-white transition-colors w-full px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-gray-700 mb-1"
        >
          <Settings size={16} />
          Settings
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-[#595959] dark:text-gray-300 hover:text-red-500 transition-colors w-full px-2 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1a1a1a] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white dark:bg-[#1f1f1f] border-r border-gray-200 dark:border-gray-700 fixed top-0 left-0 h-full z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white dark:bg-[#1f1f1f] h-full z-50 shadow-xl">
            <button
              className="absolute top-4 right-4 text-[#595959] dark:text-gray-400"
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
        <header className="md:hidden bg-white dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-gray-700 px-4 h-14 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-[#1A1A2E] dark:text-white flex-shrink-0">
            <Menu size={22} />
          </button>
          <Link to="/" className="text-lg font-bold flex-shrink-0">
            <span className="text-[#1A1A2E] dark:text-white">Career</span>
            <span className="text-[#2557A7]">Connect</span>
          </Link>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="w-9 h-9 rounded-full inline-flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#2557a7] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="w-8 h-8 rounded-full bg-[#2557A7] flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.[0]?.toUpperCase() || 'E'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
