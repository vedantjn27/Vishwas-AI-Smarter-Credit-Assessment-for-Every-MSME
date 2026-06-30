from datetime import date
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.models.bank_statement import BankTxnType
from app.models.epfo import EpfoComplianceStatus
from app.models.gst import FilingStatus
from app.models.upi import CounterpartyType, TransactionDirection
from app.schemas.common import TimestampedSchema


class GstRecordBase(BaseModel):
    period: str = Field(pattern=r"^\d{4}-\d{2}$")
    declared_turnover: Decimal = Field(ge=0)
    tax_paid: Decimal = Field(ge=0)
    filing_status: FilingStatus
    filing_delay_days: int = Field(default=0, ge=0)


class GstRecordCreate(GstRecordBase):
    """Payload for one GST filing record."""


class GstRecordRead(TimestampedSchema, GstRecordBase):
    msme_id: int


class UpiTransactionBase(BaseModel):
    txn_date: date
    amount: Decimal = Field(gt=0)
    direction: TransactionDirection
    counterparty_type: CounterpartyType


class UpiTransactionCreate(UpiTransactionBase):
    """Payload for one UPI transaction."""


class UpiTransactionRead(TimestampedSchema, UpiTransactionBase):
    msme_id: int


class EpfoRecordBase(BaseModel):
    period: str = Field(pattern=r"^\d{4}-\d{2}$")
    employee_count: int = Field(ge=0)
    contribution_amount: Decimal = Field(ge=0)
    compliance_status: EpfoComplianceStatus


class EpfoRecordCreate(EpfoRecordBase):
    """Payload for one EPFO contribution record."""


class EpfoRecordRead(TimestampedSchema, EpfoRecordBase):
    msme_id: int


class BankStatementBase(BaseModel):
    txn_date: date
    balance_after_txn: Decimal
    amount: Decimal
    txn_type: BankTxnType


class BankStatementCreate(BankStatementBase):
    """Payload for one AA-sourced bank statement transaction."""


class BankStatementRead(TimestampedSchema, BankStatementBase):
    msme_id: int


class UnstructuredDataRequest(BaseModel):
    free_text: str = Field(min_length=1)


class UnstructuredDataResponse(BaseModel):
    msme_id: int
    extracted_signals: dict[str, Any]
    source: str = "mistral_with_template_fallback"
