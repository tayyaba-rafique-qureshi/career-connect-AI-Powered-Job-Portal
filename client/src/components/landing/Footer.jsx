import { Link } from 'react-router-dom'

const cols = [
  { heading: 'For Job Seekers', links: ['Browse Jobs', 'Career Advice', 'Salary Guide', 'Resume Tips', 'Interview Prep'] },
  { heading: 'For Employers', links: ['Post a Job', 'Search Candidates', 'Pricing', 'Hiring Solutions', 'Recruiter Login'] },
  { heading: 'Company', links: ['About Us', 'Blog', 'Press', 'Careers', 'Contact'] },
  { heading: 'Legal', links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Security'] },
]

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-gray-400">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="text-xl font-bold">
              <span className="text-white">Career</span><span className="text-[#2557A7]">Connect</span>
            </Link>
            <p className="text-sm mt-3 leading-relaxed">AI-powered job matching for Pakistan's growing tech workforce.</p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="text-xs hover:text-white transition-colors font-medium">LinkedIn</a>
              <a href="#" className="text-xs hover:text-white transition-colors font-medium">Twitter</a>
              <a href="#" className="text-xs hover:text-white transition-colors font-medium">GitHub</a>
            </div>
          </div>

          {/* Link columns */}
          {cols.map(col => (
            <div key={col.heading}>
              <p className="text-white font-semibold text-sm mb-4">{col.heading}</p>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-white transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs">© {new Date().getFullYear()} CareerConnect. All rights reserved.</p>
          <p className="text-xs">Built with AI · Powered by CareerConnect</p>
        </div>
      </div>
    </footer>
  )
}
