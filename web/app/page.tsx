import metrics from "@/lib/metrics.json";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { SentimentDonut } from "@/components/charts/sentiment-donut";
import { TopicBars, type Topic } from "@/components/charts/topic-bars";
import {
  PriorityBars,
  type PriorityTopic,
} from "@/components/charts/priority-bars";
import { CompetitorView, type CompetitorData } from "@/components/competitor-view";
import { TrustPanel, type TrustPanelData } from "@/components/trust-panel";
import { MentionFeed, type Mention } from "@/components/mention-feed";
import { Situation } from "@/components/situation";
import { Coverage, type LanguageData, type PlatformData } from "@/components/coverage";

export default function Home() {
  const pr = metrics.priority_ranking;

  return (
    <>
    <Situation />
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card id="sentiment" data-reveal className="scroll-mt-20 lg:col-span-2">
          <CardHeader>
            <h2
              data-slot="card-title"
              className="font-heading text-base leading-snug font-medium"
            >
              Sentiment breakdown
            </h2>
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
              <a href="#trust" className="text-brand underline underline-offset-4">
                See why filtering raises it
              </a>
              .
            </p>
          </CardFooter>
        </Card>

        <Card id="topics" data-reveal className="scroll-mt-20 lg:col-span-3">
          <CardHeader>
            <h2
              data-slot="card-title"
              className="font-heading text-base leading-snug font-medium"
            >
              What&rsquo;s driving the conversation
            </h2>
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
          <h2
            data-slot="card-title"
            className="font-heading text-base leading-snug font-medium"
          >
            Fix this first
          </h2>
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
            <a href="#competitor" className="text-brand underline underline-offset-4">
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
    </>
  );
}
