import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class AlertType(str, enum.Enum):
    SCORE_DROP = "score_drop"
    COMPLIANCE_BREACH = "compliance_breach"
    ANOMALY = "anomaly"
    CONSENT_REVOKED = "consent_revoked"


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Alert(IdMixin, TimestampMixin, Base):
    __tablename__ = "alerts"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    alert_type: Mapped[AlertType] = mapped_column(Enum(AlertType, values_callable=enum_values), index=True)
    severity: Mapped[AlertSeverity] = mapped_column(Enum(AlertSeverity, values_callable=enum_values), index=True)
    message: Mapped[str] = mapped_column(String(500))
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    msme: Mapped["MSMEProfile"] = relationship(back_populates="alerts")
