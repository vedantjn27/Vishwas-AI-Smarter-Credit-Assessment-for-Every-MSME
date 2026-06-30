from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field

from app.models.score import RiskBand, ScoreGrade
from app.schemas.common import TimestampedSchema


class DimensionScore(BaseModel):
    name: str
    score: Decimal = Field(ge=0, le=100)
    weight: Decimal = Field(gt=0, le=1)


class ScoreTrendPoint(BaseModel):
    month: str
    score: Decimal = Field(ge=0, le=100)


class HealthScoreRead(TimestampedSchema):
    msme_id: int
    computed_at: datetime
    overall_score: Decimal = Field(ge=0, le=100)
    grade: ScoreGrade
    risk_band: RiskBand
    confidence_score: Decimal = Field(ge=0, le=100)
    dimension_breakdown_json: dict[str, Any]
    ml_predicted_band: RiskBand | None = None
    ml_rule_divergence_flag: bool


class ScoreHistoryRead(TimestampedSchema):
    msme_id: int
    computed_at: datetime
    overall_score: Decimal = Field(ge=0, le=100)


class HealthCardResponse(BaseModel):
    msme_id: int
    business_name: str
    overall_score: Decimal = Field(ge=0, le=100)
    grade: ScoreGrade
    risk_band: RiskBand
    confidence_score: Decimal = Field(ge=0, le=100)
    data_quality: str
    dimensions: list[DimensionScore]
    score_trend: list[ScoreTrendPoint]
    top_strengths: list[str]
    top_risks: list[str]
    ml_predicted_band: RiskBand | None = None
    ml_rule_divergence_flag: bool
    recommended_next_data_source: str | None = None


class ScoreComputeResponse(BaseModel):
    score: HealthScoreRead
    card: HealthCardResponse
