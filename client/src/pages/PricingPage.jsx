import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { Check } from 'lucide-react'

export default function PricingPage() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for individual job seekers',
      features: [
        'Browse unlimited jobs',
        'Apply to jobs',
        'Basic profile',
        'Email notifications',
        'Resume upload'
      ]
    },
    {
      name: 'Recruiter',
      price: '49,999',
      description: 'For companies hiring talent',
      features: [
        'Post up to 10 jobs/month',
        'AI-powered candidate matching',
        'Applicant tracking system',
        'Advanced analytics',
        'Priority support',
        'Featured job listings'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations',
      features: [
        'Unlimited job postings',
        'Dedicated account manager',
        'Custom integrations',
        'Advanced reporting',
        'API access',
        'White-label solutions',
        'SLA guarantee'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Simple, Transparent <span className="text-[#2557A7] dark:text-[#60a5fa]">Pricing</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your hiring needs. All plans include our AI-powered matching technology.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`relative bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8 ${
                  plan.popular ? 'ring-2 ring-[#2557A7] dark:ring-[#60a5fa]' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#2557A7] dark:bg-[#60a5fa] text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price === 'Custom' ? plan.price : `PKR ${plan.price}`}
                  </span>
                  {plan.price !== 'Custom' && (
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-3">
                      <Check className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular 
                    ? 'bg-[#2557A7] dark:bg-[#60a5fa] text-white hover:bg-[#1e4685] dark:hover:bg-[#4a8fd9]'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}>
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
