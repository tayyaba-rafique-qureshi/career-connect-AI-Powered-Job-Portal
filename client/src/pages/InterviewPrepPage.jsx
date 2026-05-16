import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { MessageCircle } from 'lucide-react'

export default function InterviewPrepPage() {
  const sections = [
    {
      title: 'Before the Interview',
      tips: [
        'Research the company thoroughly',
        'Review the job description carefully',
        'Prepare answers to common questions',
        'Prepare questions to ask the interviewer',
        'Plan your outfit and route in advance'
      ]
    },
    {
      title: 'During the Interview',
      tips: [
        'Arrive 10-15 minutes early',
        'Greet everyone professionally',
        'Make eye contact and smile',
        'Listen carefully to questions',
        'Use the STAR method for behavioral questions'
      ]
    },
    {
      title: 'Common Questions',
      tips: [
        'Tell me about yourself',
        'Why do you want this job?',
        'What are your strengths and weaknesses?',
        'Where do you see yourself in 5 years?',
        'Why should we hire you?'
      ]
    },
    {
      title: 'After the Interview',
      tips: [
        'Send a thank-you email within 24 hours',
        'Reflect on what went well and what to improve',
        'Follow up if you don\'t hear back in a week',
        'Continue applying to other positions',
        'Stay positive and patient'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Interview <span className="text-[#2557A7] dark:text-[#60a5fa]">Preparation</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Ace your next interview with these proven tips and strategies.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{section.title}</h2>
                <ul className="space-y-3">
                  {section.tips.map((tip, tipIdx) => (
                    <li key={tipIdx} className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-[#2557A7] dark:bg-[#60a5fa] text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                        {tipIdx + 1}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
