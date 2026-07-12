"use client";

import { useState } from "react";
import { SENTIMENT, type Sentiment } from "@/lib/sentiment";
import { ChevronIcon, ShieldIcon } from "./icons";

type SuspectItem = {
  id: string;
  text: string;
  label: Sentiment;
  score: number;
  family_says: Sentiment;
};

export type TrustPanelData = {
  filtered: {
    total: number;
    off_topic: { count: number; examples: string[] };
    competitor_only: { count: number };
  };
  suspects: {
    count: number;
    complaints_as_positive: number;
    praise_as_negative: number;
    items: SuspectItem[];
  };
  duplicates: { distinct_texts: number; rows: number };
  trust_arc: { raw_pct: number; clean_pct: number; audited_pct: number };
};

const ARC_STAGES = [
  { key: "raw_pct", label: "Raw feed", sub: "n=660" },
  { key: "clean_pct", label: "Relevance-filtered", sub: "n=590" },
  { key: "audited_pct", label: "Label-audited", sub: "shadow number" },
] as const;

function SentimentChip({ sentiment }: { sentiment: Sentiment }) {
  const s = SENTIMENT[sentiment];
  return (
    <span className="suspect-chip" style={{ color: s.color, background: `${s.color}1a` }}>
      {s.label}
    </span>
  );
}

export function TrustPanel({ data }: { data: TrustPanelData }) {
  const [expanded, setExpanded] = useState(false);
  const { filtered, suspects, duplicates, trust_arc } = data;
  const preview = 5;
  const visibleSuspects = expanded ? suspects.items : suspects.items.slice(0, preview);
  const maxArc = Math.max(trust_arc.raw_pct, trust_arc.clean_pct, trust_arc.audited_pct);

  return (
    <section id="trust" className="card section trust-panel">
      <div className="trust-head">
        <span className="trust-icon" aria-hidden>
          <ShieldIcon />
        </span>
        <div>
          <h2 className="card-title">
            What we filtered before showing you these numbers
          </h2>
          <p className="card-sub">
            Every exclusion and flag on this page is disclosed here. The only
            silent exclusion is relevance — everything else is flagged, not
            deleted or corrected.
          </p>
        </div>
      </div>

      <div className="trust-grid">
        <div className="trust-block">
          <h3 className="trust-block-title">
            {filtered.total} irrelevant posts filtered
          </h3>
          <p className="trust-block-sub">
            {filtered.off_topic.count} off-topic noise, plus{" "}
            {filtered.competitor_only.count} competitor-only posts rerouted to
            competitive intelligence.
          </p>
          <ul className="trust-examples">
            {filtered.off_topic.examples.map((ex) => (
              <li key={ex}>&ldquo;{ex}&rdquo;</li>
            ))}
          </ul>
        </div>

        <div className="trust-block">
          <h3 className="trust-block-title">
            {suspects.count} Suspect Labels
          </h3>
          <p className="trust-block-sub">
            {suspects.complaints_as_positive} complaints wearing a positive
            label vs {suspects.praise_as_negative} praise wearing a negative
            label — the errors run in the brand&rsquo;s favor.
          </p>

          <ul className="suspect-list">
            {visibleSuspects.map((item) => (
              <li key={item.id} className="suspect-row">
                <p className="suspect-text">&ldquo;{item.text}&rdquo;</p>
                <div className="suspect-meta">
                  <span>
                    labeled <SentimentChip sentiment={item.label} /> · score{" "}
                    {item.score}
                  </span>
                  <span className="suspect-arrow">
                    text reads <SentimentChip sentiment={item.family_says} />
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {suspects.items.length > preview && (
            <button
              type="button"
              className="trust-toggle"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronIcon
                style={{ transform: expanded ? "rotate(180deg)" : undefined }}
              />
              {expanded
                ? "Show fewer"
                : `Show all ${suspects.count} suspect labels`}
            </button>
          )}
        </div>

        <div className="trust-block">
          <h3 className="trust-block-title">
            {duplicates.distinct_texts} Duplicate Pairs ({duplicates.rows} rows)
          </h3>
          <p className="trust-block-sub">
            Byte-identical text from different authors on different
            platforms. Disclosed here, kept in every metric — the tool never
            silently deletes rows.
          </p>
        </div>
      </div>

      <div className="trust-arc">
        <h3 className="trust-block-title">
          The trust arc — what &ldquo;% negative&rdquo; depends on what you let reach it
        </h3>
        <div className="arc-bars">
          {ARC_STAGES.map((stage, i) => {
            const value = trust_arc[stage.key];
            const isShadow = stage.key === "audited_pct";
            return (
              <div className="arc-stage" key={stage.key}>
                <div className="arc-bar-track">
                  <div
                    className={`arc-bar-fill${isShadow ? " is-shadow" : ""}`}
                    style={{
                      height: `${(value / maxArc) * 100}%`,
                      opacity: 0.45 + i * 0.275,
                    }}
                  >
                    <span className="arc-value">{value}%</span>
                  </div>
                </div>
                <span className="arc-label">{stage.label}</span>
                <span className="arc-sub">{stage.sub}</span>
              </div>
            );
          })}
        </div>
        <p className="trust-block-sub">
          The dashboard&rsquo;s headline uses provided labels as-is (flag,
          don&rsquo;t fix). The {trust_arc.audited_pct}% figure is a{" "}
          <strong>shadow number</strong> — the plausible worst case if the 34
          suspect labels were corrected to match their text. It never appears
          as a headline.
        </p>
      </div>
    </section>
  );
}
