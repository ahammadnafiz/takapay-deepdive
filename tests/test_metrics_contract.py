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


class TestSentiment:
    def test_raw_split(self, metrics):
        s = metrics["sentiment"]
        assert s["raw_total"] == 660
        r = s["raw"]
        assert r["negative"]["count"] == 338
        assert r["negative"]["pct"] == 51.2
        assert r["positive"]["count"] == 237
        assert r["neutral"]["count"] == 85

    def test_clean_split_matches_headline(self, metrics):
        s = metrics["sentiment"]
        assert s["clean_total"] == 590
        assert s["clean"] == metrics["headline"]["clean_sentiment"]


class TestTopics:
    def test_sorted_by_volume_descending(self, metrics):
        totals = [t["total"] for t in metrics["topics"]]
        assert totals == sorted(totals, reverse=True)

    def test_off_topic_noise_excluded(self, metrics):
        assert all(t["topic"] != "off_topic" for t in metrics["topics"])

    def test_topics_cover_all_relevant_mentions(self, metrics):
        assert sum(t["total"] for t in metrics["topics"]) == 590

    def test_dominant_topic(self, metrics):
        top = metrics["topics"][0]
        assert top["topic"] == "failed_transaction"
        assert top["total"] == 220
        assert top["pct_negative"] == 89.5

    def test_key_topic_counts(self, metrics):
        by = {t["topic"]: t for t in metrics["topics"]}
        assert by["competitor"]["total"] == 72
        assert by["competitor"]["pct_negative"] == 100.0
        assert by["cashback_offer"]["total"] == 63
        assert by["charges_fees"]["total"] == 30
        assert by["charges_fees"]["pct_negative"] == 83.3

    def test_informational_topics_are_genuinely_neutral(self, metrics):
        # agent_network and feature_query are location/how-to queries, not
        # complaints — 0 negative is correct, not a labeling error.
        by = {t["topic"]: t for t in metrics["topics"]}
        assert by["agent_network"]["total"] == 26
        assert by["agent_network"]["negative"] == 0
        assert by["feature_query"]["total"] == 19
        assert by["feature_query"]["negative"] == 0

    def test_per_topic_split_sums_to_total(self, metrics):
        for t in metrics["topics"]:
            assert t["negative"] + t["neutral"] + t["positive"] == t["total"]


class TestEmittedArtifact:
    def test_main_writes_metrics_json(self, tmp_path):
        out = tmp_path / "metrics.json"
        main(csv_path=CSV_PATH, out_path=out)
        written = json.loads(out.read_text())
        assert written["headline"]["relevant_mentions"] == 590

    def test_committed_artifact_matches_pipeline(self, metrics):
        """The dashboard builds from the committed web/lib/metrics.json, not
        from the pipeline at deploy time. Guard against the artifact drifting
        from its source: everything but the run timestamp must match.
        """
        committed_path = ROOT / "web" / "lib" / "metrics.json"
        committed = json.loads(committed_path.read_text())
        drop_ts = lambda m: {k: v for k, v in m.items() if k != "generated_at"}
        assert drop_ts(committed) == drop_ts(metrics), (
            "web/lib/metrics.json is stale — re-run `python3 pipeline/analyze.py`"
        )
