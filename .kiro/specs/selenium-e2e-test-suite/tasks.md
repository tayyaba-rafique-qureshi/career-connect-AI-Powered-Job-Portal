# Implementation Plan: Selenium E2E Test Suite

## Overview

This implementation plan breaks down the creation of a comprehensive Selenium-based E2E test suite for CareerConnect into discrete, incremental coding tasks. The test suite will use Python with pytest, Selenium WebDriver, and the Page Object Model pattern. Each task builds on previous work, with checkpoints to ensure quality and integration.

## Tasks

- [ ] 1. Set up test suite structure and configuration files
  - Create tests/selenium/ directory structure with subdirectories: pages/, tests/, utils/, screenshots/, reports/
  - Create requirements.txt with Selenium 4.20.0, pytest, pytest-html, pytest-xdist, pytest-rerunfailures, webdriver-manager, Faker, pymongo, python-dotenv
  - Create pytest.ini with test markers (smoke, regression, auth, crud, admin, applicant, recruiter, slow) and pytest configuration
  - Create .env.test with environment variables for BASE_URL, API_URL, MONGODB_URI, BROWSER, HEADLESS, IMPLICIT_WAIT, EXPLICIT_WAIT
  - Create base_test.py with BaseTest class containing common constants (admin credentials, test email domain)
  - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7, 1.8, 1.9, 18.1-18.10_

- [ ]* 1.1 Create README.md with setup and usage documentation
  - Document prerequisites, installation steps, configuration, running tests, test markers, parallel execution, viewing reports
  - _Requirements: 22.1-22.12_

- [ ] 2. Implement utility modules
  - [ ] 2.1 Create test_data.py with TestDataFactory class
    - Implement methods using Faker to generate user data (email with @testcareer.com, password, name, phone)
    - Implement methods to generate job posting data (title, description, requirements, salary, location, company)
    - Implement methods to generate company data (name, description, industry, size)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 2.2 Create wait_helpers.py with custom wait functions
    - Implement wait_for_element_visible(driver, locator, timeout=10)
    - Implement wait_for_element_clickable(driver, locator, timeout=10)
    - Implement wait_for_element_present(driver, locator, timeout=10)
    - Implement wait_for_element_to_disappear(driver, locator, timeout=10)
    - Implement wait_for_text_in_element(driver, locator, text, timeout=10)
    - Implement wait_for_url_change(driver, expected_url, timeout=10)
    - _Requirements: 12.1-12.7_

  - [ ] 2.3 Create screenshot_helper.py with ScreenshotHelper class
    - Implement capture_screenshot(driver, test_name) method that saves PNG to screenshots/ directory
    - Implement naming with test name and timestamp
    - Implement full page screenshot capture
    - Implement logging of screenshot file path
    - _Requirements: 13.1-13.7_

  - [ ] 2.4 Create db_helper.py with DBHelper class
    - Implement connect_to_test_db() method that connects to careerconnect_test database
    - Implement seed_test_data() method to create test users, jobs, applications
    - Implement cleanup_test_data() method that only deletes records with @testcareer.com emails
    - Implement safety checks to verify test database name before cleanup
    - Implement logging of all cleanup operations
    - _Requirements: 10.5, 10.6, 10.7, 24.1-24.7, 30.1-30.7_

- [ ] 3. Implement Page Object Model base classes
  - [ ] 3.1 Create pages/base_page.py with BasePage class
    - Implement __init__(driver) constructor
    - Implement find_element(locator) using wait_for_element_present
    - Implement click_element(locator) using wait_for_element_clickable
    - Implement enter_text(locator, text) using wait_for_element_visible
    - Implement get_text(locator) using wait_for_element_visible
    - Implement is_element_visible(locator) method
    - Implement is_element_present(locator) method
    - Implement get_current_url() method
    - Implement wait_for_page_load() method
    - _Requirements: 2.1, 2.7, 2.8_

- [ ] 4. Implement authentication page objects
  - [ ] 4.1 Create pages/login_page.py with LoginPage class
    - Implement enter_email(email), enter_password(password), click_login_button() methods
    - Implement get_error_message() method
    - Implement is_logged_in() method that checks for dashboard redirect
    - Use flexible CSS selectors (data-testid, name, or semantic selectors)
    - _Requirements: 2.2, 2.6_

  - [ ] 4.2 Create pages/register_page.py with RegisterPage class
    - Implement enter_name(name), enter_email(email), enter_password(password), select_role(role), click_register_button() methods
    - Implement get_validation_error(field) method
    - Implement is_registration_successful() method
    - _Requirements: 2.2, 2.6_

  - [ ] 4.3 Create pages/landing_page.py with LandingPage class
    - Implement click_login_button(), click_register_button(), click_post_job_button() methods
    - Implement is_page_loaded() method
    - _Requirements: 2.2_

- [ ] 5. Implement applicant page objects
  - [ ] 5.1 Create pages/applicant_dashboard_page.py with ApplicantDashboardPage class
    - Implement get_job_recommendations() method that returns list of job elements
    - Implement click_job_card(index) method
    - Implement is_dashboard_loaded() method
    - _Requirements: 2.3_

  - [ ] 5.2 Create pages/applicant_my_jobs_page.py with ApplicantMyJobsPage class
    - Implement get_applied_jobs() method that returns list of application elements
    - Implement is_job_in_list(job_title) method
    - Implement click_application(index) method
    - _Requirements: 2.3_

  - [ ] 5.3 Create pages/applicant_profile_page.py with ApplicantProfilePage class
    - Implement update_name(name), update_phone(phone), update_skills(skills), click_save_button() methods
    - Implement is_profile_updated() method that checks for success message
    - _Requirements: 2.3_

  - [ ] 5.4 Create pages/applicant_notifications_page.py with ApplicantNotificationsPage class
    - Implement get_notifications() method that returns list of notification elements
    - Implement is_notifications_loaded() method
    - _Requirements: 2.3_

  - [ ] 5.5 Create pages/job_details_page.py with JobDetailsPage class
    - Implement click_apply_button(), enter_cover_letter(text), submit_application() methods
    - Implement is_application_submitted() method
    - _Requirements: 2.3_

- [ ] 6. Implement recruiter page objects
  - [ ] 6.1 Create pages/recruiter_dashboard_page.py with RecruiterDashboardPage class
    - Implement click_post_job_button(), get_recent_jobs() methods
    - Implement is_dashboard_loaded() method
    - _Requirements: 2.4_

  - [ ] 6.2 Create pages/post_job_page.py with PostJobPage class
    - Implement enter_job_title(title), enter_description(desc), enter_requirements(reqs), enter_salary(salary), enter_location(loc), click_post_button() methods
    - Implement is_job_posted() method
    - _Requirements: 2.4_

  - [ ] 6.3 Create pages/recruiter_my_jobs_page.py with RecruiterMyJobsPage class
    - Implement get_posted_jobs() method
    - Implement click_edit_job(index), click_delete_job(index), click_view_applicants(index) methods
    - _Requirements: 2.4_

  - [ ] 6.4 Create pages/edit_job_page.py with EditJobPage class
    - Implement update_job_title(title), update_description(desc), click_save_button() methods
    - Implement is_job_updated() method
    - _Requirements: 2.4_

  - [ ] 6.5 Create pages/job_applicants_page.py with JobApplicantsPage class
    - Implement get_applicants() method
    - Implement click_applicant(index), update_application_status(status) methods
    - _Requirements: 2.4_

- [ ] 7. Implement admin page objects
  - [ ] 7.1 Create pages/admin_overview_page.py with AdminOverviewPage class
    - Implement get_total_users(), get_total_jobs(), get_total_applications() methods
    - Implement is_statistics_loaded() method
    - _Requirements: 2.5_

  - [ ] 7.2 Create pages/admin_users_page.py with AdminUsersPage class
    - Implement get_users_list() method
    - Implement search_user(email), filter_by_role(role), click_user(index) methods
    - Implement is_pagination_visible() method
    - _Requirements: 2.5_

  - [ ] 7.3 Create pages/admin_jobs_page.py with AdminJobsPage class
    - Implement get_jobs_list() method
    - Implement filter_by_status(status), search_job(title), click_job(index) methods
    - _Requirements: 2.5_

  - [ ] 7.4 Create pages/admin_applications_page.py with AdminApplicationsPage class
    - Implement get_applications_list() method
    - Implement filter_by_status(status), click_application(index) methods
    - _Requirements: 2.5_

  - [ ] 7.5 Create pages/admin_analytics_page.py with AdminAnalyticsPage class
    - Implement is_charts_loaded(), get_chart_data() methods
    - _Requirements: 2.5_

  - [ ] 7.6 Create pages/admin_settings_page.py with AdminSettingsPage class
    - Implement update_setting(key, value), click_save_button() methods
    - Implement is_settings_updated() method
    - _Requirements: 2.5_

  - [ ] 7.7 Create pages/admin_audit_logs_page.py with AdminAuditLogsPage class
    - Implement get_audit_logs() method
    - Implement filter_by_action(action), filter_by_user(user) methods
    - _Requirements: 2.5_

- [ ] 8. Implement test fixtures in conftest.py
  - [ ] 8.1 Create conftest.py with WebDriver fixtures
    - Implement driver fixture that sets up WebDriver with webdriver-manager
    - Configure browser based on BROWSER environment variable (default: chrome)
    - Configure headless mode based on HEADLESS environment variable
    - Set implicit wait and page load timeout
    - Maximize browser window
    - Yield driver and quit after test
    - _Requirements: 11.1-11.10_

  - [ ] 8.2 Add screenshot on failure fixture
    - Implement pytest_runtest_makereport hook to capture screenshot on failure
    - Use ScreenshotHelper to save screenshot
    - _Requirements: 13.1-13.8_

  - [ ] 8.3 Add test data fixtures
    - Implement test_user fixture that creates and returns test user data
    - Implement test_job fixture that creates and returns test job data
    - Implement db_cleanup fixture that cleans up test data after tests
    - _Requirements: 10.8, 10.9, 10.10_

- [ ] 9. Implement authentication tests
  - [ ] 9.1 Create tests/test_authentication.py with authentication test cases
    - Implement test_login_with_valid_credentials (smoke) - verify redirect to dashboard
    - Implement test_login_with_invalid_credentials - verify error message
    - Implement test_logout - verify redirect to login page
    - Implement test_protected_route_without_auth - verify redirect to login
    - Implement test_token_persistence (smoke) - verify user stays logged in after refresh
    - Implement test_applicant_cannot_access_recruiter_routes - verify access control
    - Implement test_applicant_cannot_access_admin_routes - verify access control
    - Implement test_recruiter_cannot_access_admin_routes - verify access control
    - Mark tests with @pytest.mark.auth and appropriate smoke markers
    - _Requirements: 3.1-3.10_

- [ ]* 9.2 Write unit tests for authentication page objects
  - Test page object methods return correct values
  - Test error handling for missing elements
  - _Requirements: 3.1-3.10_

- [ ] 10. Implement registration tests
  - [ ] 10.1 Create tests/test_registration.py with registration test cases
    - Implement test_register_new_user_as_applicant (smoke) - verify user created and redirected
    - Implement test_register_new_user_as_recruiter (smoke) - verify user created and redirected
    - Implement test_register_with_existing_email - verify duplicate error
    - Implement test_register_with_invalid_email - verify validation error
    - Implement test_register_with_short_password - verify validation error
    - Implement test_register_without_required_fields - verify validation errors
    - Use TestDataFactory to generate unique test data
    - Mark tests with appropriate markers
    - _Requirements: 4.1-4.8_

- [ ]* 10.2 Write unit tests for registration page objects
  - Test validation error retrieval
  - Test form submission
  - _Requirements: 4.1-4.8_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement applicant journey tests
  - [ ] 12.1 Create tests/test_applicant_journey.py with applicant test cases
    - Implement test_view_job_recommendations (smoke) - verify jobs displayed on dashboard
    - Implement test_apply_to_job (smoke) - verify application submitted successfully
    - Implement test_view_applied_jobs - verify job appears in my jobs list
    - Implement test_update_profile - verify profile changes saved
    - Implement test_view_notifications - verify notifications displayed
    - Implement test_search_jobs - verify search results
    - Implement test_filter_jobs_by_location - verify filtered results
    - Implement test_filter_jobs_by_salary - verify filtered results
    - Implement test_view_job_details - verify job details page loads
    - Implement test_withdraw_application - verify application withdrawn
    - Mark tests with @pytest.mark.applicant and appropriate smoke markers
    - _Requirements: 5.1-5.7_

- [ ]* 12.2 Write integration tests for applicant journey
  - Test complete flow from login to application submission
  - Test error scenarios
  - _Requirements: 5.1-5.7_

- [ ] 13. Implement recruiter tests
  - [ ] 13.1 Create tests/test_recruiter.py with recruiter test cases
    - Implement test_post_new_job (smoke) - verify job created successfully
    - Implement test_edit_job (smoke) - verify job updated successfully
    - Implement test_view_job_applicants - verify applicants displayed
    - Implement test_delete_job - verify job removed from list
    - Implement test_view_posted_jobs (smoke) - verify all jobs displayed
    - Implement test_update_application_status - verify status changed
    - Implement test_search_applicants - verify search results
    - Implement test_filter_applicants_by_status - verify filtered results
    - Implement test_view_applicant_profile - verify profile modal opens
    - Implement test_schedule_interview - verify interview scheduled
    - Mark tests with @pytest.mark.recruiter and appropriate smoke markers
    - _Requirements: 6.1-6.7_

- [ ]* 13.2 Write integration tests for recruiter workflow
  - Test complete flow from job posting to applicant management
  - Test error scenarios
  - _Requirements: 6.1-6.7_

- [ ] 14. Implement admin panel tests
  - [ ] 14.1 Create tests/test_admin_panel.py with admin test cases
    - Implement test_view_overview_dashboard (smoke) - verify statistics displayed
    - Implement test_view_users_list (smoke) - verify users displayed with pagination
    - Implement test_view_jobs_list - verify jobs displayed with filtering
    - Implement test_view_applications_list - verify applications displayed
    - Implement test_view_analytics (smoke) - verify charts and metrics displayed
    - Implement test_update_platform_settings - verify settings saved
    - Implement test_view_audit_logs - verify logs displayed
    - Implement test_search_users - verify search results
    - Implement test_filter_users_by_role - verify filtered results
    - Implement test_filter_jobs_by_status - verify filtered results
    - Implement test_view_user_details - verify user details modal
    - Implement test_suspend_user - verify user suspended
    - Implement test_delete_job - verify job deleted
    - Implement test_view_announcements - verify announcements displayed
    - Implement test_create_announcement - verify announcement created
    - Mark tests with @pytest.mark.admin and appropriate smoke markers
    - _Requirements: 7.1-7.9_

- [ ]* 14.2 Write integration tests for admin workflows
  - Test complete admin workflows
  - Test error scenarios
  - _Requirements: 7.1-7.9_

- [ ] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Implement CRUD operation tests
  - [ ] 16.1 Create tests/test_crud_operations.py with CRUD test cases
    - Implement test_create_user (smoke) - verify user created and appears in list
    - Implement test_read_user - verify user details displayed correctly
    - Implement test_update_user - verify user changes reflected
    - Implement test_delete_user - verify user removed from list
    - Implement test_create_job (smoke) - verify job created and appears in list
    - Implement test_read_job - verify job details displayed correctly
    - Implement test_update_job (smoke) - verify job changes reflected
    - Implement test_delete_job - verify job removed from list
    - Implement test_create_application - verify application created
    - Implement test_read_application - verify application details displayed
    - Implement test_update_application_status - verify status change reflected
    - Implement test_delete_application - verify application removed
    - Mark tests with @pytest.mark.crud and appropriate smoke markers
    - _Requirements: 8.1-8.10_

- [ ]* 16.2 Write unit tests for CRUD operations
  - Test individual CRUD methods
  - Test error handling
  - _Requirements: 8.1-8.10_

- [ ] 17. Implement regression test suite
  - [ ] 17.1 Create tests/test_regression.py with regression test cases
    - Implement test_login_functionality (smoke, regression) - verify login still works
    - Implement test_job_posting_functionality (smoke, regression) - verify job posting still works
    - Implement test_job_application_functionality (smoke, regression) - verify application still works
    - Implement test_user_profile_update (regression) - verify profile update still works
    - Implement test_admin_user_management (smoke, regression) - verify admin user management still works
    - Implement test_search_functionality (regression) - verify search still works
    - Implement test_filter_functionality (regression) - verify filtering still works
    - Implement test_navigation_between_pages (regression) - verify navigation still works
    - Implement test_pagination (regression) - verify pagination still works
    - Implement test_sorting (regression) - verify sorting still works
    - Implement test_form_validation (regression) - verify validation still works
    - Implement test_error_messages (regression) - verify error messages still display
    - Implement test_success_messages (regression) - verify success messages still display
    - Implement test_logout_functionality (regression) - verify logout still works
    - Implement test_token_expiration (regression) - verify token expiration handling
    - Implement test_role_based_access (regression) - verify role-based access still works
    - Implement test_responsive_layout (regression) - verify responsive design still works
    - Implement test_browser_back_button (regression) - verify back button handling
    - Implement test_browser_refresh (regression) - verify refresh handling
    - Implement test_concurrent_users (regression, slow) - verify concurrent user handling
    - Mark tests with @pytest.mark.regression and appropriate markers
    - _Requirements: 9.1-9.10_

- [ ]* 17.2 Write integration tests for regression scenarios
  - Test complete user workflows
  - Test edge cases
  - _Requirements: 9.1-9.10_

- [ ] 18. Implement accessibility tests
  - [ ] 18.1 Create tests/test_accessibility.py with accessibility test cases
    - Implement test_all_pages_have_title - verify title element present
    - Implement test_form_inputs_have_labels - verify labels associated with inputs
    - Implement test_images_have_alt_attributes - verify alt attributes present
    - Implement test_buttons_keyboard_accessible - verify buttons can be activated with keyboard
    - Implement test_navigation_keyboard_accessible - verify navigation works with keyboard
    - Implement test_color_contrast_critical_elements - verify contrast meets WCAG AA
    - Implement test_focus_indicators_visible - verify focus indicators present
    - Implement test_heading_hierarchy - verify proper heading structure
    - Mark tests with appropriate markers
    - _Requirements: 23.1-23.8_

- [ ]* 18.2 Write additional accessibility tests
  - Test screen reader compatibility
  - Test ARIA attributes
  - _Requirements: 23.1-23.8_

- [ ] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Extend CI/CD pipeline with Selenium E2E tests job
  - [ ] 20.1 Add selenium-e2e-tests job to .github/workflows/ci.yml
    - Add job that runs after backend-tests, frontend-tests, ai-tests complete
    - Install Python 3.11 and test dependencies from tests/selenium/requirements.txt
    - Install Chrome browser and ChromeDriver
    - Start server (port 5000), client (port 5173), ai-service (port 8000) in background
    - Wait for all services to be healthy (curl health check endpoints)
    - Set environment variables: BASE_URL=http://localhost:5173, API_URL=http://localhost:5000, MONGODB_URI=mongodb://localhost:27017/careerconnect_test, HEADLESS=true
    - Run smoke tests: pytest tests/selenium/ -m smoke --html=reports/smoke-report.html
    - Run regression tests: pytest tests/selenium/ -m regression --html=reports/regression-report.html --continue-on-collection-errors
    - Run CRUD tests: pytest tests/selenium/ -m crud --html=reports/crud-report.html --continue-on-collection-errors
    - Upload screenshots as artifacts on failure
    - Upload HTML reports as artifacts
    - Configure to use 2 parallel workers with pytest-xdist
    - Configure to retry failed tests up to 2 times with pytest-rerunfailures
    - ONLY APPEND this job - do not modify existing jobs
    - _Requirements: 19.1-19.15_

- [ ] 20.2 Add deploy-staging job to .github/workflows/ci.yml
  - Add job that runs only on main branch after selenium-e2e-tests completes
  - Add deployment steps to staging environment
  - Add health check verification after deployment
  - ONLY APPEND this job - do not modify existing jobs
  - _Requirements: 20.1-20.7_

- [ ] 20.3 Update all-checks-passed job in .github/workflows/ci.yml
  - Update needs array to include selenium-e2e-tests
  - Update needs array to include deploy-staging (conditional on main branch)
  - Add summary logging of all job results
  - _Requirements: 21.1-21.7_

- [ ] 21. Final checkpoint - Ensure all tests pass and CI integration works
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The test suite uses Python with pytest, Selenium WebDriver, and Page Object Model pattern
- All tests should use flexible CSS selectors that don't rely on Tailwind hash-based class names
- Test data cleanup only deletes records with @testcareer.com emails for safety
- CI/CD integration only appends new jobs without modifying existing test infrastructure
- Admin credentials for testing: admin@careerconnect.com / Admin@123
- Headless mode is enabled in CI (HEADLESS=true) for faster execution
- Parallel execution with 2 workers speeds up test execution in CI
- Automatic retry (up to 2 times) handles flaky tests
