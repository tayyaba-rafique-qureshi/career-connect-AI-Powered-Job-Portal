import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from '../components/admin/AdminLayout'
import AdminOverview from './admin/AdminOverview'
import AdminUsers from './admin/AdminUsers'
import AdminJobs from './admin/AdminJobs'
import AdminApplications from './admin/AdminApplications'
import AdminAnalytics from './admin/AdminAnalytics'
import AdminSettings from './admin/AdminSettings'
import AdminAnnouncements from './admin/AdminAnnouncements'
import AdminAuditLogs from './admin/AdminAuditLogs'

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="audit-logs" element={<AdminAuditLogs />} />
        <Route path="*" element={<Navigate to="/dashboard/admin" replace />} />
      </Routes>
    </AdminLayout>
  )
}
