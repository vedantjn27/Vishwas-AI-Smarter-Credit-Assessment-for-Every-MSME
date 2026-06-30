from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.msme import MSMEProfile
from app.models.user import User, UserRole
from app.schemas.score import HealthCardResponse, HealthScoreRead, ScoreComputeResponse, ScoreHistoryRead
from app.services.scoring_engine import ScoringEngine

router = APIRouter()


def _ensure_score_access(msme_id: int, current_user: User, db: Session) -> None:
    if db.get(MSMEProfile, msme_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MSME profile not found",
        )
    if current_user.role in {UserRole.ADMIN, UserRole.CREDIT_OFFICER}:
        return
    if current_user.role == UserRole.MSME_OWNER and current_user.linked_msme_id == msme_id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this MSME score",
    )


@router.post("/compute/{msme_id}", response_model=ScoreComputeResponse)
def compute_score(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ScoreComputeResponse:
    _ensure_score_access(msme_id, current_user, db)
    engine = ScoringEngine(db)
    result = engine.compute_and_store(msme_id)
    card = engine.build_card(msme_id, score=result.score, result=result)
    return ScoreComputeResponse(
        score=HealthScoreRead.model_validate(result.score),
        card=HealthCardResponse.model_validate(card),
    )


@router.get("/{msme_id}", response_model=HealthScoreRead)
def get_latest_score(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthScoreRead:
    _ensure_score_access(msme_id, current_user, db)
    score = ScoringEngine(db).latest_score(msme_id)
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Score has not been computed yet",
        )
    return HealthScoreRead.model_validate(score)


@router.get("/{msme_id}/history", response_model=list[ScoreHistoryRead])
def get_score_history(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ScoreHistoryRead]:
    _ensure_score_access(msme_id, current_user, db)
    return [ScoreHistoryRead.model_validate(item) for item in ScoringEngine(db).score_history(msme_id)]


@router.get("/{msme_id}/card", response_model=HealthCardResponse)
def get_health_card(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HealthCardResponse:
    _ensure_score_access(msme_id, current_user, db)
    card = ScoringEngine(db).build_card(msme_id)
    return HealthCardResponse.model_validate(card)
