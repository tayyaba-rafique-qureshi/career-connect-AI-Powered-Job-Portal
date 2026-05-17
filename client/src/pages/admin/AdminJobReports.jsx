import { useState, useEffect } from 'react'
import { Flag, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import Pagination from '../../components/admin/Pagination'
import ConfirmModal from '../../components/admin/ConfirmModal'
import { getAllJobReports, resolveJobReport } from '../../services/adminService'

const AdminJobReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ category: '', severity: '' })
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('open')
  const [resolveModal, setResolveModal] = useState({ isOpen: false, report: null, action: '' })
  const [resolution, setResolution] = useState('')

  useEffect(() => {
    fetchReports()
  }, [pagination.page, filters, activeTab])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab  // Use activeTab as the status
        // Don't spread filters here as it might override status
      }
      
      // Add other filters if they exist (but not status)
      if (filters.category) params.category = filters.category
      if (filters.severity) params.severity = filters.severity
      
      const response = await getAllJobReports(params)
      setReports(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch reports', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    try {
      await resolveJobReport(
        resolveModal.report.jobId,
        resolveModal.report.report._id,
        { resolution, action: resolveModal.action }
      )
      setToast({ message: `Report ${resolveModal.action === 'dismiss' ? 'dismissed' : 'resolved'} successfully`, type: 'success' })
      setResolveModal({ isOpen: false, report: null, action: '' })
      setResolution('')
      fetchReports()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to resolve report', type: 'error' })
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category) => {
    const labels = {
      spam: 'Spam',
      misleading: 'Misleading',
      inappropriate: 'Inappropriate',
      duplicate: 'Duplicate',
      fake_company: 'Fake Company',
      salary_fraud: 'Salary Fraud',
      other: 'Other'
    }
    return labels[category] || category
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('open'); setPagination(prev => ({ ...prev, page: 1 })) }}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'open'
                ? 'border-b-2 border-[#2557a7] text-[#2557a7]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Open Reports
          </button>
          <button
            onClick={() => { setActiveTab('resolved'); setPagination(prev => ({ ...prev, page: 1 })) }}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'resolved'
                ? 'border-b-2 border-[#2557a7] text-[#2557a7]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => { setActiveTab('dismissed'); setPagination(prev => ({ ...prev, page: 1 })) }}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'dismissed'
                ? 'border-b-2 border-[#2557a7] text-[#2557a7]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dismissed
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
            >
              <option value="">All Categories</option>
              <option value="spam">Spam</option>
              <option value="misleading">Misleading</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="duplicate">Duplicate</option>
              <option value="fake_company">Fake Company</option>
              <option value="salary_fraud">Salary Fraud</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2557a7]"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            No reports found
          </div>
        ) : (
          reports.map((item) => (
            <div key={item._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Flag className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(item.report.severity)}`}>
                      {item.report.severity?.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.company}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span>Category: <span className="font-medium">{getCategoryLabel(item.report.category)}</span></span>
                    <span>•</span>
                    <span>Reported by: <span className="font-medium">
                      {item.reportedBy?.name || item.reportedBy?.email || 'Unknown User'}
                    </span></span>
                    <span>•</span>
                    <span>{new Date(item.report.reportedAt).toLocaleDateString()}</span>
                  </div>
                  {item.report.notes && (
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      <span className="font-medium">Notes:</span> {item.report.notes}
                    </p>
                  )}
                  {item.report.resolution && (
                    <p className="text-sm text-gray-700 bg-green-50 p-3 rounded mt-2">
                      <span className="font-medium">Resolution:</span> {item.report.resolution}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {activeTab === 'open' && (
                    <>
                      <button
                        onClick={() => setResolveModal({ isOpen: true, report: item, action: 'resolve' })}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve
                      </button>
                      <button
                        onClick={() => setResolveModal({ isOpen: true, report: item, action: 'dismiss' })}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700"
                      >
                        <XCircle className="h-4 w-4" />
                        Dismiss
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => window.open(`/dashboard/admin/jobs?id=${item.jobId}`, '_blank')}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Job
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.pages}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      {/* Resolve/Dismiss Modal */}
      {resolveModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setResolveModal({ isOpen: false, report: null, action: '' })} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {resolveModal.action === 'dismiss' ? 'Dismiss Report' : 'Resolve Report'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {resolveModal.action === 'dismiss'
                  ? 'Provide a reason for dismissing this report:'
                  : 'Provide resolution details:'}
              </p>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Enter resolution notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] mb-4"
                rows="4"
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setResolveModal({ isOpen: false, report: null, action: '' })
                    setResolution('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={!resolution.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    resolveModal.action === 'dismiss'
                      ? 'bg-gray-600 hover:bg-gray-700'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminJobReports
