import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { FileText } from 'lucide-react'

export default function TermsPage() {
  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using CareerConnect, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.'
    },
    {
      title: 'User Accounts',
      content: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account.'
    },
    {
      title: 'User Conduct',
      content: 'You agree not to use the platform for any unlawful purpose, to post false or misleading information, to harass or harm others, or to interfere with the proper functioning of the platform.'
    },
    {
      title: 'Job Postings',
      content: 'Employers are responsible for the accuracy of job postings. Job postings must comply with applicable employment laws and must not contain discriminatory content.'
    },
    {
      title: 'Intellectual Property',
      content: 'All content on CareerConnect, including text, graphics, logos, and software, is the property of CareerConnect or its licensors and is protected by copyright and other intellectual property laws.'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[900px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-[#2557A7] dark:text-[#60a5fa]" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Terms of <span className="text-[#2557A7] dark:text-[#60a5fa]">Service</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated: May 16, 2026</p>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400">
                These Terms of Service govern your use of the CareerConnect platform. Please read them carefully 
                before using our services.
              </p>
            </div>

            {sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{section.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
              </div>
            ))}

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Limitation of Liability</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                CareerConnect is not liable for any indirect, incidental, special, or consequential damages arising 
                from your use of the platform. We do not guarantee job placements or hiring outcomes.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Termination</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation of these terms 
                or for any other reason at our discretion.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Changes to Terms</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                We may modify these terms at any time. Continued use of the platform after changes constitutes 
                acceptance of the modified terms.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mt-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Questions?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you have questions about these Terms of Service, contact us at{' '}
                <a href="mailto:legal@careerconnect.pk" className="text-[#2557A7] dark:text-[#60a5fa] hover:underline">
                  legal@careerconnect.pk
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
