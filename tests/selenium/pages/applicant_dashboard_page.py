from selenium.webdriver.common.by import By
from .base_page import BasePage

class ApplicantDashboardPage(BasePage):
    JOB_CARDS = (By.CSS_SELECTOR, "[class*='JobCard'], [class*='job-card']")
    MY_JOBS_LINK = (By.XPATH, "//a[contains(@href,'/my-jobs')]")
    PROFILE_LINK = (By.XPATH, "//a[contains(@href,'/profile')]")
    NOTIFICATIONS_LINK = (By.XPATH, "//a[contains(@href,'/notifications')]")
    LOGOUT_BTN = (By.XPATH, "//button[contains(text(),'Logout')]")
    
    def open(self):
        super().open("/dashboard/applicant")
        self.wait_for_page_ready()
        return self
    
    def get_job_cards_count(self):
        return len(self.driver.find_elements(*self.JOB_CARDS))
    
    def navigate_to_my_jobs(self):
        self.click(self.MY_JOBS_LINK)
        self.wait_for_url("/my-jobs")
    
    def navigate_to_profile(self):
        self.click(self.PROFILE_LINK)
        self.wait_for_url("/profile")
    
    def logout(self):
        self.click(self.LOGOUT_BTN)
        self.wait_for_url("/login")
