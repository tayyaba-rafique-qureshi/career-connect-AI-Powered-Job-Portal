import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { Shield, Lock, Eye, AlertTriangle } from 'lucide-react'

export default function SecurityPage() {
  const measures = [
    {
      icon: Lock,
      title: 'Data Encryption',
      desc: 'All data transmitted between your browser and our servers is encrypted using industry-standard SSL/TLS protocols.'
    },
    {
      icon: Shield,
      title: 'Secure Authentication',
      desc: 'We use secure password hashing and support two-factor authentication to protect your account.'
    },
    {
      icon: Eye,
      title: 'Privacy Controls',
      desc: 'You have full control over your profile visibility and can choose what information to share with employers.'
    },
    {
      icon: AlertTriangle,
      title: 'Fraud Prevention',
      desc: 'We actively monitor for suspicious activity and fraudulent job postings to keep our platform safe.'
    }
  ]

  const tips = [
    'Use a strong, unique password for your CareerConnect account',
    'Enable two-factor authentication for added security',
    'Never share your password or login credentials with anyone',
    'Be cautious of suspicious job postings or requests for personal information',
    'Report any security concerns to our team immediately',
    'Keep your contact information up to date',
    'Review your account activity regularly',
    'Log out when using shared or public computers'
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Security & <span className="text-[#2557A7] dark:text-[#60a5fa]">Safety</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your security is our top priority. Learn how we protect your data and keep our platform safe.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Our Security Measures</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {measures.map((measure, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
                    <measure.icon className="text-[#2557A7] dark:text-[#60a5fa]" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{measure.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{measure.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Security Best Practices</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="w-6 h-6 bg-green-600 dark:bg-green-400 text-white dark:text-gray-900 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-semibold">
                    {idx + 1}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
              Report Security Issues
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              If you discover a security vulnerability or suspicious activity, please report it immediately to{' '}
              <a href="mailto:security@careerconnect.pk" className="text-[#2557A7] dark:text-[#60a5fa] hover:underline font-semibold">
                security@careerconnect.pk
              </a>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
