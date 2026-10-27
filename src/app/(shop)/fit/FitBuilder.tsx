"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { ProductPublic } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { toast, useStore } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { IconChevron } from "@/components/Icons";

type Slot = { key: string; label: string; optional: boolean; pick: (p: ProductPublic) => boolean; gendered: boolean };
const SLOTS: Slot[] = [
  { key: "top", label: "Top or dress", optional: false, gendered: true, pick: (p) => ["T-Shirts", "Shirts", "Tops", "Sweatshirts", "Ethnic Wear", "Dresses", "Co-ords"].includes(p.subcategory) },
  { key: "bottom", label: "Bottom", optional: true, gendered: true, pick: (p) => ["Jeans", "Trousers", "Skirts"].includes(p.subcategory) },
  { key: "shoes", label: "Footwear", optional: false, gendered: false, pick: (p) => p.category === "footwear" },
  { key: "extra", label: "Bag or accessory", optional: true, gendered: false, pick: (p) => ["bags", "jewellery", "accessories"].includes(p.category) },
];
const GAP = 12;

/** Krip Lab · Build a Fit — swipe each row to style a full look. */
export function FitBuilder({ products }: { products: ProductPublic[] }) {
  const [who, setWho] = useState<"all" | "women" | "men">("all");
  const [idx, setIdx] = useState<Record<string, number>>({});
  const rows = useRef<Record<string, HTMLUListElement | null>>({});
  const setInList = useStore((s) => s.setInList);

  const items = useMemo(
    () => Object.fromEntries(SLOTS.map((s) => [s.key, products.filter((p) => s.pick(p) && (who === "all" || !s.gendered || p.category === who))])),
    [products, who],
  );
  const chosen = SLOTS.map((s) => {
    const i = idx[s.key] ?? 0;
    if (s.optional && i === 0) return null;
    return items[s.key][i - (s.optional ? 1 : 0)] ?? null;
  }).filter((p): p is ProductPublic => !!p);
  const total = chosen.reduce((n, p) => n + p.price, 0);

  const scrollTo = (key: string, i: number) => {
    const row = rows.current[key];
    const cell = row?.querySelector("li");
    if (!row || !cell) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: i * (cell.getBoundingClientRect().width + GAP), behavior: reduce ? "auto" : "smooth" });
  };
  const count = (s: Slot) => items[s.key].length + (s.optional ? 1 : 0);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-2">
      <div className="lab-hero relative overflow-hidden rounded-3xl p-5 text-white">
        <span className="aurora-blob a1" aria-hidden />
        <span className="aurora-blob a2" aria-hidden />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-sun">Krip Lab · Build a Fit</p>
        <h1 className="relative text-2xl font-bold leading-tight">Swipe each row to style a full look</h1>
        <p className="relative mt-1 text-sm text-white/80">Every piece is in stock. Prices add up live.</p>
        <div className="relative mt-3 flex flex-wrap gap-2">
          {(["all", "women", "men"] as const).map((w) => (
            <button key={w} type="button" aria-pressed={who === w} onClick={() => { setWho(w); setIdx({}); Object.values(rows.current).forEach((r) => r?.scrollTo({ left: 0 })); }}
              className={`h-9 rounded-full px-4 text-sm font-semibold ${who === w ? "bg-sun text-ink" : "bg-white/15 text-white ring-1 ring-white/30"}`}>
              {w === "all" ? "Everyone" : w === "women" ? "Women" : "Men"}
            </button>
          ))}
          <button type="button" onClick={() => SLOTS.forEach((s, k) => { const i = Math.floor(Math.random() * count(s)); setTimeout(() => scrollTo(s.key, i), k * 120); })}
            className="h-9 rounded-full bg-white px-4 text-sm font-bold text-ink">
            🎲 Surprise me
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {SLOTS.map((s) => (
          <section key={s.key} aria-label={s.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{s.label}{s.optional && <span className="font-normal text-ink-soft"> · optional</span>}</h2>
              <div className="flex gap-1">
                {[-1, 1].map((d) => (
                  <button key={d} type="button" aria-label={`${d < 0 ? "Previous" : "Next"} ${s.label}`} onClick={() => scrollTo(s.key, ((idx[s.key] ?? 0) + d + count(s)) % count(s))}
                    className="grid h-9 w-9 place-items-center rounded-full bg-white ring-1 ring-line">
                    <IconChevron size={16} dir={d < 0 ? "left" : "right"} />
                  </button>
                ))}
              </div>
            </div>
            <ul
              ref={(el) => { rows.current[s.key] = el; }}
              onScroll={(e) => {
                const el = e.currentTarget;
                const w = (el.querySelector("li")?.getBoundingClientRect().width ?? 160) + GAP;
                const i = Math.round(el.scrollLeft / w);
                if (i !== (idx[s.key] ?? 0)) setIdx((x) => ({ ...x, [s.key]: i }));
              }}
              className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1"
            >
              {s.optional && (
                <li className="w-[42%] max-w-[180px] shrink-0 snap-start">
                  <div className="grid aspect-[4/5] place-items-center rounded-2xl border-2 border-dashed border-line bg-white text-sm text-ink-soft">Skip this</div>
                </li>
              )}
              {items[s.key].map((p) => (
                <li key={p.id} className="w-[42%] max-w-[180px] shrink-0 snap-start">
                  <Link href={`/product/${p.slug}`} className="block overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                    <span className="relative block aspect-[4/5]"><ProductImage src={p.images[0]} alt="" sizes="180px" /></span>
                    <span className="block p-2"><span className="line-clamp-1 text-xs font-medium">{p.title}</span><span className="text-sm font-bold">{formatPrice(p.price)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="sticky z-20 mt-4 flex items-center gap-3 rounded-2xl bg-ink p-3 text-white shadow-xl" style={{ bottom: "calc(72px + var(--safe-bottom))" }}>
        <div className="flex-1" aria-live="polite">
          <p className="text-xs text-white/70">{chosen.length} pieces · individual prices added up</p>
          <p className="text-xl font-bold">{formatPrice(total)}</p>
        </div>
        <button type="button" onClick={() => { chosen.forEach((p) => setInList("saved", p.id, true)); toast({ message: `Saved ${chosen.length} pieces to your wishlist`, action: { label: "View", href: "/wishlist" } }); }}
          className="h-11 rounded-xl bg-sun px-4 text-sm font-bold text-ink">
          Save fit ♥
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-ink-soft">Tap any piece to pick a size and add it to your bag.</p>
    </div>
  );
}
