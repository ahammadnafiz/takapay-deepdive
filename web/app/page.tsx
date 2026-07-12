import type { ReactNode } from "react";
import metrics from "@/lib/metrics.json";
import {
  MentionsIcon,
  AlertIcon,
  SwordsIcon,
  CalendarIcon,
} from "@/components/icons";
import { Card, Legend } from "@/components/Card";
import { SentimentDonut } from "@/components/SentimentDonut";
import { TopicBars } from "@/components/TopicBars";
import {
  PriorityRanking,
  type PriorityRankingData,
} from "@/components/PriorityRanking";
import {
  CompetitorView,
  type CompetitorData,
} from "@/components/CompetitorView";
import { TrustPanel, type TrustPanelData } from "@/components/TrustPanel";
import { MentionFeed, type Mention } from "@/components/MentionFeed";
import { SENTIMENT, LEGEND_ORDER, type Split } from "@/lib/sentiment";
import { topicLabel } from "@/lib/topics";

function StatCard({
  id,
  icon,
  tint,
  label,
  value,
  isText = false,
  chip,
  note,
}: {
  id?: string;
  icon: ReactNode;
  tint: string;
  label: string;
  value: string;
  isText?: boolean;
  chip?: { text: string; kind: "up" | "down" | "neutral" };
  note: string;
}) {
  return (
    <div className="stat-card" id={id}>
      <div className="stat-head">
        <span
          className="stat-icon"
          style={{ background: `${tint}1a`, color: tint }}
          aria-hidden
        >
          {icon}
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className={`stat-value${isText ? " is-text" : ""}`}>{value}</div>
      <div className="stat-foot">
        {chip && <span className={`chip ${chip.kind}`}>{chip.text}</span>}
        <span className="stat-note">{note}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const h = metrics.headline;
  const neg = h.clean_sentiment.negative;
  const pain = h.top_pain_point;
  const pr = metrics.priority_ranking as PriorityRankingData;

  return (
    <div id="overview">
      <header className="page-head">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">
            An at-a-glance read on TakaPay across 7 platforms. Of{" "}
            {h.total_mentions} posts collected, {h.relevant_mentions} actually
            name the brand, and every number here is computed on those.
          </p>
        </div>
        <span className="date-pill">
          <CalendarIcon />
          Jun 1 – Jun 30, 2026
        </span>
      </header>

      <section className="stat-grid" aria-label="Headline metrics">
        <StatCard
          icon={<MentionsIcon />}
          tint="#0d9488"
          label="Relevant mentions"
          value={h.relevant_mentions.toLocaleString()}
          chip={{ text: `of ${h.total_mentions}`, kind: "neutral" }}
          note={`${h.excluded_mentions} off-brand posts filtered out`}
        />
        <StatCard
          icon={<AlertIcon />}
          tint="#ef4444"
          label="Negative sentiment"
          value={`${neg.pct}%`}
          chip={{ text: `raw feed said 51.2%`, kind: "neutral" }}
          note={`${neg.count} of ${h.relevant_mentions} relevant mentions`}
        />
        <StatCard
          icon={<AlertIcon />}
          tint="#ef4444"
          label="Top pain point"
          value={topicLabel(pain.topic)}
          isText
          note={`${pain.count} mentions · ${pain.pct_negative}% negative · the dominant conversation`}
        />
        <StatCard
          icon={<SwordsIcon />}
          tint="#7c3aed"
          label="Competitor threat"
          value={h.top_competitor.name}
          isText
          note={`${h.top_competitor.mentions} competitor posts in the feed`}
        />
      </section>

      <div className="teaser">
        <span className="teaser-dot" aria-hidden />
        <p>
          <strong>These numbers are already filtered.</strong> The raw feed
          reads more positive than reality: it includes posts that never
          mention TakaPay and labels that contradict their own text. The full
          data-quality breakdown ships with the trust panel.
        </p>
      </div>

      <Card
        id="sentiment"
        title="Sentiment breakdown"
        subtitle="Positive, neutral, and negative across the 590 relevant mentions"
        legend={
          <Legend
            items={LEGEND_ORDER.map((k) => ({
              label: SENTIMENT[k].label,
              color: SENTIMENT[k].color,
            }))}
          />
        }
      >
        <SentimentDonut
          split={metrics.sentiment.clean as Split}
          total={metrics.sentiment.clean_total}
        />
        <p className="donut-note">
          Negative is the majority sentiment. The unfiltered feed reported only{" "}
          {metrics.headline.raw_negative_pct}% negative.{" "}
          <a href="#trust">See why filtering raises it</a> in the data-quality
          panel.
        </p>
      </Card>

      <Card
        id="topics"
        title="What's driving the conversation"
        subtitle="Every relevant mention by topic, sorted by volume"
        legend={
          <Legend
            items={LEGEND_ORDER.map((k) => ({
              label: SENTIMENT[k].label,
              color: SENTIMENT[k].color,
            }))}
          />
        }
      >
        <TopicBars topics={metrics.topics} />
        <p className="topics-note">
          One topic, failed transactions, is a third of all relevant volume at{" "}
          {metrics.topics[0].pct_negative}% negative. Not every topic is a
          complaint: <strong>agent network</strong> and{" "}
          <strong>feature query</strong> are all-neutral because they&rsquo;re
          &ldquo;where&rsquo;s an agent&rdquo; and &ldquo;how do I&rdquo;
          questions, not grievances.
        </p>
      </Card>

      <Card
        id="priority"
        title="Fix this first"
        subtitle="Operational topics ranked by negative mentions — where fixing one thing moves the most conversation"
      >
        {pr.top_exceeds_rest && (
          <div className="prank-hero">
            <strong>
              One issue drives more negative conversation than everything else
              combined.
            </strong>{" "}
            Failed transactions alone account for {pr.top_negative} negative
            mentions — more than the other {pr.topics.length - 1} fixable topics
            put together ({pr.rest_negative}).
          </div>
        )}
        <PriorityRanking topics={pr.topics} />
        <p className="prank-note">
          <strong>Competitor is deliberately absent</strong> from this list —
          separate what you fix from what you fight. NgoodPay chatter is
          competitive intelligence, not an operational bug to triage.{" "}
          <a href="#competitor">See the competitor view &rarr;</a>
        </p>
      </Card>

      <CompetitorView data={metrics.competitor as CompetitorData} />

      <TrustPanel data={metrics.trust_panel as TrustPanelData} />

      <MentionFeed mentions={metrics.mentions as Mention[]} />
    </div>
  );
}
