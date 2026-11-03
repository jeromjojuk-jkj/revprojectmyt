"use client";

import { useRef, useState } from "react";
import type { ProductPublic } from "@/lib/types";
import { fitQuestion, recommendSize, type FitPref, type FitResult } from "@/lib/fitfinder";
import { Sheet } from "./Sheet";
import { ProductImage } from "./ProductImage";

/** 📏 Size Finder — one measurement vs. this product's size chart. */
export function SizeFinder({ product, open, onClose, onPick }: { product: ProductPublic; open: boolean; onClose: () => void; onPick: (size: string) => void }) {
  const q = fitQuestion(product.sizeGuide);
  const [value, setValue] = useState("");
  const [pref, setPref] = useState<FitPref>("regular");
  const [result, setResult] = useState<FitResult | null>(null);
  if (!q || !product.sizeGuide) return null;
  return (
    <Sheet open={open} onClose={onClose} title="📏 Size Finder">
      <div className="space-y-4">
        <p className="text-sm text-ink-soft">
          We compare your measurement with <b>this item’s</b> garment measurements. Measure{" "}
          {q.kind === "foot" ? "heel to longest toe, standing" : q.kind === "waist" ? "around your natural waist" : "around the fullest part"}.
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setResult(recommendSize(product.sizeGuide!, q, Number(value.replace(",", ".")), pref));
          }}
        >
          <label htmlFor="sf-val" className="text-sm font-semibold">{q.label} ({q.unit})</label>
          <input id="sf-val" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={q.kind === "foot" ? "e.g. 25.2" : q.kind === "waist" ? "e.g. 30" : "e.g. 36"}
            className="h-12 w-full rounded-xl border-2 border-line px-3 text-lg outline-none focus:border-leaf" />
          <div role="radiogroup" aria-label="Fit preference" className="grid grid-cols-3 gap-2">
            {(["snug", "regular", "relaxed"] as FitPref[]).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={pref === f} onClick={() => setPref(f)}
                className={`h-11 rounded-xl text-sm font-semibold capitalize ring-2 ${pref === f ? "bg-leaf-soft ring-leaf" : "ring-line"}`}>{f}</button>
            ))}
          </div>
          <button className="h-12 w-full rounded-xl bg-leaf font-semibold text-white">Find my size</button>
        </form>
        {result && (
          <div className={`pop-in rounded-2xl p-4 ${result.size ? "bg-leaf-soft" : "bg-danger-soft"}`} role="status">
            {result.size && (<><p className="text-xs font-semibold uppercase tracking-wide text-leaf">Suggested size</p><p className="text-3xl font-bold">{result.size}</p></>)}
            <p className="text-sm">{result.reason}</p>
            {result.size && result.nextUp && <p className="mt-1 text-xs text-ink-soft">Between sizes or like it loose? Try {result.nextUp}.</p>}
            {result.size && (
              <button type="button" onClick={() => { onPick(result.size!); onClose(); }} className="mt-3 h-11 w-full rounded-xl bg-ink font-semibold text-white">Select {result.size}</button>
            )}
          </div>
        )}
        <p className="text-xs text-ink-soft">A suggestion, not a guarantee — fabrics stretch differently.</p>
      </div>
    </Sheet>
  );
}

/** ✨ Spotlight — a dark stage where you drag to turn the product. */
export function Spotlight({ src, title, open, onClose }: { src: string; title: string; open: boolean; onClose: () => void }) {
  const [rot, setRot] = useState({ ry: -12, rx: 4 });
  const drag = useRef<{ x: number; y: number; ry: number; rx: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const clamp = (v: number, m: number) => Math.max(-m, Math.min(m, v));
  return (
    <Sheet open={open} onClose={onClose} title="✨ Spotlight">
      <div className="spot-stage -mx-4 -my-4 flex flex-col items-center overflow-hidden px-4 pb-6 pt-8 text-white">
        <div
          className={`spot-item relative w-[min(72vw,320px)] ${dragging ? "dragging" : ""}`}
          style={{ ["--ry" as string]: `${rot.ry}deg`, ["--rx" as string]: `${rot.rx}deg` }}
          onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, ...rot }; setDragging(true); e.currentTarget.setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { const d = drag.current; if (d) setRot({ ry: clamp(d.ry + (e.clientX - d.x) * 0.4, 55), rx: clamp(d.rx - (e.clientY - d.y) * 0.25, 18) }); }}
          onPointerUp={() => { drag.current = null; setDragging(false); }}
        >
          <span className="spot-img relative block aspect-square overflow-hidden rounded-3xl bg-white"><ProductImage src={src} alt={title} sizes="320px" /></span>
          <span className="spot-shine pointer-events-none absolute inset-0 rounded-3xl" aria-hidden />
        </div>
        <p className="mt-6 text-center text-xs text-white/70">Drag to turn · {title}</p>
        <div className="mt-3 flex gap-2">
          {([["↺ Turn", -25], ["Reset", 0], ["Turn ↻", 25]] as [string, number][]).map(([l, n]) => (
            <button key={l} type="button" onClick={() => setRot((r) => (n === 0 ? { ry: 0, rx: 0 } : { ...r, ry: clamp(r.ry + n, 55) }))}
              className="h-10 rounded-full bg-white/15 px-4 text-sm font-semibold ring-1 ring-white/30">{l}</button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
