"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CategoryId, ProductPublic, VibeId } from "@/lib/types";
import { VIBES } from "@/lib/constants";
import { emptyState, runSearch, serializeSearch } from "@/lib/search";
import { ProductGrid } from "@/components/ProductCard";
import { IconBack, IconCheck, IconInfo, IconSpark } from "@/components/Icons";

type Who = "women" | "men" | "anyone";
type Want = "clothing" | "footwear" | "beauty" | "extras";

const WANTS: { id: Want; label: string }[] = [
  { id: "clothing", label: "Clothing" },
  { id: "footwear", label: "Footwear" },
  { id: "beauty", label: "Beauty" },
  { id: "extras", label: "Bags, jewellery & accessories" },
];
const BUDGET = [
  { v: 299, label: "Under ₹299" },
  { v: 499, label: "Under ₹499" },
  { v: 999, label: "Under ₹999" },
  { v: 0, label: "No limit" },
];

function cats(who: Who, wants: Want[]): CategoryId[] {
  const out: CategoryId[] = [];
  const w = wants.length ? wants : (["clothing", "footwear", "beauty", "extras"] as Want[]);
  if (w.includes("clothing")) out.push(...(who === "men" ? ["men"] : who === "women" ? ["women"] : ["men", "women"]) as CategoryId[]);
  if (w.includes("footwear")) out.push("footwear");
  if (w.includes("beauty")) out.push("beauty");
  if (w.includes("extras")) out.push("bags", "jewellery", "accessories");
  return out;
}

export function VibeFinder({ products }: { products: ProductPublic[] }) {
  const [step, setStep] = useState(0);
  const [who, setWho] = useState<Who | null>(null);
  const [vibe, setVibe] = useState<VibeId | null>(null);
  const [budget, setBudget] = useState<number | null>(null);
  const [wants, setWants] = useState<Want[]>([]);

  const state = useMemo(() => {
    const s = emptyState();
    s.vibe = vibe;
    s.max = budget || null;
    s.cats = cats(who ?? "anyone", wants);
    s.inStock = true;
    s.sort = "newest";
    return s;
  }, [who, vibe, budget, wants]);
  const result = useMemo(() => runSearch(products, state), [products, state]);

  const steps = ["Who’s shopping?", "Pick your vibe", "Budget per piece", "What are you after?"];
  const Choice = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" role="radio" aria-checked={on} onClick={onClick}
      className={`pressable flex min-h-14 w-full items-center justify-between rounded-2xl px-4 text-left font-medium ring-2 ${on ? "bg-leaf-soft ring-leaf" : "bg-white ring-line"}`}>
      {children}
      {on && <IconCheck size={18} className="text-leaf" />}
    </button>
  );

  if (step === 4) {
    return (
      <div className="px-4 pt-4">
        <button type="button" onClick={() => setStep(0)} className="-ml-2 flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-leaf"><IconBack size={18} /> Start over</button>
        <h1 className="text-xl font-semibold">Your {VIBES.find((v) => v.id === vibe)?.name ?? ""} picks</h1>
        <p className="mt-1 flex gap-2 rounded-xl bg-sun-soft p-3 text-xs">
          <IconInfo size={16} className="shrink-0" />
          These picks are filtered only from the answers you gave here (vibe, budget, who it’s for, what you want) — not from your browsing or any personal data.
        </p>
        <div className="mt-4">
          {result.total ? (
            <ProductGrid products={result.items} priorityCount={4} />
          ) : (
            <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-line">
              <p className="font-semibold">No in-stock matches for that combo</p>
              <p className="mt-1 text-sm text-ink-soft">Try a higher budget or a different vibe.</p>
              <button type="button" onClick={() => setStep(2)} className="mt-4 h-12 rounded-xl bg-leaf px-6 font-semibold text-white">Change budget</button>
            </div>
          )}
        </div>
        {result.total > 0 && (
          <Link href={`/search?${serializeSearch(state)}`} className="mt-4 flex h-12 items-center justify-center rounded-xl font-semibold text-leaf ring-2 ring-leaf">
            Refine these with filters
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="flex items-center gap-2 text-gold-ink"><IconSpark size={18} /><span className="text-[11px] font-semibold uppercase tracking-[0.14em]">Vibe Finder</span></div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-leaf" : "bg-line"}`} />)}
      </div>
      <p className="mt-3 text-xs text-ink-soft">Question {step + 1} of 4</p>
      <h1 className="text-xl font-semibold">{steps[step]}</h1>

      <div role={step === 3 ? "group" : "radiogroup"} aria-label={steps[step]} className="mt-4 space-y-2">
        {step === 0 && (["women", "men", "anyone"] as Who[]).map((w) => (
          <Choice key={w} on={who === w} onClick={() => { setWho(w); setStep(1); }}>
            {w === "women" ? "Women’s styles" : w === "men" ? "Men’s styles" : "Show me everything"}
          </Choice>
        ))}
        {step === 1 && VIBES.map((v) => (
          <Choice key={v.id} on={vibe === v.id} onClick={() => { setVibe(v.id); setStep(2); }}>
            <span><span className="block">{v.name}</span><span className="block text-xs font-normal text-ink-soft">{v.line}</span></span>
          </Choice>
        ))}
        {step === 2 && BUDGET.map((b) => (
          <Choice key={b.v} on={budget === b.v} onClick={() => { setBudget(b.v); setStep(3); }}>{b.label}</Choice>
        ))}
        {step === 3 && WANTS.map((w) => {
          const on = wants.includes(w.id);
          return (
            <button key={w.id} type="button" aria-pressed={on} onClick={() => setWants((x) => (on ? x.filter((y) => y !== w.id) : [...x, w.id]))}
              className={`pressable flex min-h-14 w-full items-center justify-between rounded-2xl px-4 text-left font-medium ring-2 ${on ? "bg-leaf-soft ring-leaf" : "bg-white ring-line"}`}>
              {w.label}
              {on && <IconCheck size={18} className="text-leaf" />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} className="h-12 flex-1 rounded-xl font-semibold text-leaf ring-2 ring-leaf">Back</button>
        )}
        {step === 3 && (
          <button type="button" onClick={() => setStep(4)} className="h-12 flex-[2] rounded-xl bg-leaf font-semibold text-white">
            {wants.length ? "Show my picks" : "Skip — show everything"}
          </button>
        )}
      </div>
    </div>
  );
}
