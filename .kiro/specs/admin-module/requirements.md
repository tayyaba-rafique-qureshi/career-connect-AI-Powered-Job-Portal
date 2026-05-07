# Requirements Document: Admin Module

## Introduction

The Admin Module is a protected administrative interface for the HireIQ Job Portal that enables authorized administrators to manage users, jobs, applications, platform settings, and monitor system activity. The module provides comprehensive oversight capabilities including user management, content moderation, analytics, and system configuration. Admin access is restricted to users with the "admin" role, which is assigned manually through database seeding scripts.

## Glossary

- **Admin_System**: The complete administrative module including all backend APIs, frontend UI, and middleware
- **Admin_User**: A user account with role "admin" that has access to administrative functions
- **Admin_Dashboard**: The main overview page displaying platform statistics and activity
- **User_Manager**: The subsystem responsible for user CRUD operations and account management
- **Job_Manager**: The subsystem responsible for job listing management and moderation
- **Application_Manager**: The subsystem responsible for viewing and managing job applications
- **Activity_Logger**: The subsystem that records all administrative actions for audit purposes
- **Analytics_Engine**: The subsystem that generates reports and statistics
- **Settings_Manager**: The subsystem that manages platform configuration
- **Notification_Broadcaster**: The subsystem that sends notifications to users
- **Moderation_Queue**: The system for managing user-reported content
- **Auth_Middleware**: The authentication middleware that verifies JWT tokens
- **Role_Middleware**: The authorization middleware that verifies admin role
- **Platform_User**: Any user of the HireIQ platform (applicant, employer, or admin)
- **Content_Report**: A user-submitted report about inappropriate content or behavior
- **Activity_Log**: A record of an administrative action with timestamp and details
- **Platform_Settings**: System-wide configuration values stored in the database
- **Ban_Action**: The action of restricting a user's access to the platform
- **Flag_Action**: The action of marking content as potentially inappropriate
- **CSV_Export**: A comma-separated values file containing exported data
- **Maintenance_Mode**: A platform state where normal user access is restricted
- **AI_Match_Score**: The similarity score between a job and applicant profile (0-100)
- **GridFS**: MongoDB's file storage system used for resume storage

## Requirements

### Requirement 1: Admin Authentication and Authorization

**User Story:** As a platform administrator, I want secure authentication and role-based access control, so that only authorized admin users can access administrative functions.

#### Acceptance Criteria

1. WHEN an Admin_User submits valid credentials to /api/auth/login, THE Auth_Middleware SHALL verify the credentials and return a JWT token
2. WHEN a request includes a valid JWT token with role "admin", THE Role_Middleware SHALL allow access to admin routes
3. WHEN a request includes a JWT token with role other than "admin", THE Role_Middleware SHALL reject the request with HTTP 403
4. WHEN a request to an admin route lacks a valid JWT token, THE Auth_Middleware SHALL reject the request with HTTP 401
5. THE Admin_System SHALL protect all routes under /api/admin/* with both Auth_Middleware and Role_Middleware
6. WHEN the seedAdmin script executes, THE Admin_System SHALL create an admin user account with role "admin" and hashed password

### Requirement 2: Admin Dashboard Statistics

**User Story:** As an administrator, I want to view platform statistics and metrics on the dashboard, so that I can monitor the health and activity of the platform.

#### Acceptance Criteria

1. WHEN an Admin_User requests dashboard statistics, THE Admin_Dashboard SHALL return total counts for users, jobs, and applications
2. WHEN an Admin_User requests dashboard statistics, THE Admin_Dashboard SHALL return counts grouped by user role (applicant, employer, admin)
3. WHEN an Admin_User requests dashboard statistics, THE Admin_Dashboard SHALL return counts grouped by job status (active, draft, closed)
4. WHEN an Admin_User requests dashboard statistics, THE Admin_Dashboard SHALL return counts grouped by application status (pending, reviewed, shortlisted, rejected, accepted)
5. WHEN an Admin_User requests dashboard statistics, THE Admin_Dashboard SHALL return the count of users created in the last 30 days
6. WHEN an Admin_User requests dashboard statistics, THE Admin_Dashboard SHALL return the count of jobs posted in the last 30 days
7. WHEN an Admin_User requests dashboard statistics, THE Admin_Dashboard SHALL return the count of applications submitted in the last 30 days
8. WHEN an Admin_User requests recent activity, THE Admin_Dashboard SHALL return the 10 most recent Activity_Log entries with timestamps

### Requirement 3: User Management Operations

**User Story:** As an administrator, I want to perform CRUD operations on user accounts, so that I can manage the platform's user base effectively.

#### Acceptance Criteria

1. WHEN an Admin_User requests the user list with pagination parameters, THE User_Manager SHALL return users with limit and offset applied
2. WHEN an Admin_User requests the user list with a search query, THE User_Manager SHALL return users matching the query in name or email fields
3. WHEN an Admin_User requests the user list with a role filter, THE User_Manager SHALL return only users with the specified role
4. WHEN an Admin_User requests a specific user by ID, THE User_Manager SHALL return the complete user document including profile data
5. WHEN an Admin_User updates a user's profile fields, THE User_Manager SHALL save the changes and return the updated user document
6. WHEN an Admin_User updates a user's role, THE User_Manager SHALL validate the role is one of [applicant, employer, admin] and save the change
7. WHEN an Admin_User deletes a user account, THE User_Manager SHALL remove the user document from the database
8. WHEN an Admin_User requests user data export, THE User_Manager SHALL generate a CSV_Export containing user records

### Requirement 4: User Ban and Unban Operations

**User Story:** As an administrator, I want to ban and unban user accounts with reasons, so that I can enforce platform policies and manage problematic users.

#### Acceptance Criteria

1. WHEN an Admin_User bans a Platform_User with a reason, THE User_Manager SHALL set isBanned to true, store the banReason, bannedAt timestamp, and bannedBy admin ID
2. WHEN a banned Platform_User attempts to log in, THE Auth_Middleware SHALL reject the login with a message indicating the account is banned
3. WHEN an Admin_User unbans a Platform_User, THE User_Manager SHALL set isBanned to false and clear banReason, bannedAt, and bannedBy fields
4. WHEN an Admin_User requests the list of banned users, THE User_Manager SHALL return all users where isBanned is true
5. THE User_Manager SHALL record a Ban_Action in the Activity_Log with admin ID, target user ID, reason, and timestamp
6. THE User_Manager SHALL record an unban action in the Activity_Log with admin ID, target user ID, and timestamp

### Requirement 5: User Password Reset

**User Story:** As an administrator, I want to reset user passwords, so that I can help users who are locked out of their accounts.

#### Acceptance Criteria

1. WHEN an Admin_User requests a password reset for a Platform_User, THE User_Manager SHALL generate a new temporary password
2. WHEN a password reset is performed, THE User_Manager SHALL hash the temporary password using bcrypt with salt rounds of 10
3. WHEN a password reset is performed, THE User_Manager SHALL save the hashed password to the user document
4. WHEN a password reset is performed, THE User_Manager SHALL return the temporary password to the Admin_User
5. THE User_Manager SHALL record the password reset action in the Activity_Log with admin ID, target user ID, and timestamp

### Requirement 6: Job Management Operations

**User Story:** As an administrator, I want to view, edit, and delete job listings, so that I can manage job content on the platform.

#### Acceptance Criteria

1. WHEN an Admin_User requests the job list with pagination parameters, THE Job_Manager SHALL return jobs with limit and offset applied
2. WHEN an Admin_User requests the job list with a search query, THE Job_Manager SHALL return jobs matching the query in title, company, or description fields
3. WHEN an Admin_User requests the job list with a status filter, THE Job_Manager SHALL return only jobs with the specified status
4. WHEN an Admin_User requests a specific job by ID, THE Job_Manager SHALL return the complete job document including postedBy user reference
5. WHEN an Admin_User updates job fields, THE Job_Manager SHALL validate required fields and save the changes
6. WHEN an Admin_User deletes a job, THE Job_Manager SHALL set deletedAt timestamp and exclude the job from public listings
7. WHEN an Admin_User requests job data export, THE Job_Manager SHALL generate a CSV_Export containing job records
8. WHEN an Admin_User requests applicants for a job, THE Job_Manager SHALL return all applications for that job with applicant details

### Requirement 7: Job Flagging and Moderation

**User Story:** As an administrator, I want to flag and unflag job listings as inappropriate, so that I can moderate job content and enforce platform policies.

#### Acceptance Criteria

1. WHEN an Admin_User flags a job with a reason, THE Job_Manager SHALL set isFlagged to true, store the flagReason, flaggedAt timestamp, and flaggedBy admin ID
2. WHEN a job is flagged, THE Job_Manager SHALL change the job status to "closed" to remove it from public listings
3. WHEN an Admin_User unflags a job, THE Job_Manager SHALL set isFlagged to false and clear flagReason, flaggedAt, and flaggedBy fields
4. WHEN an Admin_User requests the list of flagged jobs, THE Job_Manager SHALL return all jobs where isFlagged is true
5. THE Job_Manager SHALL record a Flag_Action in the Activity_Log with admin ID, target job ID, reason, and timestamp
6. THE Job_Manager SHALL record an unflag action in the Activity_Log with admin ID, target job ID, and timestamp

### Requirement 8: Application Management and Viewing

**User Story:** As an administrator, I want to view all job applications with filtering options, so that I can monitor the application process and identify issues.

#### Acceptance Criteria

1. WHEN an Admin_User requests the application list with pagination parameters, THE Application_Manager SHALL return applications with limit and offset applied
2. WHEN an Admin_User requests the application list with a status filter, THE Application_Manager SHALL return only applications with the specified status
3. WHEN an Admin_User requests the application list with a job ID filter, THE Application_Manager SHALL return only applications for that job
4. WHEN an Admin_User requests the application list with an applicant ID filter, THE Application_Manager SHALL return only applications from that applicant
5. WHEN an Admin_User requests a specific application by ID, THE Application_Manager SHALL return the complete application document with job and applicant references populated
6. WHEN an Admin_User requests an application, THE Application_Manager SHALL include the AI_Match_Score if available
7. WHEN an Admin_User requests an application with interview details, THE Application_Manager SHALL include the interview subdocument with date, time, type, and meeting link

### Requirement 9: Analytics and Reporting

**User Story:** As an administrator, I want to view analytics and generate reports, so that I can understand platform trends and make data-driven decisions.

#### Acceptance Criteria

1. WHEN an Admin_User requests user growth analytics, THE Analytics_Engine SHALL return user counts grouped by month for the past 12 months
2. WHEN an Admin_User requests job trend analytics, THE Analytics_Engine SHALL return job counts grouped by month for the past 12 months
3. WHEN an Admin_User requests application flow analytics, THE Analytics_Engine SHALL return application counts grouped by status
4. WHEN an Admin_User requests AI match score distribution, THE Analytics_Engine SHALL return application counts grouped by score ranges (0-20, 21-40, 41-60, 61-80, 81-100)
5. WHEN an Admin_User requests top skills analysis, THE Analytics_Engine SHALL return the 10 most frequently occurring skills across all applicant profiles
6. WHEN an Admin_User requests top employers ranking, THE Analytics_Engine SHALL return the 10 employers with the most job postings
7. WHEN an Admin_User requests category statistics, THE Analytics_Engine SHALL return job counts grouped by experienceLevel
8. WHEN an Admin_User requests a report export, THE Analytics_Engine SHALL generate a CSV_Export containing the requested analytics data

### Requirement 10: Platform Settings Management

**User Story:** As an administrator, I want to configure platform settings, so that I can control system behavior and features.

#### Acceptance Criteria

1. WHEN an Admin_User requests current settings, THE Settings_Manager SHALL return all Platform_Settings from the database
2. WHEN an Admin_User updates the maintenance mode setting, THE Settings_Manager SHALL save the boolean value to Platform_Settings
3. WHEN maintenance mode is enabled, THE Admin_System SHALL allow only Admin_User access to the platform
4. WHEN an Admin_User updates registration controls, THE Settings_Manager SHALL save the allowRegistration boolean to Platform_Settings
5. WHEN registration is disabled, THE Auth_Middleware SHALL reject new registration requests with HTTP 403
6. WHEN an Admin_User updates AI match threshold, THE Settings_Manager SHALL validate the value is between 0 and 100 and save to Platform_Settings
7. WHEN an Admin_User updates job posting limits, THE Settings_Manager SHALL validate the maxJobsPerEmployer is a positive integer and save to Platform_Settings
8. WHEN an Admin_User updates job expiry days, THE Settings_Manager SHALL validate the jobExpiryDays is a positive integer and save to Platform_Settings
9. WHEN an Admin_User updates email notification settings, THE Settings_Manager SHALL save the enableEmailNotifications boolean to Platform_Settings
10. THE Settings_Manager SHALL record all settings changes in the Activity_Log with admin ID, setting name, old value, new value, and timestamp

### Requirement 11: Activity Logging and Audit Trail

**User Story:** As an administrator, I want to view a comprehensive audit trail of all administrative actions, so that I can track changes and investigate issues.

#### Acceptance Criteria

1. WHEN any administrative action occurs, THE Activity_Logger SHALL create an Activity_Log entry with action type, admin ID, timestamp, and details
2. WHEN an Admin_User requests activity logs with pagination, THE Activity_Logger SHALL return logs with limit and offset applied
3. WHEN an Admin_User requests activity logs with an action type filter, THE Activity_Logger SHALL return only logs matching the specified action type
4. WHEN an Admin_User requests activity logs with an admin ID filter, THE Activity_Logger SHALL return only logs created by that admin
5. WHEN an Admin_User requests activity logs with a date range filter, THE Activity_Logger SHALL return only logs within the specified start and end dates
6. WHEN an Admin_User requests activity logs with a search query, THE Activity_Logger SHALL return logs where details contain the search term
7. WHEN an Admin_User requests activity log export, THE Activity_Logger SHALL generate a CSV_Export containing log records
8. THE Activity_Logger SHALL store action details as a JSON object containing relevant entity IDs, old values, and new values

### Requirement 12: Notification Broadcasting System

**User Story:** As an administrator, I want to send notifications to users or specific roles, so that I can communicate important information to the platform community.

#### Acceptance Criteria

1. WHEN an Admin_User creates a notification with target "all", THE Notification_Broadcaster SHALL create notification records for all Platform_Users
2. WHEN an Admin_User creates a notification with target role "applicant", THE Notification_Broadcaster SHALL create notification records for all users with role "applicant"
3. WHEN an Admin_User creates a notification with target role "employer", THE Notification_Broadcaster SHALL create notification records for all users with role "employer"
4. WHEN a notification is created, THE Notification_Broadcaster SHALL store the message, createdBy admin ID, targetAudience, and timestamp
5. WHEN an Admin_User requests notification history, THE Notification_Broadcaster SHALL return all sent notifications with recipient counts
6. WHEN a Platform_User logs in, THE Admin_System SHALL return unread notifications for that user
7. THE Notification_Broadcaster SHALL record notification broadcasts in the Activity_Log with admin ID, target audience, message preview, and recipient count

### Requirement 13: Content Moderation Queue

**User Story:** As an administrator, I want to review and resolve user-reported content, so that I can maintain platform quality and safety.

#### Acceptance Criteria

1. WHEN a Platform_User submits a content report, THE Moderation_Queue SHALL create a Content_Report with reporter ID, reported entity type, reported entity ID, reason, and timestamp
2. WHEN an Admin_User requests pending reports, THE Moderation_Queue SHALL return all Content_Reports where status is "pending"
3. WHEN an Admin_User requests resolved reports, THE Moderation_Queue SHALL return all Content_Reports where status is "resolved"
4. WHEN an Admin_User requests reports with an entity type filter, THE Moderation_Queue SHALL return only reports for that entity type (user, job, application)
5. WHEN an Admin_User views a report, THE Moderation_Queue SHALL return the complete Content_Report with reporter and reported entity details populated
6. WHEN an Admin_User resolves a report, THE Moderation_Queue SHALL update the status to "resolved", store the resolvedBy admin ID, resolution notes, and resolvedAt timestamp
7. WHEN an Admin_User takes action on reported content, THE Moderation_Queue SHALL record the action type (ban, flag, delete, dismiss) in the Content_Report
8. THE Moderation_Queue SHALL record report resolutions in the Activity_Log with admin ID, report ID, action taken, and resolution notes

### Requirement 14: Database Schema Extensions

**User Story:** As a developer, I want extended database schemas to support admin functionality, so that the system can store all required administrative data.

#### Acceptance Criteria

1. THE User model SHALL include an isBanned boolean field with default value false
2. THE User model SHALL include a banReason string field
3. THE User model SHALL include a bannedAt date field
4. THE User model SHALL include a bannedBy ObjectId reference to the User model
5. THE User model SHALL include a lastLoginAt date field
6. THE User model SHALL include a loginCount number field with default value 0
7. THE Job model SHALL include an isFlagged boolean field with default value false
8. THE Job model SHALL include a flagReason string field
9. THE Job model SHALL include a flaggedAt date field
10. THE Job model SHALL include a flaggedBy ObjectId reference to the User model
11. THE Job model SHALL include a deletedAt date field
12. THE Job model SHALL include a viewCount number field with default value 0

### Requirement 15: New Database Models

**User Story:** As a developer, I want new database models for admin-specific data, so that the system can persist activity logs, settings, notifications, and reports.

#### Acceptance Criteria

1. THE Admin_System SHALL define an ActivityLog model with fields: action (string), adminId (ObjectId ref User), targetEntity (string), targetId (ObjectId), details (object), and timestamp (date)
2. THE Admin_System SHALL define a PlatformSettings model with fields: maintenanceMode (boolean), allowRegistration (boolean), aiMatchThreshold (number), maxJobsPerEmployer (number), jobExpiryDays (number), enableEmailNotifications (boolean), and updatedBy (ObjectId ref User)
3. THE Admin_System SHALL define an AdminNotification model with fields: message (string), createdBy (ObjectId ref User), targetAudience (string enum: all, applicant, employer), recipientCount (number), and createdAt (date)
4. THE Admin_System SHALL define a ContentReport model with fields: reportedBy (ObjectId ref User), entityType (string enum: user, job, application), entityId (ObjectId), reason (string), status (string enum: pending, resolved), resolvedBy (ObjectId ref User), resolutionNotes (string), actionTaken (string enum: ban, flag, delete, dismiss, none), reportedAt (date), and resolvedAt (date)

### Requirement 16: Frontend Admin Layout and Routing

**User Story:** As an administrator, I want a dedicated admin interface with navigation, so that I can access all administrative features efficiently.

#### Acceptance Criteria

1. THE Admin_System SHALL render an AdminLayout component with a dark navy sidebar (#1E293B) and white content area
2. THE Admin_System SHALL display navigation links in the sidebar for Dashboard, Users, Jobs, Applications, Analytics, Settings, Activity Logs, Notifications, and Reports
3. WHEN an Admin_User clicks a navigation link, THE Admin_System SHALL navigate to the corresponding route without page reload
4. THE Admin_System SHALL protect all admin routes with ProtectedRoute component requiring role "admin"
5. WHEN a non-admin user attempts to access an admin route, THE Admin_System SHALL redirect to their role-appropriate dashboard
6. THE Admin_System SHALL display the current Admin_User's name and avatar in the sidebar header
7. THE Admin_System SHALL provide a logout button in the sidebar that clears authentication and redirects to login

### Requirement 17: User Interface Interactions

**User Story:** As an administrator, I want responsive UI interactions with feedback, so that I can perform actions confidently and understand system responses.

#### Acceptance Criteria

1. WHEN an Admin_User performs a destructive action (delete, ban), THE Admin_System SHALL display a confirmation modal before executing
2. WHEN an action succeeds, THE Admin_System SHALL display a success toast notification with the action result
3. WHEN an action fails, THE Admin_System SHALL display an error toast notification with the error message
4. WHEN data is loading, THE Admin_System SHALL display a loading spinner or skeleton screen
5. WHEN a data table is empty, THE Admin_System SHALL display an empty state message with relevant guidance
6. WHEN an Admin_User hovers over an action button, THE Admin_System SHALL display a tooltip with the action description
7. THE Admin_System SHALL implement responsive design that adapts to screen sizes from 320px to 1920px width

### Requirement 18: CSV Export Functionality

**User Story:** As an administrator, I want to export data tables to CSV format, so that I can analyze data in external tools and create reports.

#### Acceptance Criteria

1. WHEN an Admin_User clicks an export button on the users table, THE User_Manager SHALL generate a CSV_Export with columns: id, name, email, role, onboardingComplete, createdAt, lastLoginAt, loginCount, isBanned
2. WHEN an Admin_User clicks an export button on the jobs table, THE Job_Manager SHALL generate a CSV_Export with columns: id, title, company, location, status, experienceLevel, postedBy, views, createdAt, isFlagged
3. WHEN an Admin_User clicks an export button on the applications table, THE Application_Manager SHALL generate a CSV_Export with columns: id, jobTitle, applicantName, applicantEmail, status, aiScore, createdAt
4. WHEN an Admin_User clicks an export button on the activity logs table, THE Activity_Logger SHALL generate a CSV_Export with columns: timestamp, action, adminName, targetEntity, targetId, details
5. WHEN a CSV_Export is generated, THE Admin_System SHALL set the Content-Type header to "text/csv"
6. WHEN a CSV_Export is generated, THE Admin_System SHALL set the Content-Disposition header with a filename including the current date

### Requirement 19: API Response Format Consistency

**User Story:** As a frontend developer, I want consistent API response formats, so that I can handle responses predictably in the UI.

#### Acceptance Criteria

1. WHEN an API request succeeds, THE Admin_System SHALL return a JSON response with structure: { success: true, data: <result>, message: <optional string> }
2. WHEN an API request fails due to validation, THE Admin_System SHALL return HTTP 400 with structure: { success: false, message: <error description> }
3. WHEN an API request fails due to authentication, THE Admin_System SHALL return HTTP 401 with structure: { success: false, message: "Unauthorized" }
4. WHEN an API request fails due to authorization, THE Admin_System SHALL return HTTP 403 with structure: { success: false, message: "Forbidden" }
5. WHEN an API request fails due to a missing resource, THE Admin_System SHALL return HTTP 404 with structure: { success: false, message: "Resource not found" }
6. WHEN an API request fails due to a server error, THE Admin_System SHALL return HTTP 500 with structure: { success: false, message: "Internal server error" }
7. WHEN a paginated API request succeeds, THE Admin_System SHALL include pagination metadata: { success: true, data: <results>, pagination: { total, page, limit, pages } }

### Requirement 20: Security and Input Validation

**User Story:** As a security-conscious developer, I want input validation and sanitization, so that the admin system is protected against malicious input and injection attacks.

#### Acceptance Criteria

1. WHEN an Admin_User submits a form with required fields missing, THE Admin_System SHALL return HTTP 400 with a message listing the missing fields
2. WHEN an Admin_User submits an email field, THE Admin_System SHALL validate the email format matches the pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
3. WHEN an Admin_User submits a numeric field, THE Admin_System SHALL validate the value is a number and within acceptable range
4. WHEN an Admin_User submits a string field, THE Admin_System SHALL trim whitespace and validate length constraints
5. WHEN an Admin_User submits a role value, THE Admin_System SHALL validate the role is one of the allowed enum values
6. WHEN an Admin_User submits a MongoDB ObjectId, THE Admin_System SHALL validate the ID format is a valid 24-character hex string
7. WHEN an Admin_User submits search query parameters, THE Admin_System SHALL sanitize the input to prevent NoSQL injection by escaping special characters
8. THE Admin_System SHALL use parameterized queries for all database operations to prevent injection attacks
