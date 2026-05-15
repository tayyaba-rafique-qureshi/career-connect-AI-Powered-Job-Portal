"""
BaseTest class with common helpers and constants
"""
import os

class BaseTest:
    BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")
    API_URL = os.getenv("API_URL", "http://localhost:5000/api")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@careerconnect.com")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")
    
    DEFAULT_TIMEOUT = 15
    SHORT_TIMEOUT = 5
    LONG_TIMEOUT = 30
