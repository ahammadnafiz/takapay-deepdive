"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  Globe,
  LayoutGrid,
  ListOrdered,
  MessagesSquare,
  PieChart,
  ShieldCheck,
  Swords,
  Target,
  Waves,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const NAV = [
  { label: "Overview", icon: LayoutGrid, id: "overview" },
  { label: "Sentiment", icon: PieChart, id: "sentiment" },
  { label: "Topics", icon: ListOrdered, id: "topics" },
  { label: "Fix this first", icon: Target, id: "priority" },
  { label: "Competitor", icon: Swords, id: "competitor" },
  { label: "Trust panel", icon: ShieldCheck, id: "trust" },
  { label: "Explore mentions", icon: MessagesSquare, id: "feed" },
  { label: "Coverage & reach", icon: Globe, id: "context" },
];

const SECTION_IDS = NAV.map((item) => item.id);

const REPO_URL = "https://github.com/ahammadnafiz/takapay-deepdive";

export function AppSidebar() {
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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#overview">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Waves className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">DeepDive</span>
                  <span className="text-muted-foreground truncate text-xs">
                    TakaPay · June 2026
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Report</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeId === item.id}
                    tooltip={item.label}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={() => setActiveId(item.id)}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="How this was built">
              <a href={REPO_URL} target="_blank" rel="noreferrer">
                <BookOpen />
                <span>How this was built</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
