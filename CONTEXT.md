# CONTEXT — TakaPay Social Data Analysis (DeepDive take-home)

Glossary of domain terms. Terms are canonical — use them exactly as defined.

## Terms

### Mention
A single row in the source dataset (`takapay_sample_data.csv`). 660 exist. Every
row carries `brand_mention = True`, but that flag is unreliable and carries no
information — "Mention" refers only to presence in the feed, not actual brand
relevance.

### Relevant Mention
A Mention whose text actually contains the brand name "TakaPay"
(case-insensitive). 590 of 660 rows. All aggregate brand metrics (sentiment
split, topic breakdown) are computed over Relevant Mentions unless explicitly
labeled "raw".

### Off-topic Noise
A Mention with no brand relevance at all (traffic, weather, food, football —
61 rows, all tagged `off_topic`). Excluded from every brand metric. Its
disproportionately neutral/positive sentiment inflates apparent brand
positivity if left in.

### Suspect Label
A Mention whose provided sentiment label (and score — the two agree with each
other) contradicts the plain meaning of its text. 34 instances (5.2% of the
dataset), asymmetric: 24 complaints labeled positive vs 10 praise labeled
negative — the net effect makes the brand look better than reality.
Detection is deterministic: normalize digits/time-units out of the text,
group Template Families, flag rows whose label disagrees with a ≥75% family
majority (plus a small keyword union for families too small to vote). No ML
layer — deferred to "next week" in the README. Decision: the tool displays
the provided label but flags these rows and shows the count plus a shadow
number ("correcting them would put negativity at 58.1%") in the trust panel —
it does not silently correct them.

### Template Family
A group of Mentions whose texts are identical after normalizing numbers and
time units. 449 of 660 rows (68%) belong to a family of ≥4 members — the
dataset is heavily templated. Basis for Suspect Label detection.

### Competitor-only Post
A Mention about the competitor (NgoodPay) that never names TakaPay. 9 rows.
Excluded from brand sentiment, but included in the Competitor view as
"competitive activity". Distinct from a **Comparison Post** — the 72
`competitor`-topic rows that name TakaPay directly (100% negative); those are
Relevant Mentions and stay in brand sentiment.

### Sentiment Label vs Sentiment Score
`sentiment` (negative/neutral/positive) and `sentiment_score` (0–100) are
consistent with each other on every row once Off-topic Noise is removed
(negative 6–30, neutral 45–60, positive 72–94, no overlap). Apparent
boundary overlap in the raw data is entirely an artifact of off-topic rows.
Neither field is ground truth on Suspect Label rows — only the text is.

### Priority Ranking
The featured product call: brand-operational topics ranked by count of
negative Relevant Mentions (presented as volume × %negative). Answers "fix
this first" — `failed_transaction` is the unambiguous #1. The `competitor`
topic is excluded (it is competitive pressure, not an internal fix item) and
lives in the Competitor view; `off_topic` is excluded as noise.

### Duplicate Pair
Two Mentions with byte-identical text from different authors on different
platforms. 10 pairs (20 rows). Signature of templated/coordinated posting.
Decision: kept in all metrics, reported in the data-quality panel — the tool's
only silent exclusion is relevance filtering.

### Engagement
`reactions` + `comments`. Verified to be uninformative noise in this dataset
(uniform ~0–500, no correlation with sentiment or topic). Never used for
weighting or ranking.
