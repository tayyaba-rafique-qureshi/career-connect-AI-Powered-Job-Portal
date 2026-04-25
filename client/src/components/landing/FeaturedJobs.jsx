import { MapPin, Clock, Briefcase } from 'lucide-react'
import { Link } from 'react-router-dom'

const jobs = [
  { title: 'Senior React Developer', company: 'TechCorp', location: 'Lahore', type: 'Full-time', salary: 'PKR 150k–200k', match: 94, tags: ['React', 'TypeScript', 'Node.js'] },
  { title: 'UI/UX Designer', company: 'DesignHub', location: 'Remote', type: 'Contract', salary: 'PKR 80k–120k', match: 88, tags: ['Figma', 'Prototyping', 'Research'] },
  { title: 'Data Analyst', company: 'FinanceAI', location: 'Karachi', type: 'Full-time', salary: 'PKR 100k–140k', match: 91, tags: ['Python', 'SQL', 'Power BI'] },
  { title: 'Backend Engineer', company: 'CloudSys', location: 'Islamabad', type: 'Full-time', salary: 'PKR 130k–180k', match: 86, tags: ['Node.js', 'MongoDB', 'AWS'] },
  { title: 'Product Manager', company: 'StartupX', location: 'Lahore', type: 'Full-time', salary: 'PKR 120k–160k', match: 82, tags: ['Agile', 'Roadmapping', 'Analytics'] },
  { title: 'DevOps Engineer', company: 'InfraNet', location: 'Remote', type: 'Remote', salary: 'PKR 140k–190k', match: 89, tags: ['Docker', 'Kubernetes', 'CI/CD'] },
]

export default function FeaturedJobs() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-[#2557A7] uppercase tracking-widest mb-2">Featured Jobs</p>
            <h2 className="text-3xl font-bold text-[#1A1A2E]">Top AI-Matched Opportunities</h2>
          </div>
          <Link to="/jobs" className="hidden md:block text-sm font-semibold text-[#2557A7] hover:underline underline-offset-2">
            View all jobs →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map(job => (
            <div key={job.title} className="border border-[#D4D2D0] rounded-xl p-5 hover:shadow-md hover:border-[#2557A7] transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-[#2557A7] font-bold text-xs shrink-0">
                  {job.company.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs bg-[#E6F4EE] text-[#0D7A4E] px-2 py-1 rounded-full font-semibold">
                  {job.match}% Match
                </span>
              </div>

              <h3 className="font-bold text-[#1A1A2E] mb-1 group-hover:text-[#2557A7] transition-colors">{job.title}</h3>
              <p className="text-sm text-[#595959] mb-3">{job.company}</p>

              <div className="flex items-center gap-3 text-xs text-[#595959] mb-3">
                <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>
                <span className="flex items-center gap-1"><Briefcase size={12} />{job.type}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.tags.map(t => (
                  <span key={t} className="text-xs bg-gray-100 text-[#595959] px-2 py-1 rounded">{t}</span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1A1A2E]">{job.salary}</span>
                <Link to="/register" className="text-xs bg-[#2557A7] text-white px-4 py-1.5 rounded font-semibold hover:bg-[#1a4283] transition-colors">
                  Apply
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link to="/jobs" className="text-sm font-semibold text-[#2557A7] hover:underline">View all jobs →</Link>
        </div>
      </div>
    </section>
  )
}
