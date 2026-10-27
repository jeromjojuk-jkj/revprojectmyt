"use client";

import { useMemo, useState } from "react";
import type { ProductPublic } from "@/lib/types";
import { dominantSwatches, type Swatch } from "@/lib/colormatch";
import { emptyState, runSearch } from "@/lib/search";
import { plural } from "@/lib/format";
import { ProductGrid } from "@/components/ProductCard";

const SAMPLES = ["/art/dress-5e1a2b-1.svg", "/art/kurti-1c6b4a-1.svg", "/art/jeans-2c3e6b-1.svg", "/art/hoodie-9ca3af-1.svg"];

/** Krip Lab · Colour Match — reads a photo's colours on-device and shops them. */
export function ColourMatch({ products }: { products: ProductPublic[] }) {
  const [swatches, setSwatches] = useState<Swatch[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const analyse = async (src: string) => {
    setError(null);
    try {
      const im = new Image();
      im.src = src;
      await im.decode();
      const c = document.createElement("canvas");
      c.width = 72;
      c.height = 72;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(im, 0, 0, 72, 72);
      const sw = dominantSwatches(ctx.getImageData(0, 0, 72, 72).data, 5);
      const pick = new Set(sw.filter((s) => !["White", "Grey"].includes(s.family)).slice(0, 2).map((s) => s.family));
      if (!pick.size && sw[0]) pick.add(sw[0].family);
      setSwatches(sw);
      setSelected(pick);
      setPreview(src);
    } catch {
      setError("Couldn’t read that photo. Try a JPG or PNG.");
    }
  };

  const result = useMemo(
    () => (selected.size ? runSearch(products, { ...emptyState(), colors: [...selected], inStock: true }) : null),
    [products, selected],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pt-2">
      <div className="lab-hero relative overflow-hidden rounded-3xl p-5 text-white">
        <span className="aurora-blob a1" aria-hidden />
        <span className="aurora-blob a3" aria-hidden />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.16em] text-sun">Krip Lab · Colour Match</p>
        <h1 className="relative text-2xl font-bold leading-tight">Shop the colours in any photo</h1>
        <p className="relative mt-1 text-sm text-white/80">An outfit, a sunset, your room — we read its colours and find matching styles. Your photo never leaves your device.</p>
        <div className="relative mt-3 flex flex-wrap gap-2">
          <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-sun px-4 text-sm font-bold text-ink">
            📷 Choose a photo
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) analyse(URL.createObjectURL(f)); }} />
          </label>
          <button type="button" onClick={() => analyse(SAMPLES[Math.floor(Math.random() * SAMPLES.length)])} className="h-11 rounded-xl bg-white/15 px-4 text-sm font-semibold ring-1 ring-white/30">
            Try a sample
          </button>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      {swatches.length > 0 && (
        <div className="mt-4 flex gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview && <img src={preview} alt="Your photo" className="h-28 w-24 shrink-0 rounded-2xl object-cover ring-1 ring-line" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Colours we found</p>
            <p className="text-xs text-ink-soft">Tap to include or skip a colour.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {swatches.map((w) => {
                const on = selected.has(w.family);
                return (
                  <button key={w.family} type="button" aria-pressed={on}
                    onClick={() => setSelected((s) => { const n = new Set(s); n.has(w.family) ? n.delete(w.family) : n.add(w.family); return n; })}
                    className={`flex h-10 items-center gap-2 rounded-full bg-white pl-1 pr-3 text-sm ring-2 ${on ? "ring-ink" : "opacity-60 ring-line"}`}>
                    <span className="h-8 w-8 rounded-full ring-1 ring-black/10" style={{ background: w.hex }} />
                    {w.family} <span className="text-xs text-ink-soft">{Math.round(w.share * 100)}%</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {result ? (
        <>
          <p className="mt-5 text-sm font-semibold">{plural(result.total, "match", "matches")} in stock</p>
          <div className="mt-2">
            {result.total ? <ProductGrid products={result.items.slice(0, 24)} /> : <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft ring-1 ring-line">No in-stock styles in these colours yet. Try including another colour.</p>}
          </div>
        </>
      ) : (
        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-ink-soft">
          {[["📷", "Pick a photo"], ["🎨", "We read its colours"], ["🛍️", "Shop the matches"]].map(([e, t]) => (
            <div key={t} className="rounded-2xl bg-white p-3 ring-1 ring-line"><span className="block text-xl">{e}</span>{t}</div>
          ))}
        </div>
      )}
    </div>
  );
}
