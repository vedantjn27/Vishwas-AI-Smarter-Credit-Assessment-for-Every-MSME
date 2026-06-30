import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.base import IdMixin, TimestampMixin, enum_values

if TYPE_CHECKING:
    from app.models.msme import MSMEProfile


class UserRole(str, enum.Enum):
    MSME_OWNER = "msme_owner"
    CREDIT_OFFICER = "credit_officer"
    ADMIN = "admin"


class User(IdMixin, TimestampMixin, Base):
    __tablename__ = "users"

    username: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, values_callable=enum_values), index=True)
    linked_msme_id: Mapped[int | None] = mapped_column(ForeignKey("msme_profiles.id"), nullable=True)

    linked_msme: Mapped["MSMEProfile | None"] = relationship(back_populates="users")
