import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CalendarRange } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { ScrollFx } from "@/components/ScrollFx";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TakaPay · DeepDive Social Listening",
  description:
    "What people are saying about TakaPay, June 2026: sentiment, drivers, and data you can trust.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} font-sans`}>
      <body>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
          <SidebarInset>
            <header className="bg-background/90 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-sm">
              <div className="flex w-full items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-1 data-[orientation=vertical]:h-4"
                />
                <span className="text-sm font-medium">
                  TakaPay · Social Listening
                </span>
                <Badge variant="outline" className="ml-auto gap-1.5 tabular-nums">
                  <CalendarRange className="size-3.5" />
                  Jun 1 – Jun 30, 2026
                </Badge>
              </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
              {children}
            </main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
        <ScrollFx />
      </body>
    </html>
  );
}
