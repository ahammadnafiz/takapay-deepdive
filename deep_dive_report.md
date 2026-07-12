# TakaPay Deep-Dive: Complete Data Forensics Report

> Cross-referenced cell-by-cell from `takapay_deep_dive.ipynb` outputs, verified against [TakaPay_Analysis_Report.md](file:///Users/nafiz/Development/home-task/TakaPay_Analysis_Report.md), and extended with additional Python analysis against the raw CSV.

---

## 1. Dataset Shape — What Looks Clean on the Surface

| Dimension | Value |
|---|---|
| Total rows | 660 |
| Date range | 2026-06-01 to 2026-06-30 (single month) |
| Columns | `id`, `platform`, `timestamp`, `author`, `text`, `language`, `brand_mention`, `sentiment`, `sentiment_score`, `topic`, `reactions`, `comments` |
| Null values | **0** — every field populated |
| Platforms | Facebook (225), Reddit (81), News/Media (76), Instagram (74), YouTube (72), TikTok (68), Twitter (64) |
| Languages | bn-en/Banglish (390, 59%), bn/Bangla (155, 23%), en/English (115, 17%) |
| Raw sentiment | negative 338 (51.2%), positive 237 (35.9%), neutral 85 (12.9%) |
| Topics | 15 categories, heavily skewed toward `failed_transaction` (220) |

> [!IMPORTANT]
> The data passes every standard quality check — no nulls, no malformed dates, no encoding issues. The traps are **semantic**, not structural: mislabeled data and over-inclusive scraping. This makes them far more dangerous because they survive automated validation.

---

## 2. TRAP 1 — The Relevance Problem (70 rows, 10.6%)

The `brand_mention` column is **useless** — every single row is `True`. Checking the text directly reveals that **70 out of 660 rows never mention "TakaPay" at all.**

These 70 rows break into two distinct species:

### 2a. Off-Topic Noise: 61 rows

Pure scrape noise swept in by a broad keyword/hashtag scrape. They cover:

| Category | Count | Example |
|---|---|---|
| Weather/rain | 28 | *"Ajke Dhanmondi 27 te prochur bristi, office jete 1 ghonta deri hoye gelo."* |
| Traffic | 13 | *"Traffic ajke Farmgate e insane, 2 ghonta laglo pouchte."* |
| Food/biryani | 13 | *"Ei Farmgate er biryani ta must try, khub valo."* |
| Football | 1 | *"Argentina kal jitbe to? Messi form e ache mone hoy."* |
| Other (exams, phone) | 6 | *"Kal semester final, ekhono porini kichui"* |

> [!CAUTION]
> **Sentiment of this noise: 38 neutral + 23 positive + 0 negative.** Because it is 100% non-negative, leaving it in the feed artificially inflates TakaPay's apparent positivity and suppresses the true negativity rate.

### 2b. Competitor-Only Promo Posts: 9 rows

All 9 follow one template: *"NgoodPay notun X taka cashback offer diyeche, keu try koreche?"* with varying amounts (300-10,000 taka). They never name TakaPay.

**Ruling:** Excluded from brand sentiment, tracked separately as competitive-activity intelligence. They answer a different question ("What is NgoodPay doing?") than brand sentiment ("How do people feel about us?").

### Impact of Relevance Filtering

| Stage | % Negative | % Neutral | % Positive |
|---|---|---|---|
| Raw feed (n=660) | 51.2% | 12.9% | 35.9% |
| Relevant only (n=590) | **55.8%** | **8.0%** | 36.3% |

**The filter moves negative sentiment up 4.6 points and cuts neutral by 5.** The brand manager trusting the raw number gets a picture that is too rosy.

---

## 3. TRAP 2 — The Label Trap: 34 Rows with Flipped Sentiment (5.2%)

> [!WARNING]
> **This is the headline data-quality finding, and AI missed it entirely on the first pass.** The first draft of the analysis found only a soft "boundary inconsistency" between labels and scores. Systematic template-level auditing found 34 rows whose label *and* score contradict the plain meaning of their text.

### How the Detection Works (Deterministic, No ML)

1. **Template Normalization:** Strip all digits and time-units from each text. Identical skeletons emerge. 68% of the dataset (449/660 rows) belongs to a template family of 4 or more members.
2. **Family Majority Vote:** Within each family of 4 or more, take the sentiment held by 75%+ of members as the family's voice. Flag any member who disagrees.
3. **Keyword Union:** For families too small to vote, catch known flip patterns: "darun offer" (positive praise) labeled negative, and "atke ache" (stuck/blocked complaint) labeled positive.

### The Top 5 Template Families

| Size | Template Skeleton | Sentiment Mix |
|---|---|---|
| 40 | `# taka takapay theke katlo but receiver pay nai. # U dhore atke ache.` | 33 negative, **7 positive** |
| 29 | `why is takapay charging # taka to cash out #? this is robbery.` | 24 negative, **5 positive** |
| 14 | `takapay diye baba ke # taka pathalam, # U hoye gelo ekhono pending!` | 14 negative |
| 11 | `transaction fail holo tao # taka kete nilo, takapay er kono response nai.` | 11 negative |
| 10 | `amar account theke # taka kete niyeche kintu grameenphone recharge hoyni...` | 9 negative, **1 positive** |

The bolded minorities in families 1, 2, and 5 are the suspect flips — their siblings are overwhelmingly negative, but they wear positive labels.

### All 34 Suspect Labels — Itemized

**24 Complaints Disguised as Positive (hiding bad news):**

| ID | Score | Topic | Lang | Text |
|---|---|---|---|---|
| 1029 | 81 | charges_fees | en | *"Why is TakaPay charging 20 taka to cash out 1000? This is robbery."* |
| 1045 | 83 | login_otp | bn-en | *"TakaPay OTP ashteci na, 24 ghonta dhore login e atke achi. Fix koro please."* |
| 1058 | 88 | charges_fees | en | *"Why is TakaPay charging 15 taka to cash out 800? This is robbery."* |
| 1108 | 92 | failed_transaction | bn | *"Amar account theke 1500 taka kete niyeche kintu Teletalk recharge hoyni."* |
| 1118 | 93 | failed_transaction | bn-en | *"10000 taka TakaPay theke katlo but receiver pay nai. 24 ghonta dhore atke ache."* |
| 1120 | 73 | charges_fees | en | *"Why is TakaPay charging 15 taka to cash out 300? This is robbery."* |
| 1219 | 91 | customer_care | bn-en | *"TakaPay helpline e 45 min wait korlam, keu dhorlo na."* |
| 1232 | 75 | failed_transaction | bn | *"Amar account theke 300 taka kete niyeche kintu Teletalk recharge hoyni."* |
| 1239 | 73 | failed_transaction | bn-en | *"TakaPay diye amar bon ke 800 taka pathalam, 3 din hoye gelo ekhono pending!"* |
| 1336 | 76 | failed_transaction | bn-en | *"TakaPay diye ma ke 300 taka pathalam, 30 min hoye gelo ekhono pending!"* |
| 1388 | 83 | failed_transaction | bn-en | *"TakaPay diye colleague ke 500 taka pathalam, 30 min hoye gelo ekhono pending!"* |
| 1389 | 72 | failed_transaction | bn-en | *"1000 taka TakaPay theke katlo but receiver pay nai. 24 ghonta dhore atke ache."* |
| 1431 | 79 | failed_transaction | bn | *"Amar account theke 1000 taka kete niyeche kintu Grameenphone recharge hoyni."* |
| 1436 | 78 | charges_fees | en | *"Why is TakaPay charging 15 taka to cash out 2000? This is robbery."* |
| 1469 | 74 | failed_transaction | bn | *"ma ke taka pathiyechi 1 week age, ekhono pouchhayni. TakaPay ki korche?"* |
| 1481 | 91 | failed_transaction | bn-en | *"800 taka TakaPay theke katlo but receiver pay nai. 2 din dhore atke ache."* |
| 1520 | 83 | charges_fees | en | *"Why is TakaPay charging 20 taka to cash out 300? This is robbery."* |
| 1566 | 94 | failed_transaction | bn-en | *"1500 taka TakaPay theke katlo but receiver pay nai. 1 week dhore atke ache."* |
| 1569 | 92 | failed_transaction | bn-en | *"1000 taka TakaPay theke katlo but receiver pay nai. 2 ghonta dhore atke ache."* |
| 1587 | 93 | failed_transaction | bn-en | *"2000 taka TakaPay theke katlo but receiver pay nai. 4 din dhore atke ache."* |
| 1596 | 72 | failed_transaction | bn-en | *"2000 taka TakaPay theke katlo but receiver pay nai. 2 ghonta dhore atke ache."* |
| 1617 | 81 | failed_transaction | bn | *"baba ke taka pathiyechi 2 ghonta age, ekhono pouchhayni. TakaPay ki korche?"* |
| 1623 | 75 | failed_transaction | bn-en | *"TakaPay diye amar friend ke 800 taka pathalam, 3 din hoye gelo ekhono pending!"* |
| 1624 | 83 | failed_transaction | bn-en | *"TakaPay diye colleague ke 500 taka pathalam, 4 din hoye gelo ekhono pending!"* |

**10 Praise Disguised as Negative (hiding good news):**

| ID | Score | Topic | Lang | Text |
|---|---|---|---|---|
| 1024 | 20 | send_money | bn | *"ma ke 2000 taka pathalam TakaPay diye, sathe sathe chole gelo."* |
| 1060 | 19 | send_money | bn | *"colleague ke 800 taka pathalam TakaPay diye, sathe sathe chole gelo."* |
| 1154 | 7 | recharge | en | *"Instant Banglalink recharge on TakaPay, 1500 taka, done before I finished my tea."* |
| 1337 | 7 | cashback_offer | bn-en | *"TakaPay e tuition fee dilam ar 1000 taka cashback pelam, darun offer!"* |
| 1402 | 12 | cashback_offer | bn-en | *"TakaPay e tuition fee dilam ar 2000 taka cashback pelam, darun offer!"* |
| 1459 | 16 | recharge | en | *"Instant Teletalk recharge on TakaPay, 800 taka, done before I finished my tea."* |
| 1492 | 16 | recharge | en | *"Instant Robi recharge on TakaPay, 5000 taka, done before I finished my tea."* |
| 1514 | 20 | recharge | en | *"Instant Banglalink recharge on TakaPay, 2500 taka, done before I finished my tea."* |
| 1599 | 10 | cashback_offer | bn-en | *"TakaPay e tuition fee dilam ar 2500 taka cashback pelam, darun offer!"* |
| 1610 | 10 | cashback_offer | bn-en | *"TakaPay e credit card bill dilam ar 300 taka cashback pelam, darun offer!"* |

### Critical Properties of the Flips

1. **Label and score agree with each other on every flipped row.** A "positive, score 93" complaint. You cannot detect these by reconciling label vs. score — only the text reveals the truth.
2. **The flips are asymmetric: 24 hidden complaints vs. 10 hidden praise.** The net effect makes the brand look better than reality.
3. **Language distribution of suspects:** bn-en (18), en (9), bn (7). **25 of 34 are non-English** — an English-only pipeline would miss 74% of the flips.
4. **Topic distribution:** failed_transaction (17), charges_fees (5), recharge (4), cashback_offer (4), send_money (2), customer_care (1), login_otp (1).

---

## 4. The Trust Arc — The Single Most Important Number

| Pipeline Stage | % Negative | What Changed |
|---|---|---|
| Raw feed (n=660) | **51.2%** | — |
| Relevance-filtered (n=590) | **55.8%** | +4.6 pts — dropped 70 non-brand rows |
| Label-audited (shadow) | **58.1%** | +2.3 pts — corrected 34 suspect labels |

> [!IMPORTANT]
> **The naive dashboard understates the brand's problem by 6.9 percentage points.** This is the single most important thing to build a feature around, and it directly answers the brief's call for "caring whether what reaches the dashboard is actually correct."

### The Misdiagnosis AI Made (and the Correction)

The first draft of the AI analysis misdiagnosed a "label vs. score boundary inconsistency" — claiming positive labels bleed into the neutral score band (46-60). In fact, **all 20 overlapping rows are off-topic noise.** After relevance filtering, the score ranges partition perfectly:

| Sentiment | Score Range (clean set) | Count |
|---|---|---|
| Negative | 6 - 30 | 329 |
| Neutral | 45 - 60 | 47 |
| Positive | 72 - 94 | 214 |

**Zero overlap.** The "boundary inconsistency" was the same relevance problem wearing a different costume.

---

## 5. Topic Breakdown — One Topic Dominates Everything

On the 590 relevant mentions:

| Topic | Total | Negative | Neutral | Positive | % Negative |
|---|---|---|---|---|---|
| **failed_transaction** | **220** | **197** | **0** | **23** | **89.5%** |
| competitor | 72 | 72 | 0 | 0 | 100% |
| cashback_offer | 63 | 4 | 0 | 59 | 6.3% |
| recharge | 50 | 4 | 0 | 46 | 8.0% |
| send_money | 50 | 4 | 0 | 46 | 8.0% |
| charges_fees | 30 | 25 | 0 | 5 | 83.3% |
| agent_network | 26 | 0 | 26 | 0 | 0% |
| bill_payment | 24 | 1 | 0 | 23 | 4.2% |
| feature_query | 19 | 0 | 19 | 0 | 0% |
| customer_care | 13 | 4 | 0 | 9 | 30.8% |
| login_otp | 10 | 9 | 0 | 1 | 90.0% |
| app_crash | 9 | 8 | 0 | 1 | 88.9% |
| app_experience | 2 | 1 | 0 | 1 | 50.0% |
| product_news | 2 | 0 | 2 | 0 | 0% |

> [!NOTE]
> - `failed_transaction` alone is **37% of all relevant volume** at ~90% negative — more than triple the next largest topic.
> - `agent_network` (100% neutral) and `feature_query` (100% neutral) are genuinely informational queries — "Where is an agent?", "How do I X?" — not complaints. Their neutrality is real.
> - The **money-friction cluster** (failed_transaction + charges_fees + login_otp + app_crash) drives almost all negativity.

---

## 6. The Product Call: "Fix This First" Priority Ranking

Ranking operational topics by count of negative relevant mentions:

| Rank | Topic | Negative Mentions | % of Topic | Verdict |
|---|---|---|---|---|
| **#1** | **failed_transaction** | **197** | **89.5%** | The fire |
| #2 | charges_fees | 25 | 83.3% | Price friction |
| #3 | login_otp | 9 | 90.0% | Auth UX problem |
| #4 | app_crash | 8 | 88.9% | Stability issue |
| #5 | customer_care | 4 | 30.8% | Support gaps |
| #6 | recharge | 4 | 8.0% | Minor friction |
| #6 | send_money | 4 | 8.0% | Minor friction |
| #6 | cashback_offer | 4 | 6.3% | Minor friction |

> [!IMPORTANT]
> **The `competitor` topic (72 posts, 100% negative) is deliberately excluded from this ranking.** "People prefer NgoodPay" is competitive pressure, not an ops ticket — a different lever owned by a different team. It gets its own view. Mixing it into a fix-queue would imply an internal operational fire that is not one. *Separate what you fix from what you fight.*

---

## 7. Competitor Intelligence: NgoodPay

### 7a. 72 Comparison Posts (name TakaPay — 100% negative)

These are direct, unfavorable comparisons. Theme breakdown by keyword matching:

| Theme | Posts | Sample |
|---|---|---|
| **Fees / charges** | **32** | *"NgoodPay er cash out charge 500 e onek kom, tai TakaPay chere switch korlam."* |
| Agent network | 13 | *"Motijheel e NgoodPay agent beshi, TakaPay agent khuje pai na."* |
| App experience | 13 | *"NgoodPay app ta ekhon TakaPay theke faster mone hoche, Bashundhara eo kaj kore."* |
| Customer care | 7 | *"baba bollo NgoodPay er customer care TakaPay er cheye onek valo."* |
| Cashback / offers | 0 | (not detected by keyword — may be expressed differently) |

> [!WARNING]
> **Fees are the #1 competitive weapon** — and this cross-references with TakaPay's own internal `charges_fees` topic (30 posts, 83.3% negative). The fee problem attacks from both sides: customers complain about it internally AND cite it when leaving for NgoodPay.

Named neighborhoods in agent-network comparisons: **Motijheel, Mohakhali, Bashundhara** — these are specific geographic gaps.

### 7b. 9 Competitor-Only Promo Posts

All follow one template: *"NgoodPay notun X taka cashback offer diyeche, keu try koreche?"* with amounts ranging 300-10,000 taka. They never name TakaPay.

**Ruling:** These are competitive activity — what NgoodPay is doing in the market. Excluded from brand sentiment, tracked separately. The two numbers answer different questions.

---

## 8. The Language Confound — Coverage, Not Anger

### Naive Numbers (Misleading)

| Language | % Negative |
|---|---|
| bn-en (Banglish) | 65.9% |
| bn (Bangla) | 56.8% |
| en (English) | 26.1% |

This looks like "Banglish users are angrier." **This is completely wrong.**

### The Cross-Tabulation Proves Zero Topic Overlap

The language x topic matrix from the notebook output shows:

- **English** posts are exclusively: `bill_payment` (24), `recharge` (50), `charges_fees` (30), `feature_query` (9), `product_news` (2)
- **Banglish (bn-en)** posts are exclusively: `failed_transaction` (125), `competitor` (72), `cashback_offer` (63), `agent_network` (26), `customer_care` (13), `app_crash` (9), `login_otp` (10), `app_experience` (2)
- **Bangla (bn)** posts are exclusively: `failed_transaction` (95), `send_money` (50), `feature_query` (10)

**English and Banglish share ZERO topics.** English users talk about paying bills (low-anger); Banglish users experience failed transactions and competitor pressure (high-anger). The comparison is confounded by construction.

### The Definitive Test

Within `failed_transaction` — the one topic where bn and bn-en can be compared:

| Language | Count | % Negative |
|---|---|---|
| bn (Bangla) | 95 | 88.4% |
| bn-en (Banglish) | 125 | 90.4% |

**Near-identical.** Language tells you nothing about anger once topic is held fixed.

> [!IMPORTANT]
> **The real language finding is coverage:** 59% of the feed is code-mixed Banglish. 25 of the 34 suspect labels are Bangla or Banglish. An English-only sentiment pipeline would misread the majority of posts and miss 74% of the label flips. This is a pipeline requirement, not a demographic curiosity.

---

## 9. Platform Analysis — Where to Watch, Not Why

On the 590 relevant mentions:

| Platform | Volume | % Negative | Assessment |
|---|---|---|---|
| Facebook | 198 | 57.6% | **Largest source (one-third of feed)** |
| Reddit | 75 | 62.7% | Higher negative, small sample |
| News/Media | 71 | 47.9% | Middle band |
| Instagram | 68 | 47.1% | Middle band |
| YouTube | 65 | 49.2% | Middle band |
| Twitter | 57 | 57.9% | Higher negative |
| TikTok | 56 | 66.1% | Highest negative, small sample |

**Negativity sits in a 47-66% band everywhere.** Platform tells you where the volume is (Facebook), not why sentiment is bad (topic does). Reddit's 0% neutral is a small-sample artifact.

---

## 10. Duplicate Detection — 10 Pairs (20 rows, 3.0%)

Byte-identical texts from different authors on different platforms — the signature of coordinated/bot posting (or in this dataset, templated generation):

| Pair | Text (truncated) | Authors | Platforms |
|---|---|---|---|
| 1 | *"Amar account theke 5000 taka kete niyeche..."* | Priya7, Sabbir20 | YouTube, YouTube |
| 2 | *"Transaction fail holo tao 5000 taka kete nilo..."* | Tuhin5, Rakib55 | Facebook, Facebook |
| 3 | *"Instant Robi recharge on TakaPay, 2500 taka..."* | Rasel19, Rasel52 | YouTube, YouTube |
| 4 | *"Instant Airtel recharge on TakaPay, 2500 taka..."* | Rakib41, Nusrat67 | Instagram, Instagram |
| 5 | *"5000 taka TakaPay theke katlo but receiver pay nai..."* | Rasel17, Rima24 | Facebook, Facebook |
| 6 | *"TakaPay diye tuition fee deowa jay kina..."* | Tuhin6, Sumaiya84 | Instagram, Instagram |
| 7 | *"TakaPay diye baba ke 5000 taka pathalam..."* | Oishi10, Shuvo59 | Facebook, Facebook |
| 8 | *"Instant Teletalk recharge on TakaPay, 1500 taka..."* | Farhana49, Prova46 | Reddit, Reddit |
| 9 | *"Transaction fail holo tao 2000 taka kete nilo..."* | Nusrat82, Rima4 | Instagram, Instagram |
| 10 | *"TakaPay OTP ashteci na, 2 ghonta dhore login e..."* | Mehedi56, Oishi1 | Facebook, Facebook |

**Ruling:** Kept in all metrics, reported in the data-quality panel. The tool's only silent exclusion is relevance filtering; every other anomaly is flagged, not deleted.

---

## 11. Engagement Columns — Verified as Noise

| Sentiment | Mean Reactions | Reactions Range | Mean Comments | Comments Range |
|---|---|---|---|---|
| Negative (n=338) | 236.3 | 0-498 | 59.8 | 0-120 |
| Neutral (n=85) | 247.4 | 5-479 | 54.8 | 2-119 |
| Positive (n=237) | 241.7 | 5-500 | 59.8 | 1-120 |

**Flat uniform distribution.** Near-identical means across all sentiments. No correlation with topic either. Any engagement-weighted metric would launder randomness into the dashboard. **Checked, documented, excluded.**

---

## 12. Daily Volume — No Time-Series Story

| Metric | Value |
|---|---|
| Date range | June 1-30, 2026 |
| Total days | 30 (no missing days) |
| Min volume | 13 posts/day |
| Max volume | 30 posts/day |
| Mean volume | 22.0 posts/day |

Stable across the month. No spikes, no trends, no crisis-detection story. A date filter is fine; a trend chart pretending to show momentum would be fabricating a narrative.

---

## 13. AI Correction Trail — Where AI Got It Wrong

The [TakaPay_Analysis_Report.md](file:///Users/nafiz/Development/home-task/TakaPay_Analysis_Report.md) section 2 documents three specific errors caught in the AI's first-pass analysis:

| # | What AI Said | What Was Actually True | How It Was Caught |
|---|---|---|---|
| 1 | Found only a soft "boundary inconsistency" between labels and scores | **34 rows have sentiment completely flipped against their text** — the biggest data-quality finding | Systematic template-family auditing using deterministic normalization |
| 2 | "Positive labels bleed into the neutral score band (46-60) — trust the score over the label" | **All 20 overlapping rows are off-topic noise.** After relevance filtering, labels partition scores perfectly. On the 34 real flips, label and score agree — both are wrong | Checking which rows actually had the overlap: all `off_topic` |
| 3 | "English posts are ~44% negative; Banglish is harsher" | **English posts are 26.1% negative.** The entire comparison is confounded — the two languages share zero topics | Cross-tabulating language x topic and controlling for topic within `failed_transaction` |

---

## 14. Summary of All Data Quality Issues

| Issue | Count | Impact | Ruling |
|---|---|---|---|
| `brand_mention` flag unreliable | 660 always-True | Zero filtering value | Text-level relevance check required |
| Off-topic noise | 61 rows | Inflates positivity (+4.6 pts negative after removal) | Excluded from brand metrics |
| Competitor-only posts | 9 rows | Wrong bucket for brand sentiment | Routed to competitive intelligence |
| Suspect labels (flipped) | 34 rows (24 + 10) | Asymmetrically flatters brand (+2.3 pts) | Flagged, never silently corrected |
| Exact duplicates | 20 rows (10 pairs) | 3% amplification | Kept, disclosed in trust panel |
| Engagement noise | All rows | No signal in reactions/comments | Excluded from all analysis |
| Single-month range | N/A | No trend signal available | No time-series narrative |

---

## 15. The Executive Verdict

**TakaPay is in significantly worse shape than any naive dashboard would suggest.** The true negative sentiment is **~58%**, not 51%. The crisis is purely operational — `failed_transaction` alone accounts for 37% of all relevant brand conversation at 90% negative. The fee structure is under attack both internally (users complaining about cash-out charges) and externally (users switching to NgoodPay for lower fees).

The brand manager's action queue should be:

1. **Fix the transaction pipeline** — money getting stuck is the #1 fire
2. **Review cash-out fee structure** — under dual attack (internal complaints + competitor advantage)
3. **Address login/OTP failures** — small volume but 90% negative
4. **Stabilize the app** — 9 crash reports, 89% negative
5. **Invest in code-mixed Bangla NLP** — 59% of the feed is Banglish, and the current labeling pipeline cannot handle it

> [!TIP]
> The dashboard's job is not to make TakaPay look good. Its job is to make the brand manager **trust the numbers** enough to act on them. That is why the Trust Panel is the differentiating feature.
