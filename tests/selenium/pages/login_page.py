from selenium.webdriver.common.by import By
from .base_page import BasePage

class LoginPage(BasePage):
    EMAIL_INPUT = (By.CSS_SELECTOR, "input[name='email'], input[type='email']")
    PASSWORD_INPUT = (By.CSS_SELECTOR, "input[name='password'], input[type='password']")
    SUBMIT_BTN = (By.CSS_SELECTOR, "button[type='submit']")
    ERROR_MSG = (By.CSS_SELECTOR, ".error-message, [class*='error'], [role='alert']")
    FORGOT_PASSWORD_LINK = (By.XPATH, "//a[contains(text(),'Forgot') or contains(text(),'forgot')]")
    REGISTER_LINK = (By.XPATH, "//a[contains(text(),'Register') or contains(text(),'Sign up')]")
    GOOGLE_BTN = (By.XPATH, "//button[contains(text(),'Google')]")
    
    def open(self):
        super().open("/login")
        self.wait_for_page_ready()
        return self
    
    def login(self, email, password):
        self.type_text(self.EMAIL_INPUT, email)
        self.type_text(self.PASSWORD_INPUT, password)
        self.click(self.SUBMIT_BTN)
        return self
    
    def get_error_message(self):
        return self.get_text(self.ERROR_MSG)
    
    def click_forgot_password(self):
        self.click(self.FORGOT_PASSWORD_LINK)
    
    def click_register_link(self):
        self.click(self.REGISTER_LINK)
    
    def is_on_login_page(self):
        return "/login" in self.get_current_url()
