# Applicant Onboarding Error - 400 Status Code

## Error Details
**Error:** `AxiosError: Request failed with status code 400`
**Location:** `ApplicantOnboarding.jsx:185`
**Trigger:** Clicking "Complete Profile" button on Step 5 (Resume Upload)

---

## Root Cause Analysis

### The 400 Error is Returned When:

1. **No resume file uploaded** (Line 79-81):
```javascript
if (!req.file && isOnboarding && !hasExistingResume) {
  return res.status(400).json({ message: 'Resume is required to complete onboarding' })
}
```

2. **Resume text extraction fails** (Line 95-98):
```javascript
const rawText = await extractResumeText(fileId)
if (!rawText || !rawText.trim()) {
  await deleteOldResume(fileId)
  return res.status(400).json({ message: 'Resume text extraction failed. Please upload a text-based PDF.' })
}
```

---

## Most Likely Cause: AI Service Connection Issue

The `extractResumeText` function calls the Python AI service:
```javascript
const { data } = await axios.post(
  `${process.env.AI_SERVICE_URL}/api/extract-resume`,
  { fileId: fileId.toString() },
  { timeout: 30000 }
)
```

### Possible Issues:

1. **AI Service Not Running**
   - The Python AI service may not be started
   - Check if `ai-service` is running on the configured port

2. **Wrong AI_SERVICE_URL**
   - Environment variable may be incorrect or missing
   - Check `server/.env` for `AI_SERVICE_URL`

3. **AI Service Endpoint Missing**
   - The `/api/extract-resume` endpoint may not exist in AI service
   - Or it may be failing to extract text from the PDF

4. **PDF Format Issue**
   - The uploaded PDF may be image-based (scanned) rather than text-based
   - Text extraction only works on text-based PDFs

---

## Diagnostic Steps

### Step 1: Check if AI Service is Running
```bash
# Check if Python AI service is running
curl http://localhost:5001/health
# or whatever port is configured
```

### Step 2: Check Environment Variables
```bash
# In server/.env
AI_SERVICE_URL=http://localhost:5001
```

### Step 3: Check AI Service Logs
Look for errors in the AI service console when uploading resume

### Step 4: Test Resume Extraction Endpoint
```bash
curl -X POST http://localhost:5001/api/extract-resume \
  -H "Content-Type: application/json" \
  -d '{"fileId":"test-file-id"}'
```

---

## Solutions

### Solution 1: Start the AI Service (Most Likely Fix)

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
python main.py
```

### Solution 2: Make Resume Text Extraction Optional (Temporary Workaround)

If AI service is not critical for onboarding, make text extraction optional:

**File:** `server/src/controllers/onboardingController.js`

```javascript
// BEFORE (Line 95-98):
const rawText = await extractResumeText(fileId)
if (!rawText || !rawText.trim()) {
  await deleteOldResume(fileId)
  return res.status(400).json({ message: 'Resume text extraction failed. Please upload a text-based PDF.' })
}

// AFTER (Make it optional):
const rawText = await extractResumeText(fileId)
if (!rawText || !rawText.trim()) {
  console.warn('[Onboarding] Resume text extraction failed, continuing without text')
  // Store empty text, allow onboarding to complete
  p.resume = {
    fileId,
    fileName:         filename,
    uploadedAt:       new Date(),
    rawText:          '', // Empty but allowed
    uploadedRawText:  '',
    aiPreference:     'uploaded',
    originalSize,
    storedSize:       compressedSize,
    wasCompressed:    compressed
  }
} else {
  p.resume = {
    fileId,
    fileName:         filename,
    uploadedAt:       new Date(),
    rawText,
    uploadedRawText:  rawText,
    aiPreference:     'uploaded',
    originalSize,
    storedSize:       compressedSize,
    wasCompressed:    compressed
  }
}
```

### Solution 3: Add Better Error Handling in Frontend

**File:** `client/src/pages/onboarding/ApplicantOnboarding.jsx`

```javascript
const handleContinue = async () => {
  if (!validate()) return
  try {
    // ... existing code ...
    if (step === 5) {
      setUploading(true)
      try {
        await saveStepWithFile(5, {
          profileSummary: resume.profileSummary,
          linkedinUrl:    resume.linkedinUrl,
          portfolioUrl:   resume.portfolioUrl
        }, resume.file)
        markProfileComplete()
        navigate('/dashboard/applicant')
      } catch (uploadError) {
        // Show specific error message from backend
        const errorMsg = uploadError.response?.data?.message || 'Failed to upload resume'
        setErrors({ resume: errorMsg })
        console.error('Resume upload error:', uploadError)
      } finally {
        setUploading(false)
      }
      return
    }
    setStep(s => s + 1)
  } catch (err) {
    console.error(err)
    // Show generic error
    setErrors({ general: 'An error occurred. Please try again.' })
  }
}
```

---

## Recommended Fix (Apply This)

### Option A: If AI Service Should Work
1. Start the AI service
2. Verify it's accessible at the configured URL
3. Test resume upload again

### Option B: If AI Service is Not Available
Apply Solution 2 (make text extraction optional) to allow onboarding to complete without AI text extraction.

---

## Testing After Fix

1. Navigate to applicant registration
2. Complete all onboarding steps
3. Upload a PDF resume on Step 5
4. Click "Complete Profile"
5. Verify:
   - No 400 error
   - Profile marked as complete
   - Redirected to dashboard
   - Resume is saved

---

## Additional Checks

### Check AI Service Route
**File:** `ai-service/main.py`

Verify the `/api/extract-resume` endpoint exists:
```python
@app.post("/api/extract-resume")
async def extract_resume(request: dict):
    # Should handle fileId and return extractedText
    pass
```

### Check GridFS Connection
Ensure MongoDB GridFS is properly configured for file storage.

---

## Prevention

1. Add health check endpoint to AI service
2. Add startup validation to ensure AI service is reachable
3. Add better error messages in frontend
4. Consider making AI features optional during onboarding
5. Add retry logic for AI service calls
