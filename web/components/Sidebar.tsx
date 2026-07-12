"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BrandMark,
  OverviewIcon,
  SentimentIcon,
  TopicIcon,
  TargetIcon,
  SwordsIcon,
  ShieldIcon,
  BookIcon,
} from "./icons";

type NavItem = {
  label: string;
  icon: ReactNode;
  href?: string;
};

// Sections grow as tickets land. Items without an href render as "coming"
// placeholders so the information architecture is visible without pretending
// to link somewhere that doesn't exist yet.
const NAV: NavItem[] = [
  { label: "Overview", icon: <OverviewIcon />, href: "#overview" },
  { label: "Sentiment", icon: <SentimentIcon />, href: "#sentiment" },
  { label: "Topics", icon: <TopicIcon />, href: "#topics" },
  { label: "Fix this first", icon: <TargetIcon />, href: "#priority" },
  { label: "Competitor", icon: <SwordsIcon />, href: "#competitor" },
  { label: "Trust panel", icon: <ShieldIcon />, href: "#trust" },
];

const SECTION_IDS = NAV.filter((item) => item.href).map((item) =>
  item.href!.slice(1)
);

const REPO_URL = "https://github.com/ahammadnafiz/takapay-deepdive";

export function Sidebar() {
  const [activeId, setActiveId] = useState(SECTION_IDS[0]);
  const visibleRatios = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visibleRatios.current.set(entry.target.id, entry.intersectionRatio);
        }
        let topId = SECTION_IDS[0];
        let topRatio = 0;
        for (const id of SECTION_IDS) {
          const ratio = visibleRatios.current.get(id) ?? 0;
          if (ratio > topRatio) {
            topRatio = ratio;
            topId = id;
          }
        }
        if (topRatio > 0) setActiveId(topId);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

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
              aria-current={activeId === item.href.slice(1) ? "true" : undefined}
              onClick={() => setActiveId(item.href!.slice(1))}
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
