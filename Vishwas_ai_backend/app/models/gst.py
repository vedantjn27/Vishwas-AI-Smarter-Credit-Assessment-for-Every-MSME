import enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class FilingStatus(str, enum.Enum):
    ON_TIME = "on_time"
    LATE = "late"
    MISSED = "missed"


class GstRecord(IdMixin, TimestampMixin, Base):
    __tablename__ = "gst_records"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    period: Mapped[str] = mapped_column(String(7), index=True)
    declared_turnover: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    tax_paid: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    filing_status: Mapped[FilingStatus] = mapped_column(Enum(FilingStatus, values_callable=enum_values), index=True)
    filing_delay_days: Mapped[int] = mapped_column(default=0)

    msme: Mapped["MSMEProfile"] = relationship(back_populates="gst_records")
