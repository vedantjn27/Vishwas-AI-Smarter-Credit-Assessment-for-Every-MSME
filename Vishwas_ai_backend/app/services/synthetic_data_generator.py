from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from random import Random

from faker import Faker
from sqlalchemy.orm import Session

from app.auth.security import get_password_hash
from app.models.alert import Alert
from app.models.bank_statement import BankStatement, BankTxnType
from app.models.consent import ConsentRecord
from app.models.credit import LoanEligibilityCheck
from app.models.epfo import EpfoComplianceStatus, EpfoRecord
from app.models.gst import FilingStatus, GstRecord
from app.models.insight import Insight
from app.models.msme import MSMEProfile
from app.models.score import HealthScore, ScoreHistory
from app.models.upi import CounterpartyType, TransactionDirection, UpiTransaction
from app.models.user import User, UserRole


@dataclass(frozen=True)
class Archetype:
    name: str
    sector: str
    sub_sector: str
    months: int
    base_turnover: int
    volatility: float
    trend: float
    gst_on_time_rate: float
    epfo_on_time_rate: float
    bounce_rate: float
    overdraft_rate: float
    udyam_probability: float
    credit_invisible: bool = False
    turnover_mismatch: bool = False


ARCHETYPES = [
    Archetype("Healthy manufacturing unit", "Manufacturing", "Light engineering", 18, 850_000, 0.10, 0.025, 0.96, 0.95, 0.01, 0.02, 0.95),
    Archetype("Seasonal agri-trader", "Agriculture", "Agri trading", 18, 520_000, 0.35, 0.005, 0.88, 0.85, 0.03, 0.04, 0.80),
    Archetype("Stressed retailer", "Retail", "Kirana", 18, 360_000, 0.18, -0.035, 0.72, 0.70, 0.08, 0.12, 0.70),
    Archetype("New-to-Credit micro-business", "Services", "Repair services", 3, 140_000, 0.22, 0.02, 0.75, 0.60, 0.03, 0.05, 0.0, True),
    Archetype("GST-lagging but UPI-active informal business", "Retail", "Food stall", 12, 240_000, 0.20, 0.02, 0.45, 0.65, 0.02, 0.04, 0.25, True),
    Archetype("Anomalous reporting", "Manufacturing", "Textiles", 15, 620_000, 0.16, 0.01, 0.82, 0.80, 0.04, 0.05, 0.85, False, True),
]


class SyntheticDataGenerator:
    def __init__(self, db: Session, seed: int = 2026) -> None:
        self.db = db
        self.random = Random(seed)
        self.faker = Faker("en_IN")
        Faker.seed(seed)

    def reset_database(self) -> None:
        for model in [
            Alert,
            Insight,
            LoanEligibilityCheck,
            HealthScore,
            ScoreHistory,
            ConsentRecord,
            BankStatement,
            EpfoRecord,
            GstRecord,
            UpiTransaction,
            User,
            MSMEProfile,
        ]:
            self.db.query(model).delete()
        self.db.commit()

    def seed_demo_data(self, count: int = 18) -> dict[str, int | list[int]]:
        self.reset_database()
        self._create_demo_users()

        msme_ids: list[int] = []
        for index in range(count):
            archetype = ARCHETYPES[index % len(ARCHETYPES)]
            msme = self._create_msme(archetype, index)
            self.db.add(msme)
            self.db.flush()
            self._create_owner_user(msme, index)
            self._create_history(msme, archetype)
            msme_ids.append(msme.id)

        self.db.commit()
        return {"created_msmes": len(msme_ids), "msme_ids": msme_ids}

    def _create_demo_users(self) -> None:
        password_hash = get_password_hash("password123")
        self.db.add_all(
            [
                User(username="admin", password_hash=password_hash, role=UserRole.ADMIN),
                User(username="credit_officer", password_hash=password_hash, role=UserRole.CREDIT_OFFICER),
            ]
        )

    def _create_owner_user(self, msme: MSMEProfile, index: int) -> None:
        self.db.add(
            User(
                username=f"owner_{index + 1}",
                password_hash=get_password_hash("password123"),
                role=UserRole.MSME_OWNER,
                linked_msme_id=msme.id,
            )
        )

    def _create_msme(self, archetype: Archetype, index: int) -> MSMEProfile:
        has_udyam = self.random.random() < archetype.udyam_probability
        registration_date = None if not has_udyam else date.today() - timedelta(days=self.random.randint(250, 2500))
        return MSMEProfile(
            business_name=f"{self.faker.company()} {index + 1}",
            owner_name=self.faker.name(),
            udyam_number=f"UDYAM-DEMO-{index + 1:04d}" if has_udyam else None,
            sector=archetype.sector,
            sub_sector=archetype.sub_sector,
            city=self.faker.city(),
            state=self.random.choice(["Maharashtra", "Gujarat", "Karnataka", "Tamil Nadu", "Delhi", "Rajasthan"]),
            registration_date=registration_date,
            employee_count=max(1, int(self.random.gauss(12, 5))),
            requested_credit_invisible_flag=archetype.credit_invisible,
        )

    def _create_history(self, msme: MSMEProfile, archetype: Archetype) -> None:
        start_month = self._month_start(date.today(), months_back=archetype.months)
        employee_count = max(1, msme.employee_count)
        current_balance = Decimal(str(archetype.base_turnover * 1.5))

        for month_index in range(archetype.months):
            month_date = self._add_months(start_month, month_index)
            month_label = month_date.strftime("%Y-%m")
            seasonal_factor = 1 + (0.18 if archetype.sector == "Agriculture" and month_date.month in {10, 11, 12} else 0)
            trend_factor = max(0.35, 1 + archetype.trend * month_index)
            noise = max(0.25, self.random.gauss(1, archetype.volatility))
            turnover = Decimal(str(round(archetype.base_turnover * trend_factor * seasonal_factor * noise, 2)))

            upi_turnover = turnover * Decimal(str(self.random.uniform(0.78, 1.12)))
            declared_turnover = turnover
            if archetype.turnover_mismatch and month_index >= archetype.months - 3:
                declared_turnover = turnover * Decimal("0.48")

            self.db.add(
                GstRecord(
                    msme_id=msme.id,
                    period=month_label,
                    declared_turnover=declared_turnover.quantize(Decimal("0.01")),
                    tax_paid=(declared_turnover * Decimal("0.18")).quantize(Decimal("0.01")),
                    filing_status=self._status(archetype.gst_on_time_rate),
                    filing_delay_days=0 if self.random.random() < archetype.gst_on_time_rate else self.random.randint(3, 45),
                )
            )

            employee_count = max(1, int(employee_count * self.random.uniform(0.92, 1.08)))
            self.db.add(
                EpfoRecord(
                    msme_id=msme.id,
                    period=month_label,
                    employee_count=employee_count,
                    contribution_amount=Decimal(str(employee_count * self.random.randint(1400, 2200))).quantize(Decimal("0.01")),
                    compliance_status=self._epfo_status(archetype.epfo_on_time_rate),
                )
            )

            self._create_upi_transactions(msme.id, month_date, upi_turnover)
            current_balance = self._create_bank_transactions(msme.id, month_date, turnover, current_balance, archetype)

    def _create_upi_transactions(self, msme_id: int, month_date: date, monthly_turnover: Decimal) -> None:
        txn_count = self.random.randint(12, 34)
        avg_credit = monthly_turnover / Decimal(str(max(1, txn_count)))
        for _ in range(txn_count):
            txn_day = min(self.random.randint(1, 28), 28)
            amount = avg_credit * Decimal(str(self.random.uniform(0.35, 2.25)))
            self.db.add(
                UpiTransaction(
                    msme_id=msme_id,
                    txn_date=month_date.replace(day=txn_day),
                    amount=amount.quantize(Decimal("0.01")),
                    direction=TransactionDirection.CREDIT,
                    counterparty_type=CounterpartyType.CUSTOMER,
                )
            )

        for _ in range(self.random.randint(4, 10)):
            amount = avg_credit * Decimal(str(self.random.uniform(0.25, 1.10)))
            self.db.add(
                UpiTransaction(
                    msme_id=msme_id,
                    txn_date=month_date.replace(day=self.random.randint(1, 28)),
                    amount=amount.quantize(Decimal("0.01")),
                    direction=TransactionDirection.DEBIT,
                    counterparty_type=CounterpartyType.SUPPLIER,
                )
            )

    def _create_bank_transactions(
        self,
        msme_id: int,
        month_date: date,
        turnover: Decimal,
        current_balance: Decimal,
        archetype: Archetype,
    ) -> Decimal:
        for _ in range(self.random.randint(8, 16)):
            txn_type = BankTxnType.CREDIT
            if self.random.random() < archetype.bounce_rate:
                txn_type = BankTxnType.BOUNCE
            elif self.random.random() < archetype.overdraft_rate:
                txn_type = BankTxnType.OVERDRAFT_USED

            signed_amount = turnover * Decimal(str(self.random.uniform(0.02, 0.16)))
            if txn_type == BankTxnType.CREDIT:
                current_balance += signed_amount
            else:
                current_balance -= signed_amount

            self.db.add(
                BankStatement(
                    msme_id=msme_id,
                    txn_date=month_date.replace(day=self.random.randint(1, 28)),
                    balance_after_txn=current_balance.quantize(Decimal("0.01")),
                    amount=signed_amount.quantize(Decimal("0.01")),
                    txn_type=txn_type,
                )
            )
        return current_balance

    def _status(self, on_time_rate: float) -> FilingStatus:
        roll = self.random.random()
        if roll < on_time_rate:
            return FilingStatus.ON_TIME
        return FilingStatus.LATE if roll < 0.96 else FilingStatus.MISSED

    def _epfo_status(self, on_time_rate: float) -> EpfoComplianceStatus:
        roll = self.random.random()
        if roll < on_time_rate:
            return EpfoComplianceStatus.ON_TIME
        return EpfoComplianceStatus.LATE if roll < 0.96 else EpfoComplianceStatus.MISSED

    @staticmethod
    def _month_start(today: date, months_back: int) -> date:
        return SyntheticDataGenerator._add_months(date(today.year, today.month, 1), -months_back + 1)

    @staticmethod
    def _add_months(value: date, months: int) -> date:
        month = value.month - 1 + months
        year = value.year + month // 12
        month = month % 12 + 1
        return date(year, month, 1)
