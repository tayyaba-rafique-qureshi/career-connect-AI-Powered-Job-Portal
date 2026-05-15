from selenium.webdriver.common.by import By
from .base_page import BasePage


class AdminJobsPage(BasePage):
    """
    Page Object for Admin Jobs Management page.
    Handles job search, filtering, pagination, and job actions.
    """
    
    # Locators
    SEARCH_INPUT = (By.CSS_SELECTOR, "input[placeholder*='Search'], input[placeholder*='search'], input[name='search']")
    STATUS_FILTER = (By.CSS_SELECTOR, "select[name='status'], select")
    COMPANY_FILTER = (By.CSS_SELECTOR, "select[name='company']")
    TABLE_ROWS = (By.CSS_SELECTOR, "tbody tr, [class*='table'] [class*='row']:not([class*='header'])")
    TABLE_HEADERS = (By.CSS_SELECTOR, "thead th, [class*='table'] [class*='header']")
    PAGINATION_NEXT = (By.XPATH, "//button[contains(text(),'Next')]")
    PAGINATION_PREV = (By.XPATH, "//button[contains(text(),'Previous')]")
    EXPORT_BTN = (By.XPATH, "//button[contains(text(),'Export')]")
    ADD_JOB_BTN = (By.XPATH, "//button[contains(text(),'Add Job')]")
    
    def open(self):
        """Navigate to admin jobs page."""
        super().open("/dashboard/admin/jobs")
        self.wait_for_page_ready()
        return self
    
    def search_job(self, query):
        """
        Search for jobs by title or company.
        
        Args:
            query: Search term (job title or company name)
        """
        try:
            self.type_text(self.SEARCH_INPUT, query)
            import time
            time.sleep(0.5)  # Wait for search to filter results
        except Exception as e:
            print(f"Warning: Could not perform search: {e}")
    
    def filter_by_status(self, status):
        """
        Filter jobs by status.
        
        Args:
            status: Status to filter by (e.g., 'active', 'closed', 'pending')
        """
        try:
            from selenium.webdriver.support.ui import Select
            select_element = self.find(self.STATUS_FILTER)
            select = Select(select_element)
            
            # Try to select by value first, then by visible text
            try:
                select.select_by_value(status)
            except:
                select.select_by_visible_text(status.capitalize())
                
            import time
            time.sleep(0.5)  # Wait for filter to apply
        except Exception as e:
            print(f"Warning: Could not filter by status: {e}")
    
    def get_row_count(self):
        """
        Get the number of job rows in the table.
        
        Returns:
            int: Number of job rows
        """
        try:
            rows = self.driver.find_elements(*self.TABLE_ROWS)
            return len(rows)
        except Exception as e:
            print(f"Warning: Could not count table rows: {e}")
            return 0
    
    def get_job_row(self, index=0):
        """
        Get a specific job row by index.
        
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
            print(f"Warning: Could not get job row: {e}")
            return None
    
    def get_action_menu(self, row_index=0):
        """
        Open the action menu for a specific job row.
        
        Args:
            row_index: Index of the job row (0-based)
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
    
    def click_view_job(self, row_index=0):
        """
        Click view button for a specific job.
        
        Args:
            row_index: Index of the job row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            view_btn = self.driver.find_element(By.XPATH, "//button[contains(text(),'View')]")
            view_btn.click()
        except Exception as e:
            print(f"Warning: Could not click view button: {e}")
    
    def click_edit_job(self, row_index=0):
        """
        Click edit button for a specific job.
        
        Args:
            row_index: Index of the job row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            edit_btn = self.driver.find_element(By.XPATH, "//button[contains(text(),'Edit')]")
            edit_btn.click()
        except Exception as e:
            print(f"Warning: Could not click edit button: {e}")
    
    def click_delete_job(self, row_index=0):
        """
        Click delete button for a specific job.
        
        Args:
            row_index: Index of the job row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            delete_btn = self.driver.find_element(By.XPATH, "//button[contains(text(),'Delete')]")
            delete_btn.click()
        except Exception as e:
            print(f"Warning: Could not click delete button: {e}")
    
    def click_approve_job(self, row_index=0):
        """
        Click approve button for a specific job.
        
        Args:
            row_index: Index of the job row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            approve_btn = self.driver.find_element(By.XPATH, "//button[contains(text(),'Approve')]")
            approve_btn.click()
        except Exception as e:
            print(f"Warning: Could not click approve button: {e}")
    
    def click_reject_job(self, row_index=0):
        """
        Click reject button for a specific job.
        
        Args:
            row_index: Index of the job row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            reject_btn = self.driver.find_element(By.XPATH, "//button[contains(text(),'Reject')]")
            reject_btn.click()
        except Exception as e:
            print(f"Warning: Could not click reject button: {e}")
    
    def click_flag_job(self, row_index=0):
        """
        Click flag/report button for a specific job.
        
        Args:
            row_index: Index of the job row (0-based)
        """
        self.get_action_menu(row_index)
        try:
            flag_selectors = [
                (By.XPATH, "//button[contains(text(),'Flag')]"),
                (By.XPATH, "//button[contains(text(),'Report')]"),
                (By.XPATH, "//button[contains(text(),'Review')]")
            ]
            
            for selector in flag_selectors:
                try:
                    flag_btn = self.driver.find_element(*selector)
                    flag_btn.click()
                    return
                except:
                    continue
                    
            print("Warning: Could not find flag button")
        except Exception as e:
            print(f"Warning: Could not click flag button: {e}")
    
    def is_job_in_list(self, job_title):
        """
        Check if a job with specific title is in the list.
        
        Args:
            job_title: Job title to search for
            
        Returns:
            bool: True if job is found, False otherwise
        """
        try:
            page_source = self.driver.page_source
            return job_title in page_source
        except Exception as e:
            print(f"Warning: Could not check if job is in list: {e}")
            return False
    
    def get_job_details(self, row_index=0):
        """
        Get job details from a specific row.
        
        Args:
            row_index: Index of the job row (0-based)
            
        Returns:
            dict: Job details (title, company, status, etc.)
        """
        try:
            row = self.get_job_row(row_index)
            if row:
                # Extract text from all cells
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) > 0:
                    return {
                        "row_text": row.text,
                        "cell_count": len(cells)
                    }
            return {}
        except Exception as e:
            print(f"Warning: Could not get job details: {e}")
            return {}
    
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
    
    def export_jobs(self):
        """Click export button to download jobs list."""
        try:
            self.click(self.EXPORT_BTN)
        except Exception as e:
            print(f"Warning: Could not click export button: {e}")
    
    def get_job_count_text(self):
        """
        Get the text showing total job count (e.g., "Showing 1-10 of 50 jobs").
        
        Returns:
            str: Job count text, or empty string if not found
        """
        try:
            count_selectors = [
                (By.XPATH, "//*[contains(text(),'job') or contains(text(),'Job')]"),
                (By.CSS_SELECTOR, "[class*='count']"),
                (By.CSS_SELECTOR, "[class*='total']")
            ]
            
            for selector in count_selectors:
                try:
                    element = self.driver.find_element(*selector)
                    text = element.text
                    if text and ("job" in text.lower() or "total" in text.lower()):
                        return text
                except:
                    continue
                    
            return ""
        except Exception as e:
            print(f"Warning: Could not get job count text: {e}")
            return ""
