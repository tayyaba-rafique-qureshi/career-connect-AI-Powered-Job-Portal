import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, MoreVertical, Trash2, Star, Eye } from 'lucide-react'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminToast from '../../components/admin/AdminToast'
import Breadcrumb from '../../components/admin/Breadcrumb'
import Tooltip from '../../components/admin/Tooltip'
import KeyboardShortcutsHelp from '../../components/admin/KeyboardShortcutsHelp'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
import { getJobs, updateJobStatus, toggleFeatureJob, deleteJob } from '../../services/adminService'

const STORAGE_KEY = 'adminJobsState'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700',
  draft: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600',
  closed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700'
}

const AdminJobs = () => {
  const [searchParams] = useSearchParams()
  const isFeaturedView = searchParams.get('featured') === 'true'
  const searchRef = useRef(null)
  
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ search: '', status: '', workMode: '', experienceLevel: '' })
  const [toast, setToast] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, job: null })
  const [viewModal, setViewModal] = useState({ isOpen: false, job: null })

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+f': () => searchRef.current?.focus(),
    'ctrl+r': () => {
      fetchJobs()
      setToast({ message: 'Jobs list refreshed', type: 'success' })
    },
    'escape': () => {
      setActiveMenu(null)
      setViewModal({ isOpen: false, job: null })
      setConfirmModal({ isOpen: false, job: null })
    }
  })

  // Reentrance: Load saved state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { filters: savedFilters, pagination: savedPagination } = JSON.parse(saved)
        setFilters(savedFilters || { search: '', status: '', workMode: '', experienceLevel: '' })
        setPagination(prev => ({ ...prev, page: savedPagination?.page || 1, limit: savedPagination?.limit || 10 }))
      } catch (e) {
        console.error('Failed to load saved state:', e)
      }
    }
  }, [])

  // Reentrance: Save state
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        filters,
        pagination: { page: pagination.page, limit: pagination.limit }
      }))
    }
  }, [filters, pagination.page, pagination.limit, jobs.length])

  useEffect(() => {
    fetchJobs()
  }, [pagination.page, filters])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      }
      const response = await getJobs(params)
      
      // Filter for featured jobs if in featured view
      let jobsData = response.data.data
      if (isFeaturedView) {
        jobsData = jobsData.filter(job => job.isFeatured)
      }
      
      setJobs(jobsData)
      setPagination(prev => ({ 
        ...prev, 
        ...response.data.pagination,
        total: isFeaturedView ? jobsData.length : response.data.pagination.total
      }))
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch jobs', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateJobStatus(jobId, newStatus)
      setToast({ message: 'Job status updated successfully', type: 'success' })
      fetchJobs()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update status', type: 'error' })
    }
  }

  const handleToggleFeature = async (jobId) => {
    try {
      await toggleFeatureJob(jobId)
      setToast({ message: 'Job featured status updated', type: 'success' })
      fetchJobs()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update featured status', type: 'error' })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteJob(confirmModal.job._id)
      setToast({ message: 'Job deleted successfully', type: 'success' })
      setConfirmModal({ isOpen: false, job: null })
      fetchJobs()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to delete job', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: isFeaturedView ? 'Featured Jobs' : 'Jobs' }]} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={[
        { keys: 'Ctrl + F', description: 'Focus search field' },
        { keys: 'Ctrl + R', description: 'Refresh jobs list' },
        { keys: 'Esc', description: 'Close modal/menu' },
        { keys: '?', description: 'Show keyboard shortcuts' }
      ]} />

      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page Title */}
      {isFeaturedView && (
        <div className="flex items-center gap-2">
          <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            Featured Jobs
            <Tooltip text="Featured jobs appear at the top of job listings and receive 3x more visibility" />
          </h2>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by title or company... (Ctrl+F)"
                value={filters.search}
                onChange={handleSearch}
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
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.workMode}
            onChange={(e) => setFilters(prev => ({ ...prev, workMode: e.target.value }))}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
          >
            <option value="">All Work Modes</option>
            <option value="remote">Remote</option>
            <option value="on-site">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    Status
                    <Tooltip text="Active jobs are visible to applicants. Draft jobs are hidden. Closed jobs no longer accept applications." />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Posted</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1f1f1f] divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2557a7]"></div>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-[#f8f7f6] dark:hover:bg-[#2a2a2a]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {job.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{job.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{job.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{job.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[job.status]}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{job.views || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveMenu(activeMenu === job._id ? null : job._id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {activeMenu === job._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                            <button
                              onClick={() => {
                                setViewModal({ isOpen: true, job })
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                handleToggleFeature(job._id)
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Star className="h-4 w-4" />
                              {job.isFeatured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal({ isOpen: true, job })
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Job
                            </button>
                          </div>
                        )}
                      </div>
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

      {/* View Job Modal */}
      {viewModal.isOpen && viewModal.job && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setViewModal({ isOpen: false, job: null })} />
            <div className="relative bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{viewModal.job.title}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewModal.job.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-sm text-gray-900 dark:text-white">{viewModal.job.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Work Mode</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{viewModal.job.workMode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Experience Level</p>
                  <p className="text-sm text-gray-900 dark:text-white capitalize">{viewModal.job.experienceLevel}</p>
                </div>
                {viewModal.job.salaryMin && viewModal.job.salaryMax && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Salary Range</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      ${viewModal.job.salaryMin.toLocaleString()} - ${viewModal.job.salaryMax.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{viewModal.job.description}</p>
                </div>
                {viewModal.job.requiredSkills && viewModal.job.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {viewModal.job.requiredSkills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setViewModal({ isOpen: false, job: null })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, job: null })}
        onConfirm={handleDelete}
        title="Delete Job"
        message={`Are you sure you want to delete "${confirmModal.job?.title}"? This will also delete all applications for this job. This action cannot be undone.`}
        confirmText={confirmModal.job?.title}
        requireInput={true}
        inputPlaceholder="Type job title to confirm"
      />
    </div>
  )
}

export default AdminJobs
