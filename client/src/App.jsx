import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import JobList from './pages/JobList'
import AuthCallback from './pages/AuthCallback'
import ApplicantOnboarding from './pages/onboarding/ApplicantOnboarding'
import EmployerOnboarding from './pages/onboarding/EmployerOnboarding'
import PostJob from './pages/employer/PostJob'
import MyJobs from './pages/employer/MyJobs'
import JobApplicants from './pages/employer/JobApplicants'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRedirect from './components/RoleRedirect'

const EMPLOYER_ROLES = ['recruiter', 'employer']

function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <RoleRedirect /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public landing page — guests see this, logged-in users go to dashboard */}
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />

        {/* Role-specific dashboards */}
        <Route path="/dashboard/applicant" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/recruiter" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <RecruiterDashboard />
          </ProtectedRoute>
        } />
        {/* Recruiter sub-pages */}
        <Route path="/dashboard/recruiter/post-job" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <PostJob />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/recruiter/jobs/:jobId/edit" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <PostJob />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/recruiter/jobs" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <MyJobs />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/recruiter/jobs/:jobId/applicants" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <JobApplicants />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Shared protected */}
        <Route path="/jobs" element={<ProtectedRoute><JobList /></ProtectedRoute>} />

        {/* Onboarding */}
        <Route path="/onboarding/applicant" element={<ProtectedRoute><ApplicantOnboarding /></ProtectedRoute>} />
        <Route path="/onboarding/employer"  element={<ProtectedRoute><EmployerOnboarding /></ProtectedRoute>} />

        {/* Google OAuth callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Guest only */}
        <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
