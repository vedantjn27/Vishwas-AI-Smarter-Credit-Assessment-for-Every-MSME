from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.insight import InsightType
from app.schemas.common import TimestampedSchema


class InsightRead(TimestampedSchema):
    msme_id: int
    generated_at: datetime
    insight_type: InsightType
    content_text: str


class AskQuestionRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)


class WhatIfRequest(BaseModel):
    change_description: str = Field(min_length=1, max_length=1000)
    assumptions: dict[str, Any] = Field(default_factory=dict)


class InsightResponse(BaseModel):
    msme_id: int
    insight_type: InsightType
    content_text: str
