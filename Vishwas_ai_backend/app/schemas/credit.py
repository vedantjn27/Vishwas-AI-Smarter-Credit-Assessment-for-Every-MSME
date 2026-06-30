from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.credit import EligibilityResult, LoanType, RecommendedScheme
from app.models.score import RiskBand
from app.schemas.common import TimestampedSchema


class EligibilityCheckRequest(BaseModel):
    msme_id: int
    loan_type: LoanType
    requested_amount: Decimal = Field(gt=0)


class EligibilityCheckRead(TimestampedSchema):
    msme_id: int
    loan_type: LoanType
    requested_amount: Decimal
    eligibility_result: EligibilityResult
    recommended_interest_band: str
    collateral_required: bool
    recommended_scheme: RecommendedScheme
    checked_at: datetime


class PortfolioSummaryResponse(BaseModel):
    score_distribution: dict[str, int]
    risk_band_counts: dict[RiskBand, int]
    sector_average_scores: dict[str, Decimal]
    newly_scoreable_ntc_ntb_count: int


class BenchmarkResponse(BaseModel):
    msme_id: int
    sector: str
    msme_dimensions: dict[str, Decimal]
    sector_average_dimensions: dict[str, Decimal]


class UliLoanApplicationRequest(BaseModel):
    msme_id: int
    loan_type: LoanType
    requested_amount: Decimal = Field(gt=0)


class UliLoanApplicationResponse(BaseModel):
    application_id: str
    status: str
    simulation: bool = True
    eligibility: EligibilityCheckRead | None = None


class OcenCreditAssessmentRequest(BaseModel):
    msme_id: int
    loan_type: LoanType
    requested_amount: Decimal = Field(gt=0)


class OcenCreditAssessmentResponse(BaseModel):
    decision: EligibilityResult
    risk_band: RiskBand
    reason_codes: list[str]
    simulation: bool = True
