from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.consent import ConsentRecord, ConsentStatus
from app.models.msme import MSMEProfile
from app.models.user import User, UserRole
from app.schemas.consent import ConsentRead, ConsentRequest, ConsentStatusResponse

router = APIRouter()


def _ensure_consent_access(msme_id: int, current_user: User, db: Session) -> MSMEProfile:
    msme = db.get(MSMEProfile, msme_id)
    if msme is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MSME profile not found")
    if current_user.role in {UserRole.ADMIN, UserRole.CREDIT_OFFICER}:
        return msme
    if current_user.role == UserRole.MSME_OWNER and current_user.linked_msme_id == msme_id:
        return msme
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this MSME")


def _get_consent(consent_id: str, db: Session) -> ConsentRecord:
    consent = db.query(ConsentRecord).filter(ConsentRecord.consent_id == consent_id).first()
    if consent is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent record not found")
    return consent


@router.post("/consent/request", response_model=ConsentRead, status_code=status.HTTP_201_CREATED)
def request_consent(
    payload: ConsentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConsentRecord:
    _ensure_consent_access(payload.msme_id, current_user, db)
    consent = ConsentRecord(
        msme_id=payload.msme_id,
        fip_name=payload.fip_name,
        purpose=payload.purpose,
        status=ConsentStatus.REQUESTED,
        requested_at=datetime.utcnow(),
        expires_at=payload.expires_at or datetime.utcnow() + timedelta(days=180),
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent


@router.post("/consent/{consent_id}/approve", response_model=ConsentStatusResponse)
def approve_consent(
    consent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConsentStatusResponse:
    consent = _get_consent(consent_id, db)
    _ensure_consent_access(consent.msme_id, current_user, db)
    consent.status = ConsentStatus.ACTIVE
    db.commit()
    return ConsentStatusResponse(consent_id=consent.consent_id, status=consent.status)


@router.post("/consent/{consent_id}/revoke", response_model=ConsentStatusResponse)
def revoke_consent(
    consent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConsentStatusResponse:
    consent = _get_consent(consent_id, db)
    _ensure_consent_access(consent.msme_id, current_user, db)
    consent.status = ConsentStatus.REVOKED
    db.add(
        Alert(
            msme_id=consent.msme_id,
            triggered_at=datetime.utcnow(),
            alert_type=AlertType.CONSENT_REVOKED,
            severity=AlertSeverity.MEDIUM,
            message=f"AA consent {consent.consent_id} was revoked.",
            acknowledged=False,
        )
    )
    db.commit()
    return ConsentStatusResponse(consent_id=consent.consent_id, status=consent.status)


@router.get("/consent/{consent_id}/status", response_model=ConsentStatusResponse)
def consent_status(
    consent_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConsentStatusResponse:
    consent = _get_consent(consent_id, db)
    _ensure_consent_access(consent.msme_id, current_user, db)
    if consent.status not in {ConsentStatus.REVOKED, ConsentStatus.EXPIRED} and consent.expires_at < datetime.utcnow():
        consent.status = ConsentStatus.EXPIRED
        db.commit()
    return ConsentStatusResponse(consent_id=consent.consent_id, status=consent.status)
