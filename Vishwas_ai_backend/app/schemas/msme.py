from datetime import date

from pydantic import BaseModel, Field

from app.schemas.common import PaginatedResponse, TimestampedSchema


class MSMEBase(BaseModel):
    business_name: str = Field(min_length=1, max_length=255)
    owner_name: str = Field(min_length=1, max_length=255)
    udyam_number: str | None = Field(default=None, max_length=64)
    sector: str = Field(min_length=1, max_length=100)
    sub_sector: str | None = Field(default=None, max_length=100)
    city: str = Field(min_length=1, max_length=100)
    state: str = Field(min_length=1, max_length=100)
    registration_date: date | None = None
    employee_count: int = Field(default=0, ge=0)
    requested_credit_invisible_flag: bool = False


class MSMECreate(MSMEBase):
    """Payload for onboarding a new MSME profile."""


class MSMEUpdate(BaseModel):
    business_name: str | None = Field(default=None, min_length=1, max_length=255)
    owner_name: str | None = Field(default=None, min_length=1, max_length=255)
    udyam_number: str | None = Field(default=None, max_length=64)
    sector: str | None = Field(default=None, min_length=1, max_length=100)
    sub_sector: str | None = Field(default=None, max_length=100)
    city: str | None = Field(default=None, min_length=1, max_length=100)
    state: str | None = Field(default=None, min_length=1, max_length=100)
    registration_date: date | None = None
    employee_count: int | None = Field(default=None, ge=0)
    requested_credit_invisible_flag: bool | None = None


class MSMERead(TimestampedSchema, MSMEBase):
    """MSME profile response."""


class MSMEListResponse(PaginatedResponse):
    items: list[MSMERead]
