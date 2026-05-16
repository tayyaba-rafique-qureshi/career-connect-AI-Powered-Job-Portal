import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { Briefcase, MapPin, Clock } from 'lucide-react'

export default function CareersPage() {
  const openings = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Karachi, Pakistan',
      type: 'Full-time',
      description: 'Build and scale our AI-powered job matching platform using React, Node.js, and Python.'
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Lahore, Pakistan',
      type: 'Full-time',
      description: 'Create beautiful, intuitive experiences for job seekers and recruiters.'
    },
    {
      title: 'Machine Learning Engineer',
      department: 'AI/ML',
      location: 'Remote',
      type: 'Full-time',
      description: 'Develop and improve our recommendation and matching algorithms.'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Islamabad, Pakistan',
      type: 'Full-time',
      description: 'Help our enterprise clients succeed and grow with CareerConnect.'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Join Our <span className="text-[#2557A7] dark:text-[#60a5fa]">Team</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Help us build the future of recruitment in Pakistan. We're looking for talented, passionate people to join our mission.
            </p>
          </div>

          <div className="mb-12 bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Why Work at CareerConnect?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Impact</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your work directly helps thousands of people find meaningful careers.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Growth</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Learn from talented colleagues and work with cutting-edge technology.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Culture</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Collaborative, inclusive environment with flexible work arrangements.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Open Positions</h2>
            {openings.map((job, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{job.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{job.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Briefcase size={16} />
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={16} />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <button className="bg-[#2557A7] dark:bg-[#60a5fa] text-white px-6 py-2 rounded-lg hover:bg-[#1e4685] dark:hover:bg-[#4a8fd9] transition-colors whitespace-nowrap">
                    Apply Now
                  </button>
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
