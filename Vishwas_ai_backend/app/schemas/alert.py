from datetime import datetime

from pydantic import BaseModel

from app.models.alert import AlertSeverity, AlertType
from app.schemas.common import TimestampedSchema


class AlertRead(TimestampedSchema):
    msme_id: int
    triggered_at: datetime
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    acknowledged: bool


class AlertAcknowledgeResponse(BaseModel):
    id: int
    acknowledged: bool
