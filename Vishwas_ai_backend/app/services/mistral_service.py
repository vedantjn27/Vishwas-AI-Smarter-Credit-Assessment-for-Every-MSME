import json
from typing import Any

from app.config import get_settings


class MistralService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def generate_summary(self, msme_data: dict[str, Any], score_breakdown: dict[str, Any]) -> str:
        prompt = (
            "Explain this MSME financial health score in plain language for a bank credit officer. "
            f"MSME: {json.dumps(msme_data, default=str)}. Score: {json.dumps(score_breakdown, default=str)}."
        )
        return self._complete(prompt) or self._fallback_summary(msme_data, score_breakdown)

    def answer_question(self, msme_data: dict[str, Any], score_breakdown: dict[str, Any], question: str) -> str:
        prompt = (
            "Answer the user's question using only the MSME profile and score data. "
            f"Question: {question}. MSME: {json.dumps(msme_data, default=str)}. "
            f"Score: {json.dumps(score_breakdown, default=str)}."
        )
        return self._complete(prompt) or (
            f"Based on the available score data, this MSME has an overall score of "
            f"{score_breakdown.get('overall_score')} with risk band {score_breakdown.get('risk_band')}. "
            "A detailed AI answer could not be generated right now."
        )

    def explain_whatif(
        self,
        original_breakdown: dict[str, Any],
        hypothetical_breakdown: dict[str, Any],
        change_description: str,
    ) -> str:
        prompt = (
            "Explain how a what-if change affects MSME credit health. "
            f"Change: {change_description}. Original: {json.dumps(original_breakdown, default=str)}. "
            f"Hypothetical: {json.dumps(hypothetical_breakdown, default=str)}."
        )
        return self._complete(prompt) or (
            f"If the business improves this factor: {change_description}, the affected dimensions may improve. "
            "The exact final movement depends on the weighted scoring rules and data confidence."
        )

    def explain_anomaly(self, anomaly_type: str, supporting_data: dict[str, Any]) -> str:
        prompt = (
            "Explain this MSME credit anomaly in simple language and mention why it matters. "
            f"Type: {anomaly_type}. Data: {json.dumps(supporting_data, default=str)}."
        )
        return self._complete(prompt) or (
            f"Anomaly detected: {anomaly_type}. The supporting data suggests a pattern that should be reviewed "
            "before relying fully on the automated score."
        )

    def extract_structured_data(self, free_text: str) -> dict[str, Any]:
        prompt = (
            "Extract structured MSME credit signals from this note. Return concise JSON only with fields such as "
            f"mentions_gst, mentions_upi, mentions_cash_flow, mentions_employees. Note: {free_text}"
        )
        response = self._complete(prompt, response_format={"type": "json_object"})
        if response:
            try:
                parsed = json.loads(response)
                if isinstance(parsed, dict):
                    return parsed
            except json.JSONDecodeError:
                response = None
        text = free_text.lower()
        return {
            "mentions_gst": "gst" in text,
            "mentions_upi": "upi" in text,
            "mentions_cash_flow": "cash flow" in text or "cashflow" in text,
            "mentions_employees": "employee" in text or "staff" in text or "worker" in text,
        }

    def _complete(self, prompt: str, response_format: dict[str, str] | None = None) -> str | None:
        if not self.settings.mistral_api_key or self.settings.mistral_api_key.startswith("replace_"):
            return None
        try:
            from mistralai.client import Mistral

            client = Mistral(api_key=self.settings.mistral_api_key, timeout_ms=8000)
            response = client.chat.complete(
                model=self.settings.mistral_model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=320,
                response_format=response_format,
            )
            content = response.choices[0].message.content
            if isinstance(content, str):
                return content.strip()
            return str(content).strip()
        except Exception:
            return None

    def _fallback_summary(self, msme_data: dict[str, Any], score_breakdown: dict[str, Any]) -> str:
        return (
            f"{msme_data.get('business_name', 'This MSME')} has an overall health score of "
            f"{score_breakdown.get('overall_score')} and is currently classified as "
            f"{score_breakdown.get('risk_band')}. The confidence score is "
            f"{score_breakdown.get('confidence_score')}, so credit teams should consider both the score and "
            "the completeness of connected data sources."
        )
