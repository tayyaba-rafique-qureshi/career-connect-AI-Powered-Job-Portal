import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ users: 0, jobs: 0, applications: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/admin/users'),
      api.get('/admin/jobs'),
      api.get('/admin/applications')
    ]).then(([u, j, a]) => {
      setStats({ users: u.data.length, jobs: j.data.length, applications: a.data.length })
    }).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button className="btn-outline" onClick={handleLogout}>Logout</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.users}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{stats.jobs}</h3>
          <p>Total Jobs</p>
        </div>
        <div className="stat-card">
          <h3>{stats.applications}</h3>
          <p>Applications</p>
        </div>
      </div>

      <div className="dashboard-card" style={{ marginTop: '1.5rem' }}>
        <p>Logged in as <strong>{user?.name}</strong> — <span className="role-badge admin">Admin</span></p>
      </div>
    </div>
  )
}
