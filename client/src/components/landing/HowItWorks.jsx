import { UserCircle, Cpu, Send, CheckCircle } from 'lucide-react'

const steps = [
  { icon: UserCircle, title: 'Create Your Profile', desc: 'Add your skills, experience, and job preferences in minutes.', color: 'bg-blue-50 text-[#2557A7]' },
  { icon: Cpu,        title: 'AI Analyzes Your Profile', desc: 'Our AI engine scores your profile against thousands of job listings.', color: 'bg-green-50 text-[#0D7A4E]' },
  { icon: Send,       title: 'Get Matched & Apply', desc: 'See your top matches ranked by AI score. Apply with one click.', color: 'bg-purple-50 text-purple-700' },
  { icon: CheckCircle,title: 'Track Your Applications', desc: 'Real-time status updates — from applied to hired.', color: 'bg-orange-50 text-orange-600' },
]

export default function HowItWorks() {
  return (
    <section className="py-20 bg-[#F3F2F1]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-[#2557A7] uppercase tracking-widest mb-2">How It Works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A2E]">Land your dream job in 4 steps</h2>
          <p className="text-[#595959] mt-3 max-w-xl mx-auto">CareerConnect's AI does the heavy lifting — you just show up and apply.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
                <s.icon size={22} />
              </div>
              <span className="absolute top-4 right-4 text-4xl font-black text-gray-100 select-none">{i + 1}</span>
              <h3 className="font-bold text-[#1A1A2E] mb-2">{s.title}</h3>
              <p className="text-sm text-[#595959] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
