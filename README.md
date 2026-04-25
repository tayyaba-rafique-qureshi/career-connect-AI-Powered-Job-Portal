# CareerConnect — AI-Powered Job Portal

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

### Backend
```bash
cd server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

See `server/.env.example` and `client/.env.example` for required variables.

## Team

| Name | Role |
|---|---|
| [Your Name] | Full Stack + AI Integration |
| [Teammate 1] | Backend + Database |
| [Teammate 2] | Frontend + UI/UX |

## License

MIT
