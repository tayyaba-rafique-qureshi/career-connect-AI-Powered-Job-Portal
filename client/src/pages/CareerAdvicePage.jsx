import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { BookOpen, TrendingUp, Users, Target } from 'lucide-react'

export default function CareerAdvicePage() {
  const articles = [
    {
      icon: TrendingUp,
      title: 'How to Switch Careers Successfully',
      desc: 'Learn the essential steps to transition into a new career field with confidence.',
      category: 'Career Change'
    },
    {
      icon: Target,
      title: 'Setting Career Goals That Work',
      desc: 'Discover how to set achievable career goals and create a roadmap to success.',
      category: 'Goal Setting'
    },
    {
      icon: Users,
      title: 'Networking Tips for Job Seekers',
      desc: 'Build meaningful professional connections that can advance your career.',
      category: 'Networking'
    },
    {
      icon: BookOpen,
      title: 'Continuous Learning in Tech',
      desc: 'Stay relevant in the fast-paced tech industry with ongoing skill development.',
      category: 'Learning'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Career <span className="text-[#2557A7] dark:text-[#60a5fa]">Advice</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Expert guidance to help you navigate your career journey and achieve your professional goals.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {articles.map((article, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <article.icon className="text-[#2557A7] dark:text-[#60a5fa]" size={24} />
                </div>
                <span className="text-xs font-semibold text-[#2557A7] dark:text-[#60a5fa] uppercase tracking-wide">
                  {article.category}
                </span>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2 mb-3">{article.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{article.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
