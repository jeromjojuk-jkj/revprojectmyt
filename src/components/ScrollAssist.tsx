"use client";

import { useEffect, useState } from "react";
import { IconChevron } from "./Icons";

/**
 * - A thin progress line under the header showing how far down the page you are.
 * - A floating "back to top" button after you've scrolled a while.
 * - "/" or Ctrl/⌘+K jumps to the search box from anywhere.
 */
export function ScrollAssist() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
        setShowTop(window.scrollY > 1200);
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing = t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        const box = document.querySelector<HTMLInputElement>('input[aria-label="Search Krip"]');
        if (box) {
          e.preventDefault();
          box.focus();
          box.select();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 z-40 h-[3px] origin-left bg-gradient-to-r from-sun via-sun to-leaf"
        style={{ top: "var(--header-h)", transform: `scaleX(${progress})`, opacity: progress > 0.01 ? 1 : 0 }}
      />
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        aria-label="Scroll to top"
        tabIndex={showTop ? 0 : -1}
        className={`fab-top fixed right-4 z-30 grid h-12 w-12 place-items-center rounded-full bg-ink text-sun shadow-lg ring-2 ring-sun/60 transition-all duration-200 ${showTop ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        style={{ bottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + 92px)" }}
      >
        <IconChevron dir="up" size={22} />
      </button>
    </>
  );
}
