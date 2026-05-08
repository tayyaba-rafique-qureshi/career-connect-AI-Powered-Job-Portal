import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Briefcase, FileText, TrendingUp, Building2, Target } from 'lucide-react'
import StatCard from '../../components/admin/StatCard'
import AdminToast from '../../components/admin/AdminToast'
import { getDashboardStats } from '../../services/adminService'

const AdminOverview = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

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
          label="Total Users"
          value={stats?.totalUsers}
          subLabel={`${stats?.newSignups || 0} new this week`}
          color="blue"
        />
        <StatCard
          icon={Building2}
          label="Total Employers"
          value={stats?.usersByRole?.employer || 0}
          color="purple"
        />
        <StatCard
          icon={Briefcase}
          label="Total Jobs"
          value={stats?.totalJobs}
          subLabel={`${stats?.newJobs || 0} new this week`}
          color="green"
        />
        <StatCard
          icon={Target}
          label="Active Jobs"
          value={stats?.jobsByStatus?.active || 0}
          color="indigo"
        />
        <StatCard
          icon={FileText}
          label="Total Applications"
          value={stats?.totalApplications}
          subLabel={`${stats?.newApplications || 0} new this week`}
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          label="Pending Applications"
          value={stats?.applicationsByStatus?.pending || 0}
          color="red"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/dashboard/admin/users')}
            className="px-4 py-2 bg-[#2557a7] text-white rounded-lg hover:bg-[#0d2d6e] transition-colors"
          >
            View All Users
          </button>
          <button
            onClick={() => navigate('/dashboard/admin/jobs')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Manage Jobs
          </button>
          <button
            onClick={() => navigate('/dashboard/admin/announcements')}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Send Announcement
          </button>
        </div>
      </div>

      {/* Top Companies */}
      {stats?.topCompanies && stats.topCompanies.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies by Job Count</h3>
          <div className="space-y-3">
            {stats.topCompanies.map((company, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{company.company}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {company.jobCount} jobs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Applied Jobs */}
      {stats?.topJobs && stats.topJobs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Applied Jobs</h3>
          <div className="space-y-3">
            {stats.topJobs.map((job, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.company}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
