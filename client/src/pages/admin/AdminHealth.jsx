import { useState, useEffect } from 'react'
import { RefreshCw, Cpu, HardDrive, Database, Activity, Clock, HelpCircle, AlertTriangle } from 'lucide-react'
import AdminToast from '../../components/admin/AdminToast'
import { getPlatformHealth } from '../../services/adminService'

// Tooltip component for metric explanations
const MetricTooltip = ({ text }) => (
  <div className="group relative inline-block ml-2">
    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10 pointer-events-none">
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-gray-900"></div>
      </div>
      {text}
    </div>
  </div>
)

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

  // Check if heap memory is concerning
  const getHeapStatus = (heapBytes) => {
    const heapMB = heapBytes / (1024 * 1024)
    if (heapMB > 200) return { color: 'text-red-600', warning: true, message: 'High heap usage detected' }
    if (heapMB > 150) return { color: 'text-yellow-600', warning: true, message: 'Elevated heap usage' }
    return { color: 'text-gray-900', warning: false }
  }

  // Check if RSS memory is concerning
  const getRSSStatus = (rssBytes) => {
    const rssMB = rssBytes / (1024 * 1024)
    if (rssMB > 500) return { color: 'text-orange-600', warning: true, message: 'High RSS memory usage' }
    if (rssMB > 300) return { color: 'text-yellow-600', warning: true, message: 'Elevated RSS memory' }
    return { color: 'text-gray-900', warning: false }
  }

  // Check if uptime is concerning
  const getUptimeStatus = (seconds) => {
    const days = seconds / 86400
    if (days > 7) return { color: 'text-orange-600', warning: true, message: 'Consider restarting server (running >7 days)' }
    if (days > 14) return { color: 'text-red-600', warning: true, message: 'Server restart recommended (running >14 days)' }
    return { color: 'text-gray-900', warning: false }
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
                  <h4 className="text-sm font-medium text-gray-500">App Uptime</h4>
                </div>
                <p className="text-lg font-bold text-gray-900">{formatUptime(health.process.appUptime)}</p>
                <p className="text-xs text-gray-500 mt-1">Node {health.system.nodeVersion}</p>
              </div>
            </div>
          </div>

          {/* OS Uptime - Secondary Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Host Machine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-6 w-6 text-gray-400" />
                  <h4 className="text-sm font-medium text-gray-500">OS Uptime</h4>
                </div>
                <p className="text-lg font-bold text-gray-500">{formatUptime(health.system.osUptime)}</p>
                <p className="text-xs text-gray-400 mt-1">Machine / host uptime</p>
              </div>
            </div>
          </div>

          {/* Database Metrics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              Database Metrics
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${health.database.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className={`w-2 h-2 rounded-full mr-1 ${health.database.status === 'connected' ? 'bg-green-600' : 'bg-red-600'}`}></span>
                {health.database.status}
              </span>
            </h3>
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Announcements</h4>
                <p className="text-3xl font-bold text-orange-600">{health.collections.announcements.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Audit Logs</h4>
                <p className="text-3xl font-bold text-indigo-600">{health.collections.auditLogs.toLocaleString()}</p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Job Reports</h4>
                <p className="text-3xl font-bold text-red-600">{health.collections.jobReports.toLocaleString()}</p>
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
                {/* Process ID */}
                <div>
                  <div className="flex items-center mb-1">
                    <h4 className="text-sm font-medium text-gray-500">Process ID</h4>
                    <MetricTooltip text="Unique identifier for the Node.js server process. Useful for debugging, monitoring, and terminating stuck processes. Each time the server restarts, it gets a new PID." />
                  </div>
                  <p className="text-lg font-bold text-gray-900">{health.process.pid}</p>
                  <p className="text-xs text-gray-400 mt-1">PID: {health.process.pid}</p>
                </div>

                {/* Server Process Uptime */}
                <div>
                  <div className="flex items-center mb-1">
                    <h4 className="text-sm font-medium text-gray-500">Server Process Uptime</h4>
                    <MetricTooltip text="How long the Node.js server has been running since last restart. Long uptime (>7 days) may indicate memory leaks. Regular restarts are healthy for Node.js applications." />
                  </div>
                  <p className={`text-lg font-bold ${getUptimeStatus(health.process.appUptime).color}`}>
                    {formatUptime(health.process.appUptime)}
                  </p>
                  {getUptimeStatus(health.process.appUptime).warning && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <p className="text-xs text-orange-600">{getUptimeStatus(health.process.appUptime).message}</p>
                    </div>
                  )}
                </div>

                {/* RSS Memory */}
                <div>
                  <div className="flex items-center mb-1">
                    <h4 className="text-sm font-medium text-gray-500">RSS Memory</h4>
                    <MetricTooltip text="Resident Set Size - total memory allocated to the process including code, stack, and heap. This is the actual RAM used by the server. Normal range: 50-300 MB." />
                  </div>
                  <p className={`text-lg font-bold ${getRSSStatus(health.process.memoryUsage.rss).color}`}>
                    {formatBytes(health.process.memoryUsage.rss)}
                  </p>
                  {getRSSStatus(health.process.memoryUsage.rss).warning && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <p className="text-xs text-orange-600">{getRSSStatus(health.process.memoryUsage.rss).message}</p>
                    </div>
                  )}
                </div>

                {/* Heap Used */}
                <div>
                  <div className="flex items-center mb-1">
                    <h4 className="text-sm font-medium text-gray-500">Heap Used</h4>
                    <MetricTooltip text="Memory used for JavaScript objects, strings, and closures. High heap usage (>200 MB) suggests memory leaks or large data processing. Normal range: 20-150 MB." />
                  </div>
                  <p className={`text-lg font-bold ${getHeapStatus(health.process.memoryUsage.heapUsed).color}`}>
                    {formatBytes(health.process.memoryUsage.heapUsed)}
                  </p>
                  {getHeapStatus(health.process.memoryUsage.heapUsed).warning && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="h-3 w-3 text-red-600" />
                      <p className="text-xs text-red-600">{getHeapStatus(health.process.memoryUsage.heapUsed).message}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Help Section */}
              <details className="mt-6 pt-4 border-t border-gray-200">
                <summary className="text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  What do these metrics mean?
                </summary>
                <div className="mt-3 text-xs text-gray-600 space-y-2 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">Process ID (PID)</p>
                    <p>Unique identifier for the Node.js server process. Useful for debugging and killing stuck processes. You can use this PID with system commands like <code className="bg-gray-200 px-1 rounded">kill {health.process.pid}</code> to terminate the process if needed.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Server Process Uptime</p>
                    <p>How long the server has been running continuously. Long uptime (&gt;7 days) may indicate memory leaks or accumulated issues. Regular restarts (weekly) are recommended for Node.js applications to clear memory and refresh connections.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">RSS Memory (Resident Set Size)</p>
                    <p>Total memory allocated to the process, including code, stack, and heap. This is the actual RAM your server is using. Normal range: 50-300 MB. If this grows continuously, you may have a memory leak.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Heap Used</p>
                    <p>Memory used for JavaScript objects, strings, closures, and other dynamic data. High heap usage (&gt;200 MB) suggests memory leaks or large data processing. Normal range: 20-150 MB. This should stay relatively stable during normal operation.</p>
                  </div>
                  <div className="pt-2 border-t border-gray-300">
                    <p className="font-semibold text-gray-900">When to be concerned:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li><span className="text-red-600 font-semibold">Heap Used &gt; 200 MB:</span> Possible memory leak or heavy processing</li>
                      <li><span className="text-orange-600 font-semibold">RSS Memory &gt; 500 MB:</span> High memory usage, monitor closely</li>
                      <li><span className="text-orange-600 font-semibold">Uptime &gt; 7 days:</span> Consider restarting to clear memory</li>
                      <li><span className="text-gray-700">Continuously growing memory:</span> Definite memory leak, restart required</li>
                    </ul>
                  </div>
                </div>
              </details>
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