import type { ReactNode } from "react";

export function Card({
  id,
  title,
  subtitle,
  legend,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  legend?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="card section">
      <div className="card-head">
        <div>
          <h2 className="card-title">{title}</h2>
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        {legend}
      </div>
      {children}
    </section>
  );
}

export function Legend({
  items,
}: {
  items: { label: string; color: string }[];
}) {
  return (
    <div className="legend">
      {items.map((it) => (
        <span key={it.label} className="legend-item">
          <span className="legend-dot" style={{ background: it.color }} aria-hidden />
          {it.label}
        </span>
      ))}
    </div>
  );
}
