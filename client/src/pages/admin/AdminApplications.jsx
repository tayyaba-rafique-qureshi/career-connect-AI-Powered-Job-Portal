import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import AdminToast from '../../components/admin/AdminToast'
import Breadcrumb from '../../components/admin/Breadcrumb'
import Tooltip from '../../components/admin/Tooltip'
import KeyboardShortcutsHelp from '../../components/admin/KeyboardShortcutsHelp'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
import { getApplications, updateApplicationStatus } from '../../services/adminService'

const STORAGE_KEY = 'adminApplicationsState'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700',
  reviewed: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700',
  shortlisted: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700',
  rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700',
  accepted: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  archived: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600'
}

const AdminApplications = () => {
  const searchRef = useRef(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ status: '', search: '' })
  const [toast, setToast] = useState(null)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+f': () => searchRef.current?.focus(),
    'ctrl+r': () => {
      fetchApplications()
      setToast({ message: 'Applications list refreshed', type: 'success' })
    }
  })

  // Reentrance: Load saved state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { filters: savedFilters, pagination: savedPagination } = JSON.parse(saved)
        setFilters(savedFilters || { status: '', search: '' })
        setPagination(prev => ({ ...prev, page: savedPagination?.page || 1, limit: savedPagination?.limit || 10 }))
      } catch (e) {
        console.error('Failed to load saved state:', e)
      }
    }
  }, [])

  // Reentrance: Save state
  useEffect(() => {
    if (applications.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        filters,
        pagination: { page: pagination.page, limit: pagination.limit }
      }))
    }
  }, [filters, pagination.page, pagination.limit, applications.length])

  useEffect(() => {
    fetchApplications()
  }, [pagination.page, filters])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      }
      const response = await getApplications(params)
      setApplications(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch applications', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await updateApplicationStatus(applicationId, newStatus)
      setToast({ message: 'Application status updated successfully', type: 'success' })
      fetchApplications()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update status', type: 'error' })
    }
  }

  const getScoreBadgeColor = (score) => {
    if (score >= 70) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Applications' }]} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={[
        { keys: 'Ctrl + F', description: 'Focus search field' },
        { keys: 'Ctrl + R', description: 'Refresh applications' },
        { keys: '?', description: 'Show keyboard shortcuts' }
      ]} />

      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filters */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search applicants or jobs... (Ctrl+F)"
                value={filters.search || ''}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, search: e.target.value }))
                  setPagination(prev => ({ ...prev, page: 1 }))
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="rejected">Rejected</option>
            <option value="accepted">Accepted</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    AI Score
                    <Tooltip text="AI-powered match score (0-100) based on skills, experience, and job requirements. Higher scores indicate better fit." />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    Status
                    <Tooltip text="Application status: Pending → Reviewed → Shortlisted → Accepted/Rejected. Archived for closed applications." />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applied</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1f1f1f] divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2557a7]"></div>
                    </div>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No applications found
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={application._id} className="hover:bg-[#f8f7f6] dark:hover:bg-[#2a2a2a]">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={application.applicant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(application.applicant?.name || 'User')}`}
                          alt={application.applicant?.name}
                          className="h-10 w-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{application.applicant?.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{application.applicant?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{application.job?.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{application.job?.company}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {application.aiScore !== undefined && application.aiScore !== null ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getScoreBadgeColor(Math.round(application.aiScore * 100))}`}>
                          {Math.round(application.aiScore * 100)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_COLORS[application.status]}`}>
                        {application.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        />
      </div>
    </div>
  )
}

export default AdminApplications
