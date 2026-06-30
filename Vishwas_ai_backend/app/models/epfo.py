import enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class EpfoComplianceStatus(str, enum.Enum):
    ON_TIME = "on_time"
    LATE = "late"
    MISSED = "missed"


class EpfoRecord(IdMixin, TimestampMixin, Base):
    __tablename__ = "epfo_records"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    period: Mapped[str] = mapped_column(String(7), index=True)
    employee_count: Mapped[int] = mapped_column(default=0)
    contribution_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    compliance_status: Mapped[EpfoComplianceStatus] = mapped_column(
        Enum(EpfoComplianceStatus, values_callable=enum_values),
        index=True,
    )

    msme: Mapped["MSMEProfile"] = relationship(back_populates="epfo_records")
