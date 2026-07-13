import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { NegativityBars, VolumeBars } from "@/components/charts/coverage-bars";
import { topicLabel } from "@/lib/topics";

// Language codes → reader-facing names, kept in the frontend like topicLabel.
const LANG_LABELS: Record<string, string> = {
  "bn-en": "Banglish",
  bn: "Bangla",
  en: "English",
};

const langLabel = (code: string) => LANG_LABELS[code] ?? code;

type CoverageRow = { code: string; count: number; pct: number };
type NegRow = { code: string; count: number; pct_negative: number };
type PlatformRow = {
  platform: string;
  count: number;
  pct: number;
  pct_negative: number;
};

export type LanguageData = {
  total: number;
  banglish_pct: number;
  coverage: CoverageRow[];
  suspects_non_english: number;
  suspects_total: number;
  clean_total: number;
  naive_negative: NegRow[];
  confound: { topic: string; rows: NegRow[] };
};

export type PlatformData = {
  total: number;
  overall_negative_pct: number;
  band: { low: number; high: number };
  rows: PlatformRow[];
};

export function Coverage({
  language,
  platform,
}: {
  language: LanguageData;
  platform: PlatformData;
}) {
  return (
    <Card id="context" data-reveal className="scroll-mt-20">
      <CardHeader>
        <h2
          data-slot="card-title"
          className="font-heading text-base leading-snug font-medium"
        >
          Coverage &amp; reach
        </h2>
        <CardDescription>
          Two footnotes for reading everything above: what language the feed
          speaks, and where the volume lives.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <LanguageBlock language={language} />
        <PlatformBlock platform={platform} />
      </CardContent>
    </Card>
  );
}

function LanguageBlock({ language }: { language: LanguageData }) {
  const naive = Object.fromEntries(
    language.naive_negative.map((r) => [r.code, r])
  );
  const confound = Object.fromEntries(
    language.confound.rows.map((r) => [r.code, r])
  );

  return (
    <div>
      <h3 className="text-sm font-semibold">Language - coverage, not anger</h3>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">
          {language.banglish_pct}%
        </span>
        <p className="text-muted-foreground text-sm">
          of all {language.total} posts are code-mixed{" "}
          <strong className="text-foreground font-medium">Banglish</strong>. An
          English-only pipeline would misread the majority of this feed, and{" "}
          <strong className="text-foreground font-medium">
            {language.suspects_non_english} of {language.suspects_total}{" "}
            suspect labels
          </strong>{" "}
          are Bangla or Banglish.
        </p>
      </div>

      <div className="mt-4">
        <VolumeBars
          rows={language.coverage.map((r) => ({
            name: langLabel(r.code),
            count: r.count,
            pct: r.pct,
          }))}
          height={140}
        />
      </div>

      <div className="bg-muted/60 mt-4 rounded-lg border-l-2 p-3 text-sm">
        <strong className="font-medium">
          It is not that Banglish users are angrier.
        </strong>{" "}
        <span className="text-muted-foreground">
          The naive read (Banglish {naive["bn-en"].pct_negative}% negative vs
          English {naive["en"].pct_negative}%) is a topic-mix artifact.
          English and Banglish posts share <em>zero</em> topics: English is
          billing and recharge, Banglish is failed transactions and competitor
          pressure. Hold topic fixed and the gap vanishes. On{" "}
          {topicLabel(language.confound.topic)}, Banglish is{" "}
          {confound["bn-en"].pct_negative}% negative and Bangla{" "}
          {confound["bn"].pct_negative}%, near-identical. Language tells you
          what to <em>read</em>, not who to blame.
        </span>
      </div>
    </div>
  );
}

function PlatformBlock({ platform }: { platform: PlatformData }) {
  const ref = platform.overall_negative_pct;

  return (
    <div>
      <h3 className="text-sm font-semibold">
        Platform - where to watch, not why
      </h3>

      <p className="text-muted-foreground mt-3 text-sm">
        Negativity sits in a flat {platform.band.low}-{platform.band.high}%
        band across every platform. Facebook is a third of the feed, so that
        is where to watch. What moves sentiment is topic, not platform.
      </p>

      <div className="mt-4">
        <p className="text-muted-foreground mb-1 text-xs font-medium">
          Volume (relevant mentions)
        </p>
        <VolumeBars
          rows={platform.rows.map((r) => ({
            name: r.platform,
            count: r.count,
            pct: r.pct,
          }))}
          height={220}
        />
      </div>

      <div className="mt-4">
        <p className="text-muted-foreground mb-1 text-xs font-medium">
          % negative per platform · dashed line = overall average
        </p>
        <NegativityBars
          rows={platform.rows.map((r) => ({
            name: r.platform,
            pct_negative: r.pct_negative,
          }))}
          reference={ref}
          height={220}
        />
      </div>
    </div>
  );
}
