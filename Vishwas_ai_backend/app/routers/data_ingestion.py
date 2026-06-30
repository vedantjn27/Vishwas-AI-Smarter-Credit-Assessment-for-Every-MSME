from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.bank_statement import BankStatement
from app.models.epfo import EpfoRecord
from app.models.gst import GstRecord
from app.models.gst import FilingStatus
from app.models.msme import MSMEProfile
from app.models.upi import UpiTransaction
from app.models.user import User, UserRole
from app.models.epfo import EpfoComplianceStatus
from app.schemas.data_records import (
    BankStatementCreate,
    BankStatementRead,
    EpfoRecordCreate,
    EpfoRecordRead,
    GstRecordCreate,
    GstRecordRead,
    UnstructuredDataRequest,
    UnstructuredDataResponse,
    UpiTransactionCreate,
    UpiTransactionRead,
)
from app.services.mistral_service import MistralService

router = APIRouter()


def _create_compliance_alert(db: Session, msme_id: int, message: str, severity: AlertSeverity) -> None:
    from datetime import datetime

    db.add(
        Alert(
            msme_id=msme_id,
            triggered_at=datetime.utcnow(),
            alert_type=AlertType.COMPLIANCE_BREACH,
            severity=severity,
            message=message,
            acknowledged=False,
        )
    )


def _get_accessible_msme(msme_id: int, current_user: User, db: Session) -> MSMEProfile:
    msme = db.get(MSMEProfile, msme_id)
    if msme is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MSME profile not found",
        )

    if current_user.role in {UserRole.ADMIN, UserRole.CREDIT_OFFICER}:
        return msme

    if current_user.role == UserRole.MSME_OWNER and current_user.linked_msme_id == msme_id:
        return msme

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this MSME profile",
    )


@router.post("/gst/{msme_id}", response_model=GstRecordRead, status_code=status.HTTP_201_CREATED)
def ingest_gst_record(
    msme_id: int,
    payload: GstRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GstRecord:
    _get_accessible_msme(msme_id, current_user, db)
    record = GstRecord(msme_id=msme_id, **payload.model_dump())
    db.add(record)
    if payload.filing_status != FilingStatus.ON_TIME:
        _create_compliance_alert(
            db,
            msme_id,
            f"GST filing for {payload.period} was {payload.filing_status.value}.",
            AlertSeverity.HIGH if payload.filing_status == FilingStatus.MISSED else AlertSeverity.MEDIUM,
        )
    db.commit()
    db.refresh(record)
    return record


@router.post("/upi/{msme_id}", response_model=UpiTransactionRead, status_code=status.HTTP_201_CREATED)
def ingest_upi_transaction(
    msme_id: int,
    payload: UpiTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UpiTransaction:
    _get_accessible_msme(msme_id, current_user, db)
    transaction = UpiTransaction(msme_id=msme_id, **payload.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.post("/epfo/{msme_id}", response_model=EpfoRecordRead, status_code=status.HTTP_201_CREATED)
def ingest_epfo_record(
    msme_id: int,
    payload: EpfoRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EpfoRecord:
    _get_accessible_msme(msme_id, current_user, db)
    record = EpfoRecord(msme_id=msme_id, **payload.model_dump())
    db.add(record)
    if payload.compliance_status != EpfoComplianceStatus.ON_TIME:
        _create_compliance_alert(
            db,
            msme_id,
            f"EPFO contribution for {payload.period} was {payload.compliance_status.value}.",
            AlertSeverity.HIGH if payload.compliance_status == EpfoComplianceStatus.MISSED else AlertSeverity.MEDIUM,
        )
    db.commit()
    db.refresh(record)
    return record


@router.post(
    "/bank-statement/{msme_id}",
    response_model=BankStatementRead,
    status_code=status.HTTP_201_CREATED,
)
def ingest_bank_statement(
    msme_id: int,
    payload: BankStatementCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BankStatement:
    _get_accessible_msme(msme_id, current_user, db)
    statement = BankStatement(msme_id=msme_id, **payload.model_dump())
    db.add(statement)
    db.commit()
    db.refresh(statement)
    return statement


@router.post("/unstructured/{msme_id}", response_model=UnstructuredDataResponse)
def ingest_unstructured_note(
    msme_id: int,
    payload: UnstructuredDataRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UnstructuredDataResponse:
    _get_accessible_msme(msme_id, current_user, db)
    return UnstructuredDataResponse(
        msme_id=msme_id,
        extracted_signals=MistralService().extract_structured_data(payload.free_text),
    )
