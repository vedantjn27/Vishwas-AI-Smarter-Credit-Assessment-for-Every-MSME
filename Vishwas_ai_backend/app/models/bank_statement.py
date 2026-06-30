import enum
from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, Enum, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class BankTxnType(str, enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    BOUNCE = "bounce"
    OVERDRAFT_USED = "overdraft_used"


class BankStatement(IdMixin, TimestampMixin, Base):
    __tablename__ = "bank_statements"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    txn_date: Mapped[date] = mapped_column(Date, index=True)
    balance_after_txn: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    txn_type: Mapped[BankTxnType] = mapped_column(Enum(BankTxnType, values_callable=enum_values), index=True)

    msme: Mapped["MSMEProfile"] = relationship(back_populates="bank_statements")
