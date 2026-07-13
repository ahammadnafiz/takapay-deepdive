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


class TestPriorityRanking:
    def test_dominant_topic_is_first(self, metrics):
        pr = metrics["priority_ranking"]
        top = pr["topics"][0]
        assert top["topic"] == "failed_transaction"
        assert top["negative"] == 197
        assert top["total"] == 220
        assert top["pct_negative"] == 89.5

    def test_ordered_by_negative_count_descending(self, metrics):
        negatives = [t["negative"] for t in metrics["priority_ranking"]["topics"]]
        assert negatives == sorted(negatives, reverse=True)

    def test_competitor_and_off_topic_absent(self, metrics):
        topics = {t["topic"] for t in metrics["priority_ranking"]["topics"]}
        assert "competitor" not in topics
        assert "off_topic" not in topics

    def test_only_fixable_topics_with_negatives(self, metrics):
        # A "Fix this first" list is about things to fix — genuinely neutral
        # topics (agent_network, feature_query, product_news) have no negatives
        # and drop out by construction.
        topics = metrics["priority_ranking"]["topics"]
        assert len(topics) == 10
        assert all(t["negative"] > 0 for t in topics)

    def test_second_topic_and_volume_context(self, metrics):
        topics = metrics["priority_ranking"]["topics"]
        second = topics[1]
        assert second["topic"] == "charges_fees"
        assert second["negative"] == 25
        for t in topics:
            assert t["total"] >= t["negative"]
            assert isinstance(t["pct_negative"], float)

    def test_one_issue_exceeds_the_rest_combined(self, metrics):
        pr = metrics["priority_ranking"]
        assert pr["top_negative"] == 197
        assert pr["rest_negative"] == 60
        assert pr["top_exceeds_rest"] is True


class TestCompetitor:
    def test_two_separate_signals_split(self, metrics):
        c = metrics["competitor"]
        assert c["name"] == "NgoodPay"
        assert c["comparison"]["count"] == 72
        assert c["promo"]["count"] == 9
        # 72 + 9 must equal the headline's total competitor footprint.
        assert c["total_posts"] == 81
        assert c["total_posts"] == metrics["headline"]["top_competitor"]["mentions"]

    def test_comparison_posts_all_negative(self, metrics):
        comp = metrics["competitor"]["comparison"]
        assert comp["pct_negative"] == 100.0
        s = comp["sentiment"]
        assert s["negative"] == 72
        assert s["neutral"] == 0
        assert s["positive"] == 0

    def test_theme_counts_corrected_not_substring_inflated(self, metrics):
        # Corrected split: 'recharge...bonus' posts are cashback, not fees.
        # Naive substring matching counted them as fees (recharge ⊃ charge),
        # inflating fees to 32; the honest fee-complaint count is 10.
        by = {t["key"]: t["count"] for t in metrics["competitor"]["comparison"]["themes"]}
        assert by == {
            "app_experience": 21,
            "cashback_bonus": 21,
            "agent_network": 13,
            "fees_charges": 10,
            "customer_care": 7,
        }

    def test_themes_partition_all_comparison_posts(self, metrics):
        themes = metrics["competitor"]["comparison"]["themes"]
        assert sum(t["count"] for t in themes) == 72
        counts = [t["count"] for t in themes]
        assert counts == sorted(counts, reverse=True)

    def test_agent_theme_names_neighborhoods(self, metrics):
        agent = next(
            t for t in metrics["competitor"]["comparison"]["themes"]
            if t["key"] == "agent_network"
        )
        assert len(agent["neighborhoods"]) == 13
        for hood in ("Motijheel", "Mohakhali", "Bashundhara"):
            assert hood in agent["neighborhoods"]

    def test_fees_theme_cross_references_internal_complaints(self, metrics):
        xref = metrics["competitor"]["comparison"]["fees_cross_ref"]
        assert xref["topic"] == "charges_fees"
        assert xref["count"] == 30
        assert xref["pct_negative"] == 83.3

    def test_promo_posts_carry_a_verbatim_example(self, metrics):
        promo = metrics["competitor"]["promo"]
        assert isinstance(promo["example"], str) and promo["example"]


class TestLanguage:
    def test_coverage_leads_with_banglish_share(self, metrics):
        lang = metrics["language"]
        assert lang["total"] == 660
        assert lang["banglish_pct"] == 59.1
        by = {r["code"]: r for r in lang["coverage"]}
        assert by["bn-en"]["count"] == 390 and by["bn-en"]["pct"] == 59.1
        assert by["bn"]["count"] == 155 and by["bn"]["pct"] == 23.5
        assert by["en"]["count"] == 115 and by["en"]["pct"] == 17.4
        assert sum(r["count"] for r in lang["coverage"]) == 660

    def test_coverage_sorted_by_volume(self, metrics):
        counts = [r["count"] for r in metrics["language"]["coverage"]]
        assert counts == sorted(counts, reverse=True)

    def test_non_english_suspect_share(self, metrics):
        lang = metrics["language"]
        assert lang["suspects_non_english"] == 25
        assert lang["suspects_total"] == 34

    def test_naive_per_language_negativity_on_clean_set(self, metrics):
        # These are the confounded numbers; the view must caveat them.
        by = {r["code"]: r for r in metrics["language"]["naive_negative"]}
        assert by["bn-en"]["count"] == 320 and by["bn-en"]["pct_negative"] == 65.9
        assert by["bn"]["count"] == 155 and by["bn"]["pct_negative"] == 56.8
        assert by["en"]["count"] == 115 and by["en"]["pct_negative"] == 26.1

    def test_confound_topic_holds_language_fixed(self, metrics):
        # Within failed_transaction, negativity is near-identical across the two
        # Bangla-family languages — language explains nothing once topic is held.
        c = metrics["language"]["confound"]
        assert c["topic"] == "failed_transaction"
        by = {r["code"]: r for r in c["rows"]}
        assert by["bn"]["count"] == 95 and by["bn"]["pct_negative"] == 88.4
        assert by["bn-en"]["count"] == 125 and by["bn-en"]["pct_negative"] == 90.4
        assert abs(by["bn"]["pct_negative"] - by["bn-en"]["pct_negative"]) < 3


class TestPlatform:
    def test_volume_and_reference_line(self, metrics):
        p = metrics["platform"]
        assert p["total"] == 590
        assert p["overall_negative_pct"] == 55.8
        top = p["rows"][0]
        assert top["platform"] == "Facebook"
        assert top["count"] == 198 and top["pct"] == 33.6
        assert top["pct_negative"] == 57.6

    def test_rows_sorted_by_volume_and_cover_clean_set(self, metrics):
        rows = metrics["platform"]["rows"]
        counts = [r["count"] for r in rows]
        assert counts == sorted(counts, reverse=True)
        assert sum(counts) == 590

    def test_negativity_sits_in_a_flat_band(self, metrics):
        # Platform doesn't explain sentiment: everything is in a 47-66% band.
        rows = metrics["platform"]["rows"]
        assert all(47 <= r["pct_negative"] <= 67 for r in rows)
        band = metrics["platform"]["band"]
        assert band["low"] == 47.1 and band["high"] == 66.1


class TestTrustPanel:
    def test_filtered_totals(self, metrics):
        f = metrics["trust_panel"]["filtered"]
        assert f["total"] == 70
        assert f["off_topic"]["count"] == 61
        assert f["competitor_only"]["count"] == 9

    def test_off_topic_examples_are_verbatim(self, metrics):
        examples = metrics["trust_panel"]["filtered"]["off_topic"]["examples"]
        assert 2 <= len(examples) <= 3
        assert all(isinstance(e, str) and e for e in examples)

    def test_suspect_counts_and_asymmetry(self, metrics):
        s = metrics["trust_panel"]["suspects"]
        assert s["count"] == 34
        assert s["complaints_as_positive"] == 24
        assert s["praise_as_negative"] == 10

    def test_suspect_items_expandable_detail(self, metrics):
        items = metrics["trust_panel"]["suspects"]["items"]
        assert len(items) == 34
        for item in items:
            assert item["text"]
            assert item["label"] in ("positive", "negative", "neutral")
            assert isinstance(item["score"], int)
            assert item["family_says"] in ("positive", "negative", "neutral")

    def test_duplicates(self, metrics):
        d = metrics["trust_panel"]["duplicates"]
        assert d["distinct_texts"] == 10
        assert d["rows"] == 20

    def test_trust_arc_shadow_number(self, metrics):
        arc = metrics["trust_panel"]["trust_arc"]
        assert arc["raw_pct"] == 51.2
        assert arc["clean_pct"] == 55.8
        assert arc["audited_pct"] == 58.1


class TestMentionFlags:
    def test_every_mention_has_flags(self, metrics):
        mentions = metrics["mentions"]
        assert len(mentions) == 660
        for m in mentions:
            assert isinstance(m["is_relevant"], bool)
            assert isinstance(m["is_suspect"], bool)
            assert isinstance(m["is_duplicate"], bool)

    def test_flag_counts_match_trust_panel(self, metrics):
        mentions = metrics["mentions"]
        assert sum(m["is_relevant"] for m in mentions) == 590
        assert sum(m["is_suspect"] for m in mentions) == 34
        assert sum(m["is_duplicate"] for m in mentions) == 20

    def test_suspects_are_a_subset_of_relevant(self, metrics):
        mentions = metrics["mentions"]
        assert all(m["is_relevant"] for m in mentions if m["is_suspect"])

    def test_mentions_carry_the_feed_filter_fields(self, metrics):
        # The mention feed filters on topic/sentiment/platform and shows a
        # timestamp; every row must carry all four non-empty.
        for m in metrics["mentions"]:
            assert m["topic"]
            assert m["sentiment"] in ("positive", "neutral", "negative")
            assert m["platform"]
            assert m["timestamp"]

    def test_positive_failed_transaction_surfaces_suspects(self, metrics):
        # The feed's demo moment (ticket #6 AC): filtering to positive +
        # failed_transaction must surface suspect-flagged complaint rows.
        # Guard the data so the composed-filter demo can never silently empty.
        demo = [
            m
            for m in metrics["mentions"]
            if m["topic"] == "failed_transaction"
            and m["sentiment"] == "positive"
            and m["is_suspect"]
        ]
        assert len(demo) == 17


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
