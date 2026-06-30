from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

from app.models.score import RiskBand


MODEL_PATH = Path("ml_models/risk_classifier.joblib")
RISK_ORDER = [
    RiskBand.LOW.value,
    RiskBand.LOW_MEDIUM.value,
    RiskBand.MEDIUM.value,
    RiskBand.HIGH.value,
    RiskBand.CRITICAL.value,
]


class MLRiskClassifier:
    def __init__(self, model_path: Path = MODEL_PATH) -> None:
        self.model_path = model_path
        self.model: RandomForestClassifier | None = None
        if self.model_path.exists():
            self.model = joblib.load(self.model_path)

    def train_synthetic_model(self) -> None:
        features, labels = self._training_dataset()
        model = RandomForestClassifier(n_estimators=120, random_state=2026, max_depth=5)
        model.fit(features, labels)
        self.model_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(model, self.model_path)
        self.model = model

    def predict_band(self, dimension_breakdown: dict[str, Any]) -> RiskBand | None:
        if self.model is None:
            self.train_synthetic_model()
        if self.model is None:
            return None

        features = np.array([self._features_from_breakdown(dimension_breakdown)])
        prediction = self.model.predict(features)[0]
        return RiskBand(prediction)

    def is_divergent(self, rule_band: RiskBand, ml_band: RiskBand | None) -> bool:
        if ml_band is None:
            return False
        return abs(RISK_ORDER.index(rule_band.value) - RISK_ORDER.index(ml_band.value)) > 1

    def _features_from_breakdown(self, dimension_breakdown: dict[str, Any]) -> list[float]:
        names = [
            "Cash Flow Stability",
            "Compliance Health",
            "Statutory Stability",
            "Banking Behavior",
            "Digital Footprint",
        ]
        return [float(dimension_breakdown[name]["score"]) for name in names]

    def _training_dataset(self) -> tuple[np.ndarray, np.ndarray]:
        rng = np.random.default_rng(2026)
        features: list[list[float]] = []
        labels: list[str] = []
        archetypes = [
            ([88, 90, 86, 88, 95], RiskBand.LOW.value),
            ([70, 82, 76, 74, 85], RiskBand.LOW_MEDIUM.value),
            ([55, 62, 64, 58, 70], RiskBand.MEDIUM.value),
            ([42, 45, 50, 40, 55], RiskBand.HIGH.value),
            ([28, 30, 35, 25, 35], RiskBand.CRITICAL.value),
            ([62, 38, 55, 65, 80], RiskBand.MEDIUM.value),
            ([45, 72, 68, 48, 60], RiskBand.HIGH.value),
        ]
        for center, label in archetypes:
            for _ in range(90):
                sample = np.clip(rng.normal(center, 8), 0, 100)
                features.append(sample.tolist())
                labels.append(label)
        return np.array(features), np.array(labels)
