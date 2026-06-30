from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.alert import Alert
    from app.models.bank_statement import BankStatement
    from app.models.consent import ConsentRecord
    from app.models.credit import LoanEligibilityCheck
    from app.models.epfo import EpfoRecord
    from app.models.gst import GstRecord
    from app.models.insight import Insight
    from app.models.score import HealthScore, ScoreHistory
    from app.models.upi import UpiTransaction
    from app.models.user import User


class MSMEProfile(IdMixin, TimestampMixin, Base):
    __tablename__ = "msme_profiles"

    business_name: Mapped[str] = mapped_column(String(255), index=True)
    owner_name: Mapped[str] = mapped_column(String(255))
    udyam_number: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    sector: Mapped[str] = mapped_column(String(100), index=True)
    sub_sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(100), index=True)
    registration_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    employee_count: Mapped[int] = mapped_column(Integer, default=0)
    requested_credit_invisible_flag: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    users: Mapped[list["User"]] = relationship(back_populates="linked_msme")
    gst_records: Mapped[list["GstRecord"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    upi_transactions: Mapped[list["UpiTransaction"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    epfo_records: Mapped[list["EpfoRecord"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    bank_statements: Mapped[list["BankStatement"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    consent_records: Mapped[list["ConsentRecord"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    health_scores: Mapped[list["HealthScore"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    score_history: Mapped[list["ScoreHistory"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    insights: Mapped[list["Insight"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="msme", cascade="all, delete-orphan")
    eligibility_checks: Mapped[list["LoanEligibilityCheck"]] = relationship(
        back_populates="msme",
        cascade="all, delete-orphan",
    )
