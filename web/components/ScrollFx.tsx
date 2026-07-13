"use client";

import { useEffect } from "react";

// Adds .is-in to every [data-reveal] element as it enters the viewport.
// The hidden initial state lives in CSS behind @media (scripting: enabled)
// and (prefers-reduced-motion: no-preference), so without JS or with reduced
// motion nothing is ever hidden — this observer only ever reveals.
export function ScrollFx() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll("[data-reveal]"));
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
