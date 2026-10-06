# 🎓 AI-Powered Student Attendance Management & Predictive Risk Assistant

A full-stack web application that transforms traditional manual attendance tracking into an automated, AI-assisted platform — powered by **Google Gemini 2.5 Flash**.

![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20TypeScript-blue)
![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)
![DB](https://img.shields.io/badge/DB-Supabase%20%2F%20In--Memory-green)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Live Dashboard** | Real-time class overview — attendance percentages, risk counts, session history |
| 👩‍🎓 **Student Management** | Add, edit, and organize students per class with roll numbers and parent contacts |
| 📋 **Attendance Tracking** | Mark daily attendance (Present / Absent / Late / Excused) with bulk session support |
| 🤖 **AI Risk Analysis** | Gemini 2.5 Flash analyzes patterns, detects chronic absenteeism, outputs CRITICAL / MODERATE / LOW risk |
| 📧 **Parent Communication** | AI-generated empathetic parent email drafts with adjustable tone |
| 📈 **Analytics & Reports** | Visual charts, threshold breach detection, downloadable CSV/PDF reports |
| 🔒 **Auth & Security** | Role-based access (TEACHER / ADMIN) with Supabase RLS policies |

---

## 🏗️ Tech Stack

### Frontend (`/client`)
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** — utility-first styling
- **Zustand** — global state management
- **React Query** — server state & caching
- **Recharts** — attendance analytics charts
- **jsPDF** + **AutoTable** — PDF report exports

### Backend (`/server`)
- **Node.js** + **Express** + **TypeScript**
- **Google Gemini 2.5 Flash** (`@google/genai`) — AI risk analysis & parent drafts
- **Supabase** (`@supabase/supabase-js`) — PostgreSQL + RLS (falls back to in-memory store)
- **Zod** — strict runtime validation on all API inputs/outputs
- **Helmet** + **CORS** — hardened security middleware

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- A [Google AI Studio API Key](https://aistudio.google.com/app/apikey) (Gemini)
- *(Optional)* A [Supabase](https://supabase.com) project

### 1. Clone the repo
```bash
git clone https://github.com/rakshithchintu/attendance-poartal.git
cd attendance-poartal
```

### 2. Set up the server
```bash
cd server
cp .env.example .env        # Copy template, then fill in your keys
npm install
npm run dev                 # Starts on http://localhost:5000
```

### 3. Set up the client
```bash
cd ../client
cp .env.example .env        # Copy template
npm install
npm run dev                 # Starts on http://localhost:5173
```

### 4. (Optional) Apply Supabase schema
```bash
# In your Supabase dashboard → SQL Editor, run:
supabase/schema.sql         # Creates tables + RLS policies
supabase/seed.sql           # Inserts sample data
```

---

## 🔐 Environment Variables

### Server (`server/.env`)
| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 5000) |
| `NODE_ENV` | No | `development` / `production` |
| `GEMINI_API_KEY` | **Yes** | Google AI Studio API key |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (server-side only) |

> **Note:** If `SUPABASE_URL` is not set, the app automatically uses the built-in in-memory data store with 10 demo students, 20 sessions, and 200 attendance records — fully functional with no setup required.

### Client (`client/.env`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Backend URL (default: `http://localhost:5000`) |
| `VITE_SUPABASE_URL` | No | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase public anon key |

---

## 📁 Project Structure

```
attendance-poartal/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Dashboard, Students, Attendance, Analytics
│   │   ├── stores/          # Zustand state stores
│   │   ├── lib/             # API client, utilities
│   │   └── types/           # Shared TypeScript types
│   ├── .env.example         # Environment template
│   └── vite.config.ts
│
├── server/                  # Express + TypeScript backend
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # Express routers
│   │   ├── lib/             # Gemini AI, Supabase/MemoryStore
│   │   ├── middleware/       # Auth, error handling
│   │   └── schemas/         # Zod validation schemas
│   └── .env.example         # Environment template
│
└── supabase/                # Database schema & seed data
    ├── schema.sql           # Tables + RLS policies
    └── seed.sql             # Sample data
```

---

## 🤖 AI Capabilities

The system uses **Gemini 2.5 Flash** in two ways:

1. **Risk Analysis** — Analyzes 30-day attendance history per student, identifies patterns (Friday absences, streaks, LATE trends), and outputs structured JSON: `riskLevel`, `calculatedPercentage`, `primaryRiskFactors`, `analysisSummary`, `recommendedActions`.

2. **Parent Communication** — Generates professional, empathetic email drafts with subject line, body, and meeting discussion points — calibrated by tone (Formal / Empathetic / Urgent).

> If the Gemini API is unavailable, the system falls back to a built-in deterministic analytical engine — ensuring zero downtime.

---

## 📄 License

MIT — feel free to use, modify, and distribute.

---

*Built with ❤️ using Google Gemini AI, React, and Node.js*
