from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.insight import Insight, InsightType
from app.models.msme import MSMEProfile
from app.models.user import User, UserRole
from app.schemas.insight import AskQuestionRequest, InsightRead, InsightResponse, WhatIfRequest
from app.services.anomaly_detector import AnomalyDetector
from app.services.mistral_service import MistralService
from app.services.scoring_engine import ScoringEngine

router = APIRouter()


def _ensure_insight_access(msme_id: int, current_user: User, db: Session) -> MSMEProfile:
    msme = db.get(MSMEProfile, msme_id)
    if msme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MSME profile not found")
    if current_user.role in {UserRole.ADMIN, UserRole.CREDIT_OFFICER}:
        return msme
    if current_user.role == UserRole.MSME_OWNER and current_user.linked_msme_id == msme_id:
        return msme
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this MSME")


def _msme_payload(msme: MSMEProfile) -> dict:
    return {
        "id": msme.id,
        "business_name": msme.business_name,
        "sector": msme.sector,
        "sub_sector": msme.sub_sector,
        "city": msme.city,
        "state": msme.state,
        "employee_count": msme.employee_count,
        "udyam_registered": bool(msme.udyam_number),
        "credit_invisible": msme.requested_credit_invisible_flag,
    }


def _score_payload(card: dict) -> dict:
    return {
        "overall_score": str(card["overall_score"]),
        "grade": card["grade"].value,
        "risk_band": card["risk_band"].value,
        "confidence_score": str(card["confidence_score"]),
        "dimensions": card["dimensions"],
        "top_strengths": card["top_strengths"],
        "top_risks": card["top_risks"],
    }


def _simulate_what_if(original: dict, change_description: str) -> dict:
    from decimal import Decimal

    weights = {
        "Cash Flow Stability": Decimal("0.25"),
        "Compliance Health": Decimal("0.25"),
        "Statutory Stability": Decimal("0.15"),
        "Banking Behavior": Decimal("0.25"),
        "Digital Footprint": Decimal("0.10"),
    }
    text = change_description.lower()
    dimensions = []
    for item in original["dimensions"]:
        score = Decimal(str(item["score"]))
        name = item["name"]
        boost = Decimal("0")
        if "gst" in text and name == "Compliance Health":
            boost = Decimal("8")
        elif ("cash" in text or "upi" in text or "sales" in text) and name == "Cash Flow Stability":
            boost = Decimal("6")
        elif ("epfo" in text or "employee" in text or "staff" in text) and name == "Statutory Stability":
            boost = Decimal("6")
        elif ("bank" in text or "bounce" in text or "overdraft" in text) and name == "Banking Behavior":
            boost = Decimal("7")
        elif ("udyam" in text or "formal" in text or "digital" in text) and name == "Digital Footprint":
            boost = Decimal("6")
        new_score = min(Decimal("100"), score + boost).quantize(Decimal("0.01"))
        dimensions.append({"name": name, "score": str(new_score), "weight": str(item["weight"])})

    overall = sum(Decimal(item["score"]) * weights[item["name"]] for item in dimensions).quantize(Decimal("0.01"))
    simulated = dict(original)
    simulated["overall_score"] = str(overall)
    simulated["dimensions"] = dimensions
    return simulated


def _store_insight(db: Session, msme_id: int, insight_type: InsightType, content: str) -> Insight:
    from datetime import datetime

    insight = Insight(msme_id=msme_id, generated_at=datetime.utcnow(), insight_type=insight_type, content_text=content)
    db.add(insight)
    db.commit()
    db.refresh(insight)
    return insight


@router.get("/{msme_id}/summary", response_model=InsightRead)
def get_summary(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Insight:
    msme = _ensure_insight_access(msme_id, current_user, db)
    engine = ScoringEngine(db)
    card = engine.build_card(msme_id)
    content = MistralService().generate_summary(_msme_payload(msme), _score_payload(card))
    return _store_insight(db, msme_id, InsightType.SUMMARY, content)


@router.post("/{msme_id}/ask", response_model=InsightResponse)
def ask_question(
    msme_id: int,
    payload: AskQuestionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InsightResponse:
    msme = _ensure_insight_access(msme_id, current_user, db)
    card = ScoringEngine(db).build_card(msme_id)
    content = MistralService().answer_question(_msme_payload(msme), _score_payload(card), payload.question)
    _store_insight(db, msme_id, InsightType.QA, content)
    return InsightResponse(msme_id=msme_id, insight_type=InsightType.QA, content_text=content)


@router.post("/{msme_id}/what-if", response_model=InsightResponse)
def explain_what_if(
    msme_id: int,
    payload: WhatIfRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InsightResponse:
    _ensure_insight_access(msme_id, current_user, db)
    card = ScoringEngine(db).build_card(msme_id)
    original = _score_payload(card)
    hypothetical = _simulate_what_if(original, payload.change_description)
    content = MistralService().explain_whatif(original, hypothetical, payload.change_description)
    _store_insight(db, msme_id, InsightType.WHATIF, content)
    return InsightResponse(msme_id=msme_id, insight_type=InsightType.WHATIF, content_text=content)


@router.get("/{msme_id}/anomalies", response_model=list[InsightResponse])
def get_anomaly_insights(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[InsightResponse]:
    _ensure_insight_access(msme_id, current_user, db)
    engine = ScoringEngine(db)
    gst_records = engine._gst_records(msme_id)
    upi_transactions = engine._upi_transactions(msme_id)
    epfo_records = engine._epfo_records(msme_id)
    anomalies = AnomalyDetector().detect(gst_records, upi_transactions, epfo_records)
    service = MistralService()
    responses = []
    for anomaly in anomalies:
        content = service.explain_anomaly(anomaly.anomaly_type, anomaly.supporting_data)
        _store_insight(db, msme_id, InsightType.ANOMALY, content)
        responses.append(InsightResponse(msme_id=msme_id, insight_type=InsightType.ANOMALY, content_text=content))
    return responses
