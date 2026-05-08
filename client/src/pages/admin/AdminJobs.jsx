import { useState, useEffect } from 'react'
import { Search, MoreVertical, Trash2, Star, Eye } from 'lucide-react'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminToast from '../../components/admin/AdminToast'
import { getJobs, updateJobStatus, toggleFeatureJob, deleteJob } from '../../services/adminService'

const AdminJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ search: '', status: '', workMode: '', experienceLevel: '' })
  const [toast, setToast] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, job: null })
  const [viewModal, setViewModal] = useState({ isOpen: false, job: null })

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
      setJobs(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
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
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or company..."
                value={filters.search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filters.workMode}
            onChange={(e) => setFilters(prev => ({ ...prev, workMode: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
          >
            <option value="">All Work Modes</option>
            <option value="remote">Remote</option>
            <option value="on-site">On-site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2557a7]"></div>
                    </div>
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-[#f8f7f6]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {job.isFeatured && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.company}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job._id, e.target.value)}
                        className="text-sm border-0 bg-transparent focus:ring-0 cursor-pointer"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.views || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveMenu(activeMenu === job._id ? null : job._id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {activeMenu === job._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => {
                                setViewModal({ isOpen: true, job })
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                handleToggleFeature(job._id)
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Star className="h-4 w-4" />
                              {job.isFeatured ? 'Unfeature' : 'Feature'}
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal({ isOpen: true, job })
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">{viewModal.job.title}</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="text-sm text-gray-900">{viewModal.job.company}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm text-gray-900">{viewModal.job.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Work Mode</p>
                  <p className="text-sm text-gray-900 capitalize">{viewModal.job.workMode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Experience Level</p>
                  <p className="text-sm text-gray-900 capitalize">{viewModal.job.experienceLevel}</p>
                </div>
                {viewModal.job.salaryMin && viewModal.job.salaryMax && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Salary Range</p>
                    <p className="text-sm text-gray-900">
                      ${viewModal.job.salaryMin.toLocaleString()} - ${viewModal.job.salaryMax.toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewModal.job.description}</p>
                </div>
                {viewModal.job.requiredSkills && viewModal.job.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {viewModal.job.requiredSkills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
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
