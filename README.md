# CareerConnect — AI-Powered Job Portal

> ⚠️ **This project is currently in active development.** Features are being added and improved regularly. Not all functionality is complete.

A full-stack job portal that uses AI to match applicants with jobs based on skills, experience, and preferences — not just keywords.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| AI Service | Python + FastAPI |
| Auth | JWT + Google OAuth 2.0 |
| Email | Nodemailer (Gmail) → Resend (production) |
| File Storage | Cloudflare R2 (planned) |

## Features

- Role-based auth — Applicant, Employer, Admin
- Google OAuth sign-in
- Multi-step onboarding (Indeed-style)
- AI-powered job matching using cosine similarity
- Resume upload and text extraction
- Application tracking with status updates
- Automated email notifications
- Admin dashboard with platform analytics
- Public landing page

## Project Structure

```
careerconnect/
├── client/          # React frontend (Vite)
├── server/          # Node.js + Express API
└── ai-service/      # Python FastAPI microservice
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account

### 1. Clone the repo
```bash
git clone https://github.com/tayyaba-rafique-qureshi/career-connect-AI-Powered-Job-Portal.git
cd career-connect-AI-Powered-Job-Portal
```

### 2. Backend setup
```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### 3. AI Service setup
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. Frontend setup
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

Copy `.env.example` to `.env` in both `server/` and `client/` and fill in:

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Any strong random string |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_APP_PASSWORD` | 16-char Gmail App Password |
| `CLIENT_URL` | Frontend URL (e.g. http://localhost:3001) |

## Team

| Name 
|---|
| Tayyaba Rafique 
| Samreen Farhat 
| Umama Hidayat

## Status

- [x] Authentication (JWT + Google OAuth)
- [x] Onboarding flow
- [x] Landing page
- [x] Email notifications
- [ ] Job posting (in progress)
- [ ] AI matching integration (in progress)
- [ ] Resume upload via Cloudflare R2 (planned)
- [ ] Deployment (planned)
