from decimal import Decimal
import enum
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, JSON, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class ScoreGrade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"


class RiskBand(str, enum.Enum):
    LOW = "Low"
    LOW_MEDIUM = "Low-Medium"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class HealthScore(IdMixin, TimestampMixin, Base):
    __tablename__ = "health_scores"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    overall_score: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    grade: Mapped[ScoreGrade] = mapped_column(Enum(ScoreGrade, values_callable=enum_values), index=True)
    risk_band: Mapped[RiskBand] = mapped_column(Enum(RiskBand, values_callable=enum_values), index=True)
    confidence_score: Mapped[Decimal] = mapped_column(Numeric(5, 2))
    dimension_breakdown_json: Mapped[dict[str, Any]] = mapped_column(JSON)
    ml_predicted_band: Mapped[RiskBand | None] = mapped_column(
        Enum(RiskBand, values_callable=enum_values),
        nullable=True,
    )
    ml_rule_divergence_flag: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    msme: Mapped["MSMEProfile"] = relationship(back_populates="health_scores")


class ScoreHistory(IdMixin, TimestampMixin, Base):
    __tablename__ = "score_history"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    overall_score: Mapped[Decimal] = mapped_column(Numeric(5, 2))

    msme: Mapped["MSMEProfile"] = relationship(back_populates="score_history")
