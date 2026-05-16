import { Star } from 'lucide-react'

const testimonials = [
  { name: 'Ahmed Raza', role: 'Frontend Developer', company: 'Hired at TechCorp', text: 'CareerConnect matched me with a job I actually wanted. The AI score told me exactly how well I fit before I even applied. Got hired in 2 weeks.', avatar: 'AR' },
  { name: 'Sara Khan', role: 'HR Manager', company: 'DesignHub', text: 'We cut our screening time by 70%. The AI ranking is surprisingly accurate — our last 3 hires all came from the top 5 ranked candidates.', avatar: 'SK' },
  { name: 'Usman Ali', role: 'Data Analyst', company: 'Hired at FinanceAI', text: 'I was applying blindly on other platforms. Here, I could see my match score and tailor my profile. Landed my dream job in Karachi.', avatar: 'UA' },
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-[#F3F2F1]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[#2557A7] uppercase tracking-widest mb-2">Testimonials</p>
          <h2 className="text-3xl font-bold text-[#1A1A2E]">Trusted by job seekers & employers</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-sm text-[#595959] leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2557A7] flex items-center justify-center text-white font-bold text-xs">
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm text-[#1A1A2E]">{t.name}</p>
                  <p className="text-xs text-[#595959]">{t.role} · {t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
