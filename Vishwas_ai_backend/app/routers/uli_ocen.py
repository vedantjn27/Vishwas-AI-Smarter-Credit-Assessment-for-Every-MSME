from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.database import get_db
from app.models.credit import EligibilityResult, LoanEligibilityCheck
from app.models.msme import MSMEProfile
from app.models.score import HealthScore
from app.models.user import User, UserRole
from app.schemas.credit import (
    EligibilityCheckRead,
    OcenCreditAssessmentRequest,
    OcenCreditAssessmentResponse,
    UliLoanApplicationRequest,
    UliLoanApplicationResponse,
)
from app.services.rules_engine import RulesEngine
from app.services.scoring_engine import ScoringEngine


router = APIRouter()

_LOAN_APPLICATIONS: dict[str, dict[str, str | int | bool]] = {}


def _latest_score(db: Session, msme_id: int) -> HealthScore | None:
    return (
        db.query(HealthScore)
        .filter(HealthScore.msme_id == msme_id)
        .order_by(HealthScore.computed_at.desc(), HealthScore.id.desc())
        .first()
    )


def _create_eligibility_check(db: Session, payload: UliLoanApplicationRequest | OcenCreditAssessmentRequest) -> LoanEligibilityCheck:
    msme = db.get(MSMEProfile, payload.msme_id)
    if msme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MSME profile not found")

    score = _latest_score(db, payload.msme_id)
    if score is None:
        score = ScoringEngine(db).compute_and_store(payload.msme_id).score

    decision = RulesEngine().evaluate(msme, score, payload.loan_type, payload.requested_amount)
    check = LoanEligibilityCheck(
        msme_id=payload.msme_id,
        loan_type=decision.loan_type,
        requested_amount=decision.requested_amount,
        eligibility_result=decision.eligibility_result,
        recommended_interest_band=decision.recommended_interest_band,
        collateral_required=decision.collateral_required,
        recommended_scheme=decision.recommended_scheme,
        checked_at=decision.checked_at,
    )
    db.add(check)
    db.commit()
    db.refresh(check)
    return check


@router.post("/uli/loan-application", response_model=UliLoanApplicationResponse)
def create_uli_loan_application(
    payload: UliLoanApplicationRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)),
    db: Session = Depends(get_db),
) -> UliLoanApplicationResponse:
    check = _create_eligibility_check(db, payload)
    application_id = f"ULI-{uuid4().hex[:12].upper()}"
    status_value = "approved" if check.eligibility_result == EligibilityResult.ELIGIBLE else "under_review"
    _LOAN_APPLICATIONS[application_id] = {
        "application_id": application_id,
        "msme_id": payload.msme_id,
        "status": status_value,
        "simulation": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    return UliLoanApplicationResponse(
        application_id=application_id,
        status=status_value,
        eligibility=EligibilityCheckRead.model_validate(check),
    )


@router.get("/uli/loan-application/{application_id}/status")
def get_uli_loan_application_status(
    application_id: str,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)),
) -> dict[str, str | int | bool]:
    application = _LOAN_APPLICATIONS.get(application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan application not found in simulation store")
    return application


@router.post("/ocen/credit-assessment", response_model=OcenCreditAssessmentResponse)
def ocen_credit_assessment(
    payload: OcenCreditAssessmentRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)),
    db: Session = Depends(get_db),
) -> OcenCreditAssessmentResponse:
    check = _create_eligibility_check(db, payload)
    score = _latest_score(db, payload.msme_id)
    if score is None:
        score = ScoringEngine(db).compute_and_store(payload.msme_id).score
    return OcenCreditAssessmentResponse(
        decision=check.eligibility_result,
        risk_band=score.risk_band,
        reason_codes=[
            f"eligibility:{check.eligibility_result.value}",
            f"scheme:{check.recommended_scheme.value}",
            f"collateral_required:{str(check.collateral_required).lower()}",
            f"confidence:{score.confidence_score}",
        ],
    )
