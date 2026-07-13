import { Swords } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeBars } from "@/components/charts/theme-bars";
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
  const agent = comparison.themes.find((t) => t.key === "agent_network");
  const fees = comparison.themes.find((t) => t.key === "fees_charges");
  const xref = comparison.fees_cross_ref;

  return (
    <Card id="competitor" data-reveal className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="text-muted-foreground size-4" />
          Competitor: {name}
        </CardTitle>
        <CardDescription>
          Two separate questions, kept apart on purpose: how people compare us
          to {name}, and what {name} is doing on its own. Mixing them would
          answer neither.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Signal 1 — comparison posts (they name TakaPay; 100% negative). */}
        <div className="rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-sm font-semibold">
              {comparison.count} comparison posts
            </h3>
            <Badge
              variant="outline"
              className="border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-400"
            >
              {comparison.pct_negative}% negative
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1.5 text-sm">
            Every one of them names TakaPay in an unfavorable comparison. Each
            theme below is something {name} gets praised for at our expense.
          </p>

          <div className="mt-4">
            <ThemeBars
              themes={comparison.themes.map((t) => ({
                key: t.key,
                label: THEME_LABELS[t.key] ?? t.key,
                count: t.count,
                example: t.example,
              }))}
            />
          </div>

          <div className="bg-muted/60 mt-4 rounded-lg border-l-2 p-3 text-sm">
            <strong className="font-medium">
              Fees are a weapon that cuts both ways.
            </strong>{" "}
            <span className="text-muted-foreground">
              The {fees?.count} posts citing {name}&rsquo;s lower charges
              cross-reference our own{" "}
              <a
                href="#topics"
                className="text-foreground underline underline-offset-4"
              >
                {topicLabel(xref.topic)}
              </a>{" "}
              topic, where {xref.count} internal complaints run{" "}
              {xref.pct_negative}% negative. Customers complain about our fees{" "}
              <em>and</em> cite them when they leave.
            </span>
          </div>

          {agent?.neighborhoods && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground mr-1 text-xs">
                Agent-gap neighborhoods named:
              </span>
              {agent.neighborhoods.map((hood) => (
                <Badge key={hood} variant="secondary" className="font-normal">
                  {hood}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Signal 2 — competitor-only posts, deliberately NOT brand sentiment. */}
        <div className="bg-muted/40 rounded-xl border border-dashed p-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-sm font-semibold">
              {promo.count} competitor-only posts
            </h3>
            <Badge variant="secondary">competitive activity</Badge>
          </div>
          <p className="text-muted-foreground mt-1.5 text-sm">
            {name}&rsquo;s own cashback promos, like{" "}
            <span className="italic">&ldquo;{promo.example}&rdquo;</span> These
            never mention TakaPay, so they are{" "}
            <strong className="text-foreground font-medium">
              not counted in brand sentiment
            </strong>
            . They answer &ldquo;what is {name} doing?&rdquo; rather than
            &ldquo;how do people feel about us?&rdquo;, and that question
            belongs to a different owner.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
