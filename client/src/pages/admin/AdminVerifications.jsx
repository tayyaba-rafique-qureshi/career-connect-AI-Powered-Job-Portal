import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import Pagination from '../../components/admin/Pagination'
import { getVerifications, reviewVerification } from '../../services/adminService'

const AdminVerifications = () => {
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filter, setFilter] = useState('pending')
  const [toast, setToast] = useState(null)
  const [expandedRow, setExpandedRow] = useState(null)
  const [reviewModal, setReviewModal] = useState({ isOpen: false, user: null, action: '' })
  const [rejectedReason, setRejectedReason] = useState('')

  useEffect(() => {
    fetchVerifications()
  }, [pagination.page, filter])

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: filter
      }
      const response = await getVerifications(params)
      setVerifications(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch verifications', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async () => {
    try {
      await reviewVerification(reviewModal.user._id, reviewModal.action, rejectedReason)
      setToast({
        message: `Verification ${reviewModal.action === 'approve' ? 'approved' : 'rejected'} successfully`,
        type: 'success'
      })
      setReviewModal({ isOpen: false, user: null, action: '' })
      setRejectedReason('')
      fetchVerifications()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to review verification', type: 'error' })
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">Pending</span>
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Rejected</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Verifications Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2557a7]"></div>
                    </div>
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    No verification requests found
                  </td>
                </tr>
              ) : (
                verifications.map((user) => (
                  <>
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.employerProfile?.companyInfo?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.verificationRequest?.submittedAt
                          ? new Date(user.verificationRequest.submittedAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(user.verificationStatus)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {filter === 'pending' && (
                            <>
                              <button
                                onClick={() => setReviewModal({ isOpen: true, user, action: 'approve' })}
                                className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => setReviewModal({ isOpen: true, user, action: 'reject' })}
                                className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setExpandedRow(expandedRow === user._id ? null : user._id)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            {expandedRow === user._id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === user._id && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">Company Website:</p>
                              <a
                                href={user.verificationRequest?.companyWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              >
                                {user.verificationRequest?.companyWebsite}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                            {user.verificationRequest?.companyRegNo && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Registration Number:</p>
                                <p className="text-sm text-gray-600">{user.verificationRequest.companyRegNo}</p>
                              </div>
                            )}
                            {user.verificationRequest?.documents && user.verificationRequest.documents.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                                <div className="flex flex-wrap gap-2">
                                  {user.verificationRequest.documents.map((doc, idx) => (
                                    <a
                                      key={idx}
                                      href={doc}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                                    >
                                      Document {idx + 1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {user.verificationRequest?.rejectedReason && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Rejection Reason:</p>
                                <p className="text-sm text-red-600">{user.verificationRequest.rejectedReason}</p>
                              </div>
                            )}
                            {user.verificationRequest?.reviewedBy && (
                              <div>
                                <p className="text-sm font-medium text-gray-700">Reviewed By:</p>
                                <p className="text-sm text-gray-600">
                                  {user.verificationRequest.reviewedBy.name} on{' '}
                                  {new Date(user.verificationRequest.reviewedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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

      {/* Review Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setReviewModal({ isOpen: false, user: null, action: '' })} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {reviewModal.action === 'approve' ? 'Approve Verification' : 'Reject Verification'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {reviewModal.action === 'approve'
                  ? `Are you sure you want to approve verification for ${reviewModal.user?.employerProfile?.companyInfo?.name || reviewModal.user?.name}?`
                  : `Provide a reason for rejecting ${reviewModal.user?.employerProfile?.companyInfo?.name || reviewModal.user?.name}:`}
              </p>
              {reviewModal.action === 'reject' && (
                <textarea
                  value={rejectedReason}
                  onChange={(e) => setRejectedReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7] mb-4"
                  rows="3"
                />
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setReviewModal({ isOpen: false, user: null, action: '' })
                    setRejectedReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReview}
                  disabled={reviewModal.action === 'reject' && !rejectedReason.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                    reviewModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
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

export default AdminVerifications
