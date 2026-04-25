import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export default function CTABanner() {
  return (
    <section className="py-20 bg-[#2557A7]">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
          Ready to find your perfect match?
        </h2>
        <p className="text-blue-200 text-lg mb-8 max-w-xl mx-auto">
          Join 200,000+ professionals using CareerConnect's AI to land better jobs faster.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#2557A7] font-bold px-8 py-3.5 rounded hover:bg-blue-50 transition-colors text-sm">
            Get Started Free <ArrowRight size={16} />
          </Link>
          <Link to="/register?role=employer"
            className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 py-3.5 rounded hover:bg-blue-600 transition-colors text-sm">
            Post a Job →
          </Link>
        </div>
        <p className="text-blue-300 text-xs mt-5">No credit card required · Free forever for job seekers</p>
      </div>
    </section>
  )
}
