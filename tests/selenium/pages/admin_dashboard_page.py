from selenium.webdriver.common.by import By
from .base_page import BasePage

class AdminDashboardPage(BasePage):
    NAV_USERS = (By.XPATH, "//a[contains(@href,'/admin/users')]")
    NAV_JOBS = (By.XPATH, "//a[contains(@href,'/admin/jobs')]")
    NAV_APPLICATIONS = (By.XPATH, "//a[contains(@href,'/admin/applications')]")
    NAV_ANALYTICS = (By.XPATH, "//a[contains(@href,'/admin/analytics')]")
    NAV_SETTINGS = (By.XPATH, "//a[contains(@href,'/admin/settings')]")
    NAV_ANNOUNCEMENTS = (By.XPATH, "//a[contains(@href,'/admin/announcements')]")
    NAV_AUDIT_LOGS = (By.XPATH, "//a[contains(@href,'/admin/audit-logs')]")
    LOGOUT_BTN = (By.XPATH, "//button[contains(text(),'Logout')]")
    STAT_CARDS = (By.CSS_SELECTOR, "[class*='StatCard'], [class*='stat-card'], [class*='card']")
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[placeholder*='Search'], header input")
    
    def open(self):
        super().open("/dashboard/admin")
        self.wait_for_page_ready()
        return self
    
    def navigate_to_users(self):
        self.click(self.NAV_USERS)
        self.wait_for_url("/admin/users")
    
    def navigate_to_jobs(self):
        self.click(self.NAV_JOBS)
        self.wait_for_url("/admin/jobs")
    
    def navigate_to_applications(self):
        self.click(self.NAV_APPLICATIONS)
        self.wait_for_url("/admin/applications")
    
    def navigate_to_analytics(self):
        self.click(self.NAV_ANALYTICS)
        self.wait_for_url("/admin/analytics")
    
    def navigate_to_settings(self):
        self.click(self.NAV_SETTINGS)
        self.wait_for_url("/admin/settings")
    
    def logout(self):
        self.click(self.LOGOUT_BTN)
        self.wait_for_url("/login")
    
    def get_stat_cards_count(self):
        return len(self.driver.find_elements(*self.STAT_CARDS))
    
    def search(self, query):
        self.type_text(self.SEARCH_INPUT, query)


class AdminUsersPage(BasePage):
    """
    Page Object for Admin Users Management page.
    Handles user search, filtering, pagination, and user actions.
    """
    
    # Locators
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[placeholder*='Search'], input[placeholder*='search'], input[name='search']")
    ROLE_FILTER = (By.CSS_SELECTOR, "select[name='role'], select")
    STATUS_FILTER = (By.CSS_SELECTOR, "select[name='status']")
    TABLE_ROWS = (By.CSS_SELECTOR, "tbody tr, [class*='table'] [class*='row']:not([class*='header'])")
    TABLE_HEADERS = (By.CSS_SELECTOR, "thead th, [class*='table'] [class*='header']")
    PAGINATION_NEXT = (By.XPATH, "//button[contains(text(),'Next')]")
    PAGINATION_PREV = (By.XPATH, "//button[contains(text(),'Previous')]")
    EXPORT_BTN = (By.XPATH, "//button[contains(text(),'Export')]")
    ADD_USER_BTN = (By.XPATH, "//button[contains(text(),'Add User')]")
    
    def open(self):
        """Navigate to admin users page."""
        super().open("/dashboard/admin/users")
        self.wait_for_page_ready()
        return self
    
    def search_user(self, query):
        """
        Search for users by name or email.
        
        Args:
            query: Search term (name or email)
        """
        try:
            self.type_text(self.SEARCH_INPUT, query)
            import time
            time.sleep(0.5)  # Wait for search to filter results
        except Exception as e:
            print(f"Warning: Could not perform search: {e}")
    
    def filter_by_role(self, role):
        """
        Filter users by role.
        
        Args:
            role: Role to filter by (e.g., 'admin', 'employer', 'applicant')
        """
        try:
            from selenium.webdriver.support.ui import Select
            select_element = self.find(self.ROLE_FILTER)
            select = Select(select_element)
            
            # Try to select by value first, then by visible text
            try:
                select.select_by_value(role)
            except:
                select.select_by_visible_text(role.capitalize())
                
            import time
            time.sleep(0.5)  # Wait for filter to apply
        except Exception as e:
            print(f"Warning: Could not filter by role: {e}")
    
    def get_row_count(self):
        """
        Get the number of user rows in the table.
        
        Returns:
            int: Number of user rows
        """
        try:
            rows = self.driver.find_elements(*self.TABLE_ROWS)
            return len(rows)
        except Exception as e:
            print(f"Warning: Could not count table rows: {e}")
            return 0
    
    def get_user_row(self, index=0):
        """
        Get a specific user row by index.
        
        Args:
            index: Row index (0-based)
            
        Returns:
            WebElement: The row element, or None if not found
        """
        try:
            rows = self.driver.find_elements(*self.TABLE_ROWS)
            if index < len(rows):
                return rows[index]
            return None
        except Exception as e:
            print(f"Warning: Could not get user row: {e}")
            return None
    
    def get_action_menu(self, row_index=0):
        """
        Open the action menu for a specific user row.
        
        Args:
            row_index: Index of the user row (0-based)
        """
        try:
            rows = self.driver.find_elements(*self.TABLE_ROWS)
            if row_index < len(rows):
                row = rows[row_index]
                
                # Try multiple selectors for action button
                action_selectors = [
                    (By.CSS_SELECTOR, "button[aria-label*='action']"),
                    (By.CSS_SELECTOR, "button[aria-label*='menu']"),
                    (By.CSS_SELECTOR, "button[aria-label*='more']"),
                    (By.CSS_SELECTOR, "button:last-child"),
                    (By.XPATH, ".//button[contains(@class, 'action')]"),
                    (By.XPATH, ".//button[last()]")
                ]
                
                for selector in action_selectors:
                    try:
                        action_btn = row.find_element(*selector)
                        action_btn.click()
                        import time
                        time.sleep(0.5)  # Wait for menu to open
                        return
                    except:
                        continue
                
                print("Warning: Could not find action button in row")
        except Exception as e:
            print(f"Warning: Could not open action menu: {e}")
    
    def click_edit_user(self, row_index=0):
        """
        Click edit button for a specific user.
        
        Args:
            row_index: Index of the user row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            edit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(),'Edit')]")
            edit_btn.click()
        except Exception as e:
            print(f"Warning: Could not click edit button: {e}")
    
    def click_delete_user(self, row_index=0):
        """
        Click delete button for a specific user.
        
        Args:
            row_index: Index of the user row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            delete_btn = self.driver.find_element(By.XPATH, "//button[contains(text(),'Delete')]")
            delete_btn.click()
        except Exception as e:
            print(f"Warning: Could not click delete button: {e}")
    
    def click_ban_user(self, row_index=0):
        """
        Click ban/suspend button for a specific user.
        
        Args:
            row_index: Index of the user row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            ban_selectors = [
                (By.XPATH, "//button[contains(text(),'Ban')]"),
                (By.XPATH, "//button[contains(text(),'Suspend')]"),
                (By.XPATH, "//button[contains(text(),'Deactivate')]")
            ]
            
            for selector in ban_selectors:
                try:
                    ban_btn = self.driver.find_element(*selector)
                    ban_btn.click()
                    return
                except:
                    continue
                    
            print("Warning: Could not find ban button")
        except Exception as e:
            print(f"Warning: Could not click ban button: {e}")
    
    def is_user_in_list(self, email):
        """
        Check if a user with specific email is in the list.
        
        Args:
            email: User email to search for
            
        Returns:
            bool: True if user is found, False otherwise
        """
        try:
            page_source = self.driver.page_source
            return email in page_source
        except Exception as e:
            print(f"Warning: Could not check if user is in list: {e}")
            return False
    
    def get_pagination_info(self):
        """
        Get pagination information.
        
        Returns:
            dict: Pagination info with current_page, total_pages, etc.
        """
        try:
            # Try to find pagination text like "Page 1 of 5" or "1-10 of 50"
            pagination_text = self.driver.find_element(
                By.XPATH, 
                "//*[contains(text(),'Page') or contains(text(),'of')]"
            ).text
            return {"text": pagination_text}
        except:
            return {"text": "No pagination info"}
    
    def click_next_page(self):
        """Click next page button in pagination."""
        try:
            self.click(self.PAGINATION_NEXT)
            import time
            time.sleep(1)  # Wait for page to load
        except Exception as e:
            print(f"Warning: Could not click next page: {e}")
    
    def click_previous_page(self):
        """Click previous page button in pagination."""
        try:
            self.click(self.PAGINATION_PREV)
            import time
            time.sleep(1)  # Wait for page to load
        except Exception as e:
            print(f"Warning: Could not click previous page: {e}")
    
    def export_users(self):
        """Click export button to download users list."""
        try:
            self.click(self.EXPORT_BTN)
        except Exception as e:
            print(f"Warning: Could not click export button: {e}")
