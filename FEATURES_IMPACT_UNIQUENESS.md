# Vishwas AI Features, Impact, and Uniqueness

Vishwas AI is not only a scoring engine. It is an end-to-end credit intelligence workflow that helps banks assess MSMEs, helps MSMEs understand their credit readiness, and shows how India's digital public infrastructure style signals can support inclusive lending.

## 1. Alternate Data Ingestion

### What It Does

Captures business signals from: 

- GST records
- UPI transactions
- EPFO records
- Bank statements through AA-style data
- Unstructured business notes

### Impact

Many MSMEs cannot present perfect audited statements, but they do leave operational traces. Alternate data turns those traces into assessment evidence.

### Uniqueness

The platform treats missing traditional documents as a data-quality challenge, not as an automatic rejection reason.

## 2. Financial Health Card

### What It Does

Creates a single chart-ready profile with:

- Overall score
- Grade
- Risk band
- Confidence score
- Data quality label
- Five dimension scores
- Score trend
- Strengths
- Risks
- ML second opinion

### Impact

The Health Card gives credit officers and MSME owners a shared, understandable view of business health.

### Uniqueness

It combines a numeric score with explainability and confidence, so the user knows both what the system thinks and how much evidence supports that assessment.

## 3. Explainable Scoring Engine

### What It Does

Computes score using transparent dimensions:

| Dimension | Business Meaning |
|---|---|
| Cash Flow Stability | Whether inflows and outflows are steady enough to support repayment |
| Compliance Health | Whether GST filing and declared turnover behavior are reliable |
| Statutory and Workforce Stability | Whether EPFO and employee patterns look stable |
| Banking Behavior | Whether bank statement behavior shows discipline |
| Digital Footprint and Formalization | Whether the MSME has digital and formal identity signals |

### Impact

Banking decisions need defensibility. Explainable scoring makes the model easier to audit, challenge, and improve.

### Uniqueness

The LLM does not decide the score. It explains a deterministic score. That makes the project more credible for regulated credit workflows.

## 4. Confidence Score for NTC/NTB MSMEs

### What It Does

Measures how complete and mature the available data is. Sparse-data businesses receive indicative scoring and next-best data guidance.

### Impact

New-to-Credit and New-to-Bank MSMEs are not unfairly discarded just because they lack full history.

### Uniqueness

Most credit-score demos assume complete data. Vishwas AI explicitly models uncertainty and turns it into an onboarding path.

## 5. AI Insights

### What It Does

Provides:

- Score summaries
- Free-form Q&A
- What-if explanations
- Anomaly explanations

### Impact

Credit officers get faster interpretation. MSME owners get understandable improvement guidance.

### Uniqueness

AI is used as a reasoning and communication layer, not as an untraceable decision-maker. Fallback text keeps demos and workflows reliable even without live AI access.

## 6. ML Risk Cross-Check

### What It Does

Uses a scikit-learn model to produce a second risk opinion and flags material divergence from the rule-based score.

### Impact

Credit teams can prioritize cases where the explainable rules and ML model disagree.

### Uniqueness

The ML model acts like a second reviewer, not the final authority. This is a practical pattern for responsible AI in lending.

## 7. Role-Based Frontend

### What It Does

Provides separate experiences for:

| Role | Experience |
|---|---|
| Admin | Onboarding, portfolio oversight, system alert monitoring |
| Credit Officer | Work queue, assessment, eligibility, benchmark, ULI/OCEN, alerts |
| MSME Owner | Linked-business dashboard, health card, data, insights, consent, alerts |

### Impact

The system feels like a real bank product rather than a generic dashboard.

### Uniqueness

Each role sees only relevant actions, which improves trust, reduces clutter, and protects sensitive portfolio-wide workflows.

## 8. Credit Decision Support

### What It Does

Runs eligibility checks using score, confidence, loan type, requested amount, collateral threshold, and scheme logic.

### Impact

Credit officers get decision support that connects score outputs to lending actions.

### Uniqueness

The system does not stop at "risk is medium." It explains what decision path, collateral treatment, and scheme recommendation may fit.

## 9. Portfolio Intelligence

### What It Does

Aggregates:

- Score distribution
- Risk band counts
- Sector-wise average score
- Newly scoreable NTC/NTB count

### Impact

Banks can monitor inclusion and portfolio quality together.

### Uniqueness

The project measures credit access expansion as a product outcome, not only model accuracy.

## 10. Alerts and Monitoring

### What It Does

Flags:

- Score drops
- Compliance issues
- Anomalies
- AA consent changes

### Impact

Credit monitoring becomes continuous instead of one-time.

### Uniqueness

Alerts make the platform useful after onboarding, helping banks track portfolio quality over time.

## 11. AA Consent Simulation

### What It Does

Implements:

- Consent request
- Consent approval
- Consent revocation
- Consent status

### Impact

Demonstrates how consent-based data access can support MSME credit intelligence.

### Uniqueness

It is clearly simulated but shaped like a real integration, making the architecture credible without requiring live financial data credentials.

## 12. ULI and OCEN Simulation

### What It Does

Supports:

- ULI-style loan application
- ULI application status
- OCEN-style credit assessment

### Impact

Shows how Vishwas AI could plug into digital lending workflows.

### Uniqueness

The platform connects score computation to a larger lending ecosystem, not just an isolated API.

## 13. Silent Demo Initialization

### What It Does

When demo users are missing, login silently seeds the database. If an admin or credit officer opens an empty portfolio, demo data can be initialized in the background.

### Impact

The app feels production-like during demos because users are not exposed to seed/reset controls.

### Uniqueness

It improves presentation quality while preserving reproducible demo data.

## 14. Business Impact Summary

For MSMEs:

- More inclusive assessment
- Clearer credit-readiness guidance
- Better understanding of formalization and compliance impact

For banks:

- Faster credit triage
- Better portfolio monitoring
- Explainable and auditable decision support
- Human-in-the-loop AI workflows

For the ecosystem:

- A practical demonstration of alternate-data lending
- A bridge between AA, UPI, GST, EPFO, ULI, and OCEN-style flows
- A product narrative aligned with inclusive digital credit

## 15. Final Differentiator

Vishwas AI is powerful because it does not confuse automation with trust. It earns trust by showing the data, explaining the score, measuring confidence, respecting roles, and keeping humans in the lending loop.

