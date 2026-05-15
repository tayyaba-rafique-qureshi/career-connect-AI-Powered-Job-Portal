# Testing Guide — CareerConnect

This document explains the testing setup for CareerConnect and how to run each tier locally.

## Overview

| Tier | Framework | Location | Command |
|------|-----------|----------|---------|
| Backend unit + integration | Jest | `server/tests/` | `cd server && npm test` |
| Frontend component + util | Vitest | `client/src/tests/` | `cd client && npm test` |
| AI service | pytest | `ai-service/tests/` | `cd ai-service && pytest` |
| End-to-end (CRUD plan) | Selenium + pytest | `tests/selenium/` | `python -m pytest tests/selenium/tests/test_crud_plan.py -v` |

## CRUD Test Plan (Assignment 3)

The CRUD plan for the **Jobs** entity is documented in `Assignment3_CRUD_TestPlan.docx` and implemented in `tests/selenium/tests/test_crud_plan.py`. Five test cases cover Create, Read (list), Read (search), Update, and Delete operations.

### Prerequisites

Before running the CRUD test suite, ensure:

1. **MongoDB is reachable.** Either MongoDB Atlas (default — credentials in `tests/selenium/.env.test`) or local MongoDB on `localhost:27017`.
2. **Backend is running** at `http://localhost:5000`:
   ```powershell
   cd server
   npm install
   npm start
   ```
3. **Frontend is running** at `http://localhost:3001`:
   ```powershell
   cd client
   npm install
   npm run dev
   ```
4. **Python deps for Selenium** are installed:
   ```powershell
   cd tests/selenium
   pip install -r requirements.txt
   ```
5. **Chrome browser** is installed locally (Selenium Manager auto-resolves the matching ChromeDriver).

### Running the CRUD plan

From the **project root**:

```powershell
python -m pytest tests/selenium/tests/test_crud_plan.py -v --html=tests/selenium/reports/crud_report.html
```

Notes:

- Run from project root (not from `tests/selenium/`) so the relative `.env.test` path resolves correctly.
- Pass screenshots are saved under `tests/selenium/reports/screenshots/pass/` with names like `PASS_TC01_create_<timestamp>.png`.
- Failure screenshots (if any) are saved under `tests/selenium/reports/screenshots/`.

### Test Cases

| ID | Op | Test Function | What it verifies |
|----|----|----|----|
| TC-CRUD-01 | CREATE | `test_TC_CRUD_01_create_job_via_api_and_verify_in_ui` | Recruiter creates a job → appears on `/jobs` |
| TC-CRUD-02 | READ | `test_TC_CRUD_02_read_public_jobs_list` | Public `/jobs` page loads job content |
| TC-CRUD-03 | READ (search) | `test_TC_CRUD_03_read_search_filters_jobs` | Search input filters the visible jobs |
| TC-CRUD-04 | UPDATE | `test_TC_CRUD_04_update_job_title_via_api` | Recruiter updates a job → new title visible on `/jobs` |
| TC-CRUD-05 | DELETE | `test_TC_CRUD_05_delete_job_via_api` | Recruiter deletes a job → DELETE returns 200/204 |

## CI/CD

The `.github/workflows/ci.yml` GitHub Actions workflow runs all four test tiers on every push/PR. See `Assignment3_CRUD_TestPlan.docx` Section 3 for the full description.

## Troubleshooting

### Tests hang on "Waiting for suitable server to become available"
Your `.env.test` has the wrong `MONGODB_URI`, or you're running pytest from the wrong directory. Run from project root.

### `WinError 193 — %1 is not a valid Win32 application`
The `webdriver-manager` package returns the wrong file path on Windows. The `conftest.py` has been updated to use Selenium Manager (built into Selenium 4.6+) instead. Clear the old cache: `Remove-Item -Recurse -Force C:\Users\$env:USERNAME\.wdm`.

### `pytest: command not found`
Run as a Python module: `python -m pytest ...` instead of `pytest ...`.

### "Invalid email or password" when running admin tests
The admin user isn't seeded in your MongoDB. Run:
```powershell
cd server
node src/scripts/createAdmin.js
```
The CRUD plan in `test_crud_plan.py` deliberately avoids admin login to sidestep this requirement.
