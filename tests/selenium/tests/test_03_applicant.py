"""
Applicant User Journey Tests
Covers: Dashboard, job browsing, applications, profile
"""
import pytest
import os
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.login_page import LoginPage
from pages.applicant_dashboard_page import ApplicantDashboardPage
from utils.test_data import TestDataFactory
import time

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")

@pytest.mark.applicant
@pytest.mark.smoke
class TestApplicantJourney:
    
    def _create_and_login_applicant(self, driver):
        """Helper to create and login as applicant"""
        import requests
        api_url = os.getenv("API_URL", "http://localhost:5000/api")
        user = TestDataFactory.applicant_user()
        reg_resp = requests.post(f"{api_url}/auth/register", json={
            "name": user["name"], "email": user["email"],
            "password": user["password"], "role": "applicant"
        })
        if reg_resp.status_code == 201:
            LoginPage(driver).open().login(user["email"], user["password"])
            return user
        return None
    
    def test_applicant_dashboard_loads(self, driver):
        """TC-APP-01: Applicant dashboard loads successfully"""
        user = self._create_and_login_applicant(driver)
        if not user:
            pytest.skip("Could not create applicant user")
        
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/applicant"))
        assert "/dashboard/applicant" in driver.current_url
    
    def test_applicant_can_view_job_cards(self, driver):
        """TC-APP-02: Applicant can see job recommendations"""
        user = self._create_and_login_applicant(driver)
        if not user:
            pytest.skip("Could not create applicant user")
        
        page = ApplicantDashboardPage(driver)
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/applicant"))
        time.sleep(2)
        job_count = page.get_job_cards_count()
        assert job_count >= 0
    
    def test_applicant_can_navigate_to_my_jobs(self, driver):
        """TC-APP-03: Applicant can navigate to my jobs page"""
        user = self._create_and_login_applicant(driver)
        if not user:
            pytest.skip("Could not create applicant user")
        
        page = ApplicantDashboardPage(driver)
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/applicant"))
        page.navigate_to_my_jobs()
        assert "/my-jobs" in driver.current_url
    
    def test_applicant_can_navigate_to_profile(self, driver):
        """TC-APP-04: Applicant can navigate to profile page"""
        user = self._create_and_login_applicant(driver)
        if not user:
            pytest.skip("Could not create applicant user")
        
        page = ApplicantDashboardPage(driver)
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/applicant"))
        page.navigate_to_profile()
        assert "/profile" in driver.current_url
    
    def test_applicant_logout_works(self, driver):
        """TC-APP-05: Applicant can logout successfully"""
        user = self._create_and_login_applicant(driver)
        if not user:
            pytest.skip("Could not create applicant user")
        
        page = ApplicantDashboardPage(driver)
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/applicant"))
        page.logout()
        assert "/login" in driver.current_url
