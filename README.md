# CareerConnect — AI‑Powered Job Portal

CareerConnect is a full‑stack job portal that combines a modern job-search experience with AI‑assisted matching. It supports **Applicants** and **Employers/Recruiters** end‑to‑end (onboarding → job browsing/posting → applications → interviews → messaging & notifications).

> **Active development:** features are being added and stabilized. Use the “Integration workflow” below to keep `main` clean.

## Tech stack
- **Frontend**: React (Vite) + Tailwind CSS  
- **Backend**: Node.js + Express  
- **Database**: MongoDB (Atlas / local) + GridFS (PDF resume storage)  
- **AI service**: Python + FastAPI (separate service)  
- **Auth**: JWT + Google OAuth  
- **Email**: Nodemailer (Gmail) / production provider later

## Key features
- **Role-based access** (applicant, employer/recruiter, admin*)
- **Onboarding flows** (role-specific)
- **Responsive UI** for mobile screens
- **Jobs**: post/edit jobs, browse/search, salary formatting
- **Applications**: apply, track status, interview scheduling & rescheduling constraints
- **Messaging**: conversations + chat UI with unread badges
- **Notifications**: in-app notifications for key events
- **Resumes**: upload + secure download for authorized recruiters (GridFS)

> \* Admin module is being integrated via team PR.

## Repo structure

```
JOB-PROJECT/
├── client/          # React frontend (Vite)
├── server/          # Node.js + Express API
└── ai-service/      # Python FastAPI microservice (separate)
```

## Local development

### Prerequisites
- Node.js 18+
- (Optional) Python 3.10+ for the AI service
- MongoDB Atlas URI (or local MongoDB)

### 1) Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2) Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

### 3) AI service (optional)
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment variables (high level)
Create `.env` files in `server/` and `client/` (see each `.env.example`). Common backend variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- `CLIENT_URL`

## Integration workflow (professional)
To keep `main` stable, do **all work in feature/integration branches**:

```bash
# create a branch for your work
git checkout -b integration-manager

# commit frequently
git add -A
git commit -m "feat: ..."

# push and open a PR
git push -u origin integration-manager
```

When teammates open PRs (e.g. AI service, admin module):
- **Pull latest `origin/main`**
- **Merge PR branches into your integration branch**
- Resolve conflicts + run a quick smoke test
- Open a final PR from `integration-manager` → `main`

## Team
- Tayyaba Rafique
- Samreen Farhat
- Umama Hidayat

## CI/CD Pipeline

![CI](https://github.com/tayyaba-rafique-qureshi/career-connect-AI-Powered-Job-Portal/actions/workflows/ci.yml/badge.svg)

GitHub Actions runs automatically on every push to `main` and every PR.

| Job | What it tests |
|---|---|
| Backend Tests | Jest — auth API, jobs API, utility functions |
| Frontend Tests | Vitest — components, utils + Vite build check |
| AI Service Tests | pytest — similarity, A* search, API endpoints (28 tests) |

**Setup — add MongoDB URI as a GitHub secret:**
1. GitHub → repo → Settings → Secrets and variables → Actions
2. New secret → Name: `MONGODB_URI` → Value: your Atlas URI
3. CI uses a separate `careerconnect_test` database — never touches production data
