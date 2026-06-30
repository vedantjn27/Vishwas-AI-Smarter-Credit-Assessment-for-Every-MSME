from pydantic import BaseModel, Field

from app.models.user import UserRole
from app.schemas.common import TimestampedSchema


class UserBase(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    role: UserRole
    linked_msme_id: int | None = None


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=72)


class UserRead(TimestampedSchema, UserBase):
    """Public user response without password hash."""


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    exp: int
