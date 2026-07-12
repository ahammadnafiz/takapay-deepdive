import { SENTIMENT, LEGEND_ORDER, type Split } from "@/lib/sentiment";

const SIZE = 190;
const STROKE = 24;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 3; // px of surface between arcs

export function SentimentDonut({ split, total }: { split: Split; total: number }) {
  // Draw largest-to-smallest visual weight: negative dominates this dataset.
  const drawOrder = ["negative", "neutral", "positive"] as const;
  let acc = 0;
  const arcs = drawOrder.map((key) => {
    const seg = split[key];
    const len = (seg.pct / 100) * C;
    const dash = Math.max(len - GAP, 0);
    const arc = {
      key,
      color: SENTIMENT[key].color,
      label: SENTIMENT[key].label,
      pct: seg.pct,
      count: seg.count,
      dash,
      offset: -acc,
    };
    acc += len;
    return arc;
  });

  return (
    <div className="donut-body">
      <div className="donut" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img"
          aria-label={`Sentiment: ${split.negative.pct}% negative, ${split.neutral.pct}% neutral, ${split.positive.pct}% positive`}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map((a) => (
              <circle
                key={a.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth={STROKE}
                strokeDasharray={`${a.dash} ${C - a.dash}`}
                strokeDashoffset={a.offset}
              >
                <title>{`${a.label}: ${a.pct}% (${a.count})`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="donut-center">
          <span className="big">{split.negative.pct}%</span>
          <span className="small">negative</span>
        </div>
      </div>

      <div className="donut-legend">
        {LEGEND_ORDER.map((key) => (
          <div className="row" key={key}>
            <span className="swatch" style={{ background: SENTIMENT[key].color }} aria-hidden />
            <span className="name">{SENTIMENT[key].label}</span>
            <span className="val">{split[key].pct}%</span>
            <span className="sub">{split[key].count.toLocaleString()} of {total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
