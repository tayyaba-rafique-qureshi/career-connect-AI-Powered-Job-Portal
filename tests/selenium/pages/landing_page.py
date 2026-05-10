from selenium.webdriver.common.by import By
from .base_page import BasePage

class LandingPage(BasePage):
    LOGIN_LINK = (By.XPATH, "//a[contains(@href,'/login') or contains(text(),'Login') or contains(text(),'Sign in')]")
    REGISTER_LINK = (By.XPATH, "//a[contains(@href,'/register') or contains(text(),'Register') or contains(text(),'Sign up')]")
    HERO_SECTION = (By.CSS_SELECTOR, "[class*='hero'], [class*='Hero']")
    JOB_SEARCH = (By.CSS_SELECTOR, "input[placeholder*='Search'], input[placeholder*='job']")
    
    def open(self):
        super().open("/")
        self.wait_for_page_ready()
        return self
    
    def click_login(self):
        self.click(self.LOGIN_LINK)
        self.wait_for_url("/login")
    
    def click_register(self):
        self.click(self.REGISTER_LINK)
        self.wait_for_url("/register")
    
    def is_hero_visible(self):
        return self.is_visible(self.HERO_SECTION)
