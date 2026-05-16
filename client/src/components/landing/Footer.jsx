import { Link } from 'react-router-dom'

const cols = [
  { 
    heading: 'For Job Seekers', 
    links: [
      { label: 'Browse Jobs', href: '/jobs' },
      { label: 'Career Advice', href: '/career-advice' },
      { label: 'Salary Guide', href: '/salary-guide' },
      { label: 'Resume Tips', href: '/resume-tips' },
      { label: 'Interview Prep', href: '/interview-prep' }
    ]
  },
  { 
    heading: 'For Employers', 
    links: [
      { label: 'Post a Job', href: '/register' },
      { label: 'Search Candidates', href: '/login' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Hiring Solutions', href: '/pricing' },
      { label: 'Recruiter Login', href: '/login' }
    ]
  },
  { 
    heading: 'Company', 
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Blog', href: '/career-advice' },
      { label: 'Press', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' }
    ]
  },
  { 
    heading: 'Legal', 
    links: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookie-policy' },
      { label: 'Security', href: '/security' }
    ]
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] dark:bg-[#0a0a0a] text-gray-400 dark:text-gray-500">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="text-xl font-bold">
              <span className="text-white">Career</span><span className="text-[#2557A7] dark:text-[#60a5fa]">Connect</span>
            </Link>
            <p className="text-sm mt-3 leading-relaxed">AI-powered job matching for Pakistan's growing tech workforce.</p>
            <div className="flex gap-4 mt-4">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white dark:hover:text-[#60a5fa] transition-colors font-medium">LinkedIn</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white dark:hover:text-[#60a5fa] transition-colors font-medium">Twitter</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs hover:text-white dark:hover:text-[#60a5fa] transition-colors font-medium">GitHub</a>
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading}>
              <p className="text-white font-semibold text-sm mb-4">{col.heading}</p>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-sm hover:text-white dark:hover:text-[#60a5fa] transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 dark:border-gray-900 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs">© {new Date().getFullYear()} CareerConnect. All rights reserved.</p>
          <p className="text-xs">Built with AI · Powered by CareerConnect</p>
        </div>
      </div>
    </footer>
  )
}
