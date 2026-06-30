import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class InsightType(str, enum.Enum):
    SUMMARY = "summary"
    WHATIF = "whatif"
    ANOMALY = "anomaly"
    QA = "qa"


class Insight(IdMixin, TimestampMixin, Base):
    __tablename__ = "insights"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    insight_type: Mapped[InsightType] = mapped_column(Enum(InsightType, values_callable=enum_values), index=True)
    content_text: Mapped[str] = mapped_column(Text)

    msme: Mapped["MSMEProfile"] = relationship(back_populates="insights")
