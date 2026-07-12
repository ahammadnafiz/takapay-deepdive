import { SENTIMENT, STACK_ORDER, type Sentiment } from "@/lib/sentiment";
import { topicLabel } from "@/lib/topics";

type Topic = {
  topic: string;
  total: number;
  negative: number;
  neutral: number;
  positive: number;
  pct_negative: number;
};

export function TopicBars({ topics }: { topics: Topic[] }) {
  const max = Math.max(...topics.map((t) => t.total));

  return (
    <div className="tbars">
      {topics.map((t) => (
        <div className="tbar" key={t.topic}>
          <span className="tbar-name" title={topicLabel(t.topic)}>
            {topicLabel(t.topic)}
          </span>
          <div className="tbar-track">
            <div className="tbar-fill" style={{ width: `${(t.total / max) * 100}%` }}>
              {STACK_ORDER.map((key: Sentiment) => {
                const count = t[key];
                if (count === 0) return null;
                return (
                  <span
                    key={key}
                    className="tbar-seg"
                    style={{ flexGrow: count, background: SENTIMENT[key].color }}
                    title={`${SENTIMENT[key].label}: ${count}`}
                  />
                );
              })}
            </div>
          </div>
          <span className="tbar-total">{t.total}</span>
        </div>
      ))}
    </div>
  );
}
