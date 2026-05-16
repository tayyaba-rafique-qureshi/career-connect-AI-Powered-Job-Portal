import { useState, useEffect } from 'react'
import { Save, AlertTriangle } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import Breadcrumb from '../../components/admin/Breadcrumb'
import Tooltip from '../../components/admin/Tooltip'
import KeyboardShortcutsHelp from '../../components/admin/KeyboardShortcutsHelp'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
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

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+s': (e) => {
      e.preventDefault()
      handleSave()
    },
    'ctrl+r': () => {
      fetchSettings()
      setToast({ message: 'Settings refreshed', type: 'success' })
    }
  })

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
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Settings' }]} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={[
        { keys: 'Ctrl + S', description: 'Save settings' },
        { keys: 'Ctrl + R', description: 'Refresh settings' },
        { keys: '?', description: 'Show keyboard shortcuts' }
      ]} />

      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Maintenance Mode Warning */}
      {settings.maintenanceMode && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Maintenance Mode Active</h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              The platform is currently in maintenance mode. Only admins can access the system.
            </p>
          </div>
        </div>
      )}

      {/* Platform Controls */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Controls</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Allow New Registrations</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable new user registrations</p>
              </div>
              <Tooltip text="When disabled, new users cannot create accounts. Existing users can still log in." />
            </div>
            <button
              onClick={() => handleChange('allowRegistration', !settings.allowRegistration)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.allowRegistration ? 'bg-[#2557a7]' : 'bg-gray-200 dark:bg-gray-700'
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
            <div className="flex items-center">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Maintenance Mode</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Restrict access to admins only</p>
              </div>
              <Tooltip text="When enabled, only admin users can access the platform. All other users will see a maintenance page." />
            </div>
            <button
              onClick={() => handleChange('maintenanceMode', !settings.maintenanceMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'
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
            <div className="flex items-center">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</label>
                <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable email notifications</p>
              </div>
              <Tooltip text="Controls whether users receive email notifications for applications, messages, and updates." />
            </div>
            <button
              onClick={() => handleChange('enableEmailNotifications', !settings.enableEmailNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.enableEmailNotifications ? 'bg-[#2557a7]' : 'bg-gray-200 dark:bg-gray-700'
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
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Limits and Thresholds</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
              Featured Jobs Limit
              <Tooltip text="Maximum number of jobs that can be featured simultaneously on the homepage." />
            </label>
            <input
              type="number"
              value={settings.featuredJobsLimit}
              onChange={(e) => handleChange('featuredJobsLimit', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum number of featured jobs allowed</p>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
              Max Applications Per User
              <Tooltip text="Prevents spam by limiting how many jobs a single applicant can apply to." />
            </label>
            <input
              type="number"
              value={settings.maxApplicationsPerUser}
              onChange={(e) => handleChange('maxApplicationsPerUser', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum applications per applicant</p>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
              AI Match Threshold (%)
              <Tooltip text="Minimum AI match score (0-100) required to show job recommendations. Higher = more selective matching." />
            </label>
            <input
              type="number"
              value={settings.aiMatchThreshold}
              onChange={(e) => handleChange('aiMatchThreshold', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="0"
              max="100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum AI match score to show job recommendations</p>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
              Max Jobs Per Employer
              <Tooltip text="Limits how many active job postings a single employer can have at once." />
            </label>
            <input
              type="number"
              value={settings.maxJobsPerEmployer}
              onChange={(e) => handleChange('maxJobsPerEmployer', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Maximum active jobs per employer</p>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
              Job Expiry Days
              <Tooltip text="Jobs automatically close after this many days. Employers can manually close jobs earlier." />
            </label>
            <input
              type="number"
              value={settings.jobExpiryDays}
              onChange={(e) => handleChange('jobExpiryDays', parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              min="1"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days until job listings automatically expire</p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-[#2557a7] text-white rounded-lg hover:bg-[#0d2d6e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Save settings (Ctrl+S)"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default AdminSettings
