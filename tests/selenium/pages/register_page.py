from selenium.webdriver.common.by import By
from .base_page import BasePage

class RegisterPage(BasePage):
    NAME_INPUT = (By.CSS_SELECTOR, "input[name='name']")
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[name='email'], input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[name='password'], input[type='password']")
    ROLE_SELECT = (By.CSS_SELECTOR, "select[name='role'], select")
    SUBMIT_BTN = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MSG = (By.CSS_SELECTOR, "[class*='error'], [role='alert']")
    
    def open(self):
        super().open("/register")
        self.wait_for_page_ready()
        return self
    
    def register(self, name, email, password, role="applicant"):
        self.type_text(self.NAME_INPUT, name)
        self.type_text(self.EMAIL_INPUT, email)
        self.type_text(self.PASSWORD_INPUT, password)
        try:
            from selenium.webdriver.support.ui import Select
            select = Select(self.find(self.ROLE_SELECT))
            select.select_by_value(role)
        except:
            pass
        self.click(self.SUBMIT_BTN)
        return self
    
    def get_error(self):
        return self.get_text(self.ERROR_MSG)
