"""TakaPay social-feed analysis pipeline.

Reads the raw CSV and emits a single metrics.json consumed by the dashboard
at build time. Stdlib only — no runtime dependencies.

Vocabulary follows CONTEXT.md: a "Relevant Mention" is a row whose text
actually contains the brand name; the provided `brand_mention` column is
always True and carries no information, so it is ignored.
"""

from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

BRAND = "takapay"
SENTIMENTS = ("negative", "neutral", "positive")

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CSV = ROOT / "data" / "takapay_sample_data.csv"
DEFAULT_OUT = ROOT / "web" / "lib" / "metrics.json"

# Wallet-brand tokens look like "SomethingPay"; the top competitor is the
# most-mentioned one that isn't the brand itself.
COMPETITOR_TOKEN = re.compile(r"\b([A-Z][A-Za-z]*Pay)\b")

# Template Family normalization: strip digits/time-units so near-identical
# posts collapse to the same skeleton (per CONTEXT.md — 449/660 rows belong
# to a family of >=4 members).
DIGIT_RE = re.compile(r"\d+")
TIME_UNIT_RE = re.compile(r"\b(ghonta|din|min|minute|hour|day|sec|week)\b")
WHITESPACE_RE = re.compile(r"\s+")

# Small template families can't vote (<4 members); these phrase pairs catch
# the same flip pattern (praise phrase + negative label, complaint phrase +
# positive label) by keyword union instead.
KEYWORD_RULES = (
    ("darun offer", "negative", "positive"),
    ("atke ache", "positive", "negative"),
)

# Off-topic verbatim examples for the Trust Panel, one per noise category the
# ticket calls out. First match in file order keeps the pipeline deterministic.
OFF_TOPIC_EXAMPLE_KEYWORDS = ("traffic", "biryani", "messi")


def normalize_template(text: str) -> str:
    t = text.lower()
    t = DIGIT_RE.sub("#", t)
    t = TIME_UNIT_RE.sub("U", t)
    return WHITESPACE_RE.sub(" ", t).strip()


def load_rows(csv_path: Path) -> list[dict]:
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["is_relevant"] = BRAND in row["text"].lower()
        row["sentiment_score"] = int(row["sentiment_score"])
    return rows


def detect_suspects(rows: list[dict]) -> dict[str, dict]:
    """Deterministic Suspect Label detector (CONTEXT.md "Suspect Label").

    Layer 1: within each Template Family of >=4 rows, flag members whose
    label disagrees with a >=75% majority. Layer 2: keyword union for
    families too small to vote. Every flag traces to real siblings — no ML.
    """
    families: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        families[normalize_template(row["text"])].append(row)

    suspects: dict[str, dict] = {}
    for members in families.values():
        if len(members) < 4:
            continue
        counts = Counter(r["sentiment"] for r in members)
        majority, majority_n = counts.most_common(1)[0]
        if majority_n / len(members) < 0.75:
            continue
        for row in members:
            if row["sentiment"] != majority:
                suspects[row["id"]] = {"family_says": majority}

    for phrase, wrong_label, true_label in KEYWORD_RULES:
        for row in rows:
            if phrase in row["text"].lower() and row["sentiment"] == wrong_label:
                suspects.setdefault(row["id"], {"family_says": true_label})

    return suspects


def detect_duplicate_ids(rows: list[dict]) -> set[str]:
    """Byte-identical texts from different rows (CONTEXT.md "Duplicate Pair")."""
    text_counts = Counter(row["text"] for row in rows)
    return {row["id"] for row in rows if text_counts[row["text"]] > 1}


def pct(part: int, whole: int) -> float:
    return round(100 * part / whole, 1)


def sentiment_split(rows: list[dict]) -> dict:
    counts = Counter(r["sentiment"] for r in rows)
    return {
        s: {"count": counts[s], "pct": pct(counts[s], len(rows))}
        for s in SENTIMENTS
    }


def top_pain_point(relevant: list[dict]) -> dict:
    by_topic = Counter(r["topic"] for r in relevant if r["sentiment"] == "negative")
    topic, _ = by_topic.most_common(1)[0]
    topic_rows = [r for r in relevant if r["topic"] == topic]
    negatives = sum(1 for r in topic_rows if r["sentiment"] == "negative")
    return {
        "topic": topic,
        "count": len(topic_rows),
        "pct_negative": pct(negatives, len(topic_rows)),
    }


def topic_breakdown(relevant: list[dict]) -> list[dict]:
    """Per-topic sentiment on the Relevant Mentions, sorted by volume.

    off_topic never appears — those rows are all irrelevant (they never name
    the brand) and were dropped before this point.
    """
    out = []
    for topic in {r["topic"] for r in relevant}:
        rows_t = [r for r in relevant if r["topic"] == topic]
        counts = Counter(r["sentiment"] for r in rows_t)
        out.append({
            "topic": topic,
            "total": len(rows_t),
            "negative": counts["negative"],
            "neutral": counts["neutral"],
            "positive": counts["positive"],
            "pct_negative": pct(counts["negative"], len(rows_t)),
        })
    out.sort(key=lambda t: (-t["total"], t["topic"]))
    return out


# The "Fix this first" ranking is about operational pain the brand can act on.
# competitor is excluded by design (fix-vs-fight — routed to the Competitor
# view); off_topic never reaches the relevant set at all.
PRIORITY_EXCLUDE = {"competitor", "off_topic"}


def priority_ranking(topics: list[dict]) -> dict:
    """Ops topics ranked by negative-mention count for the featured product call.

    Built from topic_breakdown, so counts can never disagree with the topic
    view. Topics with zero negatives aren't things to fix and drop out, leaving
    a ranked to-do list. `top_exceeds_rest` backs the headline claim that one
    issue drives more negative conversation than everything else combined.
    """
    ranked = [
        {
            "topic": t["topic"],
            "negative": t["negative"],
            "total": t["total"],
            "pct_negative": t["pct_negative"],
        }
        for t in topics
        if t["topic"] not in PRIORITY_EXCLUDE and t["negative"] > 0
    ]
    ranked.sort(key=lambda t: (-t["negative"], -t["total"], t["topic"]))
    top_negative = ranked[0]["negative"]
    rest_negative = sum(t["negative"] for t in ranked[1:])
    return {
        "topics": ranked,
        "top_negative": top_negative,
        "rest_negative": rest_negative,
        "top_exceeds_rest": top_negative > rest_negative,
    }


def top_competitor(rows: list[dict]) -> dict:
    names: Counter[str] = Counter()
    for row in rows:
        if row["topic"] != "competitor":
            continue
        for token in COMPETITOR_TOKEN.findall(row["text"]):
            if token.lower() != BRAND:
                names[token] += 1
    name, _ = names.most_common(1)[0]
    mentions = sum(1 for r in rows if r["topic"] == "competitor")
    return {"name": name, "mentions": mentions}


def audited_sentiment(row: dict, suspects: dict[str, dict]) -> str:
    """The provided label, or the family's majority voice for a suspect row.

    Used only for the shadow number — never for a displayed label (flag,
    don't fix; see CONTEXT.md "Suspect Label").
    """
    info = suspects.get(row["id"])
    return info["family_says"] if info else row["sentiment"]


def build_trust_panel(
    rows: list[dict],
    relevant: list[dict],
    suspects: dict[str, dict],
    duplicate_ids: set[str],
    raw_negative_pct: float,
    clean_negative_pct: float,
) -> dict:
    non_relevant = [r for r in rows if not r["is_relevant"]]
    off_topic = [r for r in non_relevant if r["topic"] == "off_topic"]
    competitor_only = [r for r in non_relevant if r["topic"] == "competitor"]

    examples = []
    for keyword in OFF_TOPIC_EXAMPLE_KEYWORDS:
        match = next((r for r in off_topic if keyword in r["text"].lower()), None)
        if match:
            examples.append(match["text"])

    rows_by_id = {r["id"]: r for r in rows}
    flip_direction = Counter(
        (rows_by_id[rid]["sentiment"], info["family_says"])
        for rid, info in suspects.items()
    )

    audited_negative = sum(
        1 for r in relevant if audited_sentiment(r, suspects) == "negative"
    )

    suspect_items = sorted(
        (
            {
                "id": r["id"],
                "text": r["text"],
                "label": r["sentiment"],
                "score": r["sentiment_score"],
                "family_says": suspects[r["id"]]["family_says"],
            }
            for r in rows
            if r["id"] in suspects
        ),
        key=lambda item: item["id"],
    )

    return {
        "filtered": {
            "total": len(non_relevant),
            "off_topic": {"count": len(off_topic), "examples": examples},
            "competitor_only": {"count": len(competitor_only)},
        },
        "suspects": {
            "count": len(suspects),
            "complaints_as_positive": flip_direction[("positive", "negative")],
            "praise_as_negative": flip_direction[("negative", "positive")],
            "items": suspect_items,
        },
        "duplicates": {
            "distinct_texts": len({r["text"] for r in rows if r["id"] in duplicate_ids}),
            "rows": len(duplicate_ids),
        },
        "trust_arc": {
            "raw_pct": raw_negative_pct,
            "clean_pct": clean_negative_pct,
            "audited_pct": pct(audited_negative, len(relevant)),
        },
    }


def build_mentions(rows: list[dict], suspects: dict[str, dict], duplicate_ids: set[str]) -> list[dict]:
    return [
        {
            "id": r["id"],
            "platform": r["platform"],
            "timestamp": r["timestamp"],
            "text": r["text"],
            "language": r["language"],
            "sentiment": r["sentiment"],
            "sentiment_score": r["sentiment_score"],
            "topic": r["topic"],
            "is_relevant": r["is_relevant"],
            "is_suspect": r["id"] in suspects,
            "is_duplicate": r["id"] in duplicate_ids,
        }
        for r in rows
    ]


def build_metrics(csv_path: Path = DEFAULT_CSV) -> dict:
    rows = load_rows(csv_path)
    relevant = [r for r in rows if r["is_relevant"]]
    raw_split = sentiment_split(rows)
    clean_split = sentiment_split(relevant)

    suspects = detect_suspects(rows)
    duplicate_ids = detect_duplicate_ids(rows)
    topics = topic_breakdown(relevant)

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "headline": {
            "total_mentions": len(rows),
            "relevant_mentions": len(relevant),
            "excluded_mentions": len(rows) - len(relevant),
            "clean_sentiment": clean_split,
            "raw_negative_pct": raw_split["negative"]["pct"],
            "top_pain_point": top_pain_point(relevant),
            "top_competitor": top_competitor(rows),
        },
        "sentiment": {
            "raw_total": len(rows),
            "clean_total": len(relevant),
            "raw": raw_split,
            "clean": clean_split,
        },
        "topics": topics,
        "priority_ranking": priority_ranking(topics),
        "trust_panel": build_trust_panel(
            rows,
            relevant,
            suspects,
            duplicate_ids,
            raw_split["negative"]["pct"],
            clean_split["negative"]["pct"],
        ),
        "mentions": build_mentions(rows, suspects, duplicate_ids),
    }


def main(csv_path: Path = DEFAULT_CSV, out_path: Path = DEFAULT_OUT) -> None:
    metrics = build_metrics(csv_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(metrics, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
