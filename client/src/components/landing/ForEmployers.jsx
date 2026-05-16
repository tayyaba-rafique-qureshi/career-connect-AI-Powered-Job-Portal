import { Zap, Target, BarChart2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const perks = [
  { icon: Zap,      title: 'Post in Minutes', desc: 'Create a job listing in under 5 minutes. Our AI auto-suggests skills and requirements.' },
  { icon: Target,   title: 'AI Candidate Ranking', desc: 'Every applicant is scored by AI against your job description. No more manual screening.' },
  { icon: BarChart2,title: 'Hiring Analytics', desc: 'Track views, applications, and conversion rates in real time.' },
  { icon: Users,    title: 'Talent Pool Access', desc: 'Search 200,000+ pre-screened candidates filtered by skills, location, and experience.' },
]

export default function ForEmployers() {
  return (
    <section id="employers" className="py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-[#2557A7] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              For Employers
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E] mb-4">
              Hire Smarter with<br />
              <span className="text-[#2557A7]">AI-Powered Screening</span>
            </h2>
            <p className="text-[#595959] mb-8 leading-relaxed">
              Stop drowning in unqualified applications. CareerConnect's AI ranks every candidate by match score so you interview only the best.
            </p>

            <div className="space-y-5 mb-8">
              {perks.map(p => (
                <div key={p.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-[#2557A7] shrink-0">
                    <p.icon size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A2E] text-sm">{p.title}</p>
                    <p className="text-sm text-[#595959] mt-0.5">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Link to="/register" className="bg-[#2557A7] text-white font-semibold px-6 py-3 rounded hover:bg-[#1a4283] transition-colors text-sm">
                Post a Job Free →
              </Link>
              <a href="#" className="border-2 border-[#2557A7] text-[#2557A7] font-semibold px-6 py-3 rounded hover:bg-blue-50 transition-colors text-sm">
                See Pricing
              </a>
            </div>
          </div>

          {/* Right — mock dashboard */}
          <div className="bg-[#F3F2F1] rounded-2xl p-6">
            <p className="text-xs font-semibold text-[#595959] uppercase tracking-widest mb-4">Applicant Rankings</p>
            {[
              { name: 'Ahmed Raza', score: 96, skills: 'React, Node.js' },
              { name: 'Sara Khan', score: 91, skills: 'Python, ML' },
              { name: 'Usman Ali', score: 87, skills: 'React, TypeScript' },
              { name: 'Fatima Malik', score: 83, skills: 'Vue.js, CSS' },
            ].map((c, i) => (
              <div key={c.name} className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 mb-2 shadow-sm">
                <span className="text-sm font-bold text-[#595959] w-5">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#2557A7] font-bold text-xs">
                  {c.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A1A2E]">{c.name}</p>
                  <p className="text-xs text-[#595959]">{c.skills}</p>
                </div>
                <span className="text-xs font-bold bg-[#E6F4EE] text-[#0D7A4E] px-2 py-1 rounded-full">{c.score}%</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
