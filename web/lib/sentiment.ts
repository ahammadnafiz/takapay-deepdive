export type Sentiment = "negative" | "neutral" | "positive";

// Sentiment is polarity, so it follows the diverging rule: a warm pole
// (negative red), a cool pole (positive teal), and a neutral gray midpoint.
// Validated on the light surface: worst adjacent CVD ΔE 13.1 (deutan),
// all marks ≥3:1 contrast. Neutral gray sits between the poles in every
// stack, so red and teal are never adjacent.
export const SENTIMENT: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: "Positive", color: "#0d9488" },
  neutral: { label: "Neutral", color: "#5c5f66" },
  negative: { label: "Negative", color: "#e5484d" },
};

// Familiar legend order (positive → negative).
export const LEGEND_ORDER: Sentiment[] = ["positive", "neutral", "negative"];

// Stacked bars lead with negative so the red mass aligns at the left edge and
// negativity is comparable across topics at a glance.
export const STACK_ORDER: Sentiment[] = ["negative", "neutral", "positive"];

export type Split = Record<Sentiment, { count: number; pct: number }>;
