import { useState } from 'react'
import { Send } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import { sendAnnouncement } from '../../services/adminService'

const AdminAnnouncements = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    targetRole: 'all'
  })
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSend = async (e) => {
    e.preventDefault()

    if (!formData.subject || !formData.message) {
      setToast({ message: 'Subject and message are required', type: 'error' })
      return
    }

    setSending(true)
    try {
      const response = await sendAnnouncement(formData)
      setToast({
        message: `Announcement sent to ${response.data.data.recipientCount} users`,
        type: 'success'
      })
      setFormData({ subject: '', message: '', targetRole: 'all' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to send announcement', type: 'error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Announcement Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Platform Announcement</h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Enter announcement subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Target Audience
            </label>
            <select
              value={formData.targetRole}
              onChange={(e) => handleChange('targetRole', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="applicant">Applicants Only</option>
              <option value="employer">Employers Only</option>
              <option value="recruiter">Recruiters Only</option>
              <option value="admin">Admins Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Enter your announcement message"
              rows="6"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent resize-none"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2 bg-[#2557a7] text-white rounded-lg hover:bg-[#0d2d6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preview</h3>
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Subject:</p>
            <p className="text-sm font-semibold text-gray-900">
              {formData.subject || 'Your announcement subject will appear here'}
            </p>
          </div>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">To:</p>
            <p className="text-sm text-gray-700">
              {formData.targetRole === 'all' ? 'All Users' : `${formData.targetRole.charAt(0).toUpperCase() + formData.targetRole.slice(1)}s`}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Message:</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {formData.message || 'Your announcement message will appear here'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Announcements are sent immediately to all selected users</li>
          <li>Make sure to review your message before sending</li>
          <li>All announcements are logged in the audit trail</li>
          <li>Users will receive the announcement via email</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminAnnouncements
