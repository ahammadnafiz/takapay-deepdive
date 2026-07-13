"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { topicLabel } from "@/lib/topics";

export type PriorityTopic = {
  topic: string;
  negative: number;
  total: number;
  pct_negative: number;
};

const chartConfig = {
  negative: { label: "Negative mentions", color: "var(--sent-negative)" },
} satisfies ChartConfig;

// Bars are sized by negative-mention count — the axis the list is ranked
// on — so the #1 issue reads as visually dominant, not just first.
export function PriorityBars({ topics }: { topics: PriorityTopic[] }) {
  const data = topics.map((t, i) => ({
    name: `${i + 1}. ${topicLabel(t.topic)}`,
    negative: t.negative,
    share: `${t.pct_negative}% of ${t.total}`,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[320px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 44 }}
        barSize={18}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label, payload) =>
                `${label} · ${payload?.[0]?.payload.share}`
              }
            />
          }
        />
        <Bar dataKey="negative" fill="var(--color-negative)" radius={4}>
          <LabelList
            dataKey="negative"
            position="right"
            offset={8}
            className="fill-foreground font-medium tabular-nums"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
