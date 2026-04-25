import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Applicant Dashboard</h1>
        <button className="btn-outline" onClick={() => { logout(); navigate('/login') }}>Logout</button>
      </div>
      <div className="dashboard-card">
        <p>Welcome, <strong>{user?.name}</strong> — <span className="role-badge applicant">Applicant</span></p>
        <p style={{ marginTop: '1rem', color: '#888' }}>Job browsing and apply features coming in Day 3.</p>
      </div>
    </div>
  )
}
