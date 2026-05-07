# Admin Module Test Checklist

## Pre-Testing Setup

- [x] Admin user created (admin@careerconnect.com / Admin@123)
- [ ] Backend server running on http://localhost:5000
- [ ] Frontend client running on http://localhost:5173
- [ ] MongoDB connected successfully

## Authentication & Access

- [ ] Can login with admin credentials
- [ ] Redirected to /dashboard/admin after login
- [ ] Admin sidebar visible with dark navy background (#1E293B)
- [ ] Admin name and avatar displayed in sidebar
- [ ] Logout button works
- [ ] Non-admin users cannot access /dashboard/admin routes

## Dashboard (Overview Page)

- [ ] 6 stat cards display correctly (Total Users, Total Employers, Total Jobs, Active Jobs, Total Applications, Pending Applications)
- [ ] "New this week" sub-labels show correct counts
- [ ] Quick action buttons navigate to correct pages
- [ ] Top Companies table displays (if data exists)
- [ ] Most Applied Jobs table displays (if data exists)
- [ ] Loading spinner shows while fetching data

## User Management Page

### Display & Navigation
- [ ] User table displays with all columns (User, Email, Role, Status, Onboarding, Joined, Actions)
- [ ] Pagination works correctly
- [ ] Search by name/email works
- [ ] Filter by role works (applicant, employer, recruiter, admin)
- [ ] Filter by onboarding status works
- [ ] User avatars display correctly

### User Actions
- [ ] Kebab menu (⋮) opens for each user
- [ ] "Change Role" modal opens and works
  - [ ] Can select new role
  - [ ] Role updates successfully
  - [ ] Success toast appears
  - [ ] Table refreshes with new role
- [ ] "Ban User" works
  - [ ] Confirmation modal appears
  - [ ] Requires ban reason
  - [ ] User banned successfully
  - [ ] Status badge changes to "banned"
  - [ ] Success toast appears
- [ ] "Unban User" works
  - [ ] Confirmation modal appears
  - [ ] User unbanned successfully
  - [ ] Status badge changes to "active"
- [ ] "Delete User" works
  - [ ] Confirmation modal appears
  - [ ] Requires typing user email to confirm
  - [ ] User deleted successfully
  - [ ] Success toast appears
  - [ ] Table refreshes

### Edge Cases
- [ ] Empty state shows when no users found
- [ ] Loading spinner shows while fetching
- [ ] Error toast shows on API failure
- [ ] Banned user cannot login

## Job Management Page

### Display & Navigation
- [ ] Job table displays with all columns (Job, Company, Location, Status, Views, Posted, Actions)
- [ ] Featured jobs show gold star icon
- [ ] Pagination works correctly
- [ ] Search by title/company works
- [ ] Filter by status works (active, draft, closed)
- [ ] Filter by work mode works (remote, on-site, hybrid)

### Job Actions
- [ ] Status dropdown changes job status inline
  - [ ] Can change to active/draft/closed
  - [ ] Success toast appears
  - [ ] Table refreshes
- [ ] Kebab menu (⋮) opens for each job
- [ ] "View Details" modal opens and shows full job info
  - [ ] Title, company, location, work mode, experience level
  - [ ] Salary range (if available)
  - [ ] Description
  - [ ] Required skills
- [ ] "Feature/Unfeature" works
  - [ ] Gold star appears/disappears
  - [ ] Success toast appears
- [ ] "Delete Job" works
  - [ ] Confirmation modal appears
  - [ ] Requires typing job title to confirm
  - [ ] Job deleted successfully
  - [ ] Success toast appears

### Edge Cases
- [ ] Empty state shows when no jobs found
- [ ] Loading spinner shows while fetching
- [ ] Error toast shows on API failure

## Application Management Page

### Display & Navigation
- [ ] Application table displays with all columns (Applicant, Job, AI Score, Status, Applied)
- [ ] Pagination works correctly
- [ ] Filter by status works (pending, reviewed, shortlisted, rejected, hired)
- [ ] Applicant avatars display correctly

### Application Actions
- [ ] AI Score badge shows correct color
  - [ ] Green for score ≥ 70
  - [ ] Yellow for score 40-69
  - [ ] Red for score < 40
  - [ ] "N/A" for missing scores
- [ ] Status dropdown changes application status inline
  - [ ] Can change to pending/reviewed/shortlisted/rejected/hired
  - [ ] Success toast appears
  - [ ] Table refreshes

### Edge Cases
- [ ] Empty state shows when no applications found
- [ ] Loading spinner shows while fetching
- [ ] Error toast shows on API failure

## Analytics Page

### Charts Display
- [ ] Activity Over Time line chart displays
  - [ ] Shows 3 lines (signups, jobs, applications)
  - [ ] X-axis shows dates
  - [ ] Y-axis shows counts
  - [ ] Tooltip shows on hover
  - [ ] Legend displays
- [ ] User Role Distribution pie chart displays
  - [ ] Shows all roles with counts
  - [ ] Different colors for each role
  - [ ] Labels show role and count
- [ ] Job Status Distribution bar chart displays
  - [ ] Shows all statuses
  - [ ] Bars display correctly
- [ ] Application Status Funnel bar chart displays
  - [ ] Shows all statuses
  - [ ] Bars display correctly
- [ ] Top 10 Hiring Companies horizontal bar chart displays
  - [ ] Shows company names
  - [ ] Bars show job counts

### Edge Cases
- [ ] Loading spinner shows while fetching
- [ ] Error toast shows on API failure
- [ ] Charts handle empty data gracefully

## Settings Page

### Platform Controls
- [ ] "Allow New Registrations" toggle works
  - [ ] Switch animates
  - [ ] Setting saves on "Save Settings" click
- [ ] "Maintenance Mode" toggle works
  - [ ] Switch animates
  - [ ] Warning banner appears when enabled
  - [ ] Setting saves on "Save Settings" click
- [ ] "Email Notifications" toggle works
  - [ ] Switch animates
  - [ ] Setting saves on "Save Settings" click

### Limits and Thresholds
- [ ] "Featured Jobs Limit" input works
  - [ ] Accepts numbers only
  - [ ] Validates min value
- [ ] "Max Applications Per User" input works
- [ ] "AI Match Threshold" input works
  - [ ] Validates 0-100 range
- [ ] "Max Jobs Per Employer" input works
- [ ] "Job Expiry Days" input works

### Save Functionality
- [ ] "Save Settings" button works
  - [ ] Success toast appears
  - [ ] Settings persist after page refresh
  - [ ] Audit log entry created

### Edge Cases
- [ ] Loading spinner shows while fetching
- [ ] Error toast shows on API failure
- [ ] Maintenance mode warning shows when enabled

## Announcements Page

### Form
- [ ] Subject input works
- [ ] Message textarea works (minimum 3 rows)
- [ ] Target audience dropdown works
  - [ ] Shows all options (all, applicant, employer, recruiter, admin)
- [ ] Email preview updates in real-time
  - [ ] Shows subject
  - [ ] Shows target audience
  - [ ] Shows message

### Send Functionality
- [ ] "Send Announcement" button works
  - [ ] Validates required fields
  - [ ] Success toast shows recipient count
  - [ ] Form clears after send
  - [ ] Audit log entry created
- [ ] Info box displays important notes

### Edge Cases
- [ ] Error toast shows if subject/message missing
- [ ] Error toast shows on API failure
- [ ] Loading state shows while sending

## Audit Logs Page

### Display & Navigation
- [ ] Audit log table displays with all columns (Admin, Action, Target Type, Target ID, Timestamp, Actions)
- [ ] Pagination works correctly (20 per page)
- [ ] Filter by target type works (user, job, application, setting, announcement)
- [ ] Admin avatars display correctly
- [ ] Action names formatted correctly (USER_BANNED → User Banned)
- [ ] Target ID truncated to 8 characters

### Log Details
- [ ] "View Details" (eye icon) opens modal
  - [ ] Shows admin name and email
  - [ ] Shows action
  - [ ] Shows target type
  - [ ] Shows full target ID
  - [ ] Shows timestamp
  - [ ] Shows details JSON (formatted)
- [ ] Modal close button works

### Edge Cases
- [ ] Empty state shows when no logs found
- [ ] Loading spinner shows while fetching
- [ ] Error toast shows on API failure

## Responsive Design

### Desktop (≥1024px)
- [ ] Sidebar always visible
- [ ] All tables display correctly
- [ ] Charts render properly
- [ ] Modals centered

### Tablet (768px - 1023px)
- [ ] Sidebar collapses to hamburger menu
- [ ] Hamburger menu opens/closes sidebar
- [ ] Tables scroll horizontally if needed
- [ ] Charts resize appropriately

### Mobile (<768px)
- [ ] Sidebar hidden by default
- [ ] Hamburger menu works
- [ ] Tables scroll horizontally
- [ ] Charts stack vertically
- [ ] Modals full-width
- [ ] Forms stack vertically

## UI/UX Elements

### Colors
- [ ] Primary color #2557a7 used correctly
- [ ] Accent color #0d2d6e used for hover states
- [ ] Background color #f3f2f1 used
- [ ] Sidebar color #1E293B used
- [ ] Status badges use correct colors

### Interactions
- [ ] Hover effects work on buttons
- [ ] Hover effects work on table rows (#f8f7f6)
- [ ] Active navigation item highlighted (blue left border + blue text)
- [ ] Toast notifications auto-dismiss after 3 seconds
- [ ] Toast close button works
- [ ] Loading spinners animate
- [ ] Transitions smooth (0.2s-0.3s)

### Accessibility
- [ ] All buttons have hover states
- [ ] All inputs have focus states (ring-2 ring-[#2557a7])
- [ ] All images have alt text
- [ ] All forms have labels
- [ ] Color contrast meets WCAG standards

## Security

### Authentication
- [ ] Cannot access admin routes without JWT token
- [ ] Cannot access admin routes with non-admin role
- [ ] JWT token expires after 7 days
- [ ] Impersonation token expires after 15 minutes

### Authorization
- [ ] All admin API endpoints require admin role
- [ ] Banned users cannot login
- [ ] Login tracking works (lastLoginAt, loginCount)

### Audit Trail
- [ ] All user actions logged (ban, unban, delete, role change)
- [ ] All job actions logged (status change, feature, delete)
- [ ] All application actions logged (status change)
- [ ] All settings changes logged
- [ ] All announcements logged

## Performance

- [ ] Dashboard loads in < 2 seconds
- [ ] User table loads in < 1 second
- [ ] Job table loads in < 1 second
- [ ] Application table loads in < 1 second
- [ ] Analytics charts load in < 2 seconds
- [ ] Settings load in < 1 second
- [ ] Audit logs load in < 1 second
- [ ] No memory leaks (check browser dev tools)
- [ ] No console errors

## Data Integrity

### Cascade Deletes
- [ ] Deleting user deletes their jobs
- [ ] Deleting user deletes their applications
- [ ] Deleting job deletes its applications

### Data Validation
- [ ] Cannot set invalid role
- [ ] Cannot set invalid job status
- [ ] Cannot set invalid application status
- [ ] Cannot set AI threshold outside 0-100
- [ ] Cannot set negative numbers for limits

## Error Handling

- [ ] Network errors show error toast
- [ ] 401 errors redirect to login
- [ ] 403 errors show "Access denied" toast
- [ ] 404 errors show "Not found" toast
- [ ] 500 errors show "Server error" toast
- [ ] Validation errors show specific messages

## Browser Compatibility

- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)

## Final Checks

- [ ] No console errors
- [ ] No console warnings
- [ ] No broken images
- [ ] No broken links
- [ ] All text readable
- [ ] All buttons clickable
- [ ] All forms submittable
- [ ] All modals closable
- [ ] All toasts dismissible
- [ ] All charts interactive

## Test Results

**Date Tested:** _______________
**Tested By:** _______________
**Browser:** _______________
**OS:** _______________

**Overall Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________
