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


class TransactionDirection(str, enum.Enum):
    CREDIT = "credit"
    DEBIT = "debit"


class CounterpartyType(str, enum.Enum):
    CUSTOMER = "customer"
    SUPPLIER = "supplier"
    OTHER = "other"


class UpiTransaction(IdMixin, TimestampMixin, Base):
    __tablename__ = "upi_transactions"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    txn_date: Mapped[date] = mapped_column(Date, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    direction: Mapped[TransactionDirection] = mapped_column(Enum(TransactionDirection, values_callable=enum_values), index=True)
    counterparty_type: Mapped[CounterpartyType] = mapped_column(
        Enum(CounterpartyType, values_callable=enum_values),
        index=True,
    )

    msme: Mapped["MSMEProfile"] = relationship(back_populates="upi_transactions")
