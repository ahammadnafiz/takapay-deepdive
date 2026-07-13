"use client";

import { useEffect, useRef, useState } from "react";

// Animates a number from 0 to its final value on mount. Server-renders the
// final value (no-JS and SEO see the real number); with reduced motion the
// animation is skipped entirely.
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 850,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const raf = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? display.toFixed(decimals)
      : Math.round(display).toLocaleString();

  return (
    <span suppressHydrationWarning>
      {formatted}
      {suffix}
    </span>
  );
}
