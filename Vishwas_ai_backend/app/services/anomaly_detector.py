from dataclasses import dataclass

from app.models.epfo import EpfoRecord
from app.models.gst import GstRecord
from app.models.upi import TransactionDirection, UpiTransaction


@dataclass(frozen=True)
class Anomaly:
    anomaly_type: str
    severity: str
    message: str
    supporting_data: dict[str, float | int | str]


class AnomalyDetector:
    def detect(
        self,
        gst_records: list[GstRecord],
        upi_transactions: list[UpiTransaction],
        epfo_records: list[EpfoRecord],
    ) -> list[Anomaly]:
        anomalies: list[Anomaly] = []
        anomalies.extend(self._sudden_turnover_drop(gst_records))
        anomalies.extend(self._declared_vs_actual_mismatch(gst_records, upi_transactions))
        anomalies.extend(self._headcount_drop(epfo_records))
        return anomalies

    def _sudden_turnover_drop(self, records: list[GstRecord]) -> list[Anomaly]:
        ordered = sorted(records, key=lambda item: item.period)
        if len(ordered) < 4:
            return []
        latest = ordered[-1]
        trailing = ordered[-4:-1]
        avg = sum(float(item.declared_turnover) for item in trailing) / len(trailing)
        if avg > 0 and float(latest.declared_turnover) < avg * 0.60:
            return [
                Anomaly(
                    anomaly_type="sudden_turnover_drop",
                    severity="high",
                    message="Latest GST turnover is below 60% of the trailing 3-month average.",
                    supporting_data={"latest_turnover": float(latest.declared_turnover), "trailing_average": avg},
                )
            ]
        return []

    def _declared_vs_actual_mismatch(
        self,
        gst_records: list[GstRecord],
        upi_transactions: list[UpiTransaction],
    ) -> list[Anomaly]:
        upi_credit: dict[str, float] = {}
        for txn in upi_transactions:
            if txn.direction == TransactionDirection.CREDIT:
                period = txn.txn_date.strftime("%Y-%m")
                upi_credit[period] = upi_credit.get(period, 0.0) + float(txn.amount)

        anomalies: list[Anomaly] = []
        for record in gst_records:
            estimated = upi_credit.get(record.period)
            if not estimated:
                continue
            consistency = 1 - abs(float(record.declared_turnover) - estimated) / estimated
            if consistency < 0.55:
                anomalies.append(
                    Anomaly(
                        anomaly_type="declared_vs_actual_mismatch",
                        severity="medium",
                        message="GST declared turnover differs materially from UPI-estimated turnover.",
                        supporting_data={
                            "period": record.period,
                            "declared_turnover": float(record.declared_turnover),
                            "upi_estimated_turnover": estimated,
                            "consistency": round(consistency, 3),
                        },
                    )
                )
        return anomalies[:5]

    def _headcount_drop(self, records: list[EpfoRecord]) -> list[Anomaly]:
        ordered = sorted(records, key=lambda item: item.period)
        anomalies: list[Anomaly] = []
        for previous, current in zip(ordered, ordered[1:]):
            if previous.employee_count > 0 and current.employee_count < previous.employee_count * 0.70:
                anomalies.append(
                    Anomaly(
                        anomaly_type="sudden_epfo_headcount_drop",
                        severity="high",
                        message="EPFO employee count dropped by more than 30% month-on-month.",
                        supporting_data={
                            "previous_period": previous.period,
                            "current_period": current.period,
                            "previous_employee_count": previous.employee_count,
                            "current_employee_count": current.employee_count,
                        },
                    )
                )
        return anomalies
