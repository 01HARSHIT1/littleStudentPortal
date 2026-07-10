# GPro — Enterprise Workforce Management Platform

Centralized MERN application for the full employee lifecycle: recruitment, attendance, leave, payroll, performance, projects, assets, help desk, documents, analytics, and an AI operations assistant.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React (Vite), React Router, Recharts, Axios |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB (Mongoose) |
| Auth | JWT access + refresh tokens, RBAC |
| AI | OpenAI API (mock fallback if no key) |
| Uploads | Multer (+ optional Cloudinary) |

## Project structure

```
gpro/
├── client/          # React frontend (port 5173)
├── server/          # Express API (port 5000)
├── package.json     # Convenience scripts
└── README.md
```

## Prerequisites

- Node.js 18+
- MongoDB (local install, Docker, or [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster)

## Setup

```bash
# From repo root
npm run install:all

# Start MongoDB (pick one)
# Option A — Docker Desktop must be running, then:
docker compose up -d
# Option B — install MongoDB Community and start the service
# Option C — free Atlas cluster: set MONGODB_URI in server/.env
#   Example: mongodb+srv://USER:PASS@cluster.mongodb.net/gpro

# Configure server env (defaults exist in server/.env)
# Copy from server/.env.example if needed

# Seed demo organization, users, and sample data
npm run seed

# Terminal 1 — API (default port 5001; change PORT in server/.env if free)
npm run dev:server

# Terminal 2 — UI
npm run dev:client
```

Open **http://localhost:5173**  
API health: **http://localhost:5001/health**

## Demo accounts

Password for all users: `Secure@123`

| Email | Role |
| --- | --- |
| `superadmin@gpro.com` | Super Admin |
| `admin@acme.com` | Organization Admin |
| `hr@acme.com` | HR Manager |
| `manager@acme.com` | Manager |
| `lead@acme.com` | Team Lead |
| `employee@acme.com` | Employee |
| `finance@acme.com` | Finance |
| `it@acme.com` | IT Administrator |
| `auditor@acme.com` | Auditor |

## Modules

1. **Authentication** — login, JWT, refresh, lockout, profile, password change  
2. **Organization** — departments, designations, holidays, shifts  
3. **Employees** — lifecycle profiles, documents, manager assignment  
4. **Recruitment** — candidates, interviews, AI resume analysis, offer pipeline  
5. **Attendance** — clock in/out, overtime, corrections  
6. **Leave** — apply / approve, balances, holiday calendar  
7. **Payroll** — monthly generation, payslips, finance approval  
8. **Performance** — goals, KPIs, ratings  
9. **Projects & Tasks** — assignments, status tracking  
10. **Assets** — inventory and assignment  
11. **Help Desk** — tickets and comments  
12. **Documents** — repository  
13. **Notifications** — in-app alerts  
14. **Reports** — dashboards and charts  
15. **AI Assistant** — floating chat on every authenticated page  

## API overview

Base URL: `http://localhost:5000/api`

| Prefix | Purpose |
| --- | --- |
| `/auth` | Login, refresh, profile |
| `/employees` | Employee CRUD |
| `/departments`, `/designations` | Org structure |
| `/recruitment` | Candidates |
| `/attendance` | Clock in/out |
| `/leave` | Leave & holidays |
| `/payroll` | Salary runs |
| `/performance` | Reviews |
| `/projects` | Projects & tasks |
| `/assets`, `/tickets`, `/documents` | Ops modules |
| `/notifications` | Alerts |
| `/reports` | Analytics |
| `/ai` | Chat & analysis |

Health check: `GET http://localhost:5000/health`

## Environment variables

See `server/.env.example`:

- `MONGODB_URI` — MongoDB connection string  
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — token secrets  
- `OPENAI_API_KEY` — optional; AI uses intelligent mock replies without it  
- `CLOUDINARY_*` — optional cloud uploads  
- `EMAIL_*` — optional SMTP for notifications  

## Academic notes

- Out of scope (as specified): mobile app, biometrics, banking/tax APIs, multi-language, offline mode  
- Designed for free-tier / student hosting (Render, Railway, Vercel + MongoDB Atlas)  
- Role-based access is enforced on both API and UI navigation  

## License

MIT
