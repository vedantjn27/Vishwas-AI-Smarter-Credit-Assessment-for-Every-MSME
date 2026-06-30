import enum
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class LoanType(str, enum.Enum):
    PERSONAL = "personal"
    HOME = "home"
    MORTGAGE = "mortgage"
    AUTO = "auto"
    MSME_WORKING_CAPITAL = "msme_working_capital"


class EligibilityResult(str, enum.Enum):
    ELIGIBLE = "eligible"
    CONDITIONAL = "conditional"
    NOT_ELIGIBLE = "not_eligible"


class RecommendedScheme(str, enum.Enum):
    CGTMSE = "CGTMSE"
    MUDRA = "MUDRA"
    STANDARD = "standard"
    FORMALIZATION_ASSISTED_ONBOARDING = "formalization_assisted_onboarding"


class LoanEligibilityCheck(IdMixin, TimestampMixin, Base):
    __tablename__ = "loan_eligibility_checks"

    msme_id: Mapped[int] = mapped_column(ForeignKey("msme_profiles.id"), index=True)
    loan_type: Mapped[LoanType] = mapped_column(Enum(LoanType, values_callable=enum_values), index=True)
    requested_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2))
    eligibility_result: Mapped[EligibilityResult] = mapped_column(
        Enum(EligibilityResult, values_callable=enum_values),
        index=True,
    )
    recommended_interest_band: Mapped[str] = mapped_column(String(50))
    collateral_required: Mapped[bool] = mapped_column(Boolean, default=False)
    recommended_scheme: Mapped[RecommendedScheme] = mapped_column(
        Enum(RecommendedScheme, values_callable=enum_values),
        index=True,
    )
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)

    msme: Mapped["MSMEProfile"] = relationship(back_populates="eligibility_checks")
