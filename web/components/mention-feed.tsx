"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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

const FLAG_CLASSES: Record<FlagKey, string> = {
  "off-topic": "bg-muted text-muted-foreground",
  "competitor-only":
    "bg-secondary text-secondary-foreground",
  suspect:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-400",
  duplicate:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-950 dark:bg-amber-950/30 dark:text-amber-400",
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
    <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[90px_1fr] sm:gap-3">
      <span
        className="text-muted-foreground pt-1 text-[11px] font-medium tracking-wide uppercase"
        id={`filter-${label}`}
      >
        {label}
      </span>
      <div
        className="flex flex-wrap gap-1.5"
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
              aria-pressed={isActive}
              onClick={() => onSelect(isActive ? null : opt)}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors active:scale-[0.97]",
                isActive
                  ? "border-foreground bg-foreground text-background font-medium"
                  : "bg-background text-muted-foreground hover:border-ring hover:text-foreground"
              )}
            >
              {dot && (
                <span
                  className="size-1.5 rounded-full"
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
    <Card id="feed" data-reveal className="scroll-mt-20">
      <CardHeader>
        <h2
          data-slot="card-title"
          className="font-heading text-base leading-snug font-medium"
        >
          Explore the mentions
        </h2>
        <CardDescription>
          Every aggregate on this page traces back to these {mentions.length}{" "}
          posts. Filter by topic, sentiment, and platform; filters stack.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5 border-b pb-4">
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

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm tabular-nums">
            <strong className="font-semibold">{filtered.length}</strong>{" "}
            <span className="text-muted-foreground">
              of {mentions.length} posts
            </span>
          </span>
          {anyActive ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setTopic(null);
                setSentiment(null);
                setPlatform(null);
              }}
            >
              Clear filters
            </Button>
          ) : (
            <span className="text-muted-foreground text-xs">
              Try Topic{" "}
              <em className="text-foreground not-italic">Failed transactions</em> +
              Sentiment <em className="text-foreground not-italic">Positive</em> to
              see the suspect-flagged rows.
            </span>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-10 text-center text-sm">
            No posts match these filters.
          </p>
        ) : (
          <ScrollArea className="h-[560px] pr-3">
            <ul className="flex flex-col gap-2">
              {filtered.map((m) => (
                <MentionCard key={m.id} mention={m} />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function MentionCard({ mention }: { mention: Mention }) {
  const s = SENTIMENT[mention.sentiment];
  const flags = flagsFor(mention);

  return (
    <li className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-xs">
          <span className="font-semibold">{mention.platform}</span>
          <span className="text-muted-foreground tabular-nums">
            {formatTime(mention.timestamp)}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="rounded-full px-2 py-px text-[11px] font-semibold"
            style={{ color: s.color, background: `${s.color}1a` }}
          >
            {s.label}
          </span>
          <Badge variant="secondary" className="text-[11px] font-normal">
            {topicLabel(mention.topic)}
          </Badge>
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed">{mention.text}</p>
      {flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {flags.map((f) => (
            <Badge
              key={f}
              variant="outline"
              className={cn("text-[10px]", FLAG_CLASSES[f])}
            >
              {FLAG_LABELS[f]}
            </Badge>
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
