import { useState, useEffect, useRef } from 'react'
import { Search, MoreVertical, Ban, Trash2, UserCog, Eye } from 'lucide-react'
import StatusBadge from '../../components/admin/StatusBadge'
import Pagination from '../../components/admin/Pagination'
import ConfirmModal from '../../components/admin/ConfirmModal'
import AdminToast from '../../components/admin/AdminToast'
import Breadcrumb from '../../components/admin/Breadcrumb'
import Tooltip from '../../components/admin/Tooltip'
import KeyboardShortcutsHelp from '../../components/admin/KeyboardShortcutsHelp'
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts'
import { getUsers, updateUserRole, toggleUserBan, deleteUser } from '../../services/adminService'

const STORAGE_KEY = 'adminUsersState'

const AdminUsers = () => {
  const searchRef = useRef(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [filters, setFilters] = useState({})
  const [toast, setToast] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', user: null })
  const [roleModal, setRoleModal] = useState({ isOpen: false, user: null, newRole: '' })
  const [banReason, setBanReason] = useState('')

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+f': () => searchRef.current?.focus(),
    'ctrl+r': () => {
      fetchUsers()
      setToast({ message: 'Users list refreshed', type: 'success' })
    },
    'escape': () => {
      setActiveMenu(null)
      setRoleModal({ isOpen: false, user: null, newRole: '' })
      setConfirmModal({ isOpen: false, type: '', user: null })
    }
  })

  // Reentrance: Load saved state
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { filters: savedFilters, pagination: savedPagination } = JSON.parse(saved)
        setFilters(savedFilters || {})
        setPagination(prev => ({ ...prev, page: savedPagination?.page || 1, limit: savedPagination?.limit || 10 }))
      } catch (e) {
        console.error('Failed to load saved state:', e)
      }
    }
  }, [])

  // Reentrance: Save state
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        filters,
        pagination: { page: pagination.page, limit: pagination.limit }
      }))
    }
  }, [filters, pagination.page, pagination.limit, users.length])

  useEffect(() => {
    fetchUsers()
  }, [pagination.page, filters.search, filters.role, filters.onboardingComplete])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      }
      console.log('Fetching users with params:', params)
      const response = await getUsers(params)
      console.log('Users response:', response.data)
      console.log('Total users in DB:', response.data.pagination.total)
      console.log('Users fetched:', response.data.data.length)
      setUsers(response.data.data)
      setPagination(prev => ({ ...prev, ...response.data.pagination }))
    } catch (error) {
      console.error('Error fetching users:', error)
      setToast({ message: error.response?.data?.message || 'Failed to fetch users', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setFilters(prev => {
      const newFilters = { ...prev }
      if (value) {
        newFilters.search = value
      } else {
        delete newFilters.search
      }
      return newFilters
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleRoleChange = async () => {
    try {
      await updateUserRole(roleModal.user._id, roleModal.newRole)
      setToast({ message: 'User role updated successfully', type: 'success' })
      setRoleModal({ isOpen: false, user: null, newRole: '' })
      fetchUsers()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update role', type: 'error' })
    }
  }

  const handleBanToggle = async () => {
    try {
      await toggleUserBan(confirmModal.user._id, banReason)
      setToast({
        message: confirmModal.user.isBanned ? 'User unbanned successfully' : 'User banned successfully',
        type: 'success'
      })
      setConfirmModal({ isOpen: false, type: '', user: null })
      setBanReason('')
      fetchUsers()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to update ban status', type: 'error' })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteUser(confirmModal.user._id)
      setToast({ message: 'User deleted successfully', type: 'success' })
      setConfirmModal({ isOpen: false, type: '', user: null })
      fetchUsers()
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to delete user', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb items={[{ label: 'Users' }]} />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={[
        { keys: 'Ctrl + F', description: 'Focus search field' },
        { keys: 'Ctrl + R', description: 'Refresh users list' },
        { keys: 'Esc', description: 'Close modal/menu' },
        { keys: '?', description: 'Show keyboard shortcuts' }
      ]} />

      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filters */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? (
              'Loading...'
            ) : (
              <>
                Showing <span className="font-semibold">{users.length}</span> of{' '}
                <span className="font-semibold">{pagination.total}</span> users
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search by name or email... (Ctrl+F)"
                value={filters.search || ''}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={filters.role || ''}
            onChange={(e) => {
              const value = e.target.value
              setFilters(prev => {
                const newFilters = { ...prev }
                if (value) {
                  newFilters.role = value
                } else {
                  delete newFilters.role
                }
                return newFilters
              })
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="applicant">Applicant</option>
            <option value="employer">Employer</option>
            <option value="recruiter">Recruiter</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filters.onboardingComplete || ''}
            onChange={(e) => {
              const value = e.target.value
              setFilters(prev => {
                const newFilters = { ...prev }
                if (value) {
                  newFilters.onboardingComplete = value
                } else {
                  delete newFilters.onboardingComplete
                }
                return newFilters
              })
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Onboarded</option>
            <option value="false">Not Onboarded</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    Role
                    <Tooltip text="User's role determines their permissions and dashboard access" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Onboarding</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
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
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-[#f8f7f6] dark:hover:bg-[#2a2a2a]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
                          alt={user.name}
                          className="h-10 w-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.isBanned ? 'banned' : 'active'} type="user" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.onboardingComplete ? 'Complete' : 'Incomplete'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setActiveMenu(activeMenu === user._id ? null : user._id)}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                        {activeMenu === user._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                            <button
                              onClick={() => {
                                setRoleModal({ isOpen: true, user, newRole: user.role })
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <UserCog className="h-4 w-4" />
                              Change Role
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal({ isOpen: true, type: 'ban', user })
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Ban className="h-4 w-4" />
                              {user.isBanned ? 'Unban User' : 'Ban User'}
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal({ isOpen: true, type: 'delete', user })
                                setActiveMenu(null)
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete User
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

      {/* Role Change Modal */}
      {roleModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setRoleModal({ isOpen: false, user: null, newRole: '' })} />
            <div className="relative bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                Change User Role
                <Tooltip text="Changing role affects user permissions and dashboard access. Changes take effect immediately." />
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Change role for <span className="font-semibold">{roleModal.user?.name}</span>
              </p>
              <select
                value={roleModal.newRole}
                onChange={(e) => setRoleModal(prev => ({ ...prev, newRole: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] mb-4"
              >
                <option value="applicant">Applicant</option>
                <option value="employer">Employer</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setRoleModal({ isOpen: false, user: null, newRole: '' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2557a7] rounded-lg hover:bg-[#0d2d6e]"
                >
                  Update Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Confirmation Modal */}
      {confirmModal.isOpen && confirmModal.type === 'ban' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setConfirmModal({ isOpen: false, type: '', user: null })} />
            <div className="relative bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {confirmModal.user?.isBanned ? 'Unban User' : 'Ban User'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {confirmModal.user?.isBanned
                  ? `Are you sure you want to unban ${confirmModal.user?.name}?`
                  : `Are you sure you want to ban ${confirmModal.user?.name}?`}
              </p>
              {!confirmModal.user?.isBanned && (
                <>
                  <select
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2557a7] mb-3"
                  >
                    <option value="">Select reason...</option>
                    <option value="spam">Spam or fake account</option>
                    <option value="abuse">Abusive behavior</option>
                    <option value="fraud">Fraudulent activity</option>
                    <option value="violation">Terms of service violation</option>
                    <option value="inappropriate">Inappropriate content</option>
                    <option value="other">Other (specify below)</option>
                  </select>
                  {banReason === 'other' && (
                    <textarea
                      placeholder="Please specify the reason..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2557a7] mb-3"
                      rows="3"
                    />
                  )}
                </>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setConfirmModal({ isOpen: false, type: '', user: null })
                    setBanReason('')
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanToggle}
                  disabled={!confirmModal.user?.isBanned && !banReason}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen && confirmModal.type === 'delete'}
        onClose={() => setConfirmModal({ isOpen: false, type: '', user: null })}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${confirmModal.user?.name}? This will also delete all their jobs and applications. This action cannot be undone.`}
        confirmText={confirmModal.user?.email}
        requireInput={true}
        inputPlaceholder="Type user email to confirm"
      />
    </div>
  )
}

export default AdminUsers
