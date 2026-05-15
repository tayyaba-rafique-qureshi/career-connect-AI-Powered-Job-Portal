from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import os

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")

class BasePage:
    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 15)
        self.actions = ActionChains(driver)
    
    def open(self, path="/"):
        self.driver.get(f"{BASE_URL}{path}")
    
    def get_title(self):
        return self.driver.title
    
    def get_current_url(self):
        return self.driver.current_url
    
    def find(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))
    
    def click(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        element.click()
        return element
    
    def type_text(self, locator, text, clear=True):
        element = self.find(locator)
        if clear:
            element.clear()
        element.send_keys(text)
        return element
    
    def get_text(self, locator):
        return self.find(locator).text
    
    def is_visible(self, locator, timeout=5):
        try:
            WebDriverWait(self.driver, timeout).until(EC.visibility_of_element_located(locator))
            return True
        except:
            return False
    
    def wait_for_url(self, url_fragment, timeout=10):
        WebDriverWait(self.driver, timeout).until(EC.url_contains(url_fragment))
    
    def get_toast_message(self):
        toast = self.wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[class*='toast'], [role='alert'], [class*='Toast']")))
        return toast.text
    
    def scroll_to_element(self, element):
        self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
    
    def wait_for_page_ready(self):
        self.wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
