"use client";

import { useState } from "react";
import type { ProductPublic } from "@/lib/types";
import { ProductCard } from "./ProductCard";

/**
 * A continuously sliding row of products. Pauses on hover, touch and keyboard
 * focus, has a visible pause button (moving content must be stoppable), and
 * becomes a normal swipeable row when the device asks for reduced motion.
 */
export function AutoMarquee({ products, label, secondsPerItem = 3.2 }: { products: ProductPublic[]; label: string; secondsPerItem?: number }) {
  const [paused, setPaused] = useState(false);
  if (!products.length) return null;
  const loop = [...products, ...products];
  return (
    <div>
      <div
        className="marquee no-scrollbar -mx-4 overflow-hidden px-4 pb-1"
        data-paused={paused || undefined}
        role="region"
        aria-label={label}
      >
        <ul className="marquee-track flex w-max gap-2.5" style={{ animationDuration: `${products.length * secondsPerItem}s` }}>
          {loop.map((p, i) => (
            <li key={`${p.id}-${i}`} className="w-[44vw] max-w-[220px] shrink-0 sm:w-[30vw] md:w-[200px]" aria-hidden={i >= products.length || undefined} inert={i >= products.length || undefined}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </div>
      <div className="marquee-toggle mt-1 flex justify-end">
        <button
          type="button"
          onClick={() => setPaused((x) => !x)}
          aria-pressed={paused}
          className="flex h-8 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold ring-1 ring-line"
        >
          {paused ? "▶ Play slides" : "❚❚ Pause slides"}
        </button>
      </div>
    </div>
  );
}
