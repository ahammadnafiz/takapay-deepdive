import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TakaPay — Social Listening",
  description:
    "What people are saying about TakaPay, June 2026 — sentiment, drivers, and data you can trust.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
