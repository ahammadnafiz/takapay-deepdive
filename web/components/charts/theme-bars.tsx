"use client";

import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  count: { label: "Comparison posts", color: "var(--brand)" },
} satisfies ChartConfig;

// Competitor comparison themes in the single UI accent: counts of one
// series, not categories competing for identity, and not a sentiment color.
export function ThemeBars({
  themes,
}: {
  themes: { key: string; label: string; count: number; example: string }[];
}) {
  const data = themes.map((t) => ({ name: t.label, count: t.count }));

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[220px] w-full"
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
          width={140}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4}>
          <LabelList
            dataKey="count"
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
