export type Sentiment = "negative" | "neutral" | "positive";

// Chart marks use the deeper teal (#0d9488) so positive clears 3:1 contrast on
// the light surface; the categorical set [teal, purple, red] is CVD-validated
// (worst adjacent ΔE 74). Negative is red, not DeepDive's cyan, so charts about
// negativity don't visually downplay it.
export const SENTIMENT: Record<Sentiment, { label: string; color: string }> = {
  positive: { label: "Positive", color: "#0d9488" },
  neutral: { label: "Neutral", color: "#7c3aed" },
  negative: { label: "Negative", color: "#ef4444" },
};

// Familiar legend order (positive → negative).
export const LEGEND_ORDER: Sentiment[] = ["positive", "neutral", "negative"];

// Stacked bars lead with negative so the red mass aligns at the left edge and
// negativity is comparable across topics at a glance.
export const STACK_ORDER: Sentiment[] = ["negative", "neutral", "positive"];

export type Split = Record<Sentiment, { count: number; pct: number }>;
