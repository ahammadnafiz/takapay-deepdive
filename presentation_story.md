# TakaPay DeepDive — The Presentation Story

> **Format:** A data-to-story narrative for your Loom video and live presentation.
> **Duration target:** 2–3 minutes. Each act has a suggested time.
> **Rule:** Never lead with a chart. Lead with a question. Let the data answer it.

---

## THE OPENING LINE

> *"What if I told you that the dashboard your brand manager is using right now is lying to them — and the lie is making TakaPay look 7 points better than reality?"*

That's not a hypothetical. That's what this dataset proves.

---

## ACT 1 — "The Number You Trust Is Wrong" (0:00 – 0:40)

### The Setup

You're a brand manager at TakaPay, a mobile wallet in Bangladesh. Your social listening tool tells you:

> **51.2% of mentions are negative.**

Bad, but not a crisis, right? More than a third of people seem happy. You report this number to leadership. Decisions get made on it.

**The problem: that number is wrong.**

### The First Discovery — Ghost Mentions

I checked whether the 660 "brand mentions" actually mention the brand. **70 of them don't.**

They're posts about:
- 🌧️ Rain in Dhanmondi (*28 posts*)
- 🚗 Traffic in Farmgate (*13 posts*)
- 🍛 Biryani recommendations (*13 posts*)
- ⚽ Whether Messi will win tomorrow (*1 post*)

All swept in by a broad scrape. None negative. Their presence **artificially inflates positivity.**

Remove them, and the real number jumps:

```
51.2%  →  55.8% negative
```

**The dashboard was 4.6 points too optimistic. And we're not done.**

---

## ACT 2 — "The Labels Are Lying" (0:40 – 1:30)

### The Second Discovery — Flipped Sentiment

This is the finding that changes everything.

I found **34 posts where the sentiment label contradicts the text.** Not borderline cases. Obvious ones:

> *"2000 taka TakaPay theke katlo but receiver pay nai. 4 din dhore atke ache."*
> *(Money deducted, stuck for 4 days.)*
> **→ Labeled: Positive. Score: 93.**

> *"Why is TakaPay charging 20 taka to cash out 1000? This is robbery."*
> **→ Labeled: Positive.**

> *"TakaPay e tuition fee dilam ar 2000 taka cashback pelam, darun offer!"*
> *(Got 2000 taka cashback, great offer!)*
> **→ Labeled: Negative. Score: 12.**

### The Asymmetry That Matters

These aren't random errors. They're **directional:**

| Direction | Count |
|---|---|
| Complaints wearing a POSITIVE label | **24** |
| Praise wearing a NEGATIVE label | 10 |

**The errors hide complaints and surface praise. The data systematically flatters the brand.**

### How I Found Them (No AI, No ML)

68% of this dataset is templated text — the same sentence with different numbers. I normalized out the digits and time-units, grouped identical skeletons into families, and flagged any member whose label disagrees with the 75%+ majority.

Every single flag was verified by reading the text. Zero false positives.

### The Key Decision — Flag, Don't Fix

> *"I could have silently re-labeled these 34 rows. I didn't."*

Why? Because silently correcting data based on a heuristic is how a *different* trust problem starts. Instead, the dashboard:
- Displays provided labels everywhere
- Flags the 34 suspects visibly
- Shows the "shadow number" — what the score would be if we corrected them

```
51.2% (raw)  →  55.8% (clean)  →  58.1% (audited)
```

**That 7-point gap is the Trust Arc. It's the story of this dataset.**

---

## ACT 3 — "Now That We Trust the Numbers, What Do They Say?" (1:30 – 2:10)

### The Fire: Failed Transactions

With clean data, the topic breakdown tells an unambiguous story:

| Topic | Volume | % Negative |
|---|---|---|
| **Failed Transactions** | **220 posts (37% of all mentions)** | **89.5%** |
| Competitor Comparisons | 72 | 100% |
| Charges & Fees | 30 | 83.3% |
| Everything else | — | Low |

One issue drives more negativity than everything else **combined.** People's money is getting stuck. For hours. For days. Sometimes for a week.

> *"2000 taka TakaPay theke katlo but receiver pay nai. 4 din dhore atke ache."*
> *"1000 taka katlo... 24 ghonta dhore atke ache."*
> *"5000 taka... 2 din dhore atke ache."*

**This isn't a PR problem. This is a product crisis. Fix the transaction pipeline, and you eliminate a third of all negative brand conversation overnight.**

### The Product Call — "Fix This First"

I built a priority queue ranking operational topics by negative mention count:

1. 🔥 **failed_transaction** — 197 negative mentions
2. charges_fees — 25
3. login_otp — 9
4. app_crash — 8
5. Everything else — 4 or fewer

The brand manager doesn't need a pie chart. They need a to-do list.

---

## ACT 4 — "Separate What You Fix from What You Fight" (2:10 – 2:30)

### The Competitor: NgoodPay

72 posts directly compare TakaPay to NgoodPay. **100% are negative toward TakaPay.** Zero exceptions.

What are they saying?

| What NgoodPay Does Better | Posts |
|---|---|
| **Lower cash-out fees** | **32** (the #1 weapon) |
| More agents (Motijheel, Mohakhali) | 13 |
| Faster, smoother app | 13 |
| Better customer care | 7 |

> *"NgoodPay er cash out charge 500 e onek kom, tai TakaPay chere switch korlam."*
> *(NgoodPay's charge is much lower, so I switched from TakaPay.)*

**But here's the key decision:** I excluded competitor mentions from the "Fix This First" queue. Why?

> *"People prefer NgoodPay" is competitive pressure. It's not an ops ticket. A different team owns that lever. Mixing it into the fix-queue would imply an internal fire that isn't one.*

**Separate what you fix from what you fight.**

The competitor gets its own intelligence module.

---

## ACT 5 — "The Trap I Almost Fell Into" (2:30 – 2:50)

### The Language Myth

Naive cut: Banglish posts are 65.9% negative vs English at 26.1%.

**"Banglish users are angrier!"** — That was the AI's first-pass conclusion. It's completely wrong.

English users only talk about paying bills (low-anger topics). Banglish users are the ones experiencing failed transactions and competitor pressure (high-anger topics). **The two languages share zero topics.**

Within the one comparable topic (failed_transaction):
- Bangla: 88.4% negative
- Banglish: 90.4% negative

**Identical.** Language doesn't predict anger. Topic does.

The real finding: **59% of the feed is code-mixed Banglish.** An English-only pipeline would misread the majority of posts — and miss 25 of the 34 flipped labels. That's a coverage problem, not a demographics problem.

---

## ACT 6 — "Where AI Helped and Where It Failed" (2:50 – 3:00)

### The Candor Section

I used AI heavily throughout this project. Here's where it failed:

| What AI Got Wrong | What I Did Instead |
|---|---|
| Missed the 34 flipped labels entirely — found only a vague "boundary inconsistency" | Built a deterministic template-family detector from scratch |
| Said "trust the score over the label" — wrong, because on the 34 real flips, label and score both agree and both are wrong | Proved the "overlap" was just off-topic noise wearing a different costume |
| Claimed English posts are ~44% negative and framed "Banglish is harsher" | Actual figure is 26.1%; the comparison is confounded by construction |

**AI was a useful first-draft tool. But every number in this dashboard was verified against the raw CSV. The three errors above were caught because I read the data, not just the AI's summary.**

---

## THE CLOSING LINE

> *"A dashboard's job isn't to make the brand look good. It's to make the brand manager trust the numbers enough to act on them. That's why the Trust Panel isn't a footnote — it's the first thing you see."*

---

## QUICK REFERENCE — Key Numbers to Memorize

| Stat | Value | Where It Appears |
|---|---|---|
| Raw negative | 51.2% | Trust Arc (starting point) |
| Clean negative | 55.8% | Trust Arc (after relevance filter) |
| Audited negative | 58.1% | Trust Arc (shadow number) |
| Trust gap | 6.9 points | The headline |
| Total mentions | 660 | Headline strip |
| Relevant mentions | 590 | Headline strip |
| Off-topic noise | 61 rows | Trust Panel |
| Competitor-only | 9 rows | Trust Panel |
| Suspect labels | 34 (24 + 10) | Trust Panel |
| Duplicate pairs | 10 (20 rows) | Trust Panel |
| #1 pain point | failed_transaction | Priority view |
| Failed txn volume | 220 (37% of relevant) | Priority view |
| Failed txn negativity | 89.5% | Priority view |
| NgoodPay comparisons | 72 (100% negative) | Competitor view |
| #1 competitor theme | Fees/charges (32 posts) | Competitor view |
| Feed language | 59% Banglish | Language strip |
| Suspects in non-English | 25 of 34 (74%) | Language strip |

---

## DASHBOARD SCROLL ORDER (matches Loom video)

```
┌─────────────────────────────────────┐
│  1. HEADLINE STRIP                  │  ← 590 relevant · 55.8% negative · #1 pain: failed_transaction
│                                     │
│  2. SENTIMENT OVERVIEW              │  ← Clean sentiment donut/bars
│                                     │
│  3. TRUST PANEL                     │  ← The differentiator: filtered → flagged → trust arc
│     "What we filtered before        │
│      showing you these numbers"     │
│                                     │
│  4. TOPIC BREAKDOWN                 │  ← Per-topic sentiment bars
│                                     │
│  5. FIX THIS FIRST                  │  ← Priority ranking (ops topics only)
│     "Separate what you fix          │
│      from what you fight"           │
│                                     │
│  6. COMPETITOR: NgoodPay            │  ← 72 comparisons + 9 promos + themes
│                                     │
│  7. MENTION FEED                    │  ← Filterable, flagged, searchable
│                                     │
│  8. LANGUAGE + PLATFORM             │  ← Coverage stat, confound caveat, volume bars
└─────────────────────────────────────┘
```

> **Loom pacing:** 30s headline → 60s trust arc → 30s fix-vs-fight → 30s competitor → 30s wrap/AI candor
