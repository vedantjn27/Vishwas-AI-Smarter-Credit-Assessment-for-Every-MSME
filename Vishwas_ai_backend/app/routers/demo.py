from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import MessageResponse
from app.services.synthetic_data_generator import SyntheticDataGenerator

router = APIRouter()


@router.post("/seed")
def seed_demo_data(
    count: int = Query(default=18, ge=6, le=30),
    db: Session = Depends(get_db),
) -> dict[str, int | list[int] | bool | dict[str, str]]:
    result = SyntheticDataGenerator(db).seed_demo_data(count=count)
    return {
        "simulation": True,
        "demo_credentials": {
            "admin": "admin / password123",
            "credit_officer": "credit_officer / password123",
            "owners": "owner_1..owner_N / password123",
        },
        **result,
    }


@router.delete("/reset", response_model=MessageResponse)
def reset_demo_data(db: Session = Depends(get_db)) -> MessageResponse:
    SyntheticDataGenerator(db).reset_database()
    return MessageResponse(message="Demo data reset successfully")
