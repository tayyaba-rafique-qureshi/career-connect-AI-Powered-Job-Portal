import { useState, useEffect } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import { getSettings, updateSettings } from '../../services/adminService'

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    allowRegistration: true,
    maintenanceMode: false,
    featuredJobsLimit: 10,
    maxApplicationsPerUser: 50,
    aiMatchThreshold: 40,
    maxJobsPerEmployer: 100,
    jobExpiryDays: 90,
    enableEmailNotifications: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const response = await getSettings()
      setSettings(response.data.data)
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch settings', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(settings)
      setToast({ message: 'Settings updated successfully', type: 'success' })
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update settings', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2557a7]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Maintenance Mode Warning */}
      {settings.maintenanceMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-800">Maintenance Mode Active</h4>
            <p className="text-sm text-yellow-700 mt-1">
              The platform is currently in maintenance mode. Only admins can access the system.
            </p>
          </div>
        </div>
      )}

      {/* Platform Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Controls</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Allow New Registrations</label>
              <p className="text-sm text-gray-500">Enable or disable new user registrations</p>
            </div>
            <button
              onClick={() => handleChange('allowRegistration', !settings.allowRegistration)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.allowRegistration ? 'bg-[#2557a7]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.allowRegistration ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
              <p className="text-sm text-gray-500">Restrict access to admins only</p>
            </div>
            <button
              onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email Notifications</label>
              <p className="text-sm text-gray-500">Enable or disable email notifications</p>
            </div>
            <button
              onClick={() => handleChange('enableEmailNotifications', !settings.enableEmailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableEmailNotifications ? 'bg-[#2557a7]' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.enableEmailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Limits and Thresholds */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Limits and Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Featured Jobs Limit
            </label>
            <input
              type="number"
              value={settings.featuredJobsLimit}
              onChange={(e) => handleChange('featuredJobsLimit', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum number of featured jobs allowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Max Applications Per User
            </label>
            <input
              type="number"
              value={settings.maxApplicationsPerUser}
              onChange={(e) => handleChange('maxApplicationsPerUser', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum applications per applicant</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              AI Match Threshold (%)
            </label>
            <input
              type="number"
              value={settings.aiMatchThreshold}
              onChange={(e) => handleChange('aiMatchThreshold', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="0"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum AI match score to show job recommendations</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Max Jobs Per Employer
            </label>
            <input
              type="number"
              value={settings.maxJobsPerEmployer}
              onChange={(e) => handleChange('maxJobsPerEmployer', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum active jobs per employer</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Job Expiry Days
            </label>
            <input
              type="number"
              value={settings.jobExpiryDays}
              onChange={(e) => handleChange('jobExpiryDays', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 mt-1">Days until job listings automatically expire</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-[#2557a7] text-white rounded-lg hover:bg-[#0d2d6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default AdminSettings
