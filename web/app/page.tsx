import type { ReactNode } from "react";
import {
  AlertTriangle,
  Info,
  MessageSquareText,
  Swords,
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
import { SentimentDonut } from "@/components/charts/sentiment-donut";
import { TopicBars, type Topic } from "@/components/charts/topic-bars";
import {
  PriorityBars,
  type PriorityTopic,
} from "@/components/charts/priority-bars";
import { CompetitorView, type CompetitorData } from "@/components/competitor-view";
import { TrustPanel, type TrustPanelData } from "@/components/trust-panel";
import { MentionFeed, type Mention } from "@/components/mention-feed";
import { Coverage, type LanguageData, type PlatformData } from "@/components/coverage";
import { topicLabel } from "@/lib/topics";

function KpiCard({
  label,
  value,
  badge,
  note,
  icon,
  delay,
}: {
  label: string;
  value: ReactNode;
  badge?: string;
  note: string;
  icon: ReactNode;
  delay?: string;
}) {
  return (
    <Card data-reveal className={delay}>
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          {icon}
          {label}
        </CardDescription>
        <CardTitle className="text-2xl font-semibold tracking-tight tabular-nums lg:text-3xl">
          {value}
        </CardTitle>
        {badge && (
          <CardAction>
            <Badge variant="outline">{badge}</Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="text-muted-foreground text-xs">{note}</CardFooter>
    </Card>
  );
}

export default function Home() {
  const h = metrics.headline;
  const neg = h.clean_sentiment.negative;
  const pain = h.top_pain_point;
  const pr = metrics.priority_ranking;

  return (
    <div id="overview" className="flex scroll-mt-20 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground max-w-3xl text-sm">
          What people said about TakaPay across 7 platforms in June 2026. Of{" "}
          {h.total_mentions} posts collected, {h.relevant_mentions} actually
          name the brand. Every number on this page is computed on those.
        </p>
      </div>

      <section
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Headline metrics"
      >
        <KpiCard
          icon={<MessageSquareText className="size-3.5" />}
          label="Relevant mentions"
          value={<CountUp value={h.relevant_mentions} />}
          badge={`of ${h.total_mentions}`}
          note={`${h.excluded_mentions} off-brand posts filtered out`}
        />
        <KpiCard
          icon={<AlertTriangle className="size-3.5" />}
          label="Negative sentiment"
          value={<CountUp value={neg.pct} decimals={1} suffix="%" />}
          badge="raw feed said 51.2%"
          note={`${neg.count} of ${h.relevant_mentions} relevant mentions`}
          delay="delay-75"
        />
        <KpiCard
          icon={<AlertTriangle className="size-3.5" />}
          label="Top pain point"
          value={
            <span className="text-xl lg:text-2xl">{topicLabel(pain.topic)}</span>
          }
          note={`${pain.count} mentions, ${pain.pct_negative}% negative. Nothing else is close.`}
          delay="delay-150"
        />
        <KpiCard
          icon={<Swords className="size-3.5" />}
          label="Competitor threat"
          value={<span className="text-xl lg:text-2xl">{h.top_competitor.name}</span>}
          note={`${h.top_competitor.mentions} competitor posts in the feed`}
          delay="delay-225"
        />
      </section>

      <Card data-reveal className="py-4">
        <CardContent className="flex items-start gap-3 text-sm">
          <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
          <p className="text-muted-foreground">
            <strong className="text-foreground font-medium">
              These numbers are already filtered.
            </strong>{" "}
            The raw feed reads more positive than reality: it includes posts
            that never mention TakaPay and labels that contradict their own
            text. The{" "}
            <a href="#trust" className="text-foreground underline underline-offset-4">
              trust panel
            </a>{" "}
            has the full data-quality breakdown.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card id="sentiment" data-reveal className="scroll-mt-20 lg:col-span-2">
          <CardHeader>
            <CardTitle>Sentiment breakdown</CardTitle>
            <CardDescription>
              Across the {metrics.sentiment.clean_total} relevant mentions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <SentimentDonut
              split={metrics.sentiment.clean}
              total={metrics.sentiment.clean_total}
            />
          </CardContent>
          <CardFooter className="text-muted-foreground border-t text-xs [.border-t]:pt-4">
            <p>
              Negative is the majority sentiment. The unfiltered feed said
              only {metrics.headline.raw_negative_pct}%.{" "}
              <a href="#trust" className="text-foreground underline underline-offset-4">
                See why filtering raises it
              </a>
              .
            </p>
          </CardFooter>
        </Card>

        <Card id="topics" data-reveal className="scroll-mt-20 lg:col-span-3">
          <CardHeader>
            <CardTitle>What&rsquo;s driving the conversation</CardTitle>
            <CardDescription>
              Every relevant mention by topic, sorted by volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TopicBars topics={metrics.topics as Topic[]} />
          </CardContent>
          <CardFooter className="text-muted-foreground border-t text-xs [.border-t]:pt-4">
            <p>
              One topic, failed transactions, is a third of all relevant volume
              at {metrics.topics[0].pct_negative}% negative. Not every topic is
              a complaint, though:{" "}
              <strong className="text-foreground font-medium">agent network</strong> and{" "}
              <strong className="text-foreground font-medium">feature query</strong> are
              all neutral, because &ldquo;where&rsquo;s an agent&rdquo; and
              &ldquo;how do I&rdquo; questions aren&rsquo;t grievances.
            </p>
          </CardFooter>
        </Card>
      </div>

      <Card id="priority" data-reveal className="scroll-mt-20">
        <CardHeader>
          <CardTitle>Fix this first</CardTitle>
          <CardDescription>
            Operational topics ranked by negative mentions. The thing worth
            fixing first is at the top.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {pr.top_exceeds_rest && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm dark:border-red-950 dark:bg-red-950/30">
              <strong className="font-medium">
                One issue drives more negative conversation than everything
                else combined.
              </strong>{" "}
              <span className="text-muted-foreground">
                Failed transactions alone account for {pr.top_negative}{" "}
                negative mentions. The other {pr.topics.length - 1} fixable
                topics add up to {pr.rest_negative}.
              </span>
            </div>
          )}
          <PriorityBars topics={pr.topics as PriorityTopic[]} />
        </CardContent>
        <CardFooter className="text-muted-foreground border-t text-xs [.border-t]:pt-4">
          <p>
            <strong className="text-foreground font-medium">
              Competitor is deliberately absent
            </strong>{" "}
            from this list. What you fix and what you fight are different
            problems: NgoodPay chatter is competitive intelligence, not an
            operational bug to triage.{" "}
            <a href="#competitor" className="text-foreground underline underline-offset-4">
              See the competitor view →
            </a>
          </p>
        </CardFooter>
      </Card>

      <CompetitorView data={metrics.competitor as CompetitorData} />

      <TrustPanel data={metrics.trust_panel as TrustPanelData} />

      <MentionFeed mentions={metrics.mentions as Mention[]} />

      <Coverage
        language={metrics.language as LanguageData}
        platform={metrics.platform as PlatformData}
      />
    </div>
  );
}
