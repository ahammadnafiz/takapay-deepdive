"use client";

import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  pct: { label: "% negative", color: "var(--sent-negative)" },
} satisfies ChartConfig;

// The audited stage is a shadow number (plausible worst case, never a
// headline) — rendered hollow so it can't be read as a reported figure.
export function TrustArc({
  raw,
  clean,
  audited,
}: {
  raw: number;
  clean: number;
  audited: number;
}) {
  const data = [
    { stage: "Raw feed (n=660)", pct: raw, shadow: false },
    { stage: "Relevance-filtered (n=590)", pct: clean, shadow: false },
    { stage: "Label-audited (shadow)", pct: audited, shadow: true },
  ];

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[240px] w-full"
    >
      <BarChart
        accessibilityLayer
        data={data}
        margin={{ top: 24 }}
        barSize={64}
      >
        <XAxis
          dataKey="stage"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis hide domain={[0, 70]} />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel={false} />}
        />
        <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell
              key={d.stage}
              fill="var(--color-pct)"
              fillOpacity={d.shadow ? 0.18 : 1}
              stroke={d.shadow ? "var(--color-pct)" : undefined}
              strokeWidth={d.shadow ? 1.5 : 0}
              strokeDasharray={d.shadow ? "5 4" : undefined}
            />
          ))}
          <LabelList
            dataKey="pct"
            position="top"
            offset={8}
            className="fill-foreground font-semibold tabular-nums"
            fontSize={13}
            formatter={(v) => `${v}%`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
