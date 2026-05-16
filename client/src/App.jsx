import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import JobList from './pages/JobList'
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
import HelpPage from './pages/applicant/HelpPage'
import ResumeBuilderPage from './pages/applicant/ResumeBuilderPage'
import EmployerMessages from './pages/employer/EmployerMessages'
// Public pages
import InterviewPrepPage from './pages/InterviewPrepPage'
import CareerAdvicePage from './pages/CareerAdvicePage'
import SalaryGuidePage from './pages/SalaryGuidePage'
import ResumeTipsPage from './pages/ResumeTipsPage'
import PricingPage from './pages/PricingPage'
import AboutPage from './pages/AboutPage'
import CareersPage from './pages/CareersPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import CookiePolicyPage from './pages/CookiePolicyPage'
import SecurityPage from './pages/SecurityPage'
import ProtectedRoute from './components/ProtectedRoute'
import OnboardingRoute from './components/OnboardingRoute'
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
        <Route path="/jobs" element={<JobList />} />
        
        {/* Public Info Pages */}
        <Route path="/interview-prep" element={<InterviewPrepPage />} />
        <Route path="/career-advice" element={<CareerAdvicePage />} />
        <Route path="/salary-guide" element={<SalaryGuidePage />} />
        <Route path="/resume-tips" element={<ResumeTipsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/cookie-policy" element={<CookiePolicyPage />} />
        <Route path="/security" element={<SecurityPage />} />

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
        <Route path="/help" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <HelpPage />
          </ProtectedRoute>
        } />
        <Route path="/resume-builder" element={
          <ProtectedRoute allowedRoles={['applicant']}>
            <ResumeBuilderPage />
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
        <Route path="/onboarding/applicant" element={<OnboardingRoute><ApplicantOnboarding /></OnboardingRoute>} />
        <Route path="/onboarding/employer"  element={<OnboardingRoute><EmployerOnboarding /></OnboardingRoute>} />

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
