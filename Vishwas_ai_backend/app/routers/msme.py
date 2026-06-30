from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.database import get_db
from app.models.msme import MSMEProfile
from app.models.user import User, UserRole
from app.schemas.msme import MSMECreate, MSMEListResponse, MSMERead, MSMEUpdate

router = APIRouter()


def _ensure_msme_access(msme_id: int, current_user: User) -> None:
    if current_user.role in {UserRole.ADMIN, UserRole.CREDIT_OFFICER}:
        return
    if current_user.role == UserRole.MSME_OWNER and current_user.linked_msme_id == msme_id:
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this MSME profile",
    )


@router.post(
    "/onboard",
    response_model=MSMERead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(UserRole.ADMIN))],
)
def onboard_msme(payload: MSMECreate, db: Session = Depends(get_db)) -> MSMEProfile:
    if payload.udyam_number:
        existing_msme = db.query(MSMEProfile).filter(MSMEProfile.udyam_number == payload.udyam_number).first()
        if existing_msme:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Udyam number already exists",
            )

    msme = MSMEProfile(**payload.model_dump())
    db.add(msme)
    db.commit()
    db.refresh(msme)
    return msme


@router.get("/", response_model=MSMEListResponse)
def list_msmes(
    sector: str | None = Query(default=None),
    state: str | None = Query(default=None),
    credit_invisible: bool | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.CREDIT_OFFICER)),
    db: Session = Depends(get_db),
) -> MSMEListResponse:
    query = db.query(MSMEProfile)
    if sector:
        query = query.filter(MSMEProfile.sector == sector)
    if state:
        query = query.filter(MSMEProfile.state == state)
    if credit_invisible is not None:
        query = query.filter(MSMEProfile.requested_credit_invisible_flag == credit_invisible)

    total = query.count()
    items = query.order_by(MSMEProfile.id).offset(offset).limit(limit).all()
    return MSMEListResponse(
        total=total,
        limit=limit,
        offset=offset,
        items=[MSMERead.model_validate(item) for item in items],
    )


@router.get("/{msme_id}", response_model=MSMERead)
def get_msme(
    msme_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MSMEProfile:
    _ensure_msme_access(msme_id, current_user)
    msme = db.get(MSMEProfile, msme_id)
    if msme is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MSME profile not found",
        )
    return msme


@router.put("/{msme_id}", response_model=MSMERead)
def update_msme(
    msme_id: int,
    payload: MSMEUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MSMEProfile:
    _ensure_msme_access(msme_id, current_user)
    msme = db.get(MSMEProfile, msme_id)
    if msme is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MSME profile not found",
        )

    update_data = payload.model_dump(exclude_unset=True)
    new_udyam_number = update_data.get("udyam_number")
    if new_udyam_number:
        existing_msme = (
            db.query(MSMEProfile)
            .filter(MSMEProfile.udyam_number == new_udyam_number, MSMEProfile.id != msme_id)
            .first()
        )
        if existing_msme:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Udyam number already exists",
            )

    for field, value in update_data.items():
        setattr(msme, field, value)

    db.commit()
    db.refresh(msme)
    return msme
