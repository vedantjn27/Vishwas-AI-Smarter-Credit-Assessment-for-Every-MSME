# Vishwas AI Setup Guide

This guide explains how to run the Vishwas AI backend and frontend locally for development, demos, and manual testing.

## Prerequisites

Install these first:

- Python 3.12 or compatible Python 3.10+
- Node.js 20+ and npm
- PowerShell on Windows
- Git, if cloning the repository

## Repository Layout

```text
.
|-- Vishwas_ai_backend/
|-- Vishwas_ai_frontend/
|-- README.md
|-- SETUP_GUIDE.md
|-- FOLDER_STRUCTURE.md
|-- FEATURES_IMPACT_UNIQUENESS.md
|-- MANUAL_FRONTEND_TESTING_GUIDE.md
|-- PS3_MSME_FinHealth_Implementation_Plan.md
`-- requirements.txt
```

## 1. Backend Setup

From the repository root:

```powershell
cd .\Vishwas_ai_backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Create your environment file:

```powershell
Copy-Item .env.example .env
```

Recommended `.env` values:

```env
MISTRAL_API_KEY=
MISTRAL_MODEL=mistral-large-latest
DATABASE_URL=sqlite:///./msme_health.db
JWT_SECRET_KEY=change_this_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
COLLATERAL_FREE_LOAN_THRESHOLD=2000000
```

Mistral is optional for local demos. If the API key is missing or the request fails, the backend uses fallback text so the product still works.

Start the backend:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Backend URLs:

- Health: `http://127.0.0.1:8000/health`
- Swagger: `http://127.0.0.1:8000/docs`

## 2. Frontend Setup

Open a second terminal from the repository root:

```powershell
cd .\Vishwas_ai_frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend URL:

- App: `http://127.0.0.1:5173`

The frontend API client defaults to `http://127.0.0.1:8000`.

## 3. Demo Credentials

Demo data is hidden from the UI. If the database is empty, logging in as one of these users silently seeds the demo data:

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `password123` |
| Credit Officer | `credit_officer` | `password123` |
| MSME Owner | `owner_1` | `password123` |

Additional seeded owner accounts follow the pattern `owner_2`, `owner_3`, and so on, each using `password123`.

## 4. Manual Testing Flow

Use `MANUAL_FRONTEND_TESTING_GUIDE.md` for the full role-based walkthrough.

Recommended quick smoke test:

1. Open `http://127.0.0.1:5173`.
2. Login as `admin / password123`.
3. Confirm the Admin Dashboard loads.
4. Open Portfolio and confirm MSMEs are visible.
5. Open an MSME Health Card and recompute score.
6. Logout and login as `credit_officer / password123`.
7. Confirm Work Queue, Credit, ULI/OCEN, and Alerts are available.
8. Logout and login as `owner_1 / password123`.
9. Confirm only the linked business is visible.

## 5. Useful Backend Commands

Run the backend:

```powershell
cd .\Vishwas_ai_backend
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Check health:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

Seed data manually:

```powershell
python seed_data.py
```

## 6. Useful Frontend Commands

Run the frontend:

```powershell
cd .\Vishwas_ai_frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Build:

```powershell
npm run build
```

Lint:

```powershell
npm run lint
```

Format:

```powershell
npm run format
```

## 7. Troubleshooting

Backend does not respond:

- Confirm the backend terminal is still running.
- Check `http://127.0.0.1:8000/health`.
- Confirm dependencies were installed inside `Vishwas_ai_backend/.venv`.

Frontend cannot reach backend:

- Confirm backend is on port `8000`.
- Confirm frontend is on port `5173`.
- Refresh after backend startup.

Login fails:

- Try `admin / password123` first to trigger silent demo seeding.
- Check backend logs for database or auth errors.
- If the database was deleted, restart backend and login again.

Port already in use:

- Stop the old backend/frontend process.
- Or run on another port and update the frontend API base in local storage if needed.

Mistral does not respond:

- Add `MISTRAL_API_KEY` to `Vishwas_ai_backend/.env`.
- The app still works without it because fallback insight text is built in.

## 8. What Not To Commit

Generated or local-only files should stay out of git:

- `Vishwas_ai_backend/.venv/`
- `Vishwas_ai_frontend/node_modules/`
- `*.log`
- `__pycache__/`
- `.output/`
- `.tanstack/`
- `.wrangler/`
- `.env`
- `*.db`

