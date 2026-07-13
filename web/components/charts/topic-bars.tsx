"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { topicLabel } from "@/lib/topics";

export type Topic = {
  topic: string;
  total: number;
  negative: number;
  neutral: number;
  positive: number;
  pct_negative: number;
};

const chartConfig = {
  negative: { label: "Negative", color: "var(--sent-negative)" },
  neutral: { label: "Neutral", color: "var(--sent-neutral)" },
  positive: { label: "Positive", color: "var(--sent-positive)" },
} satisfies ChartConfig;

// Stacked lead-with-negative so the red mass aligns at the left edge and
// negativity is comparable across topics at a glance.
export function TopicBars({ topics }: { topics: Topic[] }) {
  const data = topics.map((t) => ({
    name: topicLabel(t.topic),
    negative: t.negative,
    neutral: t.neutral,
    positive: t.positive,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[430px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 40 }}
        barSize={18}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={130}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="negative" stackId="a" fill="var(--color-negative)" radius={2} />
        <Bar dataKey="neutral" stackId="a" fill="var(--color-neutral)" radius={2} />
        <Bar dataKey="positive" stackId="a" fill="var(--color-positive)" radius={2} />
      </BarChart>
    </ChartContainer>
  );
}
