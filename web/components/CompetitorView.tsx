import { SwordsIcon } from "./icons";
import { topicLabel } from "@/lib/topics";

// Competitor themes are their own taxonomy (not topics), so their display
// names live here — the same "keys in the pipeline, labels in the frontend"
// split that topics.ts uses.
const THEME_LABELS: Record<string, string> = {
  agent_network: "Agent network",
  cashback_bonus: "Cashback & bonuses",
  fees_charges: "Fees & charges",
  app_experience: "App experience",
  customer_care: "Customer care",
};

type Theme = {
  key: string;
  count: number;
  example: string;
  neighborhoods?: string[];
};

export type CompetitorData = {
  name: string;
  total_posts: number;
  comparison: {
    count: number;
    pct_negative: number;
    sentiment: { negative: number; neutral: number; positive: number };
    themes: Theme[];
    fees_cross_ref: { topic: string; count: number; pct_negative: number };
  };
  promo: { count: number; example: string };
};

export function CompetitorView({ data }: { data: CompetitorData }) {
  const { comparison, promo, name } = data;
  const max = Math.max(...comparison.themes.map((t) => t.count));
  const agent = comparison.themes.find((t) => t.key === "agent_network");
  const fees = comparison.themes.find((t) => t.key === "fees_charges");
  const xref = comparison.fees_cross_ref;

  return (
    <section id="competitor" className="card section competitor">
      <div className="comp-head">
        <span className="comp-icon" aria-hidden>
          <SwordsIcon />
        </span>
        <div>
          <h2 className="card-title">Competitor: {name}</h2>
          <p className="card-sub">
            Two separate questions, kept apart on purpose: how people compare us
            to {name}, and what {name} is doing on its own. Mixing them would
            answer neither.
          </p>
        </div>
      </div>

      {/* Signal 1 — comparison posts (they name TakaPay; 100% negative). */}
      <div className="comp-block">
        <div className="comp-block-head">
          <h3 className="comp-block-title">
            {comparison.count} comparison posts
          </h3>
          <span className="chip down">{comparison.pct_negative}% negative</span>
        </div>
        <p className="comp-block-sub">
          Every one names TakaPay in an unfavorable comparison — what {name}{" "}
          gets praised for, at our expense.
        </p>

        <div className="cbars">
          {comparison.themes.map((t) => (
            <div className="cbar" key={t.key} title={t.example}>
              <span className="cbar-name">{THEME_LABELS[t.key] ?? t.key}</span>
              <div className="cbar-track">
                <div
                  className="cbar-fill"
                  style={{ width: `${(t.count / max) * 100}%` }}
                />
              </div>
              <span className="cbar-count">{t.count}</span>
            </div>
          ))}
        </div>

        <div className="comp-callout">
          <strong>Fees are a weapon that cuts both ways.</strong> The{" "}
          {fees?.count} posts citing {name}&rsquo;s lower charges
          cross-reference our own{" "}
          <a href="#topics">{topicLabel(xref.topic)}</a> topic —{" "}
          {xref.count} internal complaints at {xref.pct_negative}% negative.
          Customers complain about our fees <em>and</em> cite them when they
          leave.
        </div>

        {agent?.neighborhoods && (
          <p className="comp-hoods">
            <span className="comp-hoods-label">
              Agent-gap neighborhoods named:
            </span>{" "}
            {agent.neighborhoods.map((h) => (
              <span className="comp-hood" key={h}>
                {h}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Signal 2 — competitor-only posts, deliberately NOT brand sentiment. */}
      <div className="comp-block is-activity">
        <div className="comp-block-head">
          <h3 className="comp-block-title">
            {promo.count} competitor-only posts
          </h3>
          <span className="chip neutral">competitive activity</span>
        </div>
        <p className="comp-block-sub">
          {name}&rsquo;s own cashback promos — e.g.{" "}
          <span className="comp-quote">&ldquo;{promo.example}&rdquo;</span> They
          never mention TakaPay, so they are <strong>not counted in brand
          sentiment</strong>. They answer &ldquo;what is {name} doing?&rdquo;,
          not &ldquo;how do people feel about us?&rdquo; &mdash; a different
          question with a different owner.
        </p>
      </div>
    </section>
  );
}
