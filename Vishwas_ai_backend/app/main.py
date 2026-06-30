from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_db_and_tables
from app.routers import aa_consent, alerts, auth, credit, data_ingestion, demo, insights, msme, scoring, uli_ocen


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Backend API for MSME financial health scoring, alternate-data ingestion, "
        "credit decision support, and simulated AA/ULI/OCEN integrations."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(msme.router, prefix="/msme", tags=["MSME Profile"])
app.include_router(data_ingestion.router, prefix="/data", tags=["Data Ingestion"])
app.include_router(aa_consent.router, prefix="/aa", tags=["AA Consent Simulation"])
app.include_router(scoring.router, prefix="/score", tags=["Scoring"])
app.include_router(insights.router, prefix="/insights", tags=["AI Insights"])
app.include_router(credit.router, prefix="/credit", tags=["Credit Decision Support"])
app.include_router(uli_ocen.router, tags=["ULI/OCEN Simulation"])
app.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
app.include_router(demo.router, prefix="/demo", tags=["Demo/Admin"])


@app.on_event("startup")
def on_startup() -> None:
    create_db_and_tables()


@app.get("/health", tags=["Demo/Admin"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
