from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.alert import Alert
from app.models.msme import MSMEProfile
from app.models.user import User, UserRole
from app.schemas.alert import AlertAcknowledgeResponse, AlertRead

router = APIRouter()


def _ensure_alert_access(msme_id: int, current_user: User, db: Session) -> None:
    if db.get(MSMEProfile, msme_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="MSME profile not found")
    if current_user.role in {UserRole.ADMIN, UserRole.CREDIT_OFFICER}:
        return
    if current_user.role == UserRole.MSME_OWNER and current_user.linked_msme_id == msme_id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to these alerts")


@router.get("/", response_model=list[AlertRead])
def list_portfolio_alerts(
    acknowledged: bool | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)),
    db: Session = Depends(get_db),
) -> list[Alert]:
    query = db.query(Alert)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)
    return query.order_by(Alert.triggered_at.desc(), Alert.id.desc()).limit(limit).all()


@router.get("/{msme_id}", response_model=list[AlertRead])
def list_msme_alerts(
    msme_id: int,
    acknowledged: bool | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Alert]:
    _ensure_alert_access(msme_id, current_user, db)
    query = db.query(Alert).filter(Alert.msme_id == msme_id)
    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)
    return query.order_by(Alert.triggered_at.desc(), Alert.id.desc()).all()


@router.post("/{alert_id}/acknowledge", response_model=AlertAcknowledgeResponse)
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlertAcknowledgeResponse:
    alert = db.get(Alert, alert_id)
    if alert is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    _ensure_alert_access(alert.msme_id, current_user, db)
    alert.acknowledged = True
    db.commit()
    return AlertAcknowledgeResponse(id=alert.id, acknowledged=alert.acknowledged)
