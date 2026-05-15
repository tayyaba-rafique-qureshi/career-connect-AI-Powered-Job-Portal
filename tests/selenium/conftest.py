"""
pytest fixtures shared across all test files.
Sets up and tears down WebDriver, handles login sessions, and auto-captures screenshots on failure.
"""
import pytest
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.firefox.service import Service as FirefoxService
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from dotenv import load_dotenv
from utils.screenshot_helper import take_screenshot
from utils.db_helper import DBHelper

# Load environment variables from .env.test
load_dotenv("tests/selenium/.env.test")

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")
HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
BROWSER = os.getenv("BROWSER", "chrome").lower()
IMPLICIT_WAIT = int(os.getenv("IMPLICIT_WAIT", "10"))
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@careerconnect.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")


def get_chrome_driver():
    """
    Create and configure Chrome WebDriver with options optimized for CI/CD environments.
    
    Returns:
        webdriver.Chrome: Configured Chrome WebDriver instance
    """
    options = webdriver.ChromeOptions()
    
    # Headless mode for CI environments
    if HEADLESS:
        options.add_argument("--headless=new")  # Use new headless mode
    
    # Essential Chrome options for CI/CD (prevents crashes in containerized environments)
    options.add_argument("--no-sandbox")  # Bypass OS security model (required in Docker)
    options.add_argument("--disable-dev-shm-usage")  # Overcome limited resource problems
    options.add_argument("--disable-gpu")  # Disable GPU hardware acceleration
    
    # Window and display settings
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--start-maximized")
    
    # Performance and stability options
    options.add_argument("--disable-extensions")
    options.add_argument("--disable-notifications")
    options.add_argument("--disable-infobars")
    options.add_argument("--disable-blink-features=AutomationControlled")  # Hide automation flags
    
    # Logging and debugging
    options.add_experimental_option("excludeSwitches", ["enable-logging", "enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    
    # Additional stability options for CI
    options.add_argument("--disable-browser-side-navigation")
    options.add_argument("--disable-features=VizDisplayCompositor")
    
    # Create driver with webdriver-manager (auto-downloads correct ChromeDriver version)
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    
    return driver


def get_firefox_driver():
    """
    Create and configure Firefox WebDriver with options optimized for CI/CD environments.
    
    Returns:
        webdriver.Firefox: Configured Firefox WebDriver instance
    """
    options = webdriver.FirefoxOptions()
    
    # Headless mode for CI environments
    if HEADLESS:
        options.add_argument("--headless")
    
    # Window size settings
    options.add_argument("--width=1920")
    options.add_argument("--height=1080")
    
    # Disable notifications
    options.set_preference("dom.webnotifications.enabled", False)
    options.set_preference("dom.push.enabled", False)
    
    # Create driver with webdriver-manager (auto-downloads correct GeckoDriver version)
    service = FirefoxService(GeckoDriverManager().install())
    driver = webdriver.Firefox(service=service, options=options)
    
    return driver


@pytest.fixture(scope="function")
def driver():
    """
    Fresh browser instance per test function (function scope).
    
    This fixture creates a new WebDriver instance for each test function,
    ensuring complete test isolation. Use this for most tests.
    
    Yields:
        WebDriver: Selenium WebDriver instance (Chrome or Firefox based on BROWSER env var)
    """
    # Create driver based on BROWSER environment variable
    if BROWSER == "firefox":
        d = get_firefox_driver()
    else:  # Default to Chrome
        d = get_chrome_driver()
    
    # Set implicit wait timeout
    d.implicitly_wait(IMPLICIT_WAIT)
    
    # Set page load timeout
    d.set_page_load_timeout(30)
    
    yield d
    
    # Cleanup: quit browser after test
    try:
        d.quit()
    except Exception as e:
        print(f"Warning: Error closing driver: {e}")


@pytest.fixture(scope="class")
def class_driver(request):
    """
    Shared browser instance per test class (class scope).
    
    This fixture creates a single WebDriver instance shared across all tests
    in a test class. Use this for related tests that can share browser state
    for better performance. Tests must be designed to handle shared state.
    
    Usage:
        @pytest.mark.usefixtures("class_driver")
        class TestSuite:
            def test_one(self, class_driver):
                ...
    
    Yields:
        WebDriver: Selenium WebDriver instance (Chrome or Firefox based on BROWSER env var)
    """
    # Create driver based on BROWSER environment variable
    if BROWSER == "firefox":
        d = get_firefox_driver()
    else:  # Default to Chrome
        d = get_chrome_driver()
    
    # Set implicit wait timeout
    d.implicitly_wait(IMPLICIT_WAIT)
    
    # Set page load timeout
    d.set_page_load_timeout(30)
    
    # Store driver in class for access in tests
    request.cls.driver = d
    
    yield d
    
    # Cleanup: quit browser after all tests in class
    try:
        d.quit()
    except Exception as e:
        print(f"Warning: Error closing class driver: {e}")


@pytest.fixture(scope="session")
def admin_token():
    """
    Log in as admin once per test session and return the JWT token from localStorage.
    
    This fixture creates a temporary browser session, logs in as admin,
    extracts the JWT token from localStorage, and returns it. The token
    can be used in API tests or to set up authenticated browser sessions.
    
    Returns:
        str: JWT authentication token for admin user
    """
    # Create temporary driver for login
    if BROWSER == "firefox":
        temp_driver = get_firefox_driver()
    else:
        temp_driver = get_chrome_driver()
    
    temp_driver.implicitly_wait(IMPLICIT_WAIT)
    
    try:
        # Navigate to login page
        temp_driver.get(f"{BASE_URL}/login")
        
        # Wait for login form to load
        wait = WebDriverWait(temp_driver, 15)
        
        # Enter admin credentials
        email_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='email'], input[name='email']"))
        )
        email_input.clear()
        email_input.send_keys(ADMIN_EMAIL)
        
        password_input = temp_driver.find_element(By.CSS_SELECTOR, "input[type='password'], input[name='password']")
        password_input.clear()
        password_input.send_keys(ADMIN_PASSWORD)
        
        # Click login button
        login_button = temp_driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()
        
        # Wait for redirect to admin dashboard
        wait.until(EC.url_contains("/admin"))
        
        # Extract token from localStorage
        token = temp_driver.execute_script("return localStorage.getItem('token');")
        
        if not token:
            raise Exception("Failed to retrieve admin token from localStorage")
        
        return token
        
    finally:
        # Always cleanup temporary driver
        try:
            temp_driver.quit()
        except Exception as e:
            print(f"Warning: Error closing admin token driver: {e}")


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    pytest hook to capture screenshots automatically on test failure.
    
    This hook runs after each test and captures a screenshot if the test failed.
    Screenshots are saved to tests/selenium/reports/screenshots/ with a timestamp.
    
    Args:
        item: pytest test item
        call: pytest call info
    """
    # Execute the test
    outcome = yield
    rep = outcome.get_result()
    
    # Only capture screenshot on test failure during the "call" phase
    if rep.when == "call" and rep.failed:
        # Check if screenshot capture is enabled
        if os.getenv("SCREENSHOT_ON_FAIL", "true").lower() != "true":
            return
        
        # Try to get driver from test fixtures
        driver_instance = None
        if hasattr(item, "funcargs"):
            driver_instance = item.funcargs.get("driver") or item.funcargs.get("class_driver")
        
        # Capture screenshot if driver is available
        if driver_instance:
            try:
                # Generate test name from node ID (replace path separators and special chars)
                test_name = item.nodeid.replace("/", "_").replace("::", "_").replace("[", "_").replace("]", "_")
                take_screenshot(driver_instance, test_name)
                print(f"\n📸 Screenshot captured for failed test: {test_name}")
            except Exception as e:
                print(f"\n⚠️  Failed to capture screenshot: {e}")


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """
    Clean test data before and after the entire test session (session scope, autouse).
    
    This fixture automatically runs before any tests start and after all tests complete.
    It removes all test data (users, jobs, applications) with @testcareer.com emails
    from the test database to ensure a clean state.
    
    The autouse=True parameter means this fixture runs automatically without
    being explicitly requested in test functions.
    """
    print("\n🧹 Cleaning test data before test session...")
    try:
        DBHelper.clean_all_test_data()
        print("✅ Test data cleaned successfully")
    except Exception as e:
        print(f"⚠️  Warning: Failed to clean test data before session: {e}")
    
    # Run all tests
    yield
    
    # Cleanup after all tests complete
    print("\n🧹 Cleaning test data after test session...")
    try:
        DBHelper.clean_all_test_data()
        print("✅ Test data cleaned successfully")
    except Exception as e:
        print(f"⚠️  Warning: Failed to clean test data after session: {e}")
    
    # Close database connection
    try:
        DBHelper.close()
    except Exception as e:
        print(f"⚠️  Warning: Failed to close database connection: {e}")
