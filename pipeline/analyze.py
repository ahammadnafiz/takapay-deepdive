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
from collections import Counter
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


def load_rows(csv_path: Path) -> list[dict]:
    with open(csv_path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    for row in rows:
        row["is_relevant"] = BRAND in row["text"].lower()
    return rows


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


def build_metrics(csv_path: Path = DEFAULT_CSV) -> dict:
    rows = load_rows(csv_path)
    relevant = [r for r in rows if r["is_relevant"]]
    raw_negative = sum(1 for r in rows if r["sentiment"] == "negative")

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "headline": {
            "total_mentions": len(rows),
            "relevant_mentions": len(relevant),
            "excluded_mentions": len(rows) - len(relevant),
            "clean_sentiment": sentiment_split(relevant),
            "raw_negative_pct": pct(raw_negative, len(rows)),
            "top_pain_point": top_pain_point(relevant),
            "top_competitor": top_competitor(rows),
        },
        "sentiment": {
            "raw_total": len(rows),
            "clean_total": len(relevant),
            "raw": sentiment_split(rows),
            "clean": sentiment_split(relevant),
        },
        "topics": topic_breakdown(relevant),
    }


def main(csv_path: Path = DEFAULT_CSV, out_path: Path = DEFAULT_OUT) -> None:
    metrics = build_metrics(csv_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(metrics, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
