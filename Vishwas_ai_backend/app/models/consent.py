import enum
from datetime import datetime
from typing import TYPE_CHECKING
from uuid import uuid4

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class ConsentStatus(str, enum.Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    ACTIVE = "active"
    REVOKED = "revoked"
    EXPIRED = "expired"


class ConsentRecord(IdMixin, TimestampMixin, Base):
    __tablename__ = "consent_records"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    consent_id: Mapped[str] = mapped_column(String(36), unique=True, index=True, default=lambda: str(uuid4()))
    fip_name: Mapped[str] = mapped_column(String(150))
    purpose: Mapped[str] = mapped_column(String(255))
    status: Mapped[ConsentStatus] = mapped_column(
        Enum(ConsentStatus, values_callable=enum_values),
        default=ConsentStatus.REQUESTED,
        index=True,
    )
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    msme: Mapped["MSMEProfile"] = relationship(back_populates="consent_records")
