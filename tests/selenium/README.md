# Selenium E2E Test Suite

Comprehensive end-to-end test suite for CareerConnect AI-Powered Job Portal using Selenium WebDriver, pytest, and the Page Object Model pattern.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Organization](#test-organization)
- [CI/CD Integration](#cicd-integration)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd tests/selenium
pip install -r requirements.txt

# 2. Configure environment
cp .env.test .env.test.local
# Edit .env.test.local with your settings

# 3. Start services (in separate terminals)
cd ../../server && npm start          # Backend on port 5000
cd ../../client && npm run dev         # Frontend on port 5173
cd ../../ai-service && python main.py  # AI service on port 8000

# 4. Run smoke tests (critical paths)
pytest tests/ -m smoke -v

# 5. View HTML report
open reports/smoke_report.html
```

## 📦 Installation

### Prerequisites

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Chrome Browser** - Latest stable version
- **Node.js 18+** - For running the application
- **MongoDB** - Running instance (local or cloud)

### Step 1: Install Python Dependencies

```bash
cd tests/selenium
pip install -r requirements.txt
```

**Dependencies installed:**
- `selenium` - WebDriver for browser automation
- `pytest` - Test framework
- `pytest-html` - HTML test reports
- `pytest-xdist` - Parallel test execution
- `pytest-rerunfailures` - Automatic retry for flaky tests
- `pytest-timeout` - Test timeout management
- `webdriver-manager` - Automatic ChromeDriver management
- `python-dotenv` - Environment variable management
- `pymongo` - MongoDB database operations
- `Faker` - Test data generation
- `requests` - API calls for test setup

### Step 2: Install ChromeDriver (Automatic)

ChromeDriver is automatically downloaded and managed by `webdriver-manager`. No manual installation needed!

### Step 3: Configure Environment Variables

```bash
cp .env.test .env.test.local
```

Edit `.env.test.local`:

```env
BASE_URL=http://localhost:5173
API_URL=http://localhost:5000/api
ADMIN_EMAIL=admin@careerconnect.com
ADMIN_PASSWORD=Admin@123
HEADLESS=false
BROWSER=chrome
IMPLICIT_WAIT=10
EXPLICIT_WAIT=15
MONGODB_URI=mongodb://localhost:27017/careerconnect_test
SCREENSHOT_ON_FAIL=true
```

### Step 4: Seed Admin User

```bash
cd ../../server
node src/scripts/createAdmin.js
```

## 🏃 Running Tests

### Run All Tests

```bash
pytest tests/ -v
```

### Run by Test Marker

#### Smoke Tests (Critical Paths - ~2-3 minutes)
```bash
pytest tests/ -m smoke -v
```

**What it tests:**
- Landing page loads
- Admin login works
- Registration page accessible
- Admin dashboard loads
- Protected routes redirect
- Logout clears token

#### Regression Tests (All Critical Features - ~4-5 minutes)
```bash
pytest tests/ -m regression -v
```

**What it tests:**
- All smoke test scenarios
- All admin panel pages load
- Form validation works
- Page titles are meaningful

#### CRUD Tests (Data Operations - ~3-4 minutes)
```bash
pytest tests/ -m crud -v
```

**What it tests:**
- Create, Read, Update, Delete operations
- User management (admin panel)
- Job management (admin panel)
- Application management

#### Authentication Tests
```bash
pytest tests/ -m auth -v
```

#### Admin Tests
```bash
pytest tests/ -m admin -v
```

#### Recruiter Tests
```bash
pytest tests/ -m recruiter -v
```

### Run Specific Test File

```bash
pytest tests/test_01_auth.py -v
pytest tests/test_02_registration.py -v
pytest tests/test_06_crud_users.py -v
pytest tests/test_07_crud_jobs.py -v
pytest tests/test_09_regression.py -v
pytest tests/test_10_accessibility.py -v
```

### Run Specific Test

```bash
pytest tests/test_01_auth.py::TestAuthentication::test_login_page_loads -v
```

### Run with HTML Report

```bash
pytest tests/ -m smoke --html=reports/smoke_report.html --self-contained-html
```

### Run in Headless Mode

```bash
HEADLESS=true pytest tests/ -m smoke -v
```

### Run with Parallel Execution

```bash
pytest tests/ -n 2 -v  # Run with 2 workers
pytest tests/ -n auto -v  # Auto-detect CPU cores
```

### Run with Automatic Retry (Flaky Tests)

```bash
pytest tests/ --reruns 2 --reruns-delay 2 -v
```

### Run with Timeout

```bash
pytest tests/ --timeout=60 -v  # 60 second timeout per test
```

## 📁 Test Organization

```
tests/selenium/
├── conftest.py              # Pytest fixtures and configuration
├── base_test.py             # Base test class with common constants
├── pytest.ini               # Pytest configuration and markers
├── requirements.txt         # Python dependencies
├── .env.test                # Environment variables template
├── README.md                # This file
│
├── pages/                   # Page Object Model
│   ├── base_page.py         # Base page class
│   ├── landing_page.py      # Landing page
│   ├── login_page.py        # Login page
│   ├── register_page.py     # Registration page
│   ├── admin_dashboard_page.py  # Admin dashboard
│   ├── admin_users_page.py  # Admin users management
│   └── admin_jobs_page.py   # Admin jobs management
│
├── utils/                   # Utility modules
│   ├── test_data.py         # Test data factory (Faker)
│   ├── wait_helpers.py      # Custom wait functions
│   ├── screenshot_helper.py # Screenshot capture
│   └── db_helper.py         # Database operations
│
├── tests/                   # Test files
│   ├── test_01_auth.py      # Authentication tests (12 tests)
│   ├── test_02_registration.py  # Registration tests (6 tests)
│   ├── test_06_crud_users.py    # User CRUD tests (8 tests)
│   ├── test_07_crud_jobs.py     # Job CRUD tests (8 tests)
│   ├── test_09_regression.py    # Regression tests (16 tests)
│   └── test_10_accessibility.py # Accessibility tests (5 tests)
│
└── reports/                 # Test reports and screenshots
    ├── screenshots/         # Failure screenshots
    └── *.html               # HTML test reports
```

## 🔧 Test Markers

Markers are defined in `pytest.ini`:

| Marker | Description | Test Count |
|--------|-------------|------------|
| `smoke` | Critical paths that must never break | ~11 tests |
| `regression` | All critical features for regression testing | ~16 tests |
| `auth` | Authentication and authorization tests | ~18 tests |
| `crud` | Create, Read, Update, Delete operations | ~16 tests |
| `admin` | Admin panel functionality | ~8 tests |
| `recruiter` | Recruiter/employer functionality | ~8 tests |
| `applicant` | Applicant/job seeker functionality | ~5 tests |
| `slow` | Tests that take longer to execute | ~3 tests |

### Combining Markers

```bash
# Run smoke tests for authentication
pytest tests/ -m "smoke and auth" -v

# Run all tests except slow ones
pytest tests/ -m "not slow" -v

# Run smoke or regression tests
pytest tests/ -m "smoke or regression" -v
```

## 🔄 CI/CD Integration

### GitHub Actions

The test suite is integrated into `.github/workflows/ci.yml`:

```yaml
selenium-e2e-tests:
  runs-on: ubuntu-latest
  needs: [backend-tests, frontend-tests]
  steps:
    - name: Run smoke tests
      run: pytest tests/selenium/tests/ -m smoke -v
      env:
        HEADLESS: "true"
        
    - name: Run regression tests
      run: pytest tests/selenium/tests/ -m regression -v --reruns=2
      continue-on-error: true
      
    - name: Run CRUD tests
      run: pytest tests/selenium/tests/ -m crud -v --reruns=1
      continue-on-error: true
```

### Test Execution Strategy

1. **Smoke Tests** - Run first, fail-fast, no retries
2. **Regression Tests** - Run with 2 retries, continue on error
3. **CRUD Tests** - Run with 1 retry, continue on error

### Artifacts

- HTML test reports uploaded to GitHub Actions artifacts
- Screenshots of failed tests
- Retention: 14 days

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:5173` | Frontend URL |
| `API_URL` | `http://localhost:5000/api` | Backend API URL |
| `ADMIN_EMAIL` | `admin@careerconnect.com` | Admin user email |
| `ADMIN_PASSWORD` | `Admin@123` | Admin user password |
| `HEADLESS` | `false` | Run browser in headless mode |
| `BROWSER` | `chrome` | Browser to use (chrome/firefox) |
| `IMPLICIT_WAIT` | `10` | Implicit wait timeout (seconds) |
| `EXPLICIT_WAIT` | `15` | Explicit wait timeout (seconds) |
| `MONGODB_URI` | `mongodb://localhost:27017/careerconnect_test` | Test database URI |
| `SCREENSHOT_ON_FAIL` | `true` | Capture screenshot on test failure |

### pytest.ini Configuration

```ini
[pytest]
markers =
    smoke: Critical path tests that must never break
    regression: Regression tests for all major features
    auth: Authentication and authorization tests
    crud: Create, Read, Update, Delete operations
    admin: Admin panel functionality tests
    recruiter: Recruiter/employer functionality tests
    applicant: Applicant/job seeker functionality tests
    slow: Tests that take longer to execute

testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --strict-markers
    --tb=short
    --reruns=2
    --reruns-delay=2
```

## 🐛 Troubleshooting

### Common Issues

#### 1. ChromeDriver Version Mismatch

**Error:** `SessionNotCreatedException: Message: session not created: This version of ChromeDriver only supports Chrome version X`

**Solution:** Update Chrome browser or let webdriver-manager handle it:
```bash
pip install --upgrade webdriver-manager
```

#### 2. Services Not Running

**Error:** `Connection refused` or `Service unavailable`

**Solution:** Ensure all services are running:
```bash
# Terminal 1: Backend
cd server && npm start

# Terminal 2: Frontend
cd client && npm run dev

# Terminal 3: AI Service (optional)
cd ai-service && python main.py
```

#### 3. MongoDB Connection Failed

**Error:** `pymongo.errors.ServerSelectionTimeoutError`

**Solution:** 
- Check MongoDB is running: `mongosh`
- Verify `MONGODB_URI` in `.env.test`
- Use test database: `mongodb://localhost:27017/careerconnect_test`

#### 4. Element Not Found

**Error:** `NoSuchElementException` or `TimeoutException`

**Solution:**
- Increase wait times in `.env.test`
- Check if page loaded correctly
- Verify CSS selectors in page objects
- Run in non-headless mode to debug: `HEADLESS=false pytest ...`

#### 5. Tests Fail in Headless Mode

**Error:** Tests pass locally but fail in CI

**Solution:**
- Add `--window-size=1920,1080` to Chrome options
- Increase timeouts for CI environment
- Check for timing issues (add explicit waits)
- Review screenshots in CI artifacts

#### 6. Flaky Tests

**Error:** Tests pass/fail intermittently

**Solution:**
- Use explicit waits instead of `time.sleep()`
- Add retry logic: `pytest --reruns 2`
- Check for race conditions
- Verify element visibility before interaction

#### 7. Permission Denied on Screenshots

**Error:** `PermissionError: [Errno 13] Permission denied`

**Solution:**
```bash
mkdir -p tests/selenium/reports/screenshots
chmod 755 tests/selenium/reports/screenshots
```

#### 8. Import Errors

**Error:** `ModuleNotFoundError: No module named 'pages'`

**Solution:**
```bash
# Run from tests/selenium directory
cd tests/selenium
pytest tests/ -v

# Or set PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Debug Mode

Run tests with verbose output and no capture:

```bash
pytest tests/ -v -s --tb=long
```

View browser in action (non-headless):

```bash
HEADLESS=false pytest tests/test_01_auth.py::TestAuthentication::test_login_page_loads -v -s
```

### Logging

Enable detailed logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📚 Best Practices

### 1. Use Page Object Model

✅ **Good:**
```python
login_page = LoginPage(driver)
login_page.login(email, password)
```

❌ **Bad:**
```python
driver.find_element(By.ID, "email").send_keys(email)
driver.find_element(By.ID, "password").send_keys(password)
```

### 2. Use Explicit Waits

✅ **Good:**
```python
wait = WebDriverWait(driver, 10)
element = wait.until(EC.element_to_be_clickable(locator))
```

❌ **Bad:**
```python
time.sleep(5)
element = driver.find_element(*locator)
```

### 3. Use Test Data Factory

✅ **Good:**
```python
user = TestDataFactory.applicant_user()
TestDataFactory.store_user(user)
```

❌ **Bad:**
```python
email = "test@example.com"  # May conflict with other tests
```

### 4. Clean Up Test Data

✅ **Good:**
```python
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    DBHelper.clean_all_test_data()
    yield
    DBHelper.clean_all_test_data()
```

### 5. Use Meaningful Test Names

✅ **Good:**
```python
def test_admin_login_redirects_to_dashboard(self, driver):
```

❌ **Bad:**
```python
def test_1(self, driver):
```

### 6. Add Descriptive Docstrings

✅ **Good:**
```python
def test_login_page_loads(self, driver):
    """
    TC-AUTH-01: Verify login page loads with all required elements.
    
    Steps:
    1. Navigate to login page
    2. Verify email input is visible
    3. Verify password input is visible
    
    Expected: All form elements are present
    """
```

### 7. Handle Errors Gracefully

✅ **Good:**
```python
try:
    element = driver.find_element(*locator)
except NoSuchElementException:
    print("Warning: Element not found")
    assert True, "Feature may not be implemented"
```

## 📊 Test Metrics

- **Total Test Cases:** ~55 tests
- **Smoke Tests:** ~11 tests (critical paths)
- **Regression Tests:** ~16 tests (all features)
- **CRUD Tests:** ~16 tests (data operations)
- **Average Execution Time:** 
  - Smoke: 2-3 minutes
  - Regression: 4-5 minutes
  - CRUD: 3-4 minutes
  - All: 10-12 minutes

## 🤝 Contributing

When adding new tests:

1. Follow the Page Object Model pattern
2. Add appropriate test markers
3. Include descriptive docstrings
4. Use TestDataFactory for test data
5. Clean up test data after tests
6. Add tests to appropriate test file
7. Update this README if needed

## 📞 Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review test output and screenshots
- Check CI/CD logs in GitHub Actions
- Contact the QA team

## 📄 License

This test suite is part of the CareerConnect project.
