import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { Shield } from 'lucide-react'

export default function PrivacyPage() {
  const sections = [
    {
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us, such as when you create an account, upload a resume, apply for jobs, or contact us for support. This includes your name, email address, phone number, work history, education, skills, and other professional information.'
    },
    {
      title: 'How We Use Your Information',
      content: 'We use the information we collect to provide, maintain, and improve our services, including matching you with relevant job opportunities, communicating with you about jobs and our services, and analyzing usage patterns to enhance user experience.'
    },
    {
      title: 'Information Sharing',
      content: 'We share your information with employers when you apply for jobs. We may also share information with service providers who help us operate our platform, and as required by law or to protect our rights and the safety of our users.'
    },
    {
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.'
    },
    {
      title: 'Your Rights',
      content: 'You have the right to access, update, or delete your personal information at any time. You can also opt out of marketing communications and request a copy of your data. Contact us at privacy@careerconnect.pk to exercise these rights.'
    },
    {
      title: 'Cookies and Tracking',
      content: 'We use cookies and similar tracking technologies to collect information about your browsing activities and preferences. You can control cookies through your browser settings, but disabling them may affect your ability to use certain features of our platform.'
    },
    {
      title: 'Changes to This Policy',
      content: 'We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last Updated" date below.'
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[900px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="text-[#2557A7] dark:text-[#60a5fa]" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Privacy <span className="text-[#2557A7] dark:text-[#60a5fa]">Policy</span>
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated: May 16, 2026</p>
          </div>

          <div className="space-y-8">
            <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-6">
              <p className="text-gray-600 dark:text-gray-400">
                At CareerConnect, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform. Please read this policy 
                carefully to understand our practices regarding your personal data.
              </p>
            </div>

            {sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{section.title}</h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{section.content}</p>
              </div>
            ))}

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mt-8">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Us</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you have any questions about this Privacy Policy, please contact us at{' '}
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
