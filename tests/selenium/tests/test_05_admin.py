"""
Admin Panel Tests
Covers: Admin dashboard, navigation, user management, job management
"""
import pytest
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.login_page import LoginPage
from pages.admin_dashboard_page import AdminDashboardPage
import time

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@careerconnect.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")

@pytest.mark.admin
@pytest.mark.smoke
class TestAdminPanel:
    
    def _login_admin(self, driver):
        """Helper to login as admin"""
        LoginPage(driver).open().login(ADMIN_EMAIL, ADMIN_PASSWORD)
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/admin"))
    
    def test_admin_dashboard_loads(self, driver):
        """TC-ADM-01: Admin dashboard loads successfully"""
        self._login_admin(driver)
        assert "/dashboard/admin" in driver.current_url
    
    def test_admin_dashboard_shows_stat_cards(self, driver):
        """TC-ADM-02: Admin dashboard displays statistics cards"""
        self._login_admin(driver)
        page = AdminDashboardPage(driver)
        time.sleep(1)
        card_count = page.get_stat_cards_count()
        assert card_count >= 1
    
    def test_admin_can_navigate_to_users(self, driver):
        """TC-ADM-03: Admin can navigate to users management"""
        self._login_admin(driver)
        page = AdminDashboardPage(driver)
        page.navigate_to_users()
        assert "/admin/users" in driver.current_url
    
    def test_admin_can_navigate_to_jobs(self, driver):
        """TC-ADM-04: Admin can navigate to jobs management"""
        self._login_admin(driver)
        page = AdminDashboardPage(driver)
        page.navigate_to_jobs()
        assert "/admin/jobs" in driver.current_url
    
    def test_admin_can_navigate_to_applications(self, driver):
        """TC-ADM-05: Admin can navigate to applications management"""
        self._login_admin(driver)
        page = AdminDashboardPage(driver)
        page.navigate_to_applications()
        assert "/admin/applications" in driver.current_url
    
    def test_admin_can_navigate_to_analytics(self, driver):
        """TC-ADM-06: Admin can navigate to analytics"""
        self._login_admin(driver)
        page = AdminDashboardPage(driver)
        page.navigate_to_analytics()
        assert "/admin/analytics" in driver.current_url
    
    def test_admin_can_navigate_to_settings(self, driver):
        """TC-ADM-07: Admin can navigate to settings"""
        self._login_admin(driver)
        page = AdminDashboardPage(driver)
        page.navigate_to_settings()
        assert "/admin/settings" in driver.current_url
    
    def test_admin_users_page_loads_table(self, driver):
        """TC-ADM-08: Admin users page displays user table"""
        self._login_admin(driver)
        driver.get(f"{BASE_URL}/dashboard/admin/users")
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table, [class*='table']")))
        assert True
    
    def test_admin_jobs_page_loads_table(self, driver):
        """TC-ADM-09: Admin jobs page displays job table"""
        self._login_admin(driver)
        driver.get(f"{BASE_URL}/dashboard/admin/jobs")
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table, [class*='table'], [class*='empty']")))
        assert True
    
    def test_admin_logout_works(self, driver):
        """TC-ADM-10: Admin can logout successfully"""
        self._login_admin(driver)
        page = AdminDashboardPage(driver)
        page.logout()
        assert "/login" in driver.current_url
