import Navbar from '../components/landing/Navbar'
import Footer from '../components/landing/Footer'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useState } from 'react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    alert('Thank you for contacting us! We will get back to you soon.')
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f0f0f]">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <section className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Get in <span className="text-[#2557A7] dark:text-[#60a5fa]">Touch</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="text-[#2557A7] dark:text-[#60a5fa]" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">support@careerconnect.pk</p>
            </div>

            <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="text-[#2557A7] dark:text-[#60a5fa]" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Phone</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">+92 300 1234567</p>
            </div>

            <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="text-[#2557A7] dark:text-[#60a5fa]" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Office</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Karachi, Pakistan</p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2557A7] dark:focus:ring-[#60a5fa] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2557A7] dark:focus:ring-[#60a5fa] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2557A7] dark:focus:ring-[#60a5fa] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2557A7] dark:focus:ring-[#60a5fa] focus:border-transparent resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#2557A7] dark:bg-[#60a5fa] text-white py-3 rounded-lg hover:bg-[#1e4685] dark:hover:bg-[#4a8fd9] transition-colors flex items-center justify-center gap-2 font-semibold"
              >
                <Send size={20} />
                Send Message
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
