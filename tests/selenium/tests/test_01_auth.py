"""
Authentication E2E Tests
Covers: Login, Logout, Role-based redirect, Protected routes, Token persistence

Test Suite: Authentication (12 test cases)
- Login page rendering and validation
- Valid/invalid login scenarios
- Protected route access control
- JWT token management
- Navigation links (forgot password, register)

All tests use Page Object Model pattern for maintainability.
"""
import pytest
import os
import time
from pages.login_page import LoginPage
from pages.base_page import BasePage
from base_test import BaseTest


@pytest.mark.auth
class TestAuthentication(BaseTest):
    """
    Authentication test suite covering login, logout, and access control.
    Uses Page Object Model pattern with no direct CSS selectors in tests.
    """
    
    @pytest.mark.smoke
    def test_login_page_loads(self, driver):
        """
        TC-AUTH-01: Verify login page loads correctly with all required elements.
        
        Steps:
        1. Navigate to login page
        2. Verify URL contains '/login'
        3. Verify email input is visible
        4. Verify password input is visible
        5. Verify submit button is visible
        
        Expected: All login form elements are present and visible
        """
        page = LoginPage(driver).open()
        
        # Verify we're on the login page
        assert page.is_on_login_page(), "Should be on login page"
        
        # Verify all required form elements are visible
        assert page.is_visible(LoginPage.EMAIL_INPUT, timeout=5), "Email input should be visible"
        assert page.is_visible(LoginPage.PASSWORD_INPUT, timeout=5), "Password input should be visible"
        assert page.is_visible(LoginPage.SUBMIT_BTN, timeout=5), "Submit button should be visible"
    
    @pytest.mark.smoke
    def test_valid_admin_login_redirects_to_admin_dashboard(self, driver):
        """
        TC-AUTH-02: Verify successful admin login redirects to admin dashboard.
        
        Steps:
        1. Navigate to login page
        2. Enter valid admin credentials
        3. Click submit button
        4. Wait for redirect
        5. Verify URL contains '/admin'
        
        Expected: User is redirected to admin dashboard after successful login
        """
        page = LoginPage(driver).open()
        
        # Perform login with admin credentials
        page.login(self.ADMIN_EMAIL, self.ADMIN_PASSWORD)
        
        # Wait for redirect to admin dashboard
        page.wait_for_url("/admin", timeout=15)
        
        # Verify we're on admin dashboard
        current_url = driver.current_url
        assert "/admin" in current_url, f"Should redirect to admin dashboard, but got: {current_url}"
    
    @pytest.mark.smoke
    def test_invalid_password_shows_error(self, driver):
        """
        TC-AUTH-03: Verify invalid credentials show error message.
        
        Steps:
        1. Navigate to login page
        2. Enter invalid email and password
        3. Click submit button
        4. Verify error message is displayed
        
        Expected: Error message is visible after failed login attempt
        """
        page = LoginPage(driver).open()
        
        # Attempt login with invalid credentials
        page.login("invalid@email.com", "wrongpassword123")
        
        # Wait a moment for error to appear
        time.sleep(1)
        
        # Verify error message is displayed
        assert page.is_visible(LoginPage.ERROR_MSG, timeout=5), "Error message should be visible for invalid credentials"
    
    def test_empty_email_shows_validation(self, driver):
        """
        TC-AUTH-04: Verify empty email field shows validation error.
        
        Steps:
        1. Navigate to login page
        2. Leave email field empty
        3. Enter password
        4. Click submit button
        5. Verify still on login page (form validation prevents submission)
        
        Expected: Form validation prevents submission with empty email
        """
        page = LoginPage(driver).open()
        
        # Enter only password, leave email empty
        page.type_text(LoginPage.PASSWORD_INPUT, "somepassword123")
        page.click(LoginPage.SUBMIT_BTN)
        
        # Wait a moment for validation
        time.sleep(1)
        
        # Verify we're still on login page (validation prevented submission)
        assert page.is_on_login_page(), "Should remain on login page when email is empty"
    
    def test_empty_password_shows_validation(self, driver):
        """
        TC-AUTH-05: Verify empty password field shows validation error.
        
        Steps:
        1. Navigate to login page
        2. Enter email
        3. Leave password field empty
        4. Click submit button
        5. Verify still on login page (form validation prevents submission)
        
        Expected: Form validation prevents submission with empty password
        """
        page = LoginPage(driver).open()
        
        # Enter only email, leave password empty
        page.type_text(LoginPage.EMAIL_INPUT, self.ADMIN_EMAIL)
        page.click(LoginPage.SUBMIT_BTN)
        
        # Wait a moment for validation
        time.sleep(1)
        
        # Verify we're still on login page (validation prevented submission)
        assert page.is_on_login_page(), "Should remain on login page when password is empty"
    
    @pytest.mark.smoke
    def test_protected_route_redirects_to_login(self, driver):
        """
        TC-AUTH-06: Verify unauthenticated user cannot access protected admin routes.
        
        Steps:
        1. Clear any existing session/tokens
        2. Attempt to navigate directly to admin dashboard
        3. Verify redirect to login page
        
        Expected: Unauthenticated user is redirected to login page
        """
        # Clear any existing authentication
        driver.get(self.BASE_URL)
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        
        # Attempt to access protected admin route
        driver.get(f"{self.BASE_URL}/dashboard/admin")
        
        # Create page object for assertions
        page = BasePage(driver)
        
        # Wait for redirect to login
        page.wait_for_url("/login", timeout=10)
        
        # Verify we're on login page
        current_url = driver.current_url
        assert "/login" in current_url, f"Should redirect to login page, but got: {current_url}"
    
    def test_protected_applicant_route_redirects(self, driver):
        """
        TC-AUTH-07: Verify unauthenticated user cannot access protected applicant routes.
        
        Steps:
        1. Clear any existing session/tokens
        2. Attempt to navigate directly to applicant dashboard
        3. Verify redirect to login page
        
        Expected: Unauthenticated user is redirected to login page
        """
        # Clear any existing authentication
        driver.get(self.BASE_URL)
        driver.execute_script("localStorage.clear(); sessionStorage.clear();")
        
        # Attempt to access protected applicant route
        driver.get(f"{self.BASE_URL}/dashboard/applicant")
        
        # Create page object for assertions
        page = BasePage(driver)
        
        # Wait for redirect to login
        page.wait_for_url("/login", timeout=10)
        
        # Verify we're on login page
        current_url = driver.current_url
        assert "/login" in current_url, f"Should redirect to login page, but got: {current_url}"
    
    @pytest.mark.smoke
    def test_admin_logout_redirects_to_login(self, driver):
        """
        TC-AUTH-08: Verify admin logout clears session and redirects to login.
        
        Steps:
        1. Login as admin
        2. Verify on admin dashboard
        3. Click logout button
        4. Verify redirect to login page
        
        Expected: User is logged out and redirected to login page
        """
        # Login as admin
        page = LoginPage(driver).open()
        page.login(self.ADMIN_EMAIL, self.ADMIN_PASSWORD)
        page.wait_for_url("/admin", timeout=15)
        
        # Import admin dashboard page object
        from pages.admin_dashboard_page import AdminDashboardPage
        admin_page = AdminDashboardPage(driver)
        
        # Perform logout
        admin_page.logout()
        
        # Wait a moment for redirect
        time.sleep(2)
        
        # Verify redirect to login page
        current_url = driver.current_url
        assert "/login" in current_url, f"Should redirect to login after logout, but got: {current_url}"
    
    @pytest.mark.smoke
    def test_jwt_token_stored_in_localstorage_after_login(self, driver):
        """
        TC-AUTH-09: Verify JWT token is stored in localStorage after successful login.
        
        Steps:
        1. Navigate to login page
        2. Login with valid credentials
        3. Wait for redirect
        4. Check localStorage for 'token' key
        5. Verify token exists and has reasonable length
        
        Expected: JWT token is stored in localStorage after successful login
        """
        page = LoginPage(driver).open()
        
        # Perform login
        page.login(self.ADMIN_EMAIL, self.ADMIN_PASSWORD)
        page.wait_for_url("/admin", timeout=15)
        
        # Check localStorage for token
        token = driver.execute_script("return localStorage.getItem('token');")
        
        # Verify token exists and has reasonable length (JWT tokens are typically 100+ chars)
        assert token is not None, "Token should be stored in localStorage after login"
        assert len(token) > 20, f"Token should be a valid JWT (length > 20), but got length: {len(token)}"
    
    def test_token_cleared_after_logout(self, driver):
        """
        TC-AUTH-10: Verify JWT token is removed from localStorage after logout.
        
        Steps:
        1. Login as admin
        2. Verify token exists in localStorage
        3. Logout
        4. Verify token is removed from localStorage
        
        Expected: Token is cleared from localStorage after logout
        """
        # Login as admin
        page = LoginPage(driver).open()
        page.login(self.ADMIN_EMAIL, self.ADMIN_PASSWORD)
        page.wait_for_url("/admin", timeout=15)
        
        # Verify token exists
        token_before = driver.execute_script("return localStorage.getItem('token');")
        assert token_before is not None, "Token should exist before logout"
        
        # Perform logout
        from pages.admin_dashboard_page import AdminDashboardPage
        admin_page = AdminDashboardPage(driver)
        admin_page.logout()
        
        # Wait for logout to complete
        time.sleep(2)
        
        # Verify token is cleared
        token_after = driver.execute_script("return localStorage.getItem('token');")
        assert token_after is None, "Token should be cleared from localStorage after logout"
    
    def test_forgot_password_link_navigates(self, driver):
        """
        TC-AUTH-11: Verify forgot password link navigates to correct page.
        
        Steps:
        1. Navigate to login page
        2. Click forgot password link
        3. Verify redirect to forgot password page
        
        Expected: User is navigated to forgot password page
        """
        page = LoginPage(driver).open()
        
        # Click forgot password link
        page.click_forgot_password()
        
        # Wait for navigation
        page.wait_for_url("/forgot-password", timeout=10)
        
        # Verify we're on forgot password page
        current_url = driver.current_url
        assert "/forgot-password" in current_url or "/forgot" in current_url, \
            f"Should navigate to forgot password page, but got: {current_url}"
    
    def test_register_link_navigates(self, driver):
        """
        TC-AUTH-12: Verify register link navigates to registration page.
        
        Steps:
        1. Navigate to login page
        2. Click register link
        3. Verify redirect to registration page
        
        Expected: User is navigated to registration page
        """
        page = LoginPage(driver).open()
        
        # Click register link
        page.click_register_link()
        
        # Wait for navigation
        page.wait_for_url("/register", timeout=10)
        
        # Verify we're on registration page
        current_url = driver.current_url
        assert "/register" in current_url or "/signup" in current_url, \
            f"Should navigate to registration page, but got: {current_url}"
