import type { ReactNode } from "react";
import {
  BrandMark,
  OverviewIcon,
  SentimentIcon,
  TopicIcon,
  BookIcon,
} from "./icons";

type NavItem = {
  label: string;
  icon: ReactNode;
  href?: string;
  current?: boolean;
};

// Sections grow as tickets land. Items without an href render as "coming"
// placeholders so the information architecture is visible without pretending
// to link somewhere that doesn't exist yet.
const NAV: NavItem[] = [
  { label: "Overview", icon: <OverviewIcon />, href: "#overview", current: true },
  { label: "Sentiment", icon: <SentimentIcon /> },
  { label: "Topics", icon: <TopicIcon /> },
];

const REPO_URL = "https://github.com/ahammadnafiz/takapay-deepdive";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark">
          <BrandMark />
        </span>
        <span className="brand-name">DeepDive</span>
      </div>

      <nav className="nav" aria-label="Sections">
        <div className="nav-eyebrow">TakaPay · June 2026</div>
        {NAV.map((item) =>
          item.href ? (
            <a
              key={item.label}
              className="nav-item"
              href={item.href}
              aria-current={item.current ? "true" : undefined}
            >
              {item.icon}
              {item.label}
            </a>
          ) : (
            <span key={item.label} className="nav-item" aria-disabled="true">
              {item.icon}
              {item.label}
            </span>
          )
        )}
      </nav>

      <div className="sidebar-spacer" />

      <a className="side-cta" href={REPO_URL} target="_blank" rel="noreferrer">
        How this was built
        <BookIcon />
      </a>
    </aside>
  );
}
