# TakaPay Social Data — End-to-End Analysis Report

**Dataset:** `data/takapay_sample_data.csv` — 660 records, June 1–30, 2026
**Prepared for:** DeepDive take-home task (Markopolo AI, Associate Product Engineer)
**Companion:** `takapay_deep_dive.ipynb` reproduces every number and chart in this report from the raw CSV. Section pointers below (e.g. *nb §6*) refer to it.

> **Revision note.** This is the second pass. The first draft of this report was AI-assisted and got three things wrong; all three were caught by re-verifying every claim against the raw data. The corrections are kept visible in §2 below rather than silently patched — partly because the brief asks where AI got things wrong, mostly because the corrections *are* findings.

---

## 1. Dataset Overview

| Field | Detail |
|---|---|
| Records | 660 |
| Date range | 2026-06-01 to 2026-06-30 (single month, no long-term trend to analyze) |
| Platforms | Facebook (225), Reddit (81), News/Media (76), Instagram (74), YouTube (72), TikTok (68), Twitter (64) |
| Languages | bn-en (390, 59%), bn (155, 23%), en (115, 17%) |
| Topics | 15 categories, heavily skewed toward `failed_transaction` |
| Sentiment | negative 51.2%, positive 35.9%, neutral 12.9% (raw, unfiltered) |
| Missing values | None — every field is populated for all 660 rows |
| Engagement | `reactions` / `comments` verified to be uniform noise (0–500, near-identical means across sentiments and topics) — checked and excluded from all analysis (*nb §14*) |

No nulls, no malformed dates, no encoding issues. The mess in this dataset isn't missing data — it's **mislabeled and over-inclusive** data, which is a more dangerous kind of problem because it passes every standard data-quality check.

---

## 2. Correction trail — what the first pass got wrong

1. **It missed the biggest data-quality problem entirely: 34 rows with flipped sentiment labels** (§4 below). The first draft found only a soft "boundary inconsistency"; systematic template-level auditing found 34 rows whose label *and* score contradict their own text.
2. **The "label vs score boundary inconsistency" finding was a misdiagnosis.** The first draft claimed positive labels bleed into the neutral score band (46–60) and recommended "trust the score over the label." In fact all 20 overlapping rows are `off_topic` noise — after relevance filtering, labels partition the score axis perfectly (negative 6–30, neutral 45–60, positive 72–94, zero overlap). The overlap was the *relevance* problem wearing a different costume, and the "trust the score" advice would have failed anyway: on the 34 flipped rows, label and score agree with each other and are both wrong (*nb §4*).
3. **The language section had a wrong number and a wrong causal story.** The first draft reported pure-English posts at ~44% negative and framed "Banglish is harsher" as a signal to watch. The real figure is 26.1%, and the whole comparison is confounded by construction — see §8.
4. (Smaller) Duplicates were described as "~1.5% of rows"; the correct figure is 20 rows = 3.0%. The first draft also never examined the `reactions`/`comments` columns; they are noise, now documented as such.

---

## 3. Trap 1 — ~10.6% of "brand mentions" aren't about the brand

Every row in the dataset is flagged `brand_mention = True` — there is no `False` anywhere in the column. A flag with one value filters nothing. Checking the text directly: **70 of 660 rows (10.6%) never mention "TakaPay" anywhere** (*nb §2*).

These break into two distinct patterns:

### 3a. Pure noise — 61 rows tagged `off_topic`
Traffic, weather, food recommendations, football chat — swept in by a broad keyword/hashtag scrape:

> *"Traffic ajke Farmgate e insane, 2 ghonta laglo pouchte."*
> *"Ei Banani er biryani ta must try, khub valo."*
> *"Argentina kal jitbe to? Messi form e ache mone hoy."*

Sentiment of this noise: 38 neutral, 23 positive, **0 negative**. Because it skews neutral/positive, leaving it in inflates the brand's apparent positivity.

### 3b. A genuine judgment call — 9 rows tagged `competitor`
> *"NgoodPay notun 500 taka cashback offer diyeche, keu try koreche?"*

These never name TakaPay, but they're not noise — they're organic chatter about a competitor's promotion (all nine are one template with different amounts). **Ruling: excluded from brand sentiment, tracked separately as a competitive-activity signal.** One number answers "how do people feel about us"; the other answers "what is the competitor doing." They shouldn't be conflated.

### Impact of filtering

| | Raw (n=660) | Relevant only (n=590) |
|---|---|---|
| Negative | 51.2% | **55.8%** |
| Positive | 35.9% | 36.3% |
| Neutral | 12.9% | **8.0%** |

Removing the noise changes the story: the brand is meaningfully more negative than the raw feed suggests (*nb §3*).

*Caveat, stated honestly: "text contains TakaPay" is a proxy for relevance, not a definition. In this dataset the proxy is verifiably exact (all 70 excluded rows are readable as traffic/weather/food/football/NgoodPay posts); in production it would need entity resolution for unnamed references ("this wallet app ate my money").*

---

## 4. Trap 2 — 34 rows with sentiment flipped against their own text

**This is the headline data-quality finding, and the first pass missed it.**

68% of the dataset (449/660 rows) is templated text — identical skeletons once numbers and time-units are normalized out (*nb §5*). That structure enables a deterministic label audit: within each template family (≥4 members), take the majority sentiment as the family's voice and flag any member whose label disagrees with a ≥75% majority (plus a small keyword check for families too small to vote).

Result: **34 suspect rows (5.2% of the dataset)**, every one hand-verified as a genuine flip (*nb §6*):

- *"2000 taka TakaPay theke katlo but receiver pay nai. 4 din dhore atke ache."* — money deducted, stuck 4 days → labeled **positive, score 93**
- *"Why is TakaPay charging 20 taka to cash out 1000? This is robbery."* → labeled **positive** (×5 in this family)
- *"TakaPay e tuition fee dilam ar 2000 taka cashback pelam, darun offer!"* → labeled **negative, score 12**

The tell: 34 other near-identical "stuck transaction" posts are correctly negative and 41 other "darun offer" posts are correctly positive. These aren't borderline judgment calls — they're systematic flips, almost certainly the deliberate trap behind the brief's "not everything in it is clean or perfectly labeled" line.

Two properties matter:

1. **Label and score agree with each other on every flipped row** — a "positive 93" complaint. So no amount of reconciling label against score detects them. Only the text is ground truth.
2. **The flips are asymmetric: 24 hidden complaints vs 10 hidden praise.** The errors run in the brand's favor — the feed looks better than reality.

**Ruling: flag, don't fix.** The dashboard displays provided labels everywhere, flags the 34 suspects visibly, and reports what correcting them would do — it does not silently re-label data because a heuristic disagrees. 25 of the 34 flips are in Bangla or Banglish (18 code-mixed + 7 Bangla script); only the English "robbery" family would survive an English-only pipeline — see §8.

---

## 5. The trust arc — what the dashboard says depends on what reaches it

| Pipeline stage | % negative |
|---|---|
| Raw feed (n=660) | 51.2% |
| Relevance-filtered (n=590) | 55.8% |
| Label-audited (shadow number) | **58.1%** |

The naive dashboard understates the brand's problem by **~7 points** (*nb §7*). This is the single most important thing to build a feature around, and it directly answers the brief's "caring whether what reaches the dashboard is actually correct."

---

## 6. Topic breakdown — one topic dominates everything

On the 590 relevant mentions (*nb §8*):

| Topic | Count | % Negative |
|---|---|---|
| failed_transaction | 220 | 89.5% |
| competitor | 72 | 100% |
| cashback_offer | 63 | 6.3% |
| send_money / recharge | 50 each | 8.0% |
| charges_fees | 30 | 83.3% |
| agent_network | 26 | 0% (all neutral — location queries, not complaints) |
| bill_payment | 24 | 4.2% |
| feature_query | 19 | 0% (all neutral) |
| customer_care | 13 | 30.8% |
| login_otp | 10 | 90% |
| app_crash | 9 | 88.9% |
| app_experience / product_news | 2 each | 50% / 0% |

`failed_transaction` alone is **220 rows — 33% of the raw dataset, 37% of relevant volume — at ~90% negative**, more than triple the next largest topic. Transactional failure and money friction (failed transactions, fees, OTP, crashes) drive almost all negativity. `agent_network` and `feature_query` being 100% neutral is genuine, not a labeling error — they're informational queries. A brand manager doesn't just need "what % is negative"; they need "what's driving it," and the answer is unambiguous.

---

## 7. Priority view — separate what you fix from what you fight

Ranking operational topics by count of negative mentions (arithmetically identical to volume × %negative) puts `failed_transaction` in the worst quadrant: high volume AND high negativity (*nb §9*). This is the featured product call: a "fix this first" queue.

**Ruling: the `competitor` topic (72 posts, 100% negative — the #2 negative pile) is excluded from this ranking.** "People prefer NgoodPay" is competitive pressure, not an ops ticket — a different lever owned by a different team. It gets its own view (§9). Mixing it into a fix-queue would imply an ops fire that isn't one.

---

## 8. Language — the real finding is coverage, not anger

59% of all posts are `bn-en` (code-mixed Banglish), the majority pattern:

> *"TakaPay helpline e 30 min wait korlam, keu dhorlo na."*

The naive cut says bn-en posts are 65.9% negative vs 26.1% for English — but this comparison is **confounded by construction** (*nb §11*): English and Banglish posts share **zero topics**. English rows are entirely recharge/bills/fees templates; every competitor post and most failed-transaction posts are Banglish. Within `failed_transaction` — the one topic where two languages can be compared (bn vs bn-en) — negativity is near-identical (88.4% vs 90.4%). Language tells you nothing about anger once topic is held fixed.

The durable insight: **a sentiment pipeline that only handles English or pure Bangla misreads the majority of this feed — including 25 of the 34 flipped labels.** Coverage of code-mixed text is a pipeline requirement, not a demographic curiosity.

---

## 9. Competitor signal: NgoodPay

Two signals, deliberately kept separate (*nb §10*):

- **72 comparison posts** that name TakaPay — **100% negative**, zero exceptions. Recurring themes by keyword match: fees/charges (32 posts — by far #1, and note fees also attack from inside as TakaPay's own `charges_fees` complaints), agent network density (13, with named neighborhoods: Motijheel, Mohakhali), app experience (13), cashback/promos (9), customer care (7).
- **9 competitor-only promo posts** (§3b) — competitive activity, not brand sentiment.

This is a clean, ready-made competitive-intelligence module — the brief's suggested stretch goal, essentially pre-assembled by the data.

---

## 10. Duplicate / templated content

10 pairs of byte-identical posts (20 rows, 3.0%) appear from *different* authors on *different* platforms (*nb §13*). In a real feed this is the signature of coordinated/bot posting; here, of templated generation. **Ruling: kept in all metrics, reported in the data-quality panel** — the tool's only silent exclusion is relevance; every other anomaly is flagged, not deleted. (More broadly, 68% of the feed is templated — volume metrics here count templates, not independent voices.)

---

## 11. Daily volume

Stable across the month (12–29 posts/day, mean ~19.7, no missing days, no spikes — *nb §15*). There is no time-series story; a trend chart would be forcing a narrative the data can't support.

---

## 12. Summary of data quality issues

1. **`brand_mention` flag is unreliable** — always `True`, including 61 posts with zero brand relevance. Real text-level relevance filtering is required before any aggregate is trusted.
2. **34 rows (5.2%) have sentiment label + score flipped against their text**, asymmetrically in the brand's favor. Neither label nor score is ground truth on these rows; detected via template-family majority voting, displayed as flags + a shadow number, never silently corrected.
3. **9 competitor-only posts** are a product decision, not a bug: routed to competitive intelligence, out of brand sentiment.
4. **20 rows are exact duplicates across authors/platforms** — flagged, kept, disclosed.
5. **Engagement columns are uniform noise** — verified, excluded, documented.
6. **Single-month range** — no trend signal available.

## 13. What this means for the build

Ranked by value to a brand manager and support in the data:

1. **The trust arc (51.2 → 55.8 → 58.1% negative)** — clean-by-default numbers plus an always-visible data-quality panel: what was filtered, what's flagged, what correcting would change.
2. **"Fix this first" priority ranking** — `failed_transaction` called out explicitly; competitor excluded (fix vs fight).
3. **NgoodPay competitor view** — comparison sentiment + themes + separate promo-activity signal.
4. **Filterable mention feed** — every aggregate traceable to real, flagged posts.
5. **Language coverage + platform volume** — supporting context, confound stated on-chart.

Pipeline shape: one Python script reproduces this analysis and emits a single `metrics.json` (aggregates + per-mention flags: `is_relevant`, `is_suspect`, `is_duplicate`) consumed by a static Next.js dashboard — no server state, nothing to fall over during review.

---

*Every figure above is reproducible top-to-bottom from `takapay_deep_dive.ipynb`. Flagged datasets (`data/df_with_flags.csv`, `data/clean_subset.csv`) are retained from the first pass; the notebook supersedes them as the canonical pipeline.*
