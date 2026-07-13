"use client";

import { Label, Pie, PieChart } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { SENTIMENT, LEGEND_ORDER, type Split } from "@/lib/sentiment";

const chartConfig = {
  count: { label: "Mentions" },
  negative: { label: "Negative", color: "var(--sent-negative)" },
  neutral: { label: "Neutral", color: "var(--sent-neutral)" },
  positive: { label: "Positive", color: "var(--sent-positive)" },
} satisfies ChartConfig;

export function SentimentDonut({ split, total }: { split: Split; total: number }) {
  const data = (["negative", "neutral", "positive"] as const).map((key) => ({
    sentiment: key,
    count: split[key].count,
    fill: `var(--color-${key})`,
  }));

  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <ChartContainer
        config={chartConfig}
        className="aspect-square w-[230px] shrink-0"
      >
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent nameKey="sentiment" hideLabel />}
          />
          <Pie
            data={data}
            dataKey="count"
            nameKey="sentiment"
            innerRadius={64}
            strokeWidth={5}
            paddingAngle={2}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-2xl font-semibold tabular-nums"
                      >
                        {split.negative.pct}%
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 22}
                        className="fill-muted-foreground text-xs"
                      >
                        negative
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="flex flex-col gap-3">
        {LEGEND_ORDER.map((key) => (
          <div className="flex items-center gap-2.5 text-sm" key={key}>
            <span
              className="size-2.5 shrink-0 rounded-[3px]"
              style={{ background: SENTIMENT[key].color }}
              aria-hidden
            />
            <span className="w-16 text-muted-foreground">
              {SENTIMENT[key].label}
            </span>
            <span className="w-14 font-semibold tabular-nums">
              {split[key].pct}%
            </span>
            <span className="text-muted-foreground text-xs tabular-nums">
              {split[key].count.toLocaleString()} of {total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
