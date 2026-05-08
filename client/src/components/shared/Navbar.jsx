import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bookmark, MessageSquare, Bell, User, Menu, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getNotifications } from '../../services/notificationService'
import { getUnreadMessageCount } from '../../services/messageService'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [mobileOpen, setMobileOpen] = useState(false)
  const dropdownRef = useRef()

  useEffect(() => {
    getNotifications().then(n => setUnreadCount(n.filter(x => !x.read).length)).catch(() => {})
    getUnreadMessageCount().then(setUnreadMsgs).catch(() => {})
    const interval = setInterval(() => {
      getUnreadMessageCount().then(setUnreadMsgs).catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e) => { if (!dropdownRef.current?.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setDropdownOpen(false)
  }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#E4E2E0] h-[60px] shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="h-full w-full px-3 sm:px-5 flex items-center gap-2">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-gray-100 text-[#1A1A2E]"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo */}
          <Link to="/dashboard/applicant" className="flex items-center gap-0.5 font-extrabold tracking-tight flex-shrink-0">
            <span className="text-[20px] leading-none text-[#1A1A2E]">Career</span>
            <span className="text-[20px] leading-none text-[#2557A7]">Connect</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-stretch h-[60px] ml-8">
            <NavLink
              to="/dashboard/applicant"
              className={({ isActive }) =>
                `flex items-center px-1 mr-6 text-sm font-semibold border-b-2 transition-colors ${
                  isActive ? 'text-[#2557A7] border-[#2557A7]' : 'text-[#595959] border-transparent hover:text-[#2557A7]'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/company-reviews"
              className={({ isActive }) =>
                `flex items-center px-1 text-sm border-b-2 transition-colors ${
                  isActive ? 'text-[#2557A7] border-[#2557A7]' : 'text-[#595959] border-transparent hover:text-[#2557A7]'
                }`
              }
            >
              Company reviews
            </NavLink>
          </nav>

          <div className="flex-1" />

          {/* Right actions (desktop) */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/my-jobs?tab=saved" className="inline-flex">
              <NavIconBtn icon={<Bookmark size={20} />} title="Saved jobs" />
            </Link>
            <Link to="/messages" className="inline-flex relative">
              <NavIconBtn icon={<MessageSquare size={20} />} title="Messages" />
              {unreadMsgs > 0 && (
                <span className="absolute top-[-4px] right-[-4px] min-w-[18px] h-[18px] px-[5px] bg-[#E53935] rounded-full text-[11px] font-bold text-white flex items-center justify-center leading-none">
                  {unreadMsgs > 9 ? '9+' : unreadMsgs}
                </span>
              )}
            </Link>
            <Link to="/notifications" className="inline-flex relative">
              <NavIconBtn icon={<Bell size={20} />} title="Notifications" />
              {unreadCount > 0 && (
                <span className="absolute top-[2px] right-[2px] min-w-[18px] h-[18px] px-[5px] bg-[#D93025] rounded-full border-2 border-white text-[10px] font-bold text-white flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(v => !v)}
                className="w-10 h-10 rounded-full inline-flex items-center justify-center hover:bg-gray-100 text-[#595959]"
                aria-label="Open profile menu"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#2557A7] flex items-center justify-center text-white text-xs font-bold">
                    {user?.name?.[0]?.toUpperCase() || <User size={14} />}
                  </div>
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-56 bg-white border border-[#E4E2E0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs text-[#767676] truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-[#A0A0A0] truncate">{user?.email}</p>
                  </div>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-[#2D2D2D] hover:bg-[#F7F9FC]">
                    My Profile
                  </Link>
                  <Link to="/my-jobs" onClick={() => setDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-[#2D2D2D] hover:bg-[#F7F9FC]">
                    My Jobs
                  </Link>
                  <div className="border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#2557A7] hover:bg-[#F7F9FC]"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-7 bg-[#E4E2E0] mx-3" />

            <Link
              to="/dashboard/recruiter"
              className="h-9 px-4 inline-flex items-center rounded-md border border-[#2557A7] text-sm font-semibold text-[#2557A7] hover:bg-[#2557A7] hover:text-white transition-colors whitespace-nowrap"
            >
              Employers / Post Job
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 h-full w-[85%] max-w-sm bg-white shadow-xl">
            <div className="h-[60px] px-4 flex items-center justify-between border-b border-gray-100">
              <Link to="/dashboard/applicant" className="flex items-center gap-0.5 font-extrabold tracking-tight">
                <span className="text-[18px] leading-none text-[#1A1A2E]">Career</span>
                <span className="text-[18px] leading-none text-[#2557A7]">Connect</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <MobileNavLink to="/dashboard/applicant">Home</MobileNavLink>
              <MobileNavLink to="/company-reviews">Company reviews</MobileNavLink>
              <MobileNavLink to="/my-jobs?tab=saved">Saved jobs</MobileNavLink>
              <MobileNavLink to="/messages">
                <span className="flex items-center justify-between w-full">
                  <span>Messages</span>
                  {unreadMsgs > 0 && (
                    <span className="min-w-[22px] h-[18px] px-2 bg-[#E53935] rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center">
                      {unreadMsgs > 9 ? '9+' : unreadMsgs}
                    </span>
                  )}
                </span>
              </MobileNavLink>
              <MobileNavLink to="/notifications">
                <span className="flex items-center justify-between w-full">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="min-w-[22px] h-[18px] px-2 bg-[#D93025] rounded-full text-[10px] font-bold text-white inline-flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </span>
              </MobileNavLink>
              <MobileNavLink to="/profile">My profile</MobileNavLink>

              <div className="pt-3 border-t border-gray-100 space-y-2">
                <Link
                  to="/dashboard/recruiter"
                  className="w-full h-10 px-3 inline-flex items-center justify-center rounded-lg border border-[#2557A7] text-sm font-semibold text-[#2557A7] hover:bg-[#2557A7] hover:text-white transition-colors"
                >
                  Employers / Post Job
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full h-10 px-3 inline-flex items-center justify-center rounded-lg bg-gray-50 text-sm font-semibold text-[#2557A7] hover:bg-gray-100 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavIconBtn({ icon, title }) {
  return (
    <div title={title} className="w-10 h-10 rounded-full inline-flex items-center justify-center text-[#595959] hover:text-[#2557A7] hover:bg-gray-100 transition-colors flex-shrink-0">
      {icon}
    </div>
  )
}

function MobileNavLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-blue-50 text-[#2557A7]' : 'text-[#1A1A2E] hover:bg-gray-50'
        }`
      }
    >
      {children}
    </NavLink>
  )
}
