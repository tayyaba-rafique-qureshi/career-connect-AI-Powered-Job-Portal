from selenium.webdriver.common.by import By
from .base_page import BasePage

class PostJobPage(BasePage):
    TITLE_INPUT = (By.CSS_SELECTOR, "input[name='title']")
    COMPANY_INPUT = (By.CSS_SELECTOR, "input[name='company']")
    LOCATION_INPUT = (By.CSS_SELECTOR, "input[name='location']")
    DESCRIPTION_TEXTAREA = (By.CSS_SELECTOR, "textarea[name='description'], textarea")
    SUBMIT_BTN = (By.CSS_SELECTOR, "button[type='submit']")
    SUCCESS_MSG = (By.XPATH, "//*[contains(text(),'posted') or contains(text(),'success') or contains(text(),'created')]")
    
    def open(self):
        super().open("/dashboard/recruiter/post-job")
        self.wait_for_page_ready()
        return self
    
    def fill_job_form(self, job_data):
        self.type_text(self.TITLE_INPUT, job_data["title"])
        try:
            self.type_text(self.COMPANY_INPUT, job_data["company"])
        except:
            pass
        self.type_text(self.LOCATION_INPUT, job_data.get("location", "Islamabad, PK"))
        self.type_text(self.DESCRIPTION_TEXTAREA, job_data["description"])
    
    def submit(self):
        self.click(self.SUBMIT_BTN)
    
    def post_job(self, job_data):
        self.fill_job_form(job_data)
        self.submit()
