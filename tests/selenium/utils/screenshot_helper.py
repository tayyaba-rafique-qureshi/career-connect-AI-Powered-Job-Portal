import os
import time
from datetime import datetime

SCREENSHOT_DIR = "tests/selenium/reports/screenshots"

def take_screenshot(driver, test_name, reason="failure"):
    """Save a screenshot with timestamp. Called automatically on test failure."""
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{SCREENSHOT_DIR}/{reason}_{test_name}_{timestamp}.png"
    driver.save_screenshot(filename)
    print(f"\n[Screenshot saved] {filename}")
    return filename
