# Admin Module Setup Guide

## Overview
The Admin Module provides a complete administrative interface for managing users, jobs, applications, platform settings, and monitoring system activity.

## Features Implemented

### Backend (Node.js + Express + MongoDB)
- ✅ Extended User model with ban fields (isBanned, banReason, bannedAt, bannedBy, lastLoginAt, loginCount)
- ✅ Extended Job model with admin fields (isFeatured, isFlagged, flagReason, flaggedAt, flaggedBy, deletedAt)
- ✅ New Setting model for platform configuration
- ✅ New AuditLog model for tracking admin actions
- ✅ Complete admin controller with 18 endpoints
- ✅ Admin routes with role-based protection
- ✅ Audit logging utility
- ✅ Ban check during login
- ✅ Admin seed script

### Frontend (React + Vite + Tailwind CSS)
- ✅ AdminLayout with dark navy sidebar (#1E293B)
- ✅ 8 admin pages (Overview, Users, Jobs, Applications, Analytics, Settings, Announcements, Audit Logs)
- ✅ Shared components (StatusBadge, Pagination, ConfirmModal, AdminToast, StatCard)
- ✅ Admin service for API calls
- ✅ Charts using Recharts (Line, Bar, Pie)
- ✅ Responsive design with mobile sidebar

## Setup Instructions

### 1. Install Dependencies (if not already installed)

Backend:
```bash
cd server
npm install
```

Frontend:
```bash
cd client
npm install
```

### 2. Create Admin User

Run the admin seed script:
```bash
cd server
node src/scripts/createAdmin.js
```

Default credentials:
- Email: `admin@careerconnect.com`
- Password: `Admin@123`

You can customize these by setting environment variables:
```bash
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=YourPassword node src/scripts/createAdmin.js
```

### 3. Start the Services

Terminal 1 - Backend:
```bash
cd server
npm run dev
```
Server runs on http://localhost:5000

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```
Client runs on http://localhost:5173

Terminal 3 - AI Service (optional):
```bash
cd ai-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn main:app --reload --port 8000
```

### 4. Access Admin Panel

1. Go to http://localhost:5173/login
2. Login with admin credentials
3. You'll be redirected to http://localhost:5173/dashboard/admin

## Admin Panel Features

### Dashboard (Overview)
- Total users, employers, jobs, active jobs, applications, pending applications
- New signups/jobs/applications this week
- Quick action buttons
- Top companies by job count
- Most applied jobs

### User Management
- View all users with pagination
- Search by name/email
- Filter by role and onboarding status
- Change user role
- Ban/unban users with reason
- Delete users (with cascade delete of jobs and applications)
- Impersonate users (15-minute token)

### Job Management
- View all jobs with pagination
- Search by title/company
- Filter by status, work mode, experience level
- Change job status (active/draft/closed)
- Toggle featured status
- View full job details
- Delete jobs (with cascade delete of applications)

### Application Management
- View all applications with pagination
- Filter by status
- See AI match scores with color coding (green ≥70, yellow 40-69, red <40)
- Change application status
- View applicant and job details

### Analytics
- Activity over time (signups, jobs, applications) - Line chart
- User role distribution - Pie chart
- Job status distribution - Bar chart
- Application status funnel - Bar chart
- Top 10 hiring companies - Horizontal bar chart

### Settings
- Platform controls (allow registration, maintenance mode, email notifications)
- Limits and thresholds (featured jobs limit, max applications per user, AI match threshold, max jobs per employer, job expiry days)
- Save settings with audit logging

### Announcements
- Send platform-wide announcements
- Target specific roles (all, applicant, employer, recruiter, admin)
- Email preview
- Logged in audit trail

### Audit Logs
- View all admin actions with pagination
- Filter by target type (user, job, application, setting, announcement)
- View detailed log information
- See admin who performed action, timestamp, and details

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### Analytics
- `GET /api/admin/analytics` - Get platform analytics

### User Management
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/users/:id` - Get user by ID
- `PATCH /api/admin/users/:id/role` - Update user role
- `PATCH /api/admin/users/:id/ban` - Ban/unban user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/impersonate` - Generate impersonation token

### Job Management
- `GET /api/admin/jobs` - Get all jobs (paginated)
- `PATCH /api/admin/jobs/:id/status` - Update job status
- `PATCH /api/admin/jobs/:id/feature` - Toggle featured status
- `DELETE /api/admin/jobs/:id` - Delete job

### Application Management
- `GET /api/admin/applications` - Get all applications (paginated)
- `PATCH /api/admin/applications/:id/status` - Update application status

### Settings
- `GET /api/admin/settings` - Get platform settings
- `PATCH /api/admin/settings` - Update platform settings

### Announcements
- `POST /api/admin/announcements` - Send platform announcement

### Audit Logs
- `GET /api/admin/audit-logs` - Get audit logs (paginated)

## Security Features

- All admin routes protected by JWT authentication + admin role check
- Banned users cannot login
- Login tracking (lastLoginAt, loginCount)
- All admin actions logged in audit trail
- Impersonation tokens expire after 15 minutes
- Destructive actions require confirmation with input validation

## UI/UX Features

- Indeed-inspired design with #2557a7 primary color
- Dark navy sidebar (#1E293B) with white content area
- Responsive design (mobile hamburger menu)
- Toast notifications for success/error feedback
- Loading states with spinners
- Empty states with helpful messages
- Confirmation modals for destructive actions
- Inline status updates (dropdowns for job/application status)
- Hover effects and transitions
- Color-coded badges for status and scores

## Troubleshooting

### Admin user already exists
If you see "Admin user already exists", the admin account is already created. Use the existing credentials or delete the user from MongoDB and run the seed script again.

### Cannot access admin panel
Make sure:
1. You're logged in with an admin account
2. The user's role is exactly "admin" in the database
3. The JWT token is valid and not expired

### Charts not displaying
Make sure Recharts is installed:
```bash
cd client
npm install recharts
```

### Sidebar not showing on mobile
Click the hamburger menu icon (☰) in the top left corner.

## Next Steps

- Change the default admin password after first login
- Configure email service for announcements (update emailService.js)
- Set up proper environment variables for production
- Configure CORS for production domains
- Set up database backups
- Monitor audit logs regularly
- Review and adjust platform settings as needed

## Support

For issues or questions, check:
1. Browser console for frontend errors
2. Server logs for backend errors
3. MongoDB connection status
4. Environment variables are set correctly
