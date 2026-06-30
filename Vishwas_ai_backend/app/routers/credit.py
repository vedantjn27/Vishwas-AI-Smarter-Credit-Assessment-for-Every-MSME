from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.credit import LoanEligibilityCheck
from app.models.msme import MSMEProfile
from app.models.score import HealthScore
from app.models.user import User, UserRole
from app.schemas.credit import BenchmarkResponse, EligibilityCheckRead, EligibilityCheckRequest, PortfolioSummaryResponse
from app.services.rules_engine import RulesEngine
from app.services.scoring_engine import ScoringEngine

router = APIRouter()


def _latest_score(db: Session, msme_id: int) -> HealthScore | None:
    return (
        db.query(HealthScore)
        .filter(HealthScore.msme_id == msme_id)
        .order_by(HealthScore.computed_at.desc(), HealthScore.id.desc())
        .first()
    )


@router.post("/eligibility-check", response_model=EligibilityCheckRead)
def eligibility_check(
    payload: EligibilityCheckRequest,
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)),
    db: Session = Depends(get_db),
) -> LoanEligibilityCheck:
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


@router.get("/portfolio-summary", response_model=PortfolioSummaryResponse)
def portfolio_summary(
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)),
    db: Session = Depends(get_db),
) -> PortfolioSummaryResponse:
    latest_scores: dict[int, HealthScore] = {}
    for score in db.query(HealthScore).order_by(HealthScore.computed_at.asc(), HealthScore.id.asc()).all():
        latest_scores[score.msme_id] = score

    score_distribution = {"0-39": 0, "40-54": 0, "55-69": 0, "70-84": 0, "85-100": 0}
    risk_band_counts: dict = {}
    sector_totals: dict[str, list[Decimal]] = {}
    newly_scoreable_ntc_ntb_count = 0

    for msme_id, score in latest_scores.items():
        value = float(score.overall_score)
        if value >= 85:
            score_distribution["85-100"] += 1
        elif value >= 70:
            score_distribution["70-84"] += 1
        elif value >= 55:
            score_distribution["55-69"] += 1
        elif value >= 40:
            score_distribution["40-54"] += 1
        else:
            score_distribution["0-39"] += 1

        risk_band_counts[score.risk_band] = risk_band_counts.get(score.risk_band, 0) + 1
        msme = db.get(MSMEProfile, msme_id)
        if msme:
            sector_totals.setdefault(msme.sector, []).append(score.overall_score)
            if msme.requested_credit_invisible_flag or msme.udyam_number is None:
                newly_scoreable_ntc_ntb_count += 1

    sector_average_scores = {
        sector: (sum(values, Decimal("0")) / Decimal(len(values))).quantize(Decimal("0.01"))
        for sector, values in sector_totals.items()
    }
    return PortfolioSummaryResponse(
        score_distribution=score_distribution,
        risk_band_counts=risk_band_counts,
        sector_average_scores=sector_average_scores,
        newly_scoreable_ntc_ntb_count=newly_scoreable_ntc_ntb_count,
    )


@router.get("/benchmark/{msme_id}", response_model=BenchmarkResponse)
def benchmark(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BenchmarkResponse:
    msme = db.get(MSMEProfile, msme_id)
    if msme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MSME profile not found")
    if current_user.role == UserRole.MSME_OWNER and current_user.linked_msme_id != msme_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this MSME")

    score = _latest_score(db, msme_id)
    if score is None:
        score = ScoringEngine(db).compute_and_store(msme_id).score

    msme_dimensions = {
        name: Decimal(str(data["score"])).quantize(Decimal("0.01"))
        for name, data in score.dimension_breakdown_json.items()
    }
    sector_scores = []
    for candidate in db.query(MSMEProfile).filter(MSMEProfile.sector == msme.sector).all():
        latest = _latest_score(db, candidate.id)
        if latest:
            sector_scores.append(latest.dimension_breakdown_json)
    sector_average_dimensions: dict[str, Decimal] = {}
    for dimension in msme_dimensions:
        values = [Decimal(str(item[dimension]["score"])) for item in sector_scores if dimension in item]
        sector_average_dimensions[dimension] = (
            sum(values, Decimal("0")) / Decimal(len(values))
        ).quantize(Decimal("0.01")) if values else msme_dimensions[dimension]

    return BenchmarkResponse(
        msme_id=msme_id,
        sector=msme.sector,
        msme_dimensions=msme_dimensions,
        sector_average_dimensions=sector_average_dimensions,
    )
