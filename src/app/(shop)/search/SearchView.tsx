"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ProductPublic } from "@/lib/types";
import {
  activeFilterCount, emptyState, parseSearch, runSearch, serializeSearch, SORTS,
  type Facet, type SearchState,
} from "@/lib/search";
import { CATEGORY_NAME, COLLECTIONS, VIBES } from "@/lib/constants";
import { ProductGrid } from "@/components/ProductCard";
import { Sheet } from "@/components/Sheet";
import { IconFilter, IconSort, IconX, IconCheck } from "@/components/Icons";
import { plural } from "@/lib/format";
import { useStore } from "@/lib/store";

type Group = Facet["group"];

function titleFor(s: SearchState) {
  if (s.q) return `Results for “${s.q}”`;
  if (s.collection) return COLLECTIONS[s.collection].name;
  if (s.vibe) return `${VIBES.find((v) => v.id === s.vibe)?.name} vibe`;
  if (s.max) return `Under ₹${s.max}`;
  if (s.cats.length === 1) return CATEGORY_NAME[s.cats[0]];
  return "All products";
}

const SCROLL_KEY = (url: string) => `krip-scroll:${url}`;

export function SearchView({ products }: { products: ProductPublic[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = useMemo(() => parseSearch(new URLSearchParams(params.toString())), [params]);
  const result = useMemo(() => runSearch(products, state), [products, state]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [draft, setDraft] = useState<SearchState>(state);
  const draftResult = useMemo(() => (filtersOpen ? runSearch(products, draft) : result), [filtersOpen, draft, products, result]);
  const addSearch = useStore((s) => s.addSearch);

  useEffect(() => {
    if (state.q) addSearch(state.q);
  }, [state.q, addSearch]);

  const url = `${pathname}?${params.toString()}`;
  // Restore scroll position when coming back from a product page.
  useLayoutEffect(() => {
    try {
      const y = sessionStorage.getItem(SCROLL_KEY(url));
      if (y) {
        window.scrollTo(0, Number(y));
        sessionStorage.removeItem(SCROLL_KEY(url));
      }
    } catch {}
  }, [url]);
  const rememberScroll = () => {
    try {
      sessionStorage.setItem(SCROLL_KEY(url), String(window.scrollY));
    } catch {}
  };

  const apply = (s: SearchState) => {
    const qs = serializeSearch(s);
    router.replace(qs ? `/search?${qs}` : "/search", { scroll: false });
  };

  const toggle = (s: SearchState, g: Group, value: string): SearchState => {
    const cur = s[g] as string[];
    return { ...s, [g]: cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value] };
  };

  const chips: { label: string; remove: () => SearchState }[] = [];
  const groups: Group[] = ["cats", "types", "sizes", "fits", "colors", "materials", "shades", "skin", "prices"];
  for (const g of groups) {
    for (const v of state[g] as string[]) {
      const label = result.facets.find((f) => f.group === g)?.options.find((o) => o.value === v)?.label ?? v;
      chips.push({ label, remove: () => toggle(state, g, v) });
    }
  }
  if (state.vibe) chips.push({ label: `${VIBES.find((v) => v.id === state.vibe)?.name} vibe`, remove: () => ({ ...state, vibe: null }) });
  if (state.collection) chips.push({ label: COLLECTIONS[state.collection].name, remove: () => ({ ...state, collection: null }) });
  if (state.max) chips.push({ label: `Under ₹${state.max}`, remove: () => ({ ...state, max: null }) });
  if (state.inStock) chips.push({ label: "In stock only", remove: () => ({ ...state, inStock: false }) });

  const clearAll = (): SearchState => ({ ...emptyState(), q: state.q, sort: state.sort });
  const nFilters = activeFilterCount(state);

  return (
    <div className="px-4 pt-4">
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{titleFor(state)}</h1>
          <p className="text-sm text-ink-soft" aria-live="polite">
            {plural(result.total, "product")}
            {state.collection === "trending" && " · hand-picked, not ranked by sales"}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 mt-3 flex gap-2 border-y border-line bg-paper/95 px-4 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => {
            setDraft(state);
            setFiltersOpen(true);
          }}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold ring-1 ring-line md:flex-none md:px-5"
          aria-haspopup="dialog"
        >
          <IconFilter size={18} /> Filter
          {nFilters > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-[11px] text-white">{nFilters}</span>}
        </button>
        <button
          type="button"
          onClick={() => setSortOpen(true)}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold ring-1 ring-line md:flex-none md:px-5"
          aria-haspopup="dialog"
        >
          <IconSort size={18} /> {SORTS.find((s) => s.id === state.sort)?.label}
        </button>
      </div>

      {chips.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-1" aria-label="Applied filters">
          {chips.map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => apply(c.remove())}
              className="flex h-9 shrink-0 items-center gap-1 rounded-full bg-sun-soft pl-3 pr-2 text-xs font-medium ring-1 ring-sun"
              aria-label={`Remove filter ${c.label}`}
            >
              {c.label} <IconX size={14} />
            </button>
          ))}
          <button type="button" onClick={() => apply(clearAll())} className="h-9 shrink-0 px-2 text-xs font-semibold text-leaf underline">
            Clear all
          </button>
        </div>
      )}

      <div className="mt-3">
        {result.total > 0 ? (
          <ProductGrid products={result.items} priorityCount={4} onNavigate={rememberScroll} />
        ) : (
          <div className="mx-auto max-w-sm rounded-2xl bg-white p-6 text-center ring-1 ring-line">
            <p className="text-lg font-semibold">Nothing matches… yet</p>
            <p className="mt-1 text-sm text-ink-soft">
              {state.q ? `We couldn’t find “${state.q}” with these filters.` : "No products match these filters."} Try removing a filter or searching
              for something broader like “tee” or “earrings”.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {nFilters > 0 && (
                <button type="button" onClick={() => apply(clearAll())} className="h-12 rounded-xl bg-leaf font-semibold text-white">
                  Reset filters
                </button>
              )}
              <button type="button" onClick={() => router.push("/search")} className="h-12 rounded-xl font-semibold text-leaf ring-2 ring-leaf">
                Browse everything
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sort sheet */}
      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by">
        <ul role="radiogroup" aria-label="Sort by" className="-mx-2">
          {SORTS.filter((s) => s.id !== "relevance" || state.q).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                role="radio"
                aria-checked={state.sort === s.id}
                onClick={() => {
                  apply({ ...state, sort: s.id });
                  setSortOpen(false);
                }}
                className="flex min-h-12 w-full items-center justify-between rounded-xl px-3 text-left hover:bg-paper aria-checked:font-semibold aria-checked:text-leaf"
              >
                {s.label}
                {state.sort === s.id && <IconCheck size={18} />}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-soft">
          Sorting by rating or popularity will appear once there are enough genuine reviews and orders to support it.
        </p>
      </Sheet>

      {/* Filter sheet */}
      <Sheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filters"
        side
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={() => setDraft({ ...clearAll(), sort: draft.sort })} className="h-12 flex-1 rounded-xl font-semibold text-leaf ring-2 ring-leaf">
              Clear all
            </button>
            <button
              type="button"
              onClick={() => {
                apply(draft);
                setFiltersOpen(false);
              }}
              className="h-12 flex-[1.4] rounded-xl bg-leaf font-semibold text-white"
            >
              Show {plural(draftResult.total, "result")}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <label className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-paper px-3">
            <span className="text-sm font-medium">Show in-stock items only</span>
            <input
              type="checkbox"
              checked={draft.inStock}
              onChange={(e) => setDraft({ ...draft, inStock: e.target.checked })}
              className="h-5 w-5 accent-[#166534]"
            />
          </label>
          {draftResult.facets.map((f) => (
            <fieldset key={f.group}>
              <legend className="mb-2 text-sm font-semibold">{f.label}</legend>
              <div className="flex flex-wrap gap-2">
                {f.options.map((o) => {
                  const on = (draft[f.group] as string[]).includes(o.value);
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      disabled={!on && o.count === 0}
                      onClick={() => setDraft(toggle(draft, f.group, o.value))}
                      className={`flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm ring-1 transition-colors disabled:opacity-40 ${
                        on ? "bg-leaf text-white ring-leaf" : "bg-white ring-line"
                      }`}
                    >
                      {on && <IconCheck size={14} />}
                      {o.label}
                      <span className={`text-xs ${on ? "text-white/80" : "text-ink-soft"}`}>({o.count})</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
