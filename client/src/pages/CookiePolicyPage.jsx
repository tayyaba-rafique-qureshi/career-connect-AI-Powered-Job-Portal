import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { Cookie } from 'lucide-react'

export default function CookiePolicyPage() {
  const cookieTypes = [
    {
      title: 'Essential Cookies',
      desc: 'Required for the platform to function properly. These cookies enable core functionality such as security, authentication, and accessibility.',
      examples: 'Session cookies, authentication tokens'
    },
    {
      title: 'Performance Cookies',
      desc: 'Help us understand how visitors interact with our platform by collecting and reporting information anonymously.',
      examples: 'Google Analytics, page load times'
    },
    {
      title: 'Functionality Cookies',
      desc: 'Enable enhanced functionality and personalization, such as remembering your preferences and settings.',
      examples: 'Language preferences, theme settings'
    },
    {
      title: 'Targeting Cookies',
      desc: 'Used to deliver relevant advertisements and track campaign effectiveness.',
      examples: 'Ad network cookies, remarketing pixels'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[900px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Cookie className="text-orange-600 dark:text-orange-400" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Cookie <span className="text-[#2557A7] dark:text-[#60a5fa]">Policy</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated: May 16, 2026</p>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400">
                This Cookie Policy explains how CareerConnect uses cookies and similar tracking technologies 
                to recognize you when you visit our platform. It explains what these technologies are and why 
                we use them, as well as your rights to control our use of them.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What are Cookies?</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Cookies are small data files that are placed on your computer or mobile device when you visit 
                a website. Cookies are widely used by website owners to make their websites work, or to work 
                more efficiently, as well as to provide reporting information.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Types of Cookies We Use</h2>
              <div className="space-y-6">
                {cookieTypes.map((type, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-[#1f1f1f] rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{type.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{type.desc}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      <strong>Examples:</strong> {type.examples}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How to Control Cookies</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                You have the right to decide whether to accept or reject cookies. You can exercise your cookie 
                preferences by clicking on the appropriate opt-out links provided in the cookie banner or by 
                setting your browser to refuse cookies.
              </p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                Most web browsers allow some control of cookies through browser settings. However, if you block 
                cookies, you may not be able to use all the features of our platform.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Third-Party Cookies</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                In addition to our own cookies, we may also use various third-party cookies to report usage 
                statistics of the platform and deliver advertisements on and through the platform.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mt-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Questions About Cookies?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you have questions about our use of cookies, contact us at{' '}
                <a href="mailto:privacy@careerconnect.pk" className="text-[#2557A7] dark:text-[#60a5fa] hover:underline">
                  privacy@careerconnect.pk
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
