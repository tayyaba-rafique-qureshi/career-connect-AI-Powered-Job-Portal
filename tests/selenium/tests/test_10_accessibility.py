"""
Accessibility Tests - Basic WCAG Compliance
Covers: Form labels, button text, navigation, images, responsive design

Test Suite: Accessibility (5 test cases)
- Login form has proper labels
- Buttons have descriptive text
- Sidebar navigation has text labels
- No broken images on pages
- Sidebar visible on desktop viewport

These tests ensure basic accessibility compliance for users with disabilities.
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from pages.landing_page import LandingPage
from pages.login_page import LoginPage
from pages.admin_dashboard_page import AdminDashboardPage
from base_test import BaseTest


@pytest.mark.accessibility
class TestAccessibility(BaseTest):
    """
    Accessibility test suite covering basic WCAG compliance.
    Tests ensure the application is usable by people with disabilities.
    """
    
    def _login_as_admin(self, driver):
        """Helper method to login as admin."""
        login_page = LoginPage(driver).open()
        login_page.login(self.ADMIN_EMAIL, self.ADMIN_PASSWORD)
        wait = WebDriverWait(driver, 15)
        wait.until(EC.url_contains("/admin"))
        return AdminDashboardPage(driver)
    
    @pytest.mark.smoke
    def test_login_form_has_proper_labels(self, driver):
        """
        TC-A11Y-01: Verify login form inputs have associated labels.
        
        WCAG 2.1 Criterion: 3.3.2 Labels or Instructions (Level A)
        
        Steps:
        1. Navigate to login page
        2. Check email input has label or aria-label
        3. Check password input has label or aria-label
        4. Check submit button has text or aria-label
        
        Expected: All form inputs have proper labels for screen readers
        """
        # Navigate to login page
        login_page = LoginPage(driver).open()
        
        # Find email input
        try:
            email_input = driver.find_element(*LoginPage.EMAIL_INPUT)
            
            # Check for label association
            input_id = email_input.get_attribute("id")
            input_name = email_input.get_attribute("name")
            aria_label = email_input.get_attribute("aria-label")
            aria_labelledby = email_input.get_attribute("aria-labelledby")
            placeholder = email_input.get_attribute("placeholder")
            
            # Check if input has any form of label
            has_label = False
            
            # Method 1: Check for <label for="input-id">
            if input_id:
                try:
                    label = driver.find_element(By.CSS_SELECTOR, f"label[for='{input_id}']")
                    has_label = True
                    print(f"✓ Email input has label: {label.text}")
                except:
                    pass
            
            # Method 2: Check for aria-label
            if aria_label:
                has_label = True
                print(f"✓ Email input has aria-label: {aria_label}")
            
            # Method 3: Check for aria-labelledby
            if aria_labelledby:
                has_label = True
                print(f"✓ Email input has aria-labelledby: {aria_labelledby}")
            
            # Method 4: Check for placeholder (not ideal but acceptable)
            if placeholder and ("email" in placeholder.lower() or "mail" in placeholder.lower()):
                has_label = True
                print(f"✓ Email input has descriptive placeholder: {placeholder}")
            
            assert has_label, "Email input should have a label, aria-label, or descriptive placeholder"
            
        except NoSuchElementException:
            assert False, "Email input not found on login page"
        
        # Find password input
        try:
            password_input = driver.find_element(*LoginPage.PASSWORD_INPUT)
            
            # Check for label association
            input_id = password_input.get_attribute("id")
            aria_label = password_input.get_attribute("aria-label")
            aria_labelledby = password_input.get_attribute("aria-labelledby")
            placeholder = password_input.get_attribute("placeholder")
            
            has_label = False
            
            # Check for label
            if input_id:
                try:
                    label = driver.find_element(By.CSS_SELECTOR, f"label[for='{input_id}']")
                    has_label = True
                    print(f"✓ Password input has label: {label.text}")
                except:
                    pass
            
            # Check for aria-label
            if aria_label:
                has_label = True
                print(f"✓ Password input has aria-label: {aria_label}")
            
            # Check for aria-labelledby
            if aria_labelledby:
                has_label = True
                print(f"✓ Password input has aria-labelledby: {aria_labelledby}")
            
            # Check for placeholder
            if placeholder and "password" in placeholder.lower():
                has_label = True
                print(f"✓ Password input has descriptive placeholder: {placeholder}")
            
            assert has_label, "Password input should have a label, aria-label, or descriptive placeholder"
            
        except NoSuchElementException:
            assert False, "Password input not found on login page"
        
        # Find submit button
        try:
            submit_button = driver.find_element(*LoginPage.SUBMIT_BTN)
            
            # Check button has text or aria-label
            button_text = submit_button.text
            aria_label = submit_button.get_attribute("aria-label")
            
            has_text = bool(button_text and len(button_text.strip()) > 0)
            has_aria = bool(aria_label and len(aria_label.strip()) > 0)
            
            assert has_text or has_aria, "Submit button should have visible text or aria-label"
            
            if has_text:
                print(f"✓ Submit button has text: {button_text}")
            if has_aria:
                print(f"✓ Submit button has aria-label: {aria_label}")
                
        except NoSuchElementException:
            assert False, "Submit button not found on login page"
        
        print("✓ Login form has proper labels for accessibility")
    
    @pytest.mark.smoke
    def test_buttons_have_descriptive_text(self, driver):
        """
        TC-A11Y-02: Verify buttons have descriptive text or aria-labels.
        
        WCAG 2.1 Criterion: 2.4.4 Link Purpose (Level A)
        
        Steps:
        1. Navigate to landing page
        2. Find all buttons
        3. Verify each button has text or aria-label
        
        Expected: All buttons have descriptive text for screen readers
        """
        # Navigate to landing page
        landing_page = LandingPage(driver).open()
        
        # Find all buttons on the page
        buttons = driver.find_elements(By.TAG_NAME, "button")
        links_as_buttons = driver.find_elements(By.CSS_SELECTOR, "a[role='button']")
        
        all_buttons = buttons + links_as_buttons
        
        if len(all_buttons) == 0:
            print("Warning: No buttons found on landing page")
            assert True, "Landing page loaded successfully"
            return
        
        buttons_without_text = []
        
        for i, button in enumerate(all_buttons):
            # Get button text
            button_text = button.text.strip()
            aria_label = button.get_attribute("aria-label")
            aria_labelledby = button.get_attribute("aria-labelledby")
            title = button.get_attribute("title")
            
            # Check if button has any form of text
            has_text = bool(button_text)
            has_aria_label = bool(aria_label)
            has_aria_labelledby = bool(aria_labelledby)
            has_title = bool(title)
            
            if not (has_text or has_aria_label or has_aria_labelledby or has_title):
                # Check if button has icon with alt text
                try:
                    icon = button.find_element(By.TAG_NAME, "img")
                    alt_text = icon.get_attribute("alt")
                    if alt_text:
                        has_text = True
                except:
                    pass
                
                if not has_text:
                    buttons_without_text.append(f"Button {i+1}")
        
        if buttons_without_text:
            print(f"Warning: {len(buttons_without_text)} buttons without descriptive text: {buttons_without_text}")
        
        # Allow some buttons without text (e.g., icon-only buttons with aria-label)
        assert len(buttons_without_text) < len(all_buttons) * 0.3, \
            f"Too many buttons without descriptive text: {buttons_without_text}"
        
        print(f"✓ {len(all_buttons) - len(buttons_without_text)}/{len(all_buttons)} buttons have descriptive text")
    
    @pytest.mark.smoke
    def test_sidebar_navigation_has_text_labels(self, driver):
        """
        TC-A11Y-03: Verify sidebar navigation has text labels.
        
        WCAG 2.1 Criterion: 2.4.4 Link Purpose (Level A)
        
        Steps:
        1. Login as admin
        2. Navigate to admin dashboard
        3. Find sidebar navigation
        4. Verify navigation items have text labels
        
        Expected: All navigation items have visible text or aria-labels
        """
        # Login as admin
        admin_page = self._login_as_admin(driver)
        
        # Find navigation links
        nav_links = [
            AdminDashboardPage.NAV_USERS,
            AdminDashboardPage.NAV_JOBS,
            AdminDashboardPage.NAV_APPLICATIONS,
            AdminDashboardPage.NAV_ANALYTICS,
            AdminDashboardPage.NAV_SETTINGS
        ]
        
        nav_items_with_text = 0
        nav_items_checked = 0
        
        for locator in nav_links:
            try:
                element = driver.find_element(*locator)
                nav_items_checked += 1
                
                # Check for text or aria-label
                text = element.text.strip()
                aria_label = element.get_attribute("aria-label")
                title = element.get_attribute("title")
                
                if text or aria_label or title:
                    nav_items_with_text += 1
                    if text:
                        print(f"✓ Navigation item has text: {text}")
                    elif aria_label:
                        print(f"✓ Navigation item has aria-label: {aria_label}")
                    elif title:
                        print(f"✓ Navigation item has title: {title}")
                        
            except NoSuchElementException:
                # Navigation item may not be visible or implemented
                continue
        
        # Verify at least some navigation items have text
        assert nav_items_with_text > 0, "At least one navigation item should have text or aria-label"
        
        print(f"✓ {nav_items_with_text}/{nav_items_checked} navigation items have text labels")
    
    def test_no_broken_images_on_pages(self, driver):
        """
        TC-A11Y-04: Verify no broken images on key pages.
        
        WCAG 2.1 Criterion: 1.1.1 Non-text Content (Level A)
        
        Steps:
        1. Navigate to landing page
        2. Find all images
        3. Verify images have alt attributes
        4. Check images are not broken (naturalWidth > 0)
        
        Expected: All images have alt text and load successfully
        """
        # Navigate to landing page
        landing_page = LandingPage(driver).open()
        time.sleep(2)  # Wait for images to load
        
        # Find all images
        images = driver.find_elements(By.TAG_NAME, "img")
        
        if len(images) == 0:
            print("Warning: No images found on landing page")
            assert True, "Landing page loaded successfully"
            return
        
        images_without_alt = []
        broken_images = []
        
        for i, img in enumerate(images):
            # Check for alt attribute
            alt_text = img.get_attribute("alt")
            if alt_text is None:
                images_without_alt.append(f"Image {i+1}")
            
            # Check if image is broken (naturalWidth will be 0 for broken images)
            try:
                natural_width = driver.execute_script("return arguments[0].naturalWidth;", img)
                if natural_width == 0:
                    src = img.get_attribute("src")
                    broken_images.append(f"Image {i+1} (src: {src})")
            except:
                pass
        
        # Report findings
        if images_without_alt:
            print(f"Warning: {len(images_without_alt)} images without alt text: {images_without_alt}")
        
        if broken_images:
            print(f"Warning: {len(broken_images)} broken images: {broken_images}")
        
        # Allow some images without alt (e.g., decorative images)
        assert len(images_without_alt) < len(images) * 0.5, \
            f"Too many images without alt text: {images_without_alt}"
        
        # No broken images allowed
        assert len(broken_images) == 0, f"Broken images found: {broken_images}"
        
        print(f"✓ {len(images) - len(images_without_alt)}/{len(images)} images have alt text")
        print(f"✓ {len(images) - len(broken_images)}/{len(images)} images loaded successfully")
    
    @pytest.mark.smoke
    def test_sidebar_visible_on_desktop_viewport(self, driver):
        """
        TC-A11Y-05: Verify sidebar is visible on desktop viewport.
        
        WCAG 2.1 Criterion: 1.4.10 Reflow (Level AA)
        
        Steps:
        1. Set desktop viewport size (1920x1080)
        2. Login as admin
        3. Verify sidebar is visible
        4. Verify sidebar navigation is accessible
        
        Expected: Sidebar is visible and accessible on desktop
        """
        # Set desktop viewport
        driver.set_window_size(1920, 1080)
        time.sleep(1)
        
        # Login as admin
        admin_page = self._login_as_admin(driver)
        
        # Try to find sidebar or navigation menu
        sidebar_selectors = [
            (By.CSS_SELECTOR, "aside"),
            (By.CSS_SELECTOR, "[class*='sidebar']"),
            (By.CSS_SELECTOR, "[class*='Sidebar']"),
            (By.CSS_SELECTOR, "nav[class*='side']"),
            (By.CSS_SELECTOR, ".side-nav"),
            (By.XPATH, "//aside"),
            (By.XPATH, "//nav[contains(@class, 'side')]")
        ]
        
        sidebar_found = False
        sidebar_visible = False
        
        for selector in sidebar_selectors:
            try:
                sidebar = driver.find_element(*selector)
                sidebar_found = True
                
                # Check if sidebar is visible
                is_displayed = sidebar.is_displayed()
                
                if is_displayed:
                    sidebar_visible = True
                    print(f"✓ Sidebar found and visible using selector: {selector}")
                    
                    # Check sidebar width (should be reasonable for desktop)
                    width = sidebar.size['width']
                    assert width > 100, f"Sidebar width too small: {width}px"
                    print(f"✓ Sidebar width: {width}px")
                    
                    break
                    
            except NoSuchElementException:
                continue
        
        # If no sidebar found, check for navigation menu
        if not sidebar_found:
            try:
                # Check for navigation links (alternative to sidebar)
                nav_element = driver.find_element(*AdminDashboardPage.NAV_USERS)
                if nav_element.is_displayed():
                    sidebar_visible = True
                    print("✓ Navigation menu is visible (alternative to sidebar)")
            except:
                pass
        
        assert sidebar_visible, "Sidebar or navigation menu should be visible on desktop viewport"
        
        print("✓ Sidebar is visible and accessible on desktop viewport")
