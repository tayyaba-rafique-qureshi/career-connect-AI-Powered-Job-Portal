import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import Pagination from '../../components/admin/Pagination'
import ConfirmModal from '../../components/admin/ConfirmModal'
import { getBanners, createBanner, updateBanner, deleteBanner, toggleBanner } from '../../services/adminService'

const AdminBanners = () => {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [toast, setToast] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, banner: null })
  const [formData, setFormData] = useState({
    message: '',
    type: 'info',
    startDate: '',
    endDate: '',
    dismissible: true,
    link: '',
    linkText: ''
  })

  useEffect(() => {
    fetchBanners()
  }, [pagination.page])

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit
      }
      const response = await getBanners(params)
      setBanners(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch banners', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingBanner) {
        await updateBanner(editingBanner._id, formData)
        setToast({ message: 'Banner updated successfully', type: 'success' })
      } else {
        await createBanner(formData)
        setToast({ message: 'Banner created successfully', type: 'success' })
      }
      resetForm()
      fetchBanners()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to save banner', type: 'error' })
    }
  }

  const handleEdit = (banner) => {
    setEditingBanner(banner)
    setFormData({
      message: banner.message,
      type: banner.type,
      startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
      endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
      dismissible: banner.dismissible,
      link: banner.link || '',
      linkText: banner.linkText || ''
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    try {
      await deleteBanner(deleteModal.banner._id)
      setToast({ message: 'Banner deleted successfully', type: 'success' })
      setDeleteModal({ isOpen: false, banner: null })
      fetchBanners()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to delete banner', type: 'error' })
    }
  }

  const handleToggle = async (bannerId) => {
    try {
      await toggleBanner(bannerId)
      setToast({ message: 'Banner status updated', type: 'success' })
      fetchBanners()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to toggle banner', type: 'error' })
    }
  }

  const resetForm = () => {
    setFormData({
      message: '',
      type: 'info',
      startDate: '',
      endDate: '',
      dismissible: true,
      link: '',
      linkText: ''
    })
    setEditingBanner(null)
    setShowForm(false)
  }

  const getBannerIcon = (type) => {
    switch (type) {
      case 'info': return <Info className="h-5 w-5" />
      case 'warning': return <AlertCircle className="h-5 w-5" />
      case 'success': return <CheckCircle className="h-5 w-5" />
      case 'error': return <XCircle className="h-5 w-5" />
      default: return <Info className="h-5 w-5" />
    }
  }

  const getBannerColor = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getTypeBadge = (type) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    }
    return <span className={`px-2 py-1 text-xs font-medium rounded ${colors[type]}`}>{type.toUpperCase()}</span>
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Create/Edit Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingBanner ? 'Edit Banner' : 'Create New Banner'}
          </h3>
          {!showForm && !editingBanner && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2557a7] rounded-lg hover:bg-[#0d2d6e]"
            >
              <Plus className="h-4 w-4" />
              New Banner
            </button>
          )}
        </div>

        {(showForm || editingBanner) && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                required
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
                placeholder="Enter banner message..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dismissible}
                    onChange={(e) => setFormData(prev => ({ ...prev, dismissible: e.target.checked }))}
                    className="w-4 h-4 text-[#2557a7] border-gray-300 rounded focus:ring-[#2557a7]"
                  />
                  <span className="text-sm font-medium text-gray-700">Dismissible</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
                  placeholder="https://example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
                <input
                  type="text"
                  value={formData.linkText}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2557a7]"
                  placeholder="Learn more"
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div className={`flex items-start gap-3 p-4 border-2 rounded-lg ${getBannerColor(formData.type)}`}>
                {getBannerIcon(formData.type)}
                <div className="flex-1">
                  <p className="text-sm">{formData.message || 'Your message will appear here...'}</p>
                  {formData.link && formData.linkText && (
                    <a href="#" className="text-sm font-medium underline mt-1 inline-block">
                      {formData.linkText}
                    </a>
                  )}
                </div>
                {formData.dismissible && (
                  <button type="button" className="text-gray-400 hover:text-gray-600">
                    <XCircle className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#2557a7] rounded-lg hover:bg-[#0d2d6e]"
              >
                {editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2557a7]"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
            No banners found
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner._id}
              className={`bg-white rounded-lg border-2 p-6 ${
                banner.isActive ? 'border-green-300' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getTypeBadge(banner.type)}
                  {banner.isActive && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                      ACTIVE
                    </span>
                  )}
                  {banner.dismissible && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      Dismissible
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={() => handleToggle(banner._id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                  <button
                    onClick={() => handleEdit(banner)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ isOpen: true, banner })}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-900 mb-3">{banner.message}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  Start: {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : 'Immediate'}
                </span>
                {banner.endDate && (
                  <>
                    <span>•</span>
                    <span>End: {new Date(banner.endDate).toLocaleDateString()}</span>
                  </>
                )}
                {banner.link && (
                  <>
                    <span>•</span>
                    <a href={banner.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {banner.linkText || 'Link'}
                    </a>
                  </>
                )}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, banner: null })}
        onConfirm={handleDelete}
        title="Delete Banner"
        message={`Are you sure you want to delete this banner? This action cannot be undone.`}
      />
    </div>
  )
}

export default AdminBanners
