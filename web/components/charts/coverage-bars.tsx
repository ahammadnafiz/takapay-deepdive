"use client";

import {
  Bar,
  BarChart,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const volumeConfig = {
  count: { label: "Posts", color: "var(--brand)" },
} satisfies ChartConfig;

// Shared horizontal volume bars (language coverage, platform volume) in the
// single UI accent: one magnitude series, not competing categories, and
// deliberately not a sentiment color.
export function VolumeBars({
  rows,
  height = 160,
}: {
  rows: { name: string; count: number; pct: number }[];
  height?: number;
}) {
  const data = rows.map((r) => ({ ...r, label: `${r.count} · ${r.pct}%` }));

  return (
    <ChartContainer
      config={volumeConfig}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 96 }}
        barSize={16}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={86}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4}>
          <LabelList
            dataKey="label"
            position="right"
            offset={8}
            className="fill-muted-foreground tabular-nums"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const negativityConfig = {
  pct_negative: { label: "% negative", color: "var(--sent-negative)" },
} satisfies ChartConfig;

// %-negative per platform on a fixed 0-100 scale with the overall reference
// line, so "the band is flat - platform doesn't explain sentiment" is visible.
export function NegativityBars({
  rows,
  reference,
  height = 220,
}: {
  rows: { name: string; pct_negative: number }[];
  reference: number;
  height?: number;
}) {
  return (
    <ChartContainer
      config={negativityConfig}
      className="aspect-auto w-full"
      style={{ height }}
    >
      <BarChart
        accessibilityLayer
        data={rows}
        layout="vertical"
        margin={{ top: 18, left: 8, right: 44 }}
        barSize={14}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={86}
          tickLine={false}
          axisLine={false}
          tickMargin={6}
        />
        <ChartTooltip content={<ChartTooltipContent hideLabel={false} />} />
        <Bar
          dataKey="pct_negative"
          fill="var(--color-pct_negative)"
          fillOpacity={0.55}
          radius={4}
        >
          <LabelList
            dataKey="pct_negative"
            position="right"
            offset={8}
            className="fill-muted-foreground tabular-nums"
            fontSize={12}
            formatter={(v) => `${v}%`}
          />
        </Bar>
        <ReferenceLine
          x={reference}
          stroke="var(--muted-foreground)"
          strokeDasharray="4 4"
          label={{
            value: `${reference}% avg`,
            position: "top",
            fill: "var(--muted-foreground)",
            fontSize: 11,
          }}
        />
      </BarChart>
    </ChartContainer>
  );
}
