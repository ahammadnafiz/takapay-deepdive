"use client";

import { useState } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { TrustArc } from "@/components/charts/trust-arc";
import { SENTIMENT, type Sentiment } from "@/lib/sentiment";

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

function SentimentChip({ sentiment }: { sentiment: Sentiment }) {
  const s = SENTIMENT[sentiment];
  return (
    <span
      className="inline-flex rounded px-1.5 py-px text-[11px] font-semibold"
      style={{ color: s.color, background: `${s.color}1a` }}
    >
      {s.label}
    </span>
  );
}

export function TrustPanel({ data }: { data: TrustPanelData }) {
  const [expanded, setExpanded] = useState(false);
  const { filtered, suspects, duplicates, trust_arc } = data;
  const preview = 5;
  const visibleSuspects = expanded
    ? suspects.items
    : suspects.items.slice(0, preview);

  return (
    <Card id="trust" data-reveal className="scroll-mt-20">
      <CardHeader>
        <h2
          data-slot="card-title"
          className="font-heading flex items-center gap-2 text-base leading-snug font-medium"
        >
          <ShieldCheck className="text-muted-foreground size-4" />
          What we filtered before showing you these numbers
        </h2>
        <CardDescription>
          Every exclusion and flag on this page is disclosed here. The only
          silent exclusion is relevance; everything else is flagged, not
          deleted or corrected.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-6 border-b pb-6 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-semibold">
            {filtered.total} irrelevant posts filtered
          </h3>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {filtered.off_topic.count} off-topic noise, plus{" "}
            {filtered.competitor_only.count} competitor-only posts rerouted to
            competitive intelligence.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {filtered.off_topic.examples.map((ex) => (
              <li
                key={ex}
                className="text-muted-foreground border-l-2 pl-2.5 text-xs italic"
              >
                &ldquo;{ex}&rdquo;
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            {suspects.count} Suspect Labels
          </h3>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {suspects.complaints_as_positive} complaints wearing a positive
            label vs {suspects.praise_as_negative} praise wearing a negative
            label; the errors run in the brand&rsquo;s favor.
          </p>

          <ul className="mt-3 flex flex-col gap-2">
            {visibleSuspects.map((item) => (
              <li key={item.id} className="bg-muted/50 rounded-lg border p-2.5">
                <p className="text-[13px] leading-snug">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span>
                    labeled <SentimentChip sentiment={item.label} /> · score{" "}
                    {item.score}
                  </span>
                  <span>
                    text reads <SentimentChip sentiment={item.family_says} />
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {suspects.items.length > preview && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-2"
              aria-expanded={expanded}
              onClick={() => setExpanded((v) => !v)}
            >
              <ChevronDown
                className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
              {expanded
                ? "Show fewer"
                : `Show all ${suspects.count} suspect labels`}
            </Button>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold">
            {duplicates.distinct_texts} Duplicate Pairs ({duplicates.rows}{" "}
            rows)
          </h3>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Byte-identical text from different authors on different platforms.
            Disclosed here, kept in every metric. The tool never silently
            deletes rows.
          </p>
        </div>
      </CardContent>

      <CardContent className="pt-2">
        <h3 className="text-sm font-semibold">
          The trust arc: &ldquo;% negative&rdquo; depends on what you let reach
          it
        </h3>
        <div className="mt-3">
          <TrustArc
            raw={trust_arc.raw_pct}
            clean={trust_arc.clean_pct}
            audited={trust_arc.audited_pct}
          />
        </div>
      </CardContent>

      <CardFooter className="text-muted-foreground text-xs">
        <p>
          The dashboard&rsquo;s headline uses provided labels as-is (flag,
          don&rsquo;t fix). The {trust_arc.audited_pct}% figure is a{" "}
          <strong className="text-foreground font-medium">shadow number</strong>: the
          plausible worst case if the {suspects.count} suspect labels were
          corrected to match their text. It never appears as a headline.
        </p>
      </CardFooter>
    </Card>
  );
}
