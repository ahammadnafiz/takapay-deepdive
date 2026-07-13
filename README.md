# TakaPay DeepDive

**Live dashboard: https://takapay-deepdive.vercel.app**

A social-listening deep-dive on TakaPay, built from a 660-post sample feed (June 2026, 7 platforms). One page, one story: what people are saying, what to fix first, and exactly how much you should trust the numbers behind both.

The stack is deliberately small. A stdlib-only Python pipeline (`pipeline/analyze.py`) reads the raw CSV and emits a single `metrics.json`; a Next.js dashboard (shadcn/ui + Recharts) renders it statically. There is no database and no runtime API. 48 contract tests pin every number the UI shows to the raw data.

```bash
# regenerate metrics from the raw csv
python3 -m pipeline.analyze

# run the contract tests
python3 -m pytest tests/ -q

# run the dashboard
cd web && npm install && npm run dev
```

The full analysis lives in `takapay_deep_dive.ipynb` (every figure reproducible top to bottom) and `TakaPay_Analysis_Report.md` (the written version, correction trail included).

## The product call: "Fix this first"

The brief asked for one product decision. Mine is the Priority Ranking: operational topics ranked by negative-mention count, with competitor chatter deliberately excluded.

Why this one? Because a brand manager staring at "55.8% negative" has no next action. The ranking converts sentiment into a to-do list, and this dataset makes the top item unmissable: failed transactions account for 197 negative mentions, more than the other nine fixable topics combined (60). One fix moves more conversation than everything else together.

The exclusion is the defended part. NgoodPay comparison posts are 100% negative and would sit at #2 if I left them in, but "customers say NgoodPay's fees are lower" is not a bug you triage. It's competitive intelligence with a different owner. The dashboard keeps a separate competitor view for it, including the detail that the fee complaints there cross-reference our own charges-and-fees topic. Fees cut both ways: people complain about them, then cite them when they leave.

## What I noticed about the data

The dataset is booby-trapped, and most of the work was refusing to chart it as-is.

- **The `brand_mention` column is dead weight.** It is `True` on all 660 rows. 70 of those rows never mention TakaPay at all: 61 are scrape noise (traffic, biryani, Messi) and 9 are NgoodPay-only promo posts. Filtering them moves headline negativity from 51.2% to 55.8%, because the noise skewed positive-neutral.
- **34 rows have sentiment flipped against their own text.** "10000 taka TakaPay theke katlo but receiver pay nai" labeled positive, score 93. Found by template-family majority vote: 68% of the feed is templated text, so near-identical posts can out-vote a stray label. The flips are asymmetric, 24 hidden complaints vs 10 hidden praise, so the raw feed flatters the brand. The dashboard flags these rows but never corrects them.
- **The trust arc.** Same question, three answers: 51.2% negative (raw) → 55.8% (relevance-filtered) → 58.1% (if the 34 flipped labels were corrected). The dashboard's headline uses the middle number; the third is shown as a hollow "shadow" bar and never as a headline.
- **The language "insight" that isn't.** Banglish posts run 65.9% negative vs 26.1% for English, which looks like "Banglish users are angrier." It's a confound: English and Banglish posts share zero topics in this feed. Hold topic fixed (failed transactions) and Banglish vs Bangla is 90.4% vs 88.4%. The real language finding is coverage: 59% of the feed is code-mixed, so an English-only pipeline misreads the majority.
- **Duplicates and dead columns.** 10 byte-identical texts across different authors and platforms (20 rows, disclosed and kept, never silently dropped). The reactions/comments columns are uniform noise with near-identical means across sentiments, so no engagement weighting anywhere. Daily volume is flat, so no time-series story either.

## Where AI helped, and where it was wrong

AI (Claude) wrote most of the pipeline and dashboard code, drafted the analysis, and did the survey passes over the raw text. Every number was re-verified against the raw CSV before shipping, and the first-pass analysis was wrong in three places that mattered. The correction trail is kept in `TakaPay_Analysis_Report.md` §2; the short version:

1. **It missed the flipped labels entirely.** The first draft's data-quality section found only a soft "label/score boundary inconsistency." The 34 flipped rows, the single most consequential data problem in the set, only surfaced after systematic template-level auditing on the second pass.
2. **It misdiagnosed the label/score overlap and gave advice that would have backfired.** The first draft saw positive labels scoring in the neutral 46-60 band and recommended "trust the score over the label." All 20 overlapping rows turn out to be off-topic noise; after relevance filtering, labels partition the score axis perfectly. Worse, on the 34 flipped rows the label and score agree with each other and are both wrong, so "trust the score" would have preserved every flip.
3. **The language section had a wrong number and a wrong story.** The first draft reported English posts at ~44% negative and framed "Banglish is harsher" as a signal worth watching. The real English figure is 26.1%, and the comparison itself is confounded by construction (zero shared topics). The draft had the arithmetic wrong and the causal story wrong.

(Smaller: the duplicate share was misstated as ~1.5%; it's 3.0%. The engagement columns went unexamined until the second pass.)

## With another week

- A code-mixed Bangla sentiment model (BanglaBERT or similar) instead of trusting provided labels, since 25 of the 34 flipped labels are on Bangla or Banglish text.
- Entity resolution for unnamed brand references ("this wallet app ate my money" currently doesn't count as relevant).
- A real dedup policy: cluster template families and near-duplicates, weight or collapse them explicitly instead of just disclosing.
- Real-time ingestion with the trust panel recomputed per window, so data-quality flags age with the feed instead of being a one-off audit.

## Repo map

```
pipeline/analyze.py          # csv → metrics.json, stdlib only
tests/                       # 48 contract tests pinning UI numbers to raw data
web/                         # Next.js + shadcn/ui + Recharts dashboard
takapay_deep_dive.ipynb      # the full analysis, reproducible
TakaPay_Analysis_Report.md   # written report, correction trail in §2
CONTEXT.md                   # shared vocabulary + locked decisions
docs/loom-outline.md         # walkthrough outline for the demo video
data/                        # raw csv + first-pass flagged exports
```
