from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from app.config import get_settings
from app.models.credit import EligibilityResult, LoanType, RecommendedScheme
from app.models.msme import MSMEProfile
from app.models.score import HealthScore, ScoreGrade


@dataclass(frozen=True)
class EligibilityDecision:
    loan_type: LoanType
    requested_amount: Decimal
    eligibility_result: EligibilityResult
    recommended_interest_band: str
    collateral_required: bool
    recommended_scheme: RecommendedScheme
    checked_at: datetime


class RulesEngine:
    def __init__(self) -> None:
        self.settings = get_settings()

    def evaluate(self, msme: MSMEProfile, latest_score: HealthScore, loan_type: LoanType, requested_amount: Decimal) -> EligibilityDecision:
        grade = latest_score.grade
        confidence = float(latest_score.confidence_score)
        threshold = Decimal(str(self.settings.collateral_free_loan_threshold))

        if grade in {ScoreGrade.A, ScoreGrade.B} and confidence >= 60:
            result = EligibilityResult.ELIGIBLE
        elif grade == ScoreGrade.C or confidence < 60:
            result = EligibilityResult.CONDITIONAL
        else:
            result = EligibilityResult.NOT_ELIGIBLE

        collateral_required = requested_amount > threshold
        scheme = self._scheme(msme, grade, requested_amount, threshold)
        if msme.udyam_number is None and grade in {ScoreGrade.A, ScoreGrade.B, ScoreGrade.C}:
            result = EligibilityResult.CONDITIONAL
            scheme = RecommendedScheme.FORMALIZATION_ASSISTED_ONBOARDING

        return EligibilityDecision(
            loan_type=loan_type,
            requested_amount=requested_amount,
            eligibility_result=result,
            recommended_interest_band=self._interest_band(grade),
            collateral_required=collateral_required,
            recommended_scheme=scheme,
            checked_at=datetime.utcnow(),
        )

    def _interest_band(self, grade: ScoreGrade) -> str:
        return {
            ScoreGrade.A: "10.0%-11.5%",
            ScoreGrade.B: "11.5%-13.0%",
            ScoreGrade.C: "13.0%-15.5%",
            ScoreGrade.D: "15.5%-18.0%",
            ScoreGrade.E: "Manual review only",
        }[grade]

    def _scheme(
        self,
        msme: MSMEProfile,
        grade: ScoreGrade,
        requested_amount: Decimal,
        threshold: Decimal,
    ) -> RecommendedScheme:
        if requested_amount <= Decimal("1000000") and msme.employee_count <= 10:
            return RecommendedScheme.MUDRA
        if requested_amount > threshold or grade in {ScoreGrade.C, ScoreGrade.D}:
            return RecommendedScheme.CGTMSE
        return RecommendedScheme.STANDARD
