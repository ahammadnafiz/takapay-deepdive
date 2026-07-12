"use client";

import { useMemo, useState } from "react";
import { SENTIMENT, LEGEND_ORDER, type Sentiment } from "@/lib/sentiment";
import { topicLabel } from "@/lib/topics";

export type Mention = {
  id: string;
  platform: string;
  timestamp: string;
  text: string;
  sentiment: Sentiment;
  topic: string;
  is_relevant: boolean;
  is_suspect: boolean;
  is_duplicate: boolean;
};

// Flags are derived from the same booleans the trust panel counts, so a badge
// on a card and a number in the panel can never disagree. off-topic and
// competitor-only both mean "doesn't name the brand", split by topic.
type FlagKey = "off-topic" | "competitor-only" | "suspect" | "duplicate";

const FLAG_LABELS: Record<FlagKey, string> = {
  "off-topic": "Off-topic",
  "competitor-only": "Competitor-only",
  suspect: "Suspect label",
  duplicate: "Duplicate",
};

function flagsFor(m: Mention): FlagKey[] {
  const flags: FlagKey[] = [];
  if (!m.is_relevant && m.topic === "off_topic") flags.push("off-topic");
  if (!m.is_relevant && m.topic === "competitor") flags.push("competitor-only");
  if (m.is_suspect) flags.push("suspect");
  if (m.is_duplicate) flags.push("duplicate");
  return flags;
}

const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");

// Timestamps are "YYYY-MM-DD HH:MM:SS"; parse by hand so there's no
// timezone-dependent Date() ambiguity across browsers.
function formatTime(ts: string): string {
  const [date, time = ""] = ts.split(" ");
  const [, month, day] = date.split("-");
  return `${MONTHS[Number(month) - 1]} ${Number(day)} · ${time.slice(0, 5)}`;
}

function ChipRow<T extends string>({
  label,
  options,
  active,
  onSelect,
  format,
  renderDot,
}: {
  label: string;
  options: T[];
  active: T | null;
  onSelect: (value: T | null) => void;
  format?: (value: T) => string;
  renderDot?: (value: T) => string | undefined;
}) {
  return (
    <div className="filter-row">
      <span className="filter-label" id={`filter-${label}`}>
        {label}
      </span>
      <div
        className="filter-chips"
        role="group"
        aria-labelledby={`filter-${label}`}
      >
        {options.map((opt) => {
          const isActive = active === opt;
          const dot = renderDot?.(opt);
          return (
            <button
              key={opt}
              type="button"
              className={`filter-chip${isActive ? " is-active" : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelect(isActive ? null : opt)}
            >
              {dot && (
                <span
                  className="filter-dot"
                  style={{ background: dot }}
                  aria-hidden
                />
              )}
              {format ? format(opt) : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MentionFeed({ mentions }: { mentions: Mention[] }) {
  const [topic, setTopic] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [platform, setPlatform] = useState<string | null>(null);

  // Filter options, most-common first, computed once from the data.
  const topics = useMemo(() => byFrequency(mentions.map((m) => m.topic)), [mentions]);
  const platforms = useMemo(
    () => byFrequency(mentions.map((m) => m.platform)),
    [mentions]
  );

  const filtered = useMemo(
    () =>
      mentions.filter(
        (m) =>
          (!topic || m.topic === topic) &&
          (!sentiment || m.sentiment === sentiment) &&
          (!platform || m.platform === platform)
      ),
    [mentions, topic, sentiment, platform]
  );

  const anyActive = topic || sentiment || platform;

  return (
    <section id="feed" className="card section">
      <div className="card-head">
        <div>
          <h2 className="card-title">Explore the mentions</h2>
          <p className="card-sub">
            Every aggregate on this page traces back to these {mentions.length}{" "}
            posts. Filter by topic, sentiment, and platform — they compose.
          </p>
        </div>
      </div>

      <div className="feed-filters">
        <ChipRow
          label="Topic"
          options={topics}
          active={topic}
          onSelect={setTopic}
          format={topicLabel}
        />
        <ChipRow
          label="Sentiment"
          options={LEGEND_ORDER}
          active={sentiment}
          onSelect={setSentiment}
          format={(s) => SENTIMENT[s].label}
          renderDot={(s) => SENTIMENT[s].color}
        />
        <ChipRow
          label="Platform"
          options={platforms}
          active={platform}
          onSelect={setPlatform}
        />
      </div>

      <div className="feed-status">
        <span className="feed-count">
          <strong>{filtered.length}</strong> of {mentions.length} posts
        </span>
        {anyActive ? (
          <button
            type="button"
            className="feed-clear"
            onClick={() => {
              setTopic(null);
              setSentiment(null);
              setPlatform(null);
            }}
          >
            Clear filters
          </button>
        ) : (
          <span className="feed-hint">
            Try Topic <em>Failed transactions</em> + Sentiment{" "}
            <em>Positive</em> to see the suspect-flagged rows.
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="feed-empty">No posts match these filters.</p>
      ) : (
        <ul className="feed-list">
          {filtered.map((m) => (
            <MentionCard key={m.id} mention={m} />
          ))}
        </ul>
      )}
    </section>
  );
}

function MentionCard({ mention }: { mention: Mention }) {
  const s = SENTIMENT[mention.sentiment];
  const flags = flagsFor(mention);

  return (
    <li className="mcard">
      <div className="mcard-top">
        <span className="mcard-meta">
          <span className="mcard-platform">{mention.platform}</span>
          <span className="mcard-time">{formatTime(mention.timestamp)}</span>
        </span>
        <span className="mcard-tags">
          <span
            className="mcard-sentiment"
            style={{ color: s.color, background: `${s.color}1a` }}
          >
            {s.label}
          </span>
          <span className="mcard-topic">{topicLabel(mention.topic)}</span>
        </span>
      </div>
      <p className="mcard-text">{mention.text}</p>
      {flags.length > 0 && (
        <div className="mcard-flags">
          {flags.map((f) => (
            <span key={f} className={`flag-badge flag-${f}`}>
              {FLAG_LABELS[f]}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

function byFrequency(values: string[]): string[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
}
