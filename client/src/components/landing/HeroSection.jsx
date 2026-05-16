import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Sparkles } from 'lucide-react'

const POPULAR = ['React Developer', 'UI/UX Designer', 'Data Analyst', 'Remote', 'Lahore', 'Python', 'Project Manager']

export default function HeroSection() {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/jobs?q=${keyword}&loc=${location}`)
  }

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">

          {/* Left */}
          <div>
            {/* AI badge */}
            <div className="inline-flex items-center gap-2 bg-[#E6F4EE] text-[#0D7A4E] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Sparkles size={14} />
              AI-Powered Job Matching
            </div>

            <h1 className="text-[40px] md:text-[52px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
              Find Work That<br />
              <span className="text-[#2557A7]">Actually Fits You</span>
            </h1>

            <p className="text-lg text-[#595959] mb-8 leading-relaxed max-w-lg">
              CareerConnect uses AI to match your skills with the right jobs — not just keywords. Get matched smarter, apply faster.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex flex-col md:flex-row rounded-lg border border-[#D4D2D0] overflow-hidden shadow-sm focus-within:border-[#2557A7] focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <div className="flex items-center flex-1 px-4 bg-white">
                  <Search size={18} className="text-gray-400 shrink-0" />
                  <input
                    type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
                    placeholder="Job title, skill, or keyword"
                    className="w-full h-[52px] px-3 text-sm outline-none bg-transparent"
                  />
                </div>
                <div className="flex items-center px-4 bg-white border-t md:border-t-0 md:border-l border-[#D4D2D0]">
                  <MapPin size={18} className="text-gray-400 shrink-0" />
                  <input
                    type="text" value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="City or Remote"
                    className="w-full md:w-44 h-[52px] px-3 text-sm outline-none bg-transparent"
                  />
                </div>
                <button type="submit"
                  className="h-[52px] px-8 bg-[#2557A7] text-white font-semibold text-sm hover:bg-[#1a4283] transition-colors shrink-0">
                  Search Jobs
                </button>
              </div>
            </form>

            {/* Popular searches */}
            <div className="flex flex-wrap gap-2 mb-8">
              <span className="text-xs text-[#595959] self-center">Popular:</span>
              {POPULAR.map(tag => (
                <button key={tag} type="button" onClick={() => setKeyword(tag)}
                  className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-[#2557A7] text-[#595959] rounded-full transition-colors">
                  {tag}
                </button>
              ))}
            </div>

            {/* Dual CTA */}
            <div id="hero-cta" className="flex flex-col sm:flex-row gap-3">
              <a href="/register" className="inline-flex items-center justify-center gap-2 bg-[#2557A7] text-white font-semibold px-6 py-3 rounded hover:bg-[#1a4283] transition-colors text-sm">
                I'm looking for a job →
              </a>
              <a href="#employers" className="inline-flex items-center justify-center gap-2 border-2 border-[#2557A7] text-[#2557A7] font-semibold px-6 py-3 rounded hover:bg-blue-50 transition-colors text-sm">
                I want to hire talent →
              </a>
            </div>
          </div>

          {/* Right — illustration */}
          <div className="hidden md:flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Main card */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-[#2557A7] font-bold text-sm">CC</div>
                  <div>
                    <p className="font-semibold text-sm text-[#1A1A2E]">Senior React Developer</p>
                    <p className="text-xs text-[#595959]">TechCorp · Lahore · Remote</p>
                  </div>
                  <span className="ml-auto text-xs bg-[#E6F4EE] text-[#0D7A4E] px-2 py-1 rounded-full font-semibold">94% Match</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-4">
                  {['React','Node.js','TypeScript'].map(s => (
                    <span key={s} className="text-xs bg-blue-50 text-[#2557A7] px-2 py-1 rounded">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#1A1A2E]">PKR 150k – 200k/mo</span>
                  <button className="text-xs bg-[#2557A7] text-white px-4 py-1.5 rounded font-semibold">Apply Now</button>
                </div>
              </div>

              {/* Floating badge 1 */}
              <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="text-xs font-bold text-[#1A1A2E]">AI Matched</p>
                  <p className="text-xs text-[#595959]">Based on your skills</p>
                </div>
              </div>

              {/* Floating badge 2 */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-2 flex items-center gap-2">
                <span className="text-lg">✅</span>
                <div>
                  <p className="text-xs font-bold text-[#1A1A2E]">1,200+ Jobs</p>
                  <p className="text-xs text-[#595959]">Added this week</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
