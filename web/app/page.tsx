import metrics from "@/lib/metrics.json";

const TOPIC_LABELS: Record<string, string> = {
  failed_transaction: "Failed transactions",
};

function topicLabel(topic: string): string {
  return TOPIC_LABELS[topic] ?? topic.replaceAll("_", " ");
}

function StatTile({
  label,
  dotColor,
  value,
  context,
  textValue = false,
}: {
  label: string;
  dotColor?: string;
  value: string;
  context: string;
  textValue?: boolean;
}) {
  return (
    <div className="stat-tile">
      <div className="stat-label">
        {dotColor && (
          <span className="stat-dot" style={{ background: dotColor }} aria-hidden />
        )}
        {label}
      </div>
      <div className={`stat-value${textValue ? " stat-value--text" : ""}`}>
        {value}
      </div>
      <div className="stat-context">{context}</div>
    </div>
  );
}

export default function Home() {
  const h = metrics.headline;
  const neg = h.clean_sentiment.negative;
  const pain = h.top_pain_point;

  return (
    <main className="container">
      <header className="masthead">
        <div className="masthead-kicker">Social listening · June 2026</div>
        <h1>What people are saying about TakaPay</h1>
        <p className="masthead-sub">
          {h.total_mentions} posts collected across 7 platforms.{" "}
          {h.relevant_mentions} are actually about the brand — every number
          below is computed on those.
        </p>
      </header>

      <section className="stat-grid" aria-label="Headline metrics">
        <StatTile
          label="Relevant mentions"
          value={h.relevant_mentions.toLocaleString()}
          context={`of ${h.total_mentions} collected — ${h.excluded_mentions} irrelevant posts filtered out`}
        />
        <StatTile
          label="Negative sentiment"
          dotColor="var(--negative)"
          value={`${neg.pct}%`}
          context={`${neg.count} negative mentions — raw feed said ${h.raw_negative_pct}%`}
        />
        <StatTile
          label="Top pain point"
          dotColor="var(--negative)"
          value={topicLabel(pain.topic)}
          context={`${pain.count} mentions, ${pain.pct_negative}% negative — the dominant conversation`}
          textValue
        />
        <StatTile
          label="Competitor threat"
          dotColor="var(--accent)"
          value={h.top_competitor.name}
          context={`${h.top_competitor.mentions} competitor posts in the feed this month`}
          textValue
        />
      </section>

      <footer className="footnote">
        Numbers are relevance-filtered before display — the raw feed
        overstates neutrality. A full data-quality breakdown ships with the
        trust panel.
      </footer>
    </main>
  );
}
