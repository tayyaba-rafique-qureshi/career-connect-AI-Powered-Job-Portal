import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  BarChart2,
  Settings,
  Megaphone,
  ScrollText,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Star,
  Flag,
  CheckCircle,
  Activity,
  Sun,
  Moon
} from 'lucide-react'

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const { isDark, toggle: toggleTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

    const navigation = [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'All Users', href: '/dashboard/admin/users', icon: Users },
    { name: 'All Jobs', href: '/dashboard/admin/jobs', icon: Briefcase },
    { name: 'Featured Jobs', href: '/dashboard/admin/jobs?featured=true', icon: Star },
    { name: 'Applications', href: '/dashboard/admin/applications', icon: FileText },
    { name: 'Job Reports', href: '/dashboard/admin/job-reports', icon: Flag },
    { name: 'Verifications', href: '/dashboard/admin/verifications', icon: CheckCircle },
    { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart2 },
    { name: 'Banners', href: '/dashboard/admin/banners', icon: Megaphone },
    { name: 'System Health', href: '/dashboard/admin/health', icon: Activity },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
    { name: 'Announcements', href: '/dashboard/admin/announcements', icon: Megaphone },
    { name: 'Audit Logs', href: '/dashboard/admin/audit-logs', icon: ScrollText }
  ]


  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#f3f2f1] dark:bg-[#1a1a1a]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1E293B] dark:bg-[#0f0f0f] transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-700">
            <div>
              <h1 className="text-xl font-bold text-white">CareerConnect</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#2557a7] text-white border-l-4 border-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={user?.avatar || 'https://ui-avatars.com/api/?name=Admin&background=2557a7&color=fff'}
                alt={user?.name}
                className="h-10 w-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors w-full"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
              <Link
                to="/"
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white dark:bg-[#1f1f1f] border-b border-gray-200 dark:border-gray-700 h-16 flex items-center px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {navigation.find(item => item.href === location.pathname)?.name || 'Admin Panel'}
            </h2>
          </div>
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-10 h-10 rounded-full inline-flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-[#2557a7] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
