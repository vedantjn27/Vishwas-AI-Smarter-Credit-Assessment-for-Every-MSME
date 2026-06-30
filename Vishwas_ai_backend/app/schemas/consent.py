from datetime import datetime

from pydantic import BaseModel, Field

from app.models.consent import ConsentStatus
from app.schemas.common import TimestampedSchema


class ConsentRequest(BaseModel):
    msme_id: int
    fip_name: str = Field(min_length=1, max_length=150)
    purpose: str = Field(min_length=1, max_length=255)
    expires_at: datetime


class ConsentRead(TimestampedSchema):
    msme_id: int
    consent_id: str
    fip_name: str
    purpose: str
    status: ConsentStatus
    requested_at: datetime
    expires_at: datetime


class ConsentStatusResponse(BaseModel):
    consent_id: str
    status: ConsentStatus
    simulation: bool = True
