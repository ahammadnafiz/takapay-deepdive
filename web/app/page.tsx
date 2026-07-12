import type { ReactNode } from "react";
import metrics from "@/lib/metrics.json";
import {
  MentionsIcon,
  AlertIcon,
  SwordsIcon,
  CalendarIcon,
} from "@/components/icons";

const TOPIC_LABELS: Record<string, string> = {
  failed_transaction: "Failed transactions",
};

function topicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic.replaceAll("_", " ");
}

function StatCard({
  icon,
  tint,
  label,
  value,
  isText = false,
  chip,
  note,
}: {
  icon: ReactNode;
  tint: string;
  label: string;
  value: string;
  isText?: boolean;
  chip?: { text: string; kind: "up" | "down" | "neutral" };
  note: string;
}) {
  return (
    <div className="stat-card">
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

  return (
    <div id="overview">
      <header className="page-head">
        <div>
          <h1 className="page-title">Overview</h1>
          <p className="page-sub">
            An at-a-glance read on TakaPay across 7 platforms. Of{" "}
            {h.total_mentions} posts collected, {h.relevant_mentions} actually
            name the brand — every number here is computed on those.
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
          note={`${pain.count} mentions · ${pain.pct_negative}% negative — the dominant conversation`}
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
          reads more positive than reality — it includes posts that never
          mention TakaPay and labels that contradict their own text. The full
          data-quality breakdown ships with the trust panel.
        </p>
      </div>
    </div>
  );
}
