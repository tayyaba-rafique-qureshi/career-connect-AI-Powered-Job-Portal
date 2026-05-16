from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
import time

class WaitHelpers:
    def __init__(self, driver, timeout=15):
        self.driver = driver
        self.wait = WebDriverWait(driver, timeout)
    
    def wait_for_element(self, locator):
        return self.wait.until(EC.presence_of_element_located(locator))
    
    def wait_for_clickable(self, locator):
        return self.wait.until(EC.element_to_be_clickable(locator))
    
    def wait_for_url_contains(self, text):
        self.wait.until(EC.url_contains(text))
    
    def wait_for_text_present(self, text):
        self.wait.until(EC.presence_of_element_located(
            (By.XPATH, f"//*[contains(text(),'{text}')]")))
    
    def wait_for_toast(self):
        """Wait for a toast notification to appear"""
        return self.wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[class*='toast'], [role='alert'], [class*='Toast']")))
    
    def wait_for_table_rows(self, min_rows=1):
        """Wait until a table has at least min_rows rows"""
        self.wait.until(lambda d: len(d.find_elements(By.CSS_SELECTOR, "tbody tr")) >= min_rows)
    
    def wait_for_modal(self):
        return self.wait.until(EC.presence_of_element_located(
            (By.CSS_SELECTOR, "[role='dialog'], .modal, [class*='Modal']")))
    
    def wait_for_spinner_gone(self):
        """Wait until loading spinner disappears"""
        try:
            self.wait.until(EC.invisibility_of_element_located(
                (By.CSS_SELECTOR, "[class*='spinner'], [class*='loading'], [class*='Loader']")))
        except:
            pass
    
    def wait_for_page_load(self):
        """Wait until document.readyState is complete"""
        self.wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
