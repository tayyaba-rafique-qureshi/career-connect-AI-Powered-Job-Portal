import { useState, useEffect } from 'react'
import { RefreshCw, Cpu, HardDrive, Database, Activity, Clock } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import { getPlatformHealth } from '../../services/adminService'

const AdminHealth = () => {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  useEffect(() => {
    fetchHealth()
  }, [])

  useEffect(() => {
    let interval
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchHealth()
      }, 30000) // 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchHealth = async () => {
    setLoading(true)
    try {
      const response = await getPlatformHealth()
      setHealth(response.data.data)
    } catch (error) {
      setToast({ message: error.response?.data?.message || 'Failed to fetch health data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${days}d ${hours}h ${minutes}m`
  }

  const getMemoryStatus = (percent) => {
    if (percent < 70) return 'text-green-600'
    if (percent < 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2557a7]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toast && <AdminToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Platform Health Monitor</h2>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-[#2557a7] border-gray-300 rounded focus:ring-[#2557a7]"
            />
            <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
          </label>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2557a7] rounded-lg hover:bg-[#0d2d6e] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {health && (
        <>
          {/* System Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Cpu className="h-6 w-6 text-blue-600" />
                  <h4 className="text-sm font-medium text-gray-500">CPU Cores</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{health.system.cpus}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <HardDrive className="h-6 w-6 text-purple-600" />
                  <h4 className="text-sm font-medium text-gray-500">Memory Usage</h4>
                </div>
                <p className={`text-2xl font-bold ${getMemoryStatus(parseFloat(health.system.memoryUsagePercent))}`}>
                  {health.system.memoryUsagePercent}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatBytes(health.system.usedMemory)} / {formatBytes(health.system.totalMemory)}
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-6 w-6 text-green-600" />
                  <h4 className="text-sm font-medium text-gray-500">Platform</h4>
                </div>
                <p className="text-lg font-bold text-gray-900">{health.system.platform}</p>
                <p className="text-xs text-gray-500 mt-1">{health.system.arch}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-6 w-6 text-orange-600" />
                  <h4 className="text-sm font-medium text-gray-500">System Uptime</h4>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatUptime(health.system.uptime)}</p>
                <p className="text-xs text-gray-500 mt-1">Node {health.system.nodeVersion}</p>
              </div>
            </div>
          </div>

          {/* Database Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="h-6 w-6 text-indigo-600" />
                  <h4 className="text-sm font-medium text-gray-500">Collections</h4>
                </div>
                <p className="text-2xl font-bold text-gray-900">{health.database.collections}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Data Size</h4>
                <p className="text-xl font-bold text-gray-900">{formatBytes(health.database.dataSize)}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Storage Size</h4>
                <p className="text-xl font-bold text-gray-900">{formatBytes(health.database.storageSize)}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Index Size</h4>
                <p className="text-xl font-bold text-gray-900">{formatBytes(health.database.indexSize)}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Avg Object Size</h4>
                <p className="text-xl font-bold text-gray-900">{formatBytes(health.database.avgObjSize)}</p>
              </div>
            </div>
          </div>

          {/* Collection Counts */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Counts</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Users</h4>
                <p className="text-3xl font-bold text-blue-600">{health.collections.users.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Jobs</h4>
                <p className="text-3xl font-bold text-green-600">{health.collections.jobs.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Applications</h4>
                <p className="text-3xl font-bold text-purple-600">{health.collections.applications.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last Hour)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">New Users</h4>
                <p className="text-3xl font-bold text-gray-900">{health.recentActivity.lastHour.users}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">New Jobs</h4>
                <p className="text-3xl font-bold text-gray-900">{health.recentActivity.lastHour.jobs}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">New Applications</h4>
                <p className="text-3xl font-bold text-gray-900">{health.recentActivity.lastHour.applications}</p>
              </div>
            </div>
          </div>

          {/* Process Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Metrics</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Process ID</h4>
                  <p className="text-lg font-bold text-gray-900">{health.process.pid}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Process Uptime</h4>
                  <p className="text-lg font-bold text-gray-900">{formatUptime(health.process.uptime)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">RSS Memory</h4>
                  <p className="text-lg font-bold text-gray-900">{formatBytes(health.process.memoryUsage.rss)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Heap Used</h4>
                  <p className="text-lg font-bold text-gray-900">{formatBytes(health.process.memoryUsage.heapUsed)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamp */}
          <div className="text-center text-sm text-gray-500">
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </div>
        </>
      )}
    </div>
  )
}

export default AdminHealth