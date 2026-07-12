"""Contract tests for the metrics.json seam.

The executed notebook (takapay_deep_dive.ipynb) is the oracle: every expected
value below was independently derived there from the raw CSV. Tests verify the
emitted metrics contract only — never pipeline internals.
"""

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from pipeline.analyze import build_metrics, main  # noqa: E402

CSV_PATH = ROOT / "data" / "takapay_sample_data.csv"


@pytest.fixture(scope="module")
def metrics():
    return build_metrics(CSV_PATH)


class TestHeadline:
    def test_relevance_split(self, metrics):
        h = metrics["headline"]
        assert h["total_mentions"] == 660
        assert h["relevant_mentions"] == 590
        assert h["excluded_mentions"] == 70

    def test_clean_sentiment_split(self, metrics):
        s = metrics["headline"]["clean_sentiment"]
        assert s["negative"]["count"] == 329
        assert s["negative"]["pct"] == 55.8
        assert s["positive"]["count"] == 214
        assert s["positive"]["pct"] == 36.3
        assert s["neutral"]["count"] == 47
        assert s["neutral"]["pct"] == 8.0

    def test_raw_negative_for_comparison(self, metrics):
        assert metrics["headline"]["raw_negative_pct"] == 51.2

    def test_top_pain_point(self, metrics):
        p = metrics["headline"]["top_pain_point"]
        assert p["topic"] == "failed_transaction"
        assert p["count"] == 220
        assert p["pct_negative"] == 89.5

    def test_top_competitor(self, metrics):
        c = metrics["headline"]["top_competitor"]
        assert c["name"] == "NgoodPay"
        assert c["mentions"] == 81


class TestEmittedArtifact:
    def test_main_writes_metrics_json(self, tmp_path):
        out = tmp_path / "metrics.json"
        main(csv_path=CSV_PATH, out_path=out)
        written = json.loads(out.read_text())
        assert written["headline"]["relevant_mentions"] == 590
