import { SENTIMENT } from "@/lib/sentiment";
import { topicLabel } from "@/lib/topics";

type PriorityTopic = {
  topic: string;
  negative: number;
  total: number;
  pct_negative: number;
};

export type PriorityRankingData = {
  topics: PriorityTopic[];
  top_negative: number;
  rest_negative: number;
  top_exceeds_rest: boolean;
};

// Bars are sized by negative-mention count — the axis the list is ranked on —
// so the #1 issue reads as visually dominant, not just first. All bars are the
// negative colour because every value here is a count of complaints.
export function PriorityRanking({ topics }: { topics: PriorityTopic[] }) {
  const max = topics[0].negative;

  return (
    <ol className="prank">
      {topics.map((t, i) => (
        <li className="prank-row" key={t.topic}>
          <span className="prank-rank" aria-hidden>
            {i + 1}
          </span>
          <span className="prank-name" title={topicLabel(t.topic)}>
            {topicLabel(t.topic)}
          </span>
          <div className="prank-track">
            <div
              className="prank-fill"
              style={{
                width: `${(t.negative / max) * 100}%`,
                background: SENTIMENT.negative.color,
              }}
            />
          </div>
          <span className="prank-count">
            <strong>{t.negative}</strong> negative
            <span className="prank-context">
              {" "}
              · {t.pct_negative}% of {t.total}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
