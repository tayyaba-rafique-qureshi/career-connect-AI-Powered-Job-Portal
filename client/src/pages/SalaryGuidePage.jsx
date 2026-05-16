import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { DollarSign } from 'lucide-react'

export default function SalaryGuidePage() {
  const salaries = [
    { role: 'Software Engineer', entry: '50,000 - 80,000', mid: '80,000 - 150,000', senior: '150,000 - 300,000' },
    { role: 'Data Analyst', entry: '40,000 - 70,000', mid: '70,000 - 120,000', senior: '120,000 - 200,000' },
    { role: 'UI/UX Designer', entry: '45,000 - 75,000', mid: '75,000 - 130,000', senior: '130,000 - 220,000' },
    { role: 'Product Manager', entry: '60,000 - 100,000', mid: '100,000 - 180,000', senior: '180,000 - 350,000' },
    { role: 'DevOps Engineer', entry: '55,000 - 90,000', mid: '90,000 - 160,000', senior: '160,000 - 280,000' }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-green-600 dark:text-green-400" size={32} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Salary <span className="text-[#2557A7] dark:text-[#60a5fa]">Guide</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Average salary ranges for tech roles in Pakistan (PKR per month)
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Role</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Entry Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Mid Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Senior Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {salaries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{item.role}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">PKR {item.entry}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">PKR {item.mid}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">PKR {item.senior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> Salaries vary based on company size, location, skills, and experience. These are approximate ranges based on market data.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
