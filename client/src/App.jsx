import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AdminDashboard from './pages/AdminDashboard'
import RecruiterDashboard from './pages/RecruiterDashboard'
import AuthCallback from './pages/AuthCallback'
import ApplicantOnboarding from './pages/onboarding/ApplicantOnboarding'
import EmployerOnboarding from './pages/onboarding/EmployerOnboarding'
// Employer pages
import PostJob from './pages/employer/PostJob'
import EmployerMyJobs from './pages/employer/MyJobs'
import JobApplicants from './pages/employer/JobApplicants'
// Applicant pages
import ApplicantDashboard from './pages/applicant/ApplicantDashboard'
import ApplicantMyJobs from './pages/applicant/MyJobs'
import Messages from './pages/applicant/Messages'
import Notifications from './pages/applicant/Notifications'
import ProfilePage from './pages/applicant/ProfilePage'
import CompanyReviews from './pages/applicant/CompanyReviews'
import EmployerMessages from './pages/employer/EmployerMessages'
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
        {/* Public */}
        <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />

        {/* ── Applicant ── */}
        <Route path="/dashboard/applicant" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ApplicantDashboard />
          </ProtectedRoute>
        } />
        <Route path="/my-jobs" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ApplicantMyJobs />
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute allowedRoles={['applicant', ...EMPLOYER_ROLES]}>
            <Messages />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute allowedRoles={['applicant', ...EMPLOYER_ROLES]}>
            <Notifications />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/company-reviews" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <CompanyReviews />
          </ProtectedRoute>
        } />

        {/* ── Employer / Recruiter ── */}
        <Route path="/dashboard/recruiter" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <RecruiterDashboard />
          </ProtectedRoute>
        } />
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
            <EmployerMyJobs />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/recruiter/jobs/:jobId/applicants" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <JobApplicants />
          </ProtectedRoute>
        } />
        <Route path="/employer/messages" element={
          <ProtectedRoute allowedRoles={EMPLOYER_ROLES}>
            <EmployerMessages />
          </ProtectedRoute>
        } />

        {/* ── Admin ── */}
        <Route path="/dashboard/admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* ── Onboarding ── */}
        <Route path="/onboarding/applicant" element={<ProtectedRoute><ApplicantOnboarding /></ProtectedRoute>} />
        <Route path="/onboarding/employer"  element={<ProtectedRoute><EmployerOnboarding /></ProtectedRoute>} />

        {/* ── Auth ── */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login"            element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register"         element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
