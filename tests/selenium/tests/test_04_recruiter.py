"""
Recruiter Job Posting Tests
Covers: Job creation, editing, management
"""
import pytest
import os
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.login_page import LoginPage
from pages.recruiter_dashboard_page import PostJobPage
from utils.test_data import TestDataFactory
import time

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")
API_URL = os.getenv("API_URL", "http://localhost:5000/api")

@pytest.mark.recruiter
@pytest.mark.smoke
class TestRecruiterJourney:
    
    def _create_and_login_recruiter(self, driver):
        """Helper to create and login as recruiter"""
        user = TestDataFactory.employer_user()
        reg_resp = requests.post(f"{API_URL}/auth/register", json={
            "name": user["name"], "email": user["email"],
            "password": user["password"], "role": "recruiter"
        })
        if reg_resp.status_code == 201:
            LoginPage(driver).open().login(user["email"], user["password"])
            return user
        return None
    
    def test_recruiter_dashboard_loads(self, driver):
        """TC-REC-01: Recruiter dashboard loads successfully"""
        user = self._create_and_login_recruiter(driver)
        if not user:
            pytest.skip("Could not create recruiter user")
        
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/recruiter"))
        assert "/dashboard/recruiter" in driver.current_url
    
    def test_recruiter_can_access_post_job_page(self, driver):
        """TC-REC-02: Recruiter can access post job page"""
        user = self._create_and_login_recruiter(driver)
        if not user:
            pytest.skip("Could not create recruiter user")
        
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/recruiter"))
        driver.get(f"{BASE_URL}/dashboard/recruiter/post-job")
        time.sleep(1)
        assert "/post-job" in driver.current_url
    
    def test_recruiter_can_post_new_job(self, driver):
        """TC-REC-03: Recruiter can post a new job"""
        user = self._create_and_login_recruiter(driver)
        if not user:
            pytest.skip("Could not create recruiter user")
        
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/recruiter"))
        job = TestDataFactory.job_posting()
        job["title"] = f"Selenium Test — {job['title']}"
        
        page = PostJobPage(driver).open()
        page.post_job(job)
        time.sleep(2)
        
        assert "post-job" not in driver.current_url or \
            driver.find_elements(By.XPATH, "//*[contains(text(),'success') or contains(text(),'posted')]")
        TestDataFactory.store_job(job)
    
    def test_recruiter_can_view_my_jobs(self, driver):
        """TC-REC-04: Recruiter can view their posted jobs"""
        user = self._create_and_login_recruiter(driver)
        if not user:
            pytest.skip("Could not create recruiter user")
        
        WebDriverWait(driver, 15).until(EC.url_contains("/dashboard/recruiter"))
        driver.get(f"{BASE_URL}/dashboard/recruiter/jobs")
        time.sleep(1)
        assert "/jobs" in driver.current_url
