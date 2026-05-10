"""
Registration Flow E2E Tests
Covers: New user registration, validation, duplicate prevention, role assignment

Test Suite: Registration (6 test cases)
- Registration page rendering
- Successful applicant registration
- Successful employer registration
- Duplicate email validation
- Password strength validation
- Required field validation

All tests use Page Object Model pattern and TestDataFactory for test data generation.
"""
import pytest
import time
import os
from pages.register_page import RegisterPage
from pages.login_page import LoginPage
from pages.base_page import BasePage
from utils.test_data import TestDataFactory
from base_test import BaseTest


@pytest.mark.auth
class TestRegistration(BaseTest):
    """
    Registration test suite covering user registration flows and validation.
    Uses Page Object Model pattern and TestDataFactory for unique test data.
    """
    
    @pytest.mark.smoke
    def test_registration_page_loads(self, driver):
        """
        TC-REG-01: Verify registration page loads correctly with all required form fields.
        
        Steps:
        1. Navigate to registration page
        2. Verify URL contains '/register'
        3. Verify name input is visible
        4. Verify email input is visible
        5. Verify password input is visible
        6. Verify submit button is visible
        
        Expected: All registration form elements are present and visible
        """
        page = RegisterPage(driver).open()
        
        # Verify we're on the registration page
        current_url = driver.current_url
        assert "/register" in current_url or "/signup" in current_url, \
            f"Should be on registration page, but got: {current_url}"
        
        # Verify all required form elements are visible
        assert page.is_visible(RegisterPage.NAME_INPUT, timeout=5), "Name input should be visible"
        assert page.is_visible(RegisterPage.EMAIL_INPUT, timeout=5), "Email input should be visible"
        assert page.is_visible(RegisterPage.PASSWORD_INPUT, timeout=5), "Password input should be visible"
        assert page.is_visible(RegisterPage.SUBMIT_BTN, timeout=5), "Submit button should be visible"
    
    @pytest.mark.smoke
    def test_register_new_applicant(self, driver):
        """
        TC-REG-02: Verify new applicant can register successfully.
        
        Steps:
        1. Navigate to registration page
        2. Generate unique applicant user data using TestDataFactory
        3. Fill in registration form with applicant role
        4. Submit form
        5. Verify redirect away from registration page
        6. Store user data for cleanup
        
        Expected: User is registered and redirected to onboarding or dashboard
        """
        # Generate unique applicant user data
        user = TestDataFactory.applicant_user()
        
        # Navigate to registration page
        page = RegisterPage(driver).open()
        
        # Fill in registration form
        page.register(
            name=user["name"],
            email=user["email"],
            password=user["password"],
            role="applicant"
        )
        
        # Wait for registration to complete
        time.sleep(3)
        
        # Verify redirect away from registration page (to onboarding or dashboard)
        current_url = driver.current_url
        assert "/register" not in current_url, \
            f"Should redirect away from registration page after successful registration, but got: {current_url}"
        
        # Verify we're on a valid post-registration page
        assert any(path in current_url for path in ["/onboarding", "/dashboard", "/login"]), \
            f"Should redirect to onboarding, dashboard, or login page, but got: {current_url}"
        
        # Store user data for cleanup
        TestDataFactory.store_user(user)
    
    @pytest.mark.smoke
    def test_register_new_employer(self, driver):
        """
        TC-REG-03: Verify new employer can register successfully.
        
        Steps:
        1. Navigate to registration page
        2. Generate unique employer user data using TestDataFactory
        3. Fill in registration form with employer role
        4. Submit form
        5. Verify redirect away from registration page
        6. Store user data for cleanup
        
        Expected: User is registered and redirected to onboarding or dashboard
        """
        # Generate unique employer user data
        user = TestDataFactory.employer_user()
        
        # Navigate to registration page
        page = RegisterPage(driver).open()
        
        # Fill in registration form
        page.register(
            name=user["name"],
            email=user["email"],
            password=user["password"],
            role="employer"
        )
        
        # Wait for registration to complete
        time.sleep(3)
        
        # Verify redirect away from registration page
        current_url = driver.current_url
        assert "/register" not in current_url, \
            f"Should redirect away from registration page after successful registration, but got: {current_url}"
        
        # Verify we're on a valid post-registration page
        assert any(path in current_url for path in ["/onboarding", "/dashboard", "/login"]), \
            f"Should redirect to onboarding, dashboard, or login page, but got: {current_url}"
        
        # Store user data for cleanup
        TestDataFactory.store_user(user)
    
    def test_register_duplicate_email_shows_error(self, driver):
        """
        TC-REG-04: Verify duplicate email registration shows error message.
        
        Steps:
        1. Navigate to registration page
        2. Attempt to register with existing admin email
        3. Submit form
        4. Verify error message is displayed
        
        Expected: Error message is shown for duplicate email
        """
        page = RegisterPage(driver).open()
        
        # Attempt to register with existing admin email (known to exist)
        page.register(
            name="Duplicate User",
            email=self.ADMIN_EMAIL,  # Use existing admin email
            password="Test@1234",
            role="applicant"
        )
        
        # Wait for error to appear
        time.sleep(2)
        
        # Verify error message is displayed
        assert page.is_visible(RegisterPage.ERROR_MSG, timeout=5), \
            "Error message should be visible for duplicate email registration"
        
        # Optionally verify we're still on registration page
        current_url = driver.current_url
        assert "/register" in current_url or "/signup" in current_url, \
            f"Should remain on registration page after duplicate email error, but got: {current_url}"
    
    def test_register_short_password_blocked(self, driver):
        """
        TC-REG-05: Verify short password (< 6 characters) is rejected.
        
        Steps:
        1. Navigate to registration page
        2. Generate unique email
        3. Attempt to register with short password (3 characters)
        4. Submit form
        5. Verify error message is displayed or validation prevents submission
        
        Expected: Registration is blocked with short password
        """
        page = RegisterPage(driver).open()
        
        # Attempt to register with short password
        page.register(
            name="Test User",
            email=TestDataFactory.unique_email("shortpw"),
            password="123",  # Too short (< 6 characters)
            role="applicant"
        )
        
        # Wait for validation
        time.sleep(2)
        
        # Verify error message is displayed or still on registration page
        is_error_visible = page.is_visible(RegisterPage.ERROR_MSG, timeout=3)
        current_url = driver.current_url
        is_still_on_register = "/register" in current_url or "/signup" in current_url
        
        assert is_error_visible or is_still_on_register, \
            "Should show error or remain on registration page for short password"
    
    def test_register_missing_name_blocked(self, driver):
        """
        TC-REG-06: Verify missing name field shows validation error.
        
        Steps:
        1. Navigate to registration page
        2. Fill in email and password only (leave name empty)
        3. Submit form
        4. Verify validation prevents submission or shows error
        
        Expected: Registration is blocked when name field is empty
        """
        page = RegisterPage(driver).open()
        
        # Fill in only email and password, leave name empty
        page.type_text(RegisterPage.EMAIL_INPUT, TestDataFactory.unique_email("noname"))
        page.type_text(RegisterPage.PASSWORD_INPUT, "Test@1234")
        
        # Attempt to submit without name
        page.click(RegisterPage.SUBMIT_BTN)
        
        # Wait for validation
        time.sleep(2)
        
        # Verify we're still on registration page or error is shown
        current_url = driver.current_url
        is_still_on_register = "/register" in current_url or "/signup" in current_url
        is_error_visible = page.is_visible(RegisterPage.ERROR_MSG, timeout=3)
        
        assert is_still_on_register or is_error_visible, \
            "Should remain on registration page or show error when name is missing"
