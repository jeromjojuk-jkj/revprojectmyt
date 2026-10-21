"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CategoryId, ProductPublic } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { useHydrated, useStore } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { Price } from "@/components/Price";
import { IconHeart, IconX, IconEye } from "@/components/Icons";

type Verdict = "save" | "skip";

/**
 * Style Swipe: swipe right to save to the wishlist, left to skip.
 * Saves go to the normal wishlist on this device; nothing is sent anywhere.
 */
export function StyleSwipe({ products }: { products: ProductPublic[] }) {
  const hydrated = useHydrated();
  const setInList = useStore((s) => s.setInList);
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const deck = useMemo(() => {
    // Deterministic shuffle so server and client agree.
    const list = products.filter((p) => cat === "all" || p.category === cat);
    return [...list].sort((a, b) => (a.id.charCodeAt(2) * 7 + a.id.charCodeAt(3)) % 11 - (b.id.charCodeAt(2) * 7 + b.id.charCodeAt(3)) % 11);
  }, [products, cat]);
  const [index, setIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<Verdict | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setIndex(0);
    setSaved([]);
  }, [cat]);

  const current = deck[index];
  const next = deck[index + 1];

  const decide = (v: Verdict) => {
    if (!current || leaving) return;
    if (v === "save") {
      setInList("saved", current.id, true);
      setSaved((s) => [...s, current.id]);
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setLeaving(v);
    setTimeout(() => {
      setLeaving(null);
      setDrag({ x: 0, y: 0, active: false });
      setIndex((i) => i + 1);
    }, reduce ? 0 : 220);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") decide("save");
      if (e.key === "ArrowLeft") decide("skip");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dx = leaving === "save" ? 520 : leaving === "skip" ? -520 : drag.x;
  const rot = dx / 18;
  const hint = dx > 40 ? "save" : dx < -40 ? "skip" : null;

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">New on Krip</p>
      <h1 className="text-xl font-semibold">Style Swipe</h1>
      <p className="text-sm text-ink-soft">Swipe right to save, left to skip. Saves go to your wishlist on this device.</p>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="radiogroup" aria-label="Category">
        {[{ id: "all" as const, short: "Everything" }, ...CATEGORIES].map((c) => (
          <button key={c.id} type="button" role="radio" aria-checked={cat === c.id} onClick={() => setCat(c.id)}
            className={`flex min-h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium ring-1 ${cat === c.id ? "bg-ink text-white ring-ink" : "bg-white ring-line"}`}>
            {c.short}
          </button>
        ))}
      </div>

      <div className="relative mt-4 aspect-[4/5] w-full select-none">
        {!current ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl bg-white p-6 text-center ring-1 ring-line">
            <p className="text-lg font-semibold">That’s the whole deck</p>
            <p className="text-sm text-ink-soft">You saved {saved.length} {saved.length === 1 ? "style" : "styles"} this round.</p>
            <div className="flex gap-2">
              <Link href="/wishlist" className="flex h-12 items-center rounded-xl bg-leaf px-5 font-semibold text-white">Open wishlist</Link>
              <button type="button" onClick={() => { setIndex(0); setSaved([]); }} className="h-12 rounded-xl px-5 font-semibold text-leaf ring-2 ring-leaf">Swipe again</button>
            </div>
          </div>
        ) : (
          <>
            {next && (
              <div className="absolute inset-0 scale-[0.95] overflow-hidden rounded-3xl bg-white opacity-80 ring-1 ring-line" aria-hidden>
                <ProductImage src={next.images[0]} alt="" sizes="400px" />
              </div>
            )}
            <div
              className="absolute inset-0 touch-none overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-line"
              style={{
                transform: `translate(${dx}px, ${drag.y * 0.2}px) rotate(${rot}deg)`,
                transition: drag.active ? "none" : "transform 220ms cubic-bezier(.2,.8,.2,1)",
              }}
              onPointerDown={(e) => {
                start.current = { x: e.clientX, y: e.clientY };
                setDrag({ x: 0, y: 0, active: true });
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (!start.current) return;
                setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
              }}
              onPointerUp={() => {
                start.current = null;
                if (drag.x > 90) decide("save");
                else if (drag.x < -90) decide("skip");
                else setDrag({ x: 0, y: 0, active: false });
              }}
              onPointerCancel={() => {
                start.current = null;
                setDrag({ x: 0, y: 0, active: false });
              }}
            >
              <ProductImage src={current.images[0]} alt={current.title} sizes="400px" priority />
              {hint && (
                <span className={`absolute top-6 rounded-xl border-4 px-3 py-1 text-2xl font-black uppercase ${hint === "save" ? "left-6 -rotate-12 border-leaf text-leaf" : "right-6 rotate-12 border-danger text-danger"}`} aria-hidden>
                  {hint === "save" ? "Save" : "Skip"}
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent p-4 pt-16 text-white">
                <p className="text-xs uppercase tracking-wide text-white/80">{current.brand}</p>
                <p className="text-lg font-semibold leading-snug">{current.title}</p>
                <div className="[&_*]:!text-white"><Price price={current.price} mrp={current.mrp} /></div>
              </div>
            </div>
          </>
        )}
      </div>

      {current && (
        <div className="mt-5 flex items-center justify-center gap-5">
          <button type="button" onClick={() => decide("skip")} aria-label={`Skip ${current.title}`} className="pressable grid h-16 w-16 place-items-center rounded-full bg-white text-danger shadow-md ring-1 ring-line">
            <IconX size={28} />
          </button>
          <Link href={`/product/${current.slug}`} aria-label={`View ${current.title}`} className="pressable grid h-12 w-12 place-items-center rounded-full bg-white shadow ring-1 ring-line">
            <IconEye size={20} />
          </Link>
          <button type="button" onClick={() => decide("save")} aria-label={`Save ${current.title}`} className="pressable grid h-16 w-16 place-items-center rounded-full bg-leaf text-white shadow-md">
            <IconHeart size={28} filled />
          </button>
        </div>
      )}
      <p className="mt-3 text-center text-xs text-ink-soft" aria-live="polite">
        {current ? `${index + 1} of ${deck.length}` : ""}{hydrated && saved.length ? ` · ${saved.length} saved` : ""} · Arrow keys work too
      </p>
    </div>
  );
}
