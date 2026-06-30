# Vishwas AI Manual Frontend Testing Guide

Use this guide to manually test the integrated Vishwas AI frontend and backend.

## Local URLs

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://127.0.0.1:8000/health`
- Backend Swagger: `http://127.0.0.1:8000/docs`

## Demo Data Behavior

Demo data is now hidden from users.

- There is no visible Demo tab.
- If demo users do not exist, logging in as `admin`, `credit_officer`, or `owner_1` silently seeds demo data.
- If the admin or credit officer dashboard finds an empty portfolio, it silently seeds demo data in the background.
- Users should experience the app as already populated, not as a seed/reset tool.

Demo credentials:

- Admin: `admin / password123`
- Credit officer: `credit_officer / password123`
- MSME owner: `owner_1 / password123`

## 1. Availability

1. Open `http://127.0.0.1:5173`.
2. Confirm the frontend loads.
3. Open `http://127.0.0.1:8000/health`.
4. Confirm backend returns `status: ok`.

Pass criteria:

- Frontend returns a page.
- Backend health is `ok`.

## 2. Login And Silent Initialization

1. Go to `/login`.
2. Login as `admin / password123`.
3. Confirm login succeeds even if the database was previously empty.
4. Logout.
5. Login as `credit_officer / password123`.
6. Logout.
7. Login as `owner_1 / password123`.

Pass criteria:

- Demo data initializes behind the scenes.
- No page exposes seed/reset controls.
- Top navigation changes based on role.

## 3. Admin Dashboard

1. Login as `admin`.
2. Open `/dashboard`.
3. Confirm the title says Admin Dashboard.
4. Confirm cards show portfolio counts, alerts, NTC/NTB count, and average score.
5. Confirm Admin Actions include:
   - Onboard New MSME
   - Review Full Portfolio
   - Monitor System Alerts

Pass criteria:

- Admin sees onboarding/system oversight actions.
- Admin sees the `Onboard MSME` nav item.
- Admin does not see any seed/reset demo UI.

## 4. Admin MSME Onboarding

1. Login as `admin`.
2. Open `Onboard MSME` from the nav.
3. Fill required fields:
   - Business name
   - Owner name
   - Sector
   - City
   - State
   - Employees
4. Leave Udyam blank to create an NTC/NTB style business.
5. Keep `Mark as credit-invisible / NTC-NTB` checked.
6. Click `Create MSME and Compute Score`.
7. Open the created MSME Health Card from the success panel.

Pass criteria:

- New MSME is created.
- Initial score is computed or clearly marked pending data.
- Created MSME is visible in Portfolio.
- Credit officer cannot access onboarding.

## 5. Credit Officer Dashboard And Work Queue

1. Login as `credit_officer`.
2. Open `/dashboard`.
3. Confirm the title says Credit Officer Dashboard.
4. Confirm the right panel is Work Queue.
5. Check work queue items:
   - Pending NTC/NTB assessment
   - Open alert reviews
   - Eligibility checks
6. Click each queue item and confirm it opens the correct workflow.

Pass criteria:

- Credit officer does not see Onboard MSME.
- Credit officer does not see admin onboarding controls.
- Work Queue focuses on assessment and review tasks.

## 6. MSME Owner Dashboard

1. Login as `owner_1`.
2. Open `/dashboard`.
3. Confirm the dashboard says My Business Health.
4. Confirm it shows only the linked MSME.
5. Confirm owner actions include:
   - View Health Card
   - Add Business Data
   - Ask AI Insights
   - Review My Alerts
6. Try opening `/portfolio`, `/credit`, `/uli`, and `/alerts`.

Pass criteria:

- Owner sees only their linked MSME.
- Owner does not see bank-wide tools in nav.
- Restricted pages show owner-appropriate access messages.

## 7. Portfolio

Admin or credit officer:

1. Open `/portfolio`.
2. Search by business or owner.
3. Filter by sector.
4. Filter by state.
5. Toggle credit-invisible only.
6. Open an MSME detail page.

Pass criteria:

- Portfolio loads with silently initialized data.
- Filters work.
- NTC/NTB businesses are clearly marked.

## 8. MSME Profile

1. Open any MSME detail page.
2. Select Profile.
3. Confirm business, owner, Udyam, sector, location, registration date, employees, and formalized status.
4. Update employee count.
5. Update Udyam number.
6. Save.

Pass criteria:

- Profile updates persist.
- Formalized status changes when Udyam is added.

## 9. Financial Health Card

1. Open an MSME detail page.
2. Select Health Card.
3. Click Recompute Score.
4. Confirm button shows recomputing and then success.
5. Confirm card displays:
   - Overall score
   - Grade
   - Risk band
   - Confidence
   - Data quality
   - Five dimensions
   - Trend
   - Strengths
   - Risks
   - ML second opinion

Pass criteria:

- Recompute works.
- Low-confidence MSMEs show indicative-score messaging.

## 10. Alternate Data Ingestion

Open an MSME detail page and select Data Ingestion.

Test each form:

- GST: submit on-time, then late with delay days.
- UPI: submit credit and debit transactions.
- EPFO: submit on-time, then late or missed.
- Bank: submit credit and debit transactions.
- Note: submit a business note about GST, UPI, cash flow, and employees.

Pass criteria:

- Every form submits.
- Score can be recomputed after new data.
- Late GST/EPFO or consent changes can produce alerts.

## 11. AI Insights

Open MSME detail and select AI Insights.

1. Generate summary.
2. Ask: `Why is this MSME risky?`
3. Run what-if: `GST filings are on time for the next six months`.
4. Load anomalies.

Pass criteria:

- Responses appear in professional cards, not raw generated text or raw JSON.
- Summary, Q&A, what-if, and anomalies are readable.

## 12. AA Consent

1. Open MSME detail.
2. Select AA Consent.
3. Request consent.
4. Approve it.
5. Refresh status.
6. Revoke it.
7. Check alerts.

Pass criteria:

- Consent lifecycle works.
- Simulation label is visible.
- Revocation can create alert.

## 13. Credit Decision Support

Login as admin or credit officer.

1. Open `/credit`.
2. Run eligibility with:
   - MSME ID: a valid ID
   - Loan type: Working Capital
   - Amount: `1500000`
3. Test other loan types:
   - Personal
   - Home
   - Mortgage
   - Auto
4. Run benchmark for an MSME.

Pass criteria:

- Eligibility result, interest band, collateral, and scheme render.
- Portfolio charts render.
- Benchmark comparison renders.

## 14. ULI And OCEN

Login as admin or credit officer.

1. Open `/uli`.
2. Submit ULI loan application.
3. Check application status.
4. Confirm status appears as a formatted card, not raw JSON.
5. Run OCEN assessment.

Pass criteria:

- ULI returns application ID and status.
- OCEN returns decision, risk band, and reason codes.

## 15. Alerts

Login as admin or credit officer.

1. Open `/alerts`.
2. Click an alert.
3. Confirm Alert Details panel shows:
   - MSME ID
   - Alert type
   - Severity
   - Triggered time
   - Message
   - Acknowledged state
4. Acknowledge an open alert.
5. Open MSME detail and select Alerts.
6. Click an MSME-specific alert and confirm the same detail panel behavior.

Pass criteria:

- Alert click opens details.
- Acknowledge updates state.

## 16. Role Separation Checklist

Admin:

- [ ] Sees Admin Dashboard.
- [ ] Sees Onboard MSME.
- [ ] Can create MSMEs.
- [ ] Can browse portfolio.
- [ ] Can use credit, ULI/OCEN, and alerts.
- [ ] Does not see seed/reset demo controls.

Credit officer:

- [ ] Sees Credit Officer Dashboard.
- [ ] Sees Work Queue.
- [ ] Can browse portfolio.
- [ ] Can assess MSMEs and run credit decisions.
- [ ] Cannot access admin onboarding.
- [ ] Does not see seed/reset demo controls.

MSME owner:

- [ ] Sees My Business Health dashboard.
- [ ] Sees only linked MSME.
- [ ] Can view own Health Card, data, insights, AA consent, and alerts.
- [ ] Cannot access portfolio-wide tools.

## 17. End-To-End Demo Script

1. Open frontend.
2. Login as admin.
3. Show Admin Dashboard.
4. Open Onboard MSME.
5. Create a new credit-invisible MSME.
6. Open its Health Card.
7. Add alternate data.
8. Recompute score.
9. Generate AI summary and what-if.
10. Logout and login as credit officer.
11. Show Work Queue.
12. Run eligibility and benchmark.
13. Submit ULI and OCEN assessment.
14. Open Alerts and click one alert for details.
15. Logout and login as owner_1.
16. Show owner-only dashboard and linked MSME view.

## 18. Troubleshooting

Backend health:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

Restart backend:

```powershell
cd .\Vishwas_ai_backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Restart frontend:

```powershell
cd .\Vishwas_ai_frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Common issues:

- If login fails for demo users, refresh and retry; login silently initializes demo data.
- If an MSME has no score, open Health Card and click Recompute Score.
- If owner access looks wrong after database reset, logout and login again as `owner_1`.
- If a page returns 403, confirm you are using the correct role.

