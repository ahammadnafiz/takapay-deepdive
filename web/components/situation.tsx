import type { ReactNode } from "react";
import {
  ArrowDown,
  Link2,
  Megaphone,
  ShieldAlert,
  ShieldHalf,
  Swords,
  Target,
  ThumbsUp,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import metrics from "@/lib/metrics.json";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CountUp } from "@/components/CountUp";
import { topicLabel } from "@/lib/topics";
import { cn } from "@/lib/utils";

type Tone = "negative" | "positive" | "neutral";

interface TopicRow {
  topic: string;
  total: number;
  negative: number;
  neutral: number;
  positive: number;
  pct_negative: number;
}

/* What each NgoodPay comparison theme claims, phrased as the perceived
   advantage users cite. */
const THEME_LABELS: Record<string, string> = {
  app_experience: "Faster app",
  cashback_bonus: "Recharge bonuses",
  agent_network: "More agents nearby",
  fees_charges: "Lower cash-out fees",
  customer_care: "Better customer care",
};

// Below this many posts a sentiment split is too thin to read as a verdict:
// a 50/50 bar on 2 posts is noise, not a signal. Such rows show a plain "n="
// count instead of a confident tag, and their bars render muted.
const LOW_N = 5;

/* Editorial read of each theme, derived from its numbers, not hand-tagged:
   scale and negativity set the severity; all-neutral topics with enough
   volume are demand signals, not grievances. Callers must gate on LOW_N
   first; this never runs for tiny samples. */
function verdict(t: TopicRow): { label: string; tone: Tone } {
  if (t.topic === "competitor") return { label: "threat", tone: "negative" };
  if (t.negative === 0 && t.positive === 0)
    return { label: "demand", tone: "neutral" };
  const negP = t.negative / t.total;
  const posP = t.positive / t.total;
  if (negP >= 0.85 && t.total >= 50)
    return { label: "crisis", tone: "negative" };
  if (negP >= 0.8 && t.total >= 20)
    return { label: "sore point", tone: "negative" };
  if (negP >= 0.8) return { label: "watch", tone: "negative" };
  if (posP >= 0.8) return { label: "loved", tone: "positive" };
  return { label: "mixed", tone: "neutral" };
}

const TONE_TEXT: Record<Tone, string> = {
  negative: "text-(--sent-negative) bg-(--sent-negative)/10",
  positive: "text-(--sent-positive) bg-(--sent-positive)/10",
  neutral: "text-muted-foreground bg-muted",
};

const TONE_DOT: Record<Tone, string> = {
  negative: "var(--sent-negative)",
  positive: "var(--sent-positive)",
  neutral: "var(--sent-neutral)",
};

function VerdictTag({ label, tone }: { label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase whitespace-nowrap",
        TONE_TEXT[tone]
      )}
    >
      {label}
    </span>
  );
}

function Kpi({
  icon,
  label,
  value,
  note,
  valueClassName,
  delay,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  note: string;
  valueClassName?: string;
  delay?: string;
}) {
  return (
    <Card data-reveal className={cn("gap-2 py-4", delay)}>
      <CardHeader className="gap-1">
        <CardDescription className="flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
          {icon}
          {label}
        </CardDescription>
        <CardTitle
          className={cn(
            "text-3xl font-semibold tracking-tight tabular-nums",
            valueClassName
          )}
        >
          {value}
        </CardTitle>
      </CardHeader>
      <CardFooter className="text-muted-foreground text-xs">{note}</CardFooter>
    </Card>
  );
}

/* Stacked sentiment split with 2px surface gaps between segments. */
function SplitSegments({
  negative,
  neutral,
  positive,
  className,
}: {
  negative: number;
  neutral: number;
  positive: number;
  className?: string;
}) {
  const total = negative + neutral + positive;
  const segs = [
    { key: "neg", v: negative, color: "var(--sent-negative)" },
    { key: "neu", v: neutral, color: "var(--sent-neutral)" },
    { key: "pos", v: positive, color: "var(--sent-positive)" },
  ].filter((s) => s.v > 0);
  return (
    <div
      className={cn("flex h-2 w-full gap-0.5 overflow-hidden rounded-full", className)}
    >
      {segs.map((s) => (
        <div
          key={s.key}
          style={{ width: `${(s.v / total) * 100}%`, background: s.color }}
          className="h-full first:rounded-l-full last:rounded-r-full"
        />
      ))}
    </div>
  );
}

function ThemeRow({ t }: { t: TopicRow }) {
  const lowN = t.total < LOW_N;
  const counts = { negative: t.negative, neutral: t.neutral, positive: t.positive };
  const dominant = (Object.keys(counts) as Tone[]).reduce((a, b) =>
    counts[a] >= counts[b] ? a : b
  );
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn("size-2 shrink-0 rounded-full", lowN && "opacity-40")}
        style={{ background: TONE_DOT[dominant] }}
      />
      <span
        className={cn(
          "w-36 shrink-0 truncate text-sm font-medium",
          lowN && "text-muted-foreground font-normal"
        )}
      >
        {t.topic === "competitor" ? "NgoodPay switching" : topicLabel(t.topic)}
      </span>
      <span className="text-muted-foreground w-8 shrink-0 text-right text-xs tabular-nums">
        {t.total}
      </span>
      <SplitSegments
        negative={t.negative}
        neutral={t.neutral}
        positive={t.positive}
        className={cn("flex-1", lowN && "opacity-40")}
      />
      <span className="flex w-24 shrink-0 justify-end">
        {lowN ? (
          <span className="text-muted-foreground text-[10px] tabular-nums">
            n = {t.total}
          </span>
        ) : (
          (() => {
            const v = verdict(t);
            return <VerdictTag label={v.label} tone={v.tone} />;
          })()
        )}
      </span>
    </div>
  );
}

/* One thin labeled bar; length carries the comparison, color carries the
   semantic (sentiment token or brand-for-volume). */
function MiniBar({
  label,
  value,
  max,
  color,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-36 shrink-0 truncate text-xs">
        {label}
      </span>
      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full"
          style={{ width: `${(value / max) * 100}%`, background: color }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-xs font-medium tabular-nums">
        {value}
        {suffix}
      </span>
    </div>
  );
}

function Decision({
  icon,
  action,
  text,
  href,
  linkLabel,
}: {
  icon: ReactNode;
  action: string;
  text: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <p className="text-sm">
        <strong className="font-semibold tracking-wide uppercase">
          {action}:
        </strong>{" "}
        <span className="text-muted-foreground">{text}</span>{" "}
        <a
          href={href}
          className="text-brand whitespace-nowrap underline underline-offset-4"
        >
          {linkLabel}
        </a>
      </p>
    </div>
  );
}

export function Situation() {
  const h = metrics.headline;
  const arc = metrics.trust_panel.trust_arc;
  const clean = metrics.sentiment.clean;
  const topics = metrics.topics as TopicRow[];
  const comp = metrics.competitor;
  const pr = metrics.priority_ranking;

  const pain = topics[0];
  const complaintsTotal = pr.top_negative + pr.rest_negative;
  const stuckShare = Math.round((pr.top_negative / complaintsTotal) * 100);
  const compWins = Math.round(
    (comp.comparison.count * (100 - comp.comparison.pct_negative)) / 100
  );
  const themeMax = Math.max(...comp.comparison.themes.map((t) => t.count));

  const platforms = [...metrics.platform.rows].sort(
    (a, b) => b.pct_negative - a.pct_negative
  );
  const biggest = [...metrics.platform.rows].sort((a, b) => b.count - a.count)[0];
  const angriest = platforms[0];

  const suspects = metrics.trust_panel.suspects;

  const strengths = topics
    .filter((t) => t.total >= 20 && t.positive / t.total >= 0.8)
    .map((t) => ({
      topic: t.topic,
      posPct: Math.round((t.positive / t.total) * 100),
    }));
  const topStrength = strengths[0];

  const lovedTopics = topics.filter(
    (t) => t.total >= LOW_N && verdict(t).label === "loved"
  );
  const lovedPosts = lovedTopics.reduce((s, t) => s + t.total, 0);
  const demandLabels = topics
    .filter((t) => t.total >= LOW_N && verdict(t).label === "demand")
    .map((t) => topicLabel(t.topic).toLowerCase())
    .join(" and ");
  const demandLabelsCap =
    demandLabels.charAt(0).toUpperCase() + demandLabels.slice(1);

  return (
    <section
      id="situation"
      aria-label="Situation briefing"
      className="flex scroll-mt-20 flex-col gap-4"
    >
      <div data-reveal className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
            The situation · TakaPay · June 2026
          </p>
          <Badge
            variant="outline"
            className="border-(--sent-negative)/30 bg-(--sent-negative)/5 text-(--sent-negative) gap-1.5 text-[10px] font-medium tracking-wide uppercase"
          >
            <span className="size-1.5 rounded-full bg-current" />
            Under pressure
          </Badge>
          <span className="text-muted-foreground ml-auto hidden text-xs sm:inline">
            {h.excluded_mentions} off-brand posts removed before counting
          </span>
        </div>
        <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-balance lg:text-4xl">
          Clean the feed and TakaPay runs {Math.round(clean.negative.pct)}%
          negative, most of it money that never arrives.
        </h1>
        <p className="text-muted-foreground max-w-4xl text-sm">
          {h.total_mentions} posts collected, {h.relevant_mentions} about the
          brand. What to fix, what to fight, what to trust, and the calls that
          follow.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          icon={<TriangleAlert className="size-3.5" />}
          label="Negative sentiment"
          value={<CountUp value={clean.negative.pct} decimals={1} suffix="%" />}
          valueClassName="text-(--sent-negative)"
          note={`${clean.negative.count} of ${h.relevant_mentions} relevant posts`}
        />
        <Kpi
          icon={<Target className="size-3.5" />}
          label="Top pain point"
          value={<CountUp value={pain.total} />}
          note={`${topicLabel(pain.topic)} · ${pain.pct_negative}% negative`}
          delay="delay-75"
        />
        <Kpi
          icon={<Swords className="size-3.5" />}
          label="Competitor mentions"
          value={<CountUp value={h.top_competitor.mentions} />}
          note={`${comp.name} · ${comp.comparison.count} head-to-head, ${compWins} won`}
          delay="delay-150"
        />
        <Kpi
          icon={<ThumbsUp className="size-3.5" />}
          label="Positive posts"
          value={<CountUp value={clean.positive.count} />}
          valueClassName="text-(--sent-positive)"
          note="cashback · recharge · send money"
          delay="delay-225"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-8">
          <Card data-reveal className="gap-3 py-4">
            <CardHeader>
              <h2
                data-slot="card-title"
                className="font-heading text-base leading-snug font-medium"
              >
                Sentiment mix, cleaned data
              </h2>
              <CardAction className="text-muted-foreground text-xs tabular-nums">
                raw {arc.raw_pct}% → clean {arc.clean_pct}% → audited{" "}
                {arc.audited_pct}% negative
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-1.5">
              <SplitSegments
                negative={clean.negative.count}
                neutral={clean.neutral.count}
                positive={clean.positive.count}
                className="h-3"
              />
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: "var(--sent-negative)" }}
                  />
                  negative {clean.negative.count}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: "var(--sent-neutral)" }}
                  />
                  neutral {clean.neutral.count}
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: "var(--sent-positive)" }}
                  />
                  positive {clean.positive.count}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card data-reveal className="flex-1 gap-3 py-4 delay-75">
            <CardHeader>
              <h2
                data-slot="card-title"
                className="font-heading text-base leading-snug font-medium"
              >
                What people are talking about
              </h2>
              <CardDescription>
                Every theme ranked by volume; red is complaint share
              </CardDescription>
              <CardAction>
                <Badge
                  variant="outline"
                  className="border-(--sent-negative)/30 text-(--sent-negative) gap-1 tabular-nums"
                >
                  <TriangleAlert className="size-3" />
                  {pr.top_negative} of {complaintsTotal} complaints = stuck money
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2">
              {topics.map((t) => (
                <ThemeRow key={t.topic} t={t} />
              ))}
              <div className="mt-auto grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    Money that moves is loved; money that stalls is the crisis
                  </p>
                  <p className="text-muted-foreground text-xs">
                    The {lovedTopics.length} loved topics ({lovedPosts} posts)
                    are all completed transactions. Every crisis and sore point
                    is a failure of the same flow: the brand is judged on
                    whether money arrives.
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">
                    Gray rows are questions, not complaints
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {demandLabelsCap} carry zero negativity because they are
                    &ldquo;where&rdquo; and &ldquo;how&rdquo; queries: demand to
                    serve, not anger to fix. Scoring them negative would invent
                    a problem that is not there.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-muted-foreground border-t text-xs [.border-t]:pt-3">
              <p>
                The verdicts are computed from the numbers: crisis and sore
                point by scale and negativity, demand where every post is a
                neutral question.{" "}
                <a href="#topics" className="text-brand underline underline-offset-4">
                  Full topic detail
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-4">
          <Card data-reveal className="gap-3 py-4 delay-75">
            <CardHeader>
              <h2
                data-slot="card-title"
                className="font-heading text-base leading-snug font-medium"
              >
                Competitor · {comp.name}
              </h2>
              <CardAction>
                <Badge variant="outline" className="tabular-nums">
                  {comp.total_posts} mentions
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs">
                All {comp.comparison.count} head-to-head comparisons favored{" "}
                {comp.name}. Why people say they are switching:
              </p>
              {comp.comparison.themes.map((t) => (
                <MiniBar
                  key={t.key}
                  label={THEME_LABELS[t.key] ?? t.key}
                  value={t.count}
                  max={themeMax}
                  color="var(--brand)"
                />
              ))}
            </CardContent>
            <CardFooter className="text-muted-foreground border-t text-xs [.border-t]:pt-3">
              <a href="#competitor" className="text-brand underline underline-offset-4">
                Competitor view
              </a>
            </CardFooter>
          </Card>

          <Card data-reveal className="gap-3 py-4 delay-150">
            <CardHeader>
              <h2
                data-slot="card-title"
                className="font-heading text-base leading-snug font-medium"
              >
                Platform heat
              </h2>
              <CardAction className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                % negative
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {platforms.map((p) => (
                <MiniBar
                  key={p.platform}
                  label={p.platform}
                  value={Math.round(p.pct_negative)}
                  max={100}
                  color="var(--sent-negative)"
                  suffix="%"
                />
              ))}
            </CardContent>
            <CardFooter className="text-muted-foreground border-t text-xs [.border-t]:pt-3">
              <p>
                {angriest.platform} angriest · {biggest.platform} biggest (
                {Math.round(biggest.pct)}% of volume) ·{" "}
                {metrics.language.banglish_pct}% of posts in Banglish
              </p>
            </CardFooter>
          </Card>

          <Card data-reveal className="gap-3 py-4 delay-225">
            <CardHeader>
              <h2
                data-slot="card-title"
                className="flex items-center gap-1.5 font-heading text-base leading-snug font-medium"
              >
                <ShieldAlert className="text-muted-foreground size-4" />
                Can you trust the labels?
              </h2>
              <CardAction>
                <Badge
                  variant="outline"
                  className="border-(--sent-negative)/30 text-(--sent-negative) tabular-nums"
                >
                  {suspects.count} flipped
                </Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs">
                Posts whose label contradicts their own text, caught by
                template voting. The errors run one way:
              </p>
              <MiniBar
                label="Complaints as praise"
                value={suspects.complaints_as_positive}
                max={suspects.complaints_as_positive}
                color="var(--sent-negative)"
              />
              <MiniBar
                label="Praise as complaints"
                value={suspects.praise_as_negative}
                max={suspects.complaints_as_positive}
                color="var(--sent-positive)"
              />
            </CardContent>
            <CardFooter className="text-muted-foreground border-t text-xs [.border-t]:pt-3">
              <p>
                Every flip flatters the brand. Flagged, never silently
                corrected.{" "}
                <a href="#trust" className="text-brand underline underline-offset-4">
                  Trust panel
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      <Card data-reveal className="gap-0 py-4">
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Decision
            icon={<Wrench className="size-4" />}
            action="Fix"
            text={`Auto-reverse stuck transactions in hours, not days: ${stuckShare}% of all complaints.`}
            href="#priority"
            linkLabel="Priority queue"
          />
          <Decision
            icon={<ShieldHalf className="size-4" />}
            action="Defend"
            text={`Answer cash-out fee anger; match ${comp.name} on bonuses and agent coverage.`}
            href="#competitor"
            linkLabel="Competitor view"
          />
          <Decision
            icon={<Megaphone className="size-4" />}
            action="Amplify"
            text={`Push what the feed loves: ${topicLabel(topStrength.topic).toLowerCase()} at ${topStrength.posPct}% positive, plus recharge and bills, in Banglish.`}
            href="#context"
            linkLabel="Coverage"
          />
        </CardContent>
      </Card>

      {/* No data-reveal here: this row sits inside the bottom 8% band that
          ScrollFx never reveals on landing, so it must render visible. */}
      <div className="text-muted-foreground flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-1.5">
          <Link2 className="size-3.5 shrink-0" />
          Labels are as provided: 34 flipped labels are flagged, never silently
          corrected, and most volume is templated text (
          {metrics.trust_panel.duplicates.rows} duplicate rows): pressure, not
          headcount.
        </p>
        <a
          href="#overview"
          className="text-brand flex items-center gap-1 whitespace-nowrap underline underline-offset-4"
        >
          Full evidence below
          <ArrowDown className="size-3.5" />
        </a>
      </div>
    </section>
  );
}
