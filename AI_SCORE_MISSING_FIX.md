# AI Score Not Showing for New Applicants - Analysis & Fix

## Issue Description
When creating a new applicant account, AI match scores and features are not showing on job cards in the "Jobs for you" section.

**Expected:** Job cards should show AI match percentage (e.g., 44.14%), skills matched, and missing skills  
**Actual:** No AI score or features displayed

---

## Root Cause Analysis

### The Problem Chain:

1. **Resume Text Extraction Made Optional**
   - We recently made resume text extraction optional (to fix onboarding errors)
   - If AI service is down during onboarding, resume is saved with empty `rawText`
   - File: `server/src/controllers/onboardingController.js`

2. **AI Matching Requires Resume Text**
   - AI matching endpoint: `POST /api/ai/match` with `{applicant_id, job_id}`
   - Python AI service needs resume text to calculate match scores
   - If `rawText` is empty, AI service returns `matchScore: null`

3. **Frontend Shows Nothing When Score is Null**
   - Job cards check `if (matchScore)` before displaying AI features
   - When `matchScore` is `null` or `undefined`, nothing is shown
   - File: `client/src/components/applicant/JobCard.jsx`

### Why This Happens:

```
New Applicant Registration
    ↓
AI Service Not Running (or fails)
    ↓
Resume uploaded but text extraction fails
    ↓
Resume saved with rawText = '' (empty)
    ↓
Onboarding completes successfully ✓
    ↓
User browses jobs
    ↓
AI matching called: POST /api/ai/match {applicant_id, job_id}
    ↓
AI service finds empty rawText
    ↓
Returns matchScore: null
    ↓
Frontend shows no AI features ❌
```

---

## Solutions

### Solution 1: Start the AI Service (Recommended)

**This is the proper fix** - ensures all AI features work correctly.

#### Steps:

1. **Navigate to AI service directory:**
```bash
cd ai-service
```

2. **Activate virtual environment:**
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies (if not already installed):**
```bash
pip install -r requirements.txt
```

4. **Verify environment variables:**
Check `ai-service/.env` has:
```env
MONGO_URI=mongodb+srv://your-connection-string
PORT=5001
```

5. **Start the AI service:**
```bash
python main.py
```

6. **Verify it's running:**
```bash
curl http://localhost:5001/health
```

Should return:
```json
{
  "status": "ok",
  "service": "CareerConnect AI",
  "db": "connected"
}
```

7. **Re-upload resume:**
   - Go to Profile → Resume tab
   - Re-upload your resume PDF
   - Text will be extracted this time
   - AI features will start working

---

### Solution 2: Retry Text Extraction for Existing Users

Create an admin tool or script to retry text extraction for users with empty resume text.

#### Backend Script:
```javascript
// scripts/retryResumeExtraction.js
const User = require('../models/User')
const { extractResumeText } = require('../controllers/onboardingController')

async function retryTextExtraction() {
  const usersWithoutText = await User.find({
    'applicantProfile.resume.fileId': { $exists: true },
    'applicantProfile.resume.rawText': ''
  })

  console.log(`Found ${usersWithoutText.length} users without resume text`)

  for (const user of usersWithoutText) {
    try {
      const fileId = user.applicantProfile.resume.fileId
      const rawText = await extractResumeText(fileId)
      
      if (rawText && rawText.trim()) {
        user.applicantProfile.resume.rawText = rawText
        user.applicantProfile.resume.uploadedRawText = rawText
        await user.save()
        console.log(`✓ Extracted text for user ${user._id}`)
      } else {
        console.log(`✗ No text extracted for user ${user._id}`)
      }
    } catch (err) {
      console.error(`✗ Error for user ${user._id}:`, err.message)
    }
  }
}

retryTextExtraction().then(() => process.exit())
```

#### Run the script:
```bash
cd server
node scripts/retryResumeExtraction.js
```

---

### Solution 3: Add Fallback UI (User-Friendly)

Show helpful messages when AI features aren't available.

#### Update JobCard Component:

**File:** `client/src/components/applicant/JobCard.jsx`

```jsx
// Add this section where AI match score is displayed:

{matchScore !== null && matchScore !== undefined ? (
  // Show AI match score
  <div className="ai-match-badge">
    {Math.round(matchScore)}% match
  </div>
) : (
  // Show fallback message
  <div className="ai-match-unavailable">
    <InfoIcon size={14} />
    <span>AI match pending</span>
    <Tooltip text="Upload a resume to see AI match scores" />
  </div>
)}
```

#### Update ApplicantDashboard:

**File:** `client/src/pages/applicant/ApplicantDashboard.jsx`

Add a banner at the top if user has no resume text:

```jsx
{user?.applicantProfile?.resume?.fileId && !user?.applicantProfile?.resume?.rawText && (
  <div className="alert alert-info">
    <InfoIcon />
    <div>
      <strong>AI features unavailable</strong>
      <p>Re-upload your resume to enable AI job matching and recommendations.</p>
      <button onClick={() => navigate('/profile?tab=resume')}>
        Update Resume
      </button>
    </div>
  </div>
)}
```

---

### Solution 4: Background Job for Text Extraction

Set up a cron job to automatically retry text extraction.

#### Using node-cron:

```javascript
// server/jobs/resumeTextExtraction.js
const cron = require('node-cron')
const User = require('../models/User')
const { extractResumeText } = require('../controllers/onboardingController')

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Starting resume text extraction job')
  
  const users = await User.find({
    'applicantProfile.resume.fileId': { $exists: true },
    'applicantProfile.resume.rawText': ''
  }).limit(10) // Process 10 at a time

  for (const user of users) {
    try {
      const fileId = user.applicantProfile.resume.fileId
      const rawText = await extractResumeText(fileId)
      
      if (rawText && rawText.trim()) {
        user.applicantProfile.resume.rawText = rawText
        user.applicantProfile.resume.uploadedRawText = rawText
        await user.save()
        console.log(`[Cron] ✓ Extracted text for user ${user._id}`)
      }
    } catch (err) {
      console.error(`[Cron] ✗ Error for user ${user._id}:`, err.message)
    }
  }
  
  console.log('[Cron] Resume text extraction job completed')
})
```

#### Register in server startup:

```javascript
// server/server.js
require('./jobs/resumeTextExtraction') // Add this line
```

---

## Immediate Action Required

### For Development/Testing:

1. **Start the AI service** (Solution 1)
2. **Re-upload resume** for test accounts
3. **Verify AI scores appear** on job cards

### For Production:

1. **Ensure AI service is always running**
2. **Implement Solution 4** (background job)
3. **Implement Solution 3** (fallback UI)
4. **Add monitoring** for AI service health

---

## Verification Steps

### 1. Check if AI Service is Running:
```bash
curl http://localhost:5001/health
```

### 2. Check User's Resume Text:
```javascript
// In MongoDB or via API
db.users.findOne(
  { email: "test@example.com" },
  { "applicantProfile.resume.rawText": 1 }
)
```

### 3. Test AI Matching:
```bash
curl -X POST http://localhost:5001/api/ai/match \
  -H "Content-Type: application/json" \
  -d '{
    "applicant_id": "USER_ID_HERE",
    "job_id": "JOB_ID_HERE"
  }'
```

Should return:
```json
{
  "matchScore": 75.5,
  "skillsMatched": ["javascript", "react", "node.js"],
  "skillsMissing": ["python", "django"]
}
```

### 4. Check Frontend:
- Browse to "Jobs for you"
- Click on a job card
- AI match score should appear
- Skills matched/missing should be visible

---

## Prevention

### 1. Add AI Service Health Check on Startup:
```javascript
// server/server.js
const checkAIService = async () => {
  try {
    await axios.get(`${process.env.AI_SERVICE_URL}/health`, { timeout: 5000 })
    console.log('[Startup] ✓ AI service is available')
    return true
  } catch (err) {
    console.warn('[Startup] ✗ AI service is unavailable - AI features will be limited')
    return false
  }
}

// Call during startup
checkAIService()
```

### 2. Add Resume Text Validation:
```javascript
// In onboarding completion
if (!user.applicantProfile.resume.rawText) {
  console.warn(`[Onboarding] User ${user._id} completed without resume text`)
  // Send notification to admin
  // Or add to retry queue
}
```

### 3. Add User Notification:
```javascript
// When user completes onboarding without text
if (!resumeText) {
  await Notification.create({
    user: user._id,
    type: 'warning',
    title: 'Resume processing pending',
    message: 'We\'re still processing your resume. AI features will be available soon.',
    link: '/profile?tab=resume'
  })
}
```

### 4. Add Admin Dashboard Alert:
```javascript
// In admin dashboard stats
const usersWithoutResumeText = await User.countDocuments({
  'applicantProfile.resume.fileId': { $exists: true },
  'applicantProfile.resume.rawText': ''
})

// Show warning if > 0
```

---

## Summary

### Root Cause:
✅ Resume text extraction is optional (to prevent onboarding failures)  
✅ AI matching requires resume text  
✅ Empty resume text → null AI scores → no UI display

### Immediate Fix:
1. Start AI service: `cd ai-service && python main.py`
2. Re-upload resume for affected users
3. AI scores will appear

### Long-term Solutions:
1. Background job to retry text extraction
2. Fallback UI for missing AI features
3. Health checks and monitoring
4. User notifications

### Files to Check:
- `server/src/controllers/onboardingController.js` - Resume text extraction
- `server/src/services/aiService.js` - AI matching logic
- `client/src/pages/applicant/ApplicantDashboard.jsx` - Job display
- `client/src/components/applicant/JobCard.jsx` - AI score UI
- `ai-service/main.py` - AI service entry point
- `ai-service/routes/resume.py` - Text extraction endpoint

---

## Next Steps

1. ✅ Start AI service
2. ✅ Test with new applicant account
3. ✅ Verify AI scores appear
4. ⏳ Implement background job (optional)
5. ⏳ Add fallback UI (recommended)
6. ⏳ Add monitoring (production)
