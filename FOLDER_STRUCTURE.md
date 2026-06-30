# Vishwas AI Folder Structure

This file explains where everything lives and why it exists.

## Top-Level Structure

```text
.
|-- Vishwas_ai_backend/
|   |-- app/
|   |-- ml_models/
|   |-- .env.example
|   |-- .gitignore
|   |-- requirements.txt
|   `-- seed_data.py
|
|-- Vishwas_ai_frontend/
|   |-- public/
|   |-- src/
|   |-- .gitignore
|   |-- package.json
|   |-- package-lock.json
|   |-- bun.lock
|   |-- tsconfig.json
|   `-- vite.config.ts
|
|-- README.md
|-- SETUP_GUIDE.md
|-- FOLDER_STRUCTURE.md
|-- FEATURES_IMPACT_UNIQUENESS.md
|-- MANUAL_FRONTEND_TESTING_GUIDE.md
|-- PS3_MSME_FinHealth_Implementation_Plan.md
`-- requirements.txt
```

## Backend: `Vishwas_ai_backend/`

FastAPI backend for scoring, data ingestion, AI insights, authentication, simulated integrations, alerts, and credit decision support.

```text
Vishwas_ai_backend/
|-- app/
|   |-- auth/
|   |-- models/
|   |-- prompts/
|   |-- routers/
|   |-- schemas/
|   |-- services/
|   |-- utils/
|   |-- config.py
|   |-- database.py
|   `-- main.py
|-- ml_models/
|-- .env.example
|-- requirements.txt
`-- seed_data.py
```

### `app/main.py`

Creates the FastAPI app, configures CORS, creates database tables on startup, and registers all routers.

### `app/config.py`

Loads environment-driven settings:

- app name and version
- database URL
- Mistral API settings
- JWT settings
- collateral-free loan threshold
- CORS origins

### `app/database.py`

Defines SQLAlchemy engine, session factory, database dependency, and table creation helper.

### `app/auth/`

Authentication and authorization utilities.

| File | Purpose |
|---|---|
| `security.py` | Password hashing and JWT token creation |
| `dependencies.py` | Current-user extraction and route access helpers |

### `app/models/`

SQLAlchemy ORM models.

| File | Entity |
|---|---|
| `user.py` | Users and roles: admin, credit officer, MSME owner |
| `msme.py` | MSME profiles |
| `gst.py` | GST records |
| `upi.py` | UPI transactions |
| `epfo.py` | EPFO records |
| `bank_statement.py` | AA-style bank transactions |
| `consent.py` | AA consent lifecycle |
| `score.py` | Health score and score history |
| `insight.py` | AI insight records |
| `alert.py` | Alerts |
| `credit.py` | Loan eligibility checks |

### `app/schemas/`

Pydantic request and response schemas for API validation.

### `app/routers/`

HTTP API route modules.

| File | Route Area |
|---|---|
| `auth.py` | Register, login, current user |
| `msme.py` | MSME onboarding, list, detail, update |
| `data_ingestion.py` | GST, UPI, EPFO, bank, unstructured data |
| `aa_consent.py` | AA consent request, approve, revoke, status |
| `scoring.py` | Compute score, score detail, history, health card |
| `insights.py` | Summary, Q&A, what-if, anomalies |
| `credit.py` | Eligibility, portfolio summary, benchmark |
| `uli_ocen.py` | ULI and OCEN simulations |
| `alerts.py` | Alert list, MSME alerts, acknowledge |
| `demo.py` | Hidden demo seed/reset APIs |

### `app/services/`

Business logic layer.

| File | Purpose |
|---|---|
| `scoring_engine.py` | Weighted financial health score, confidence, health card |
| `rules_engine.py` | Credit eligibility rules, scheme and collateral recommendation |
| `ml_risk_classifier.py` | scikit-learn risk model training/inference |
| `mistral_service.py` | AI summary, Q&A, what-if, anomaly text with fallbacks |
| `anomaly_detector.py` | Rule-based anomaly detection |
| `synthetic_data_generator.py` | Demo MSME and alternate-data generation |

### `ml_models/`

Storage location for persisted ML models such as `.joblib` or `.pkl` files. These are ignored by git because they are generated artifacts.

### `seed_data.py`

Standalone script for seeding demo data manually.

## Frontend: `Vishwas_ai_frontend/`

React frontend for role-based dashboards, workflows, and visual credit intelligence.

```text
Vishwas_ai_frontend/
|-- public/
|   `-- media/
|-- src/
|   |-- components/
|   |-- hooks/
|   |-- lib/
|   |-- routes/
|   |-- routeTree.gen.ts
|   |-- router.tsx
|   |-- server.ts
|   |-- start.ts
|   `-- styles.css
|-- package.json
|-- package-lock.json
|-- bun.lock
|-- tsconfig.json
`-- vite.config.ts
```

### `public/media/`

Project visual assets used by the app and README.

### `src/routes/`

TanStack Router route files.

| File | Page |
|---|---|
| `index.tsx` | Public landing/about page |
| `login.tsx` | Login |
| `signup.tsx` | Signup |
| `_app.tsx` | Authenticated app layout |
| `_app.dashboard.tsx` | Role-based dashboard |
| `_app.demo.tsx` | Admin MSME onboarding page |
| `_app.portfolio.tsx` | Portfolio browser |
| `_app.msme.$id.tsx` | MSME detail, health card, data, insights, AA, alerts |
| `_app.credit.tsx` | Credit decision support |
| `_app.uli.tsx` | ULI and OCEN simulation UI |
| `_app.alerts.tsx` | Portfolio alert review |

### `src/lib/`

Shared frontend logic.

| File | Purpose |
|---|---|
| `api.ts` | Typed API client and response interfaces |
| `auth.tsx` | Auth context, token storage, silent demo seeding |
| `theme.tsx` | Theme provider and toggle |
| `utils.ts` | UI utility helpers |
| `error-page.ts` | Error display |
| `error-capture.ts` | Client-side error capture |

### `src/components/`

Application components and UI primitives. `TopNav.tsx` controls role-based navigation:

- Admin: Dashboard, Onboard MSME, Portfolio, Credit, ULI/OCEN, Alerts
- Credit Officer: Dashboard, Portfolio, Credit, ULI/OCEN, Alerts
- MSME Owner: Dashboard only, with owner workflows inside the linked MSME view

### `src/components/ui/`

Reusable UI primitives based on Radix-style components.

## Documentation Files

| File | Purpose |
|---|---|
| `README.md` | Main project overview and pitch-ready narrative |
| `SETUP_GUIDE.md` | Local install, run, demo login, troubleshooting |
| `FOLDER_STRUCTURE.md` | Repository structure and ownership map |
| `FEATURES_IMPACT_UNIQUENESS.md` | Feature impact and differentiation |
| `MANUAL_FRONTEND_TESTING_GUIDE.md` | Manual QA checklist for frontend and backend workflows |
| `PS3_MSME_FinHealth_Implementation_Plan.md` | Original implementation plan and backend blueprint |
| `requirements.txt` | Root Python dependency list for convenience |

