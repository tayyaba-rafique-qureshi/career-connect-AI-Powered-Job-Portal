import { useEffect, useState } from 'react'
import { MapPin, Briefcase, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'

const TYPE_COLOR = {
  'full-time':  'bg-green-50 text-green-700',
  'part-time':  'bg-yellow-50 text-yellow-700',
  'contract':   'bg-blue-50 text-blue-700',
  'internship': 'bg-purple-50 text-purple-700',
}

export default function FeaturedJobs() {
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get(`${API}/jobs`, { params: { limit: 6, sort: 'newest', status: 'active' } })
      .then(res => {
        const list = Array.isArray(res.data) ? res.data
          : res.data?.jobs || res.data?.data || []
        setJobs(list.slice(0, 6))
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false))
  }, [])

  const fallback = [
    { title: 'Software Engineer',  company: 'TechCorp',  location: 'Lahore',  jobType: ['full-time'],  requiredSkills: ['React', 'Node.js'] },
    { title: 'UI/UX Designer',     company: 'DesignHub', location: 'Remote',  jobType: ['contract'],   requiredSkills: ['Figma', 'Prototyping'] },
    { title: 'Data Analyst',        company: 'FinanceAI', location: 'Karachi', jobType: ['full-time'],  requiredSkills: ['Python', 'SQL'] },
  ]

  const display = jobs.length > 0 ? jobs : (loading ? [] : fallback)

  return (
    <section className="py-20 bg-white" id="featured-jobs">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-[#2557A7] uppercase tracking-widest mb-2">
              {jobs.length > 0 ? 'Live Openings' : 'Featured Jobs'}
            </p>
            <h2 className="text-3xl font-bold text-[#1A1A2E]">
              {jobs.length > 0 ? 'Jobs Hiring Right Now' : 'Top AI-Matched Opportunities'}
            </h2>
          </div>
          <Link to="/register" className="hidden md:block text-sm font-semibold text-[#2557A7] hover:underline underline-offset-2">
            See all jobs →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[#2557A7]" size={28} />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {display.map((job, i) => (
              <JobCard key={job._id || i} job={job} demo={jobs.length === 0} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to="/register" className="text-sm font-semibold text-[#2557A7] hover:underline">See all jobs →</Link>
        </div>
      </div>
    </section>
  )
}

function JobCard({ job, demo }) {
  const skills    = (job.requiredSkills || job.skills || []).slice(0, 3)
  const jobType   = Array.isArray(job.jobType) ? job.jobType[0] : job.jobType
  const typeClass = TYPE_COLOR[jobType?.toLowerCase()] || 'bg-gray-100 text-gray-600'
  const initial   = (job.company || 'J').slice(0, 2).toUpperCase()

  return (
    <Link
      to="/register"
      className="block border border-[#D4D2D0] rounded-xl p-5 hover:shadow-md hover:border-[#2557A7] transition-all group"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#2557A7] font-bold text-xs shrink-0">
          {initial}
        </div>
        {demo && (
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-medium">Sample</span>
        )}
      </div>

      <h3 className="font-bold text-[#1A1A2E] mb-1 group-hover:text-[#2557A7] transition-colors text-[15px]">
        {job.title}
      </h3>
      <p className="text-sm text-[#595959] mb-3">{job.company}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[#595959] mb-3">
        {job.location && (
          <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
        )}
        {jobType && (
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium ${typeClass}`}>
            <Briefcase size={10} />{jobType}
          </span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {skills.map(s => (
            <span key={s} className="text-xs bg-gray-100 text-[#595959] px-2 py-0.5 rounded">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {(job.salaryMin || job.salaryMax) ? (
          <span className="text-sm font-semibold text-[#1A1A2E]">
            PKR {job.salaryMin ? `${(job.salaryMin / 1000).toFixed(0)}k` : ''}
            {job.salaryMin && job.salaryMax ? '–' : ''}
            {job.salaryMax ? `${(job.salaryMax / 1000).toFixed(0)}k` : ''}
          </span>
        ) : <span />}
        <span className="text-xs bg-[#2557A7] text-white px-4 py-1.5 rounded font-semibold group-hover:bg-[#1a4283] transition-colors">
          Apply
        </span>
      </div>
    </Link>
  )
}
