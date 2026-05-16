import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { isDark, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Browse Jobs', href: '/jobs' },
    { label: 'Companies', href: '#companies' },
    { label: 'Salary Guide', href: '#salary' },
    { label: 'For Employers', href: '#employers' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#1f1f1f] transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight">
          <span className="text-[#1A1A2E] dark:text-white">Career</span><span className="text-[#2557A7]">Connect</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.label} href={l.href}
              className="text-sm font-medium text-[#595959] dark:text-gray-300 hover:text-[#2557A7] dark:hover:text-[#60a5fa] transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-full inline-flex items-center justify-center text-[#595959] dark:text-gray-300 hover:text-[#2557A7] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <Link to="/login" className="text-sm font-semibold text-[#2557A7] dark:text-[#60a5fa] hover:underline underline-offset-2 px-3 py-2">
            Sign In
          </Link>
          <Link to="/register" className="text-sm font-semibold bg-[#2557A7] text-white px-5 py-2.5 rounded hover:bg-[#1a4283] transition-colors">
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2 text-[#1A1A2E] dark:text-white" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white dark:bg-[#1f1f1f] border-t border-gray-100 dark:border-gray-700 px-6 py-4 flex flex-col gap-4">
          {links.map(l => (
            <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-[#595959] dark:text-gray-300 hover:text-[#2557A7] dark:hover:text-[#60a5fa]">
              {l.label}
            </a>
          ))}
          <hr className="border-gray-100 dark:border-gray-700" />
          
          {/* Dark mode toggle for mobile */}
          <button
            onClick={() => {
              toggleTheme()
              setMenuOpen(false)
            }}
            className="flex items-center gap-2 text-sm font-medium text-[#595959] dark:text-gray-300 hover:text-[#2557A7] dark:hover:text-[#60a5fa]"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-semibold text-[#2557A7] dark:text-[#60a5fa]">Sign In</Link>
          <Link to="/register" onClick={() => setMenuOpen(false)}
            className="text-sm font-semibold bg-[#2557A7] text-white px-5 py-2.5 rounded text-center hover:bg-[#1a4283] transition-colors">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  )
}
