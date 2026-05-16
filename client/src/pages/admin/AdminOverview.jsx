import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, FileText, TrendingUp, Building2, Target } from 'lucide-react'
import StatCard from '../../components/admin/StatCard'
import AdminToast from '../../components/admin/AdminToast'
import Breadcrumb from '../../components/admin/Breadcrumb'
import Tooltip from '../../components/admin/Tooltip'
import KeyboardShortcutsHelp from '../../components/admin/KeyboardShortcutsHelp'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
import { getDashboardStats } from '../../services/adminService'

const AdminOverview = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+r': (e) => {
      e.preventDefault()
      fetchStats()
      setToast({ message: 'Dashboard refreshed', type: 'success' })
    }
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats()
      setStats(response.data.data)
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch stats', type: 'error' })
    } finally {
      setLoading(false)
    }
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
      <Breadcrumb items={[{ label: 'Dashboard' }]} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={[
        { keys: 'Ctrl + R', description: 'Refresh dashboard' },
        { keys: '?', description: 'Show keyboard shortcuts' }
      ]} />

      {toast && (
        <AdminToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          icon={Users}
          label={
            <div className="flex items-center">
              Total Users
              <Tooltip text="Total number of registered users across all roles (applicants, employers, recruiters, admins)" />
            </div>
          }
          value={stats?.totalUsers}
          subLabel={`${stats?.newSignups || 0} new this week`}
          color="blue"
        />
        <StatCard
          icon={Building2}
          label={
            <div className="flex items-center">
              Total Employers
              <Tooltip text="Number of users with employer or recruiter role who can post jobs" />
            </div>
          }
          value={stats?.usersByRole?.employer || 0}
          color="purple"
        />
        <StatCard
          icon={Briefcase}
          label={
            <div className="flex items-center">
              Total Jobs
              <Tooltip text="All job postings including active, draft, and closed positions" />
            </div>
          }
          value={stats?.totalJobs}
          subLabel={`${stats?.newJobs || 0} new this week`}
          color="green"
        />
        <StatCard
          icon={Target}
          label={
            <div className="flex items-center">
              Active Jobs
              <Tooltip text="Currently published jobs that applicants can apply to" />
            </div>
          }
          value={stats?.jobsByStatus?.active || 0}
          color="indigo"
        />
        <StatCard
          icon={FileText}
          label={
            <div className="flex items-center">
              Total Applications
              <Tooltip text="All job applications submitted by applicants across all jobs" />
            </div>
          }
          value={stats?.totalApplications}
          subLabel={`${stats?.newApplications || 0} new this week`}
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          label={
            <div className="flex items-center">
              Pending Applications
              <Tooltip text="Applications awaiting review by employers. High numbers may indicate slow employer response." />
            </div>
          }
          value={stats?.applicationsByStatus?.pending || 0}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/dashboard/admin/users')}
            className="px-4 py-2 bg-[#2557a7] text-white rounded-lg hover:bg-[#0d2d6e] transition-colors"
          >
            View All Users
          </button>
          <button
            onClick={() => navigate('/dashboard/admin/jobs')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Manage Jobs
          </button>
          <button
            onClick={() => navigate('/dashboard/admin/announcements')}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Send Announcement
          </button>
        </div>
      </div>

      {/* Top Companies */}
      {stats?.topCompanies && stats.topCompanies.length > 0 && (
        <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Companies by Job Count</h3>
          <div className="space-y-3">
            {stats.topCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{company.company}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {company.jobCount} jobs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Applied Jobs */}
      {stats?.topJobs && stats.topJobs.length > 0 && (
        <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Applied Jobs</h3>
          <div className="space-y-3">
            {stats.topJobs.map((job, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{job.company}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {job.applicationCount} applications
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOverview
