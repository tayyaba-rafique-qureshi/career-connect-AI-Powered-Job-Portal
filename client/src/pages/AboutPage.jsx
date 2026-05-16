import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { Target, Users, Zap, Heart } from 'lucide-react'

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: 'Our Mission',
      desc: 'To connect talented professionals with their dream careers using AI-powered matching technology.'
    },
    {
      icon: Users,
      title: 'Our Team',
      desc: 'A diverse group of engineers, designers, and career experts passionate about transforming recruitment.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      desc: 'We leverage cutting-edge AI and machine learning to make job matching smarter and faster.'
    },
    {
      icon: Heart,
      title: 'Our Values',
      desc: 'Transparency, inclusivity, and excellence drive everything we do at CareerConnect.'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              About <span className="text-[#2557A7] dark:text-[#60a5fa]">CareerConnect</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              We're on a mission to revolutionize how people find jobs and how companies find talent in Pakistan's growing tech ecosystem.
            </p>
          </div>

          <div className="mb-16">
            <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8 md:p-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400">
                <p>
                  CareerConnect was founded with a simple belief: finding the right job shouldn't be a matter of luck. 
                  In Pakistan's rapidly growing tech industry, talented professionals and innovative companies were 
                  struggling to find each other.
                </p>
                <p>
                  We built CareerConnect to solve this problem using artificial intelligence. Our platform analyzes 
                  skills, experience, and career goals to match candidates with opportunities where they'll truly thrive. 
                  For employers, we provide intelligent tools to identify the best talent quickly and efficiently.
                </p>
                <p>
                  Today, we're proud to serve thousands of job seekers and hundreds of companies across Pakistan, 
                  helping build careers and teams that drive innovation forward.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                  <value.icon className="text-[#2557A7] dark:text-[#60a5fa]" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
