import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { FileText, CheckCircle } from 'lucide-react'

export default function ResumeTipsPage() {
  const tips = [
    {
      title: 'Keep it Concise',
      desc: 'Limit your resume to 1-2 pages. Recruiters spend only 6-7 seconds on initial screening.'
    },
    {
      title: 'Use Action Verbs',
      desc: 'Start bullet points with strong action verbs like "Developed", "Managed", "Implemented".'
    },
    {
      title: 'Quantify Achievements',
      desc: 'Use numbers and metrics to demonstrate impact (e.g., "Increased sales by 30%").'
    },
    {
      title: 'Tailor for Each Job',
      desc: 'Customize your resume for each application by highlighting relevant skills and experience.'
    },
    {
      title: 'Include Keywords',
      desc: 'Use keywords from the job description to pass Applicant Tracking Systems (ATS).'
    },
    {
      title: 'Professional Format',
      desc: 'Use a clean, professional layout with consistent formatting and easy-to-read fonts.'
    },
    {
      title: 'Highlight Skills',
      desc: 'Create a dedicated skills section with both technical and soft skills relevant to the role.'
    },
    {
      title: 'Proofread Carefully',
      desc: 'Check for spelling and grammar errors. Ask someone else to review your resume.'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-purple-600 dark:text-purple-400" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Resume <span className="text-[#2557A7] dark:text-[#60a5fa]">Tips</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Create a winning resume that gets you noticed by recruiters and lands interviews.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {tips.map((tip, idx) => (
              <div key={idx} className="flex gap-4 p-6 bg-gray-50 dark:bg-[#1f1f1f] rounded-lg">
                <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{tip.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tip.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
