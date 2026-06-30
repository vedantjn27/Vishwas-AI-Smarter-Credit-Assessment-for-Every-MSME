from datetime import datetime

from pydantic import BaseModel, ConfigDict


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TimestampedSchema(OrmModel):
    id: int
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel):
    total: int
    limit: int
    offset: int
