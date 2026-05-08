import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import AdminToast from '../../components/admin/AdminToast'
import { getAnalytics } from '../../services/adminService'

const COLORS = ['#2557a7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await getAnalytics()
      setAnalytics(response.data.data)
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch analytics', type: 'error' })
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

  // Merge data for combined line chart
  const mergedTimeData = analytics?.signupsPerDay?.map((item, index) => ({
    date: item.date,
    signups: item.count,
    jobs: analytics.jobsPerDay[index]?.count || 0,
    applications: analytics.applicationsPerDay[index]?.count || 0
  })) || []

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Activity Over Time */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Over Time (Last 30 Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mergedTimeData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="signups" stroke="#2557a7" strokeWidth={2} name="Signups" />
            <Line type="monotone" dataKey="jobs" stroke="#10b981" strokeWidth={2} name="Jobs Posted" />
            <Line type="monotone" dataKey="applications" stroke="#f59e0b" strokeWidth={2} name="Applications" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.roleDistribution || []}
                dataKey="count"
                nameKey="role"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.role}: ${entry.count}`}
              >
                {(analytics?.roleDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Job Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.jobStatusDistribution || []}>
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2557a7" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status Funnel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.applicationStatusDistribution || []}>
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Companies */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Hiring Companies</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.topCompanies || []} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="company" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="jobCount" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AdminAnalytics
