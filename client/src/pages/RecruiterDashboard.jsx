import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RecruiterDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Recruiter Dashboard</h1>
        <button className="btn-outline" onClick={() => { logout(); navigate('/login') }}>Logout</button>
      </div>
      <div className="dashboard-card">
        <p>Welcome, <strong>{user?.name}</strong> — <span className="role-badge recruiter">Recruiter</span></p>
        <p style={{ marginTop: '1rem', color: '#888' }}>Job posting features coming in Day 3.</p>
      </div>
    </div>
  )
}
