from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from math import sqrt

from sqlalchemy.orm import Session

from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.bank_statement import BankStatement, BankTxnType
from app.models.epfo import EpfoComplianceStatus, EpfoRecord
from app.models.gst import FilingStatus, GstRecord
from app.models.msme import MSMEProfile
from app.models.score import HealthScore, RiskBand, ScoreGrade, ScoreHistory
from app.models.upi import TransactionDirection, UpiTransaction
from app.services.anomaly_detector import AnomalyDetector
from app.services.ml_risk_classifier import MLRiskClassifier


DIMENSION_WEIGHTS = {
    "Cash Flow Stability": Decimal("0.25"),
    "Compliance Health": Decimal("0.25"),
    "Statutory Stability": Decimal("0.15"),
    "Banking Behavior": Decimal("0.25"),
    "Digital Footprint": Decimal("0.10"),
}


@dataclass(frozen=True)
class ScoreResult:
    score: HealthScore
    top_strengths: list[str]
    top_risks: list[str]
    data_quality: str
    recommended_next_data_source: str | None


class ScoringEngine:
    def __init__(self, db: Session) -> None:
        self.db = db

    def compute_and_store(self, msme_id: int) -> ScoreResult:
        msme = self.db.get(MSMEProfile, msme_id)
        if msme is None:
            raise ValueError("MSME profile not found")

        gst_records = self._gst_records(msme_id)
        upi_transactions = self._upi_transactions(msme_id)
        epfo_records = self._epfo_records(msme_id)
        bank_statements = self._bank_statements(msme_id)
        previous_score = self.latest_score(msme_id)

        dimensions = {
            "Cash Flow Stability": self._cash_flow_score(upi_transactions),
            "Compliance Health": self._compliance_score(gst_records, upi_transactions),
            "Statutory Stability": self._statutory_score(epfo_records),
            "Banking Behavior": self._banking_score(bank_statements),
            "Digital Footprint": self._digital_score(msme, upi_transactions),
        }
        overall = sum(Decimal(str(dimensions[name])) * DIMENSION_WEIGHTS[name] for name in DIMENSION_WEIGHTS)
        confidence = self._confidence_score(gst_records, upi_transactions, epfo_records, bank_statements)
        grade, risk_band = self._grade_and_risk(float(overall))
        data_quality, recommendation = self._data_quality(confidence, gst_records, upi_transactions, epfo_records, bank_statements)

        breakdown = {
            name: {"score": round(score, 2), "weight": float(DIMENSION_WEIGHTS[name])}
            for name, score in dimensions.items()
        }
        ml_classifier = MLRiskClassifier()
        ml_band = ml_classifier.predict_band(breakdown)
        divergence = ml_classifier.is_divergent(risk_band, ml_band)

        score = HealthScore(
            msme_id=msme_id,
            computed_at=datetime.utcnow(),
            overall_score=overall.quantize(Decimal("0.01")),
            grade=grade,
            risk_band=risk_band,
            confidence_score=Decimal(str(confidence)).quantize(Decimal("0.01")),
            dimension_breakdown_json=breakdown,
            ml_predicted_band=ml_band,
            ml_rule_divergence_flag=divergence,
        )
        self.db.add(score)
        self.db.add(
            ScoreHistory(
                msme_id=msme_id,
                computed_at=score.computed_at,
                overall_score=score.overall_score,
            )
        )
        self._store_score_drop_alert(msme_id, previous_score, score)
        self._store_anomaly_alerts(msme_id, gst_records, upi_transactions, epfo_records)
        self.db.commit()
        self.db.refresh(score)

        return ScoreResult(
            score=score,
            top_strengths=self._top_dimensions(dimensions, reverse=True),
            top_risks=self._top_dimensions(dimensions, reverse=False),
            data_quality=data_quality,
            recommended_next_data_source=recommendation,
        )

    def latest_score(self, msme_id: int) -> HealthScore | None:
        return (
            self.db.query(HealthScore)
            .filter(HealthScore.msme_id == msme_id)
            .order_by(HealthScore.computed_at.desc(), HealthScore.id.desc())
            .first()
        )

    def score_history(self, msme_id: int) -> list[ScoreHistory]:
        return (
            self.db.query(ScoreHistory)
            .filter(ScoreHistory.msme_id == msme_id)
            .order_by(ScoreHistory.computed_at)
            .all()
        )

    def build_card(self, msme_id: int, score: HealthScore | None = None, result: ScoreResult | None = None) -> dict:
        msme = self.db.get(MSMEProfile, msme_id)
        if msme is None:
            raise ValueError("MSME profile not found")

        score = score or self.latest_score(msme_id)
        if score is None:
            result = self.compute_and_store(msme_id)
            score = result.score

        dimensions = [
            {
                "name": name,
                "score": Decimal(str(data["score"])).quantize(Decimal("0.01")),
                "weight": Decimal(str(data["weight"])),
            }
            for name, data in score.dimension_breakdown_json.items()
        ]
        dimension_scores = {item["name"]: float(item["score"]) for item in dimensions}
        confidence = float(score.confidence_score)
        data_quality, recommendation = self._data_quality_from_score(confidence)
        return {
            "msme_id": msme.id,
            "business_name": msme.business_name,
            "overall_score": score.overall_score,
            "grade": score.grade,
            "risk_band": score.risk_band,
            "confidence_score": score.confidence_score,
            "data_quality": result.data_quality if result else data_quality,
            "dimensions": dimensions,
            "score_trend": self._trend_points(msme_id),
            "top_strengths": result.top_strengths if result else self._top_dimensions(dimension_scores, reverse=True),
            "top_risks": result.top_risks if result else self._top_dimensions(dimension_scores, reverse=False),
            "ml_predicted_band": score.ml_predicted_band,
            "ml_rule_divergence_flag": score.ml_rule_divergence_flag,
            "recommended_next_data_source": result.recommended_next_data_source if result else recommendation,
        }

    def _gst_records(self, msme_id: int) -> list[GstRecord]:
        return self.db.query(GstRecord).filter(GstRecord.msme_id == msme_id).order_by(GstRecord.period).all()

    def _upi_transactions(self, msme_id: int) -> list[UpiTransaction]:
        return self.db.query(UpiTransaction).filter(UpiTransaction.msme_id == msme_id).order_by(UpiTransaction.txn_date).all()

    def _epfo_records(self, msme_id: int) -> list[EpfoRecord]:
        return self.db.query(EpfoRecord).filter(EpfoRecord.msme_id == msme_id).order_by(EpfoRecord.period).all()

    def _bank_statements(self, msme_id: int) -> list[BankStatement]:
        return self.db.query(BankStatement).filter(BankStatement.msme_id == msme_id).order_by(BankStatement.txn_date).all()

    def _cash_flow_score(self, transactions: list[UpiTransaction]) -> float:
        monthly = self._monthly_net_upi(transactions)
        values = list(monthly.values())
        if not values:
            return 35.0
        avg = mean(values)
        cv = stddev(values) / abs(avg) if avg else 1.0
        stability = clip(100 - cv * 100)
        trend = normalized_slope(values)
        return clip(0.7 * stability + 0.3 * trend)

    def _compliance_score(self, records: list[GstRecord], transactions: list[UpiTransaction]) -> float:
        if not records:
            return 30.0
        on_time_pct = sum(1 for record in records if record.filing_status == FilingStatus.ON_TIME) / len(records)
        upi_turnover = self._monthly_upi_credit(transactions)
        consistency_scores = []
        for record in records:
            estimated = upi_turnover.get(record.period)
            if estimated and estimated > 0:
                declared = float(record.declared_turnover)
                consistency_scores.append(clip((1 - abs(declared - estimated) / estimated) * 100))
        turnover_consistency = mean(consistency_scores) if consistency_scores else 60.0
        return clip(0.5 * on_time_pct * 100 + 0.5 * turnover_consistency)

    def _statutory_score(self, records: list[EpfoRecord]) -> float:
        if not records:
            return 40.0
        regularity = sum(1 for record in records if record.compliance_status == EpfoComplianceStatus.ON_TIME) / len(records)
        headcounts = [record.employee_count for record in records]
        avg = mean(headcounts)
        stability = clip(100 - (stddev(headcounts) / avg) * 100) if avg else 50
        return clip(0.6 * regularity * 100 + 0.4 * stability)

    def _banking_score(self, statements: list[BankStatement]) -> float:
        if not statements:
            return 35.0
        total = len(statements)
        bounce_rate = sum(1 for item in statements if item.txn_type == BankTxnType.BOUNCE) / total
        overdraft_ratio = sum(1 for item in statements if item.txn_type == BankTxnType.OVERDRAFT_USED) / total
        monthly_balance = defaultdict(list)
        for statement in statements:
            monthly_balance[statement.txn_date.strftime("%Y-%m")].append(float(statement.balance_after_txn))
        avg_balances = [mean(monthly_balance[period]) for period in sorted(monthly_balance)]
        balance_trend_bonus = normalized_slope(avg_balances)
        return clip(100 - bounce_rate * 100 * 0.5 - overdraft_ratio * 100 * 0.3 + balance_trend_bonus * 0.2)

    def _digital_score(self, msme: MSMEProfile, transactions: list[UpiTransaction]) -> float:
        digital_base = 70 if transactions else 20
        formalization = 30 if msme.udyam_number else 0
        return clip(digital_base + formalization)

    def _confidence_score(
        self,
        gst_records: list[GstRecord],
        upi_transactions: list[UpiTransaction],
        epfo_records: list[EpfoRecord],
        bank_statements: list[BankStatement],
    ) -> float:
        sources_present = sum(bool(source) for source in [gst_records, upi_transactions, epfo_records, bank_statements])
        periods = set()
        periods.update(record.period for record in gst_records)
        periods.update(record.period for record in epfo_records)
        periods.update(txn.txn_date.strftime("%Y-%m") for txn in upi_transactions)
        periods.update(statement.txn_date.strftime("%Y-%m") for statement in bank_statements)
        months = min(len(periods), 12)
        return clip((0.6 * (sources_present / 4) + 0.4 * (months / 12)) * 100)

    def _data_quality(
        self,
        confidence: float,
        gst_records: list[GstRecord],
        upi_transactions: list[UpiTransaction],
        epfo_records: list[EpfoRecord],
        bank_statements: list[BankStatement],
    ) -> tuple[str, str | None]:
        if confidence >= 70:
            return "Good", None
        missing = [
            ("GST filings", gst_records),
            ("UPI transactions", upi_transactions),
            ("EPFO records", epfo_records),
            ("AA bank statements", bank_statements),
        ]
        next_source = next((name for name, records in missing if not records), "longer transaction history")
        return "Limited - Indicative Score Only", f"Connect {next_source} to improve confidence"

    def _data_quality_from_score(self, confidence: float) -> tuple[str, str | None]:
        if confidence >= 70:
            return "Good", None
        return "Limited - Indicative Score Only", "Connect additional data sources to improve confidence"

    def _trend_points(self, msme_id: int) -> list[dict[str, Decimal | str]]:
        return [
            {"month": item.computed_at.strftime("%Y-%m"), "score": item.overall_score}
            for item in self.score_history(msme_id)
        ]

    def _top_dimensions(self, dimensions: dict[str, float], reverse: bool) -> list[str]:
        ranked = sorted(dimensions.items(), key=lambda item: item[1], reverse=reverse)
        if reverse:
            return [f"{name}: {score:.0f}/100" for name, score in ranked[:2]]
        return [f"{name}: {score:.0f}/100" for name, score in ranked[:2]]

    def _store_anomaly_alerts(
        self,
        msme_id: int,
        gst_records: list[GstRecord],
        upi_transactions: list[UpiTransaction],
        epfo_records: list[EpfoRecord],
    ) -> None:
        anomalies = AnomalyDetector().detect(gst_records, upi_transactions, epfo_records)
        for anomaly in anomalies:
            self.db.add(
                Alert(
                    msme_id=msme_id,
                    triggered_at=datetime.utcnow(),
                    alert_type=AlertType.ANOMALY,
                    severity=AlertSeverity(anomaly.severity),
                    message=anomaly.message,
                    acknowledged=False,
                )
            )

    def _store_score_drop_alert(
        self,
        msme_id: int,
        previous_score: HealthScore | None,
        current_score: HealthScore,
    ) -> None:
        if previous_score is None:
            return
        drop = Decimal(previous_score.overall_score) - Decimal(current_score.overall_score)
        if drop >= Decimal("10.00"):
            self.db.add(
                Alert(
                    msme_id=msme_id,
                    triggered_at=datetime.utcnow(),
                    alert_type=AlertType.SCORE_DROP,
                    severity=AlertSeverity.HIGH if drop >= Decimal("20.00") else AlertSeverity.MEDIUM,
                    message=f"Health score dropped by {drop.quantize(Decimal('0.01'))} points since the previous computation.",
                    acknowledged=False,
                )
            )

    def _grade_and_risk(self, score: float) -> tuple[ScoreGrade, RiskBand]:
        if score >= 85:
            return ScoreGrade.A, RiskBand.LOW
        if score >= 70:
            return ScoreGrade.B, RiskBand.LOW_MEDIUM
        if score >= 55:
            return ScoreGrade.C, RiskBand.MEDIUM
        if score >= 40:
            return ScoreGrade.D, RiskBand.HIGH
        return ScoreGrade.E, RiskBand.CRITICAL

    def _monthly_net_upi(self, transactions: list[UpiTransaction]) -> dict[str, float]:
        monthly = defaultdict(float)
        for txn in transactions:
            amount = float(txn.amount)
            if txn.direction == TransactionDirection.CREDIT:
                monthly[txn.txn_date.strftime("%Y-%m")] += amount
            else:
                monthly[txn.txn_date.strftime("%Y-%m")] -= amount
        return dict(sorted(monthly.items()))

    def _monthly_upi_credit(self, transactions: list[UpiTransaction]) -> dict[str, float]:
        monthly = defaultdict(float)
        for txn in transactions:
            if txn.direction == TransactionDirection.CREDIT:
                monthly[txn.txn_date.strftime("%Y-%m")] += float(txn.amount)
        return dict(monthly)


def clip(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def mean(values: list[float] | list[int]) -> float:
    return sum(values) / len(values) if values else 0.0


def stddev(values: list[float] | list[int]) -> float:
    if len(values) < 2:
        return 0.0
    avg = mean(values)
    return sqrt(sum((value - avg) ** 2 for value in values) / len(values))


def normalized_slope(values: list[float] | list[int]) -> float:
    if len(values) < 2:
        return 50.0
    xs = list(range(len(values)))
    x_avg = mean(xs)
    y_avg = mean(values)
    denominator = sum((x - x_avg) ** 2 for x in xs)
    if denominator == 0:
        return 50.0
    slope = sum((x - x_avg) * (y - y_avg) for x, y in zip(xs, values)) / denominator
    scale = abs(y_avg) if y_avg else max(abs(value) for value in values) or 1
    return clip(50 + (slope / scale) * 500)
