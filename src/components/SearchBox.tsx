"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useHydrated, useStore } from "@/lib/store";
import type { Suggestion } from "@/lib/search";
import { IconBack, IconClock, IconSearch, IconX } from "./Icons";
import { CATEGORIES } from "@/lib/constants";

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQ = pathname === "/search" ? params.get("q") ?? "" : "";
  const [q, setQ] = useState(urlQ);
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const recent = useStore((s) => s.recentSearches);
  const addSearch = useStore((s) => s.addSearch);
  const clearSearches = useStore((s) => s.clearSearches);
  const hydrated = useHydrated();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => setQ(urlQ), [urlQ]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => setSuggestions(d.suggestions ?? []))
        .catch(() => {});
    }, 140);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  const showRecent = q.trim().length < 2;
  const items: { label: string; href: string; kind: string }[] = showRecent
    ? (hydrated ? recent : []).map((r) => ({ label: r, href: `/search?q=${encodeURIComponent(r)}`, kind: "recent" }))
    : suggestions.map((s) => ({ label: s.label, href: s.href, kind: s.kind }));

  const go = (href: string, label?: string) => {
    if (label) addSearch(label);
    setOpen(false);
    inputRef.current?.blur();
    router.push(href);
  };

  const submit = () => {
    const t = q.trim();
    if (active >= 0 && items[active]) return go(items[active].href, items[active].kind === "product" ? undefined : t || items[active].label);
    go(t ? `/search?q=${encodeURIComponent(t)}` : "/search", t);
  };

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={`flex h-11 items-center gap-2 rounded-xl border-2 bg-white px-3 transition-colors ${open ? "border-leaf" : "border-transparent ring-1 ring-line"}`}
      >
        {open ? (
          <button type="button" aria-label="Close search" className="-ml-2 grid h-10 w-10 place-items-center md:hidden" onClick={() => { setOpen(false); inputRef.current?.blur(); }}>
            <IconBack size={20} />
          </button>
        ) : (
          <IconSearch size={20} className="shrink-0 text-ink-soft" />
        )}
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(items.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="Search tees, kajal, sneakers, olive…"
          aria-label="Search Krip"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none focus-visible:outline-none placeholder:text-neutral-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button type="button" aria-label="Clear search" className="-mr-2 grid h-10 w-10 place-items-center text-ink-soft" onClick={() => { setQ(""); inputRef.current?.focus(); }}>
            <IconX size={18} />
          </button>
        )}
      </form>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 overflow-y-auto bg-white px-4 pb-24 pt-3 shadow-xl md:absolute md:inset-x-0 md:top-full md:bottom-auto md:mt-2 md:max-h-[70vh] md:rounded-2xl md:px-2 md:pb-2 md:ring-1 md:ring-line">
          {showRecent && hydrated && recent.length > 0 && (
            <div className="mb-1 flex items-center justify-between px-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Recent searches</p>
              <button type="button" className="min-h-11 px-2 text-xs font-semibold text-leaf" onClick={clearSearches}>Clear</button>
            </div>
          )}
          <ul id={listId} role="listbox" aria-label={showRecent ? "Recent searches" : "Suggestions"}>
            {items.map((it, i) => (
              <li key={it.href + i} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onClick={() => go(it.href, it.kind === "product" ? undefined : it.kind === "recent" ? it.label : q.trim() || it.label)}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-2 text-left text-[15px] ${i === active ? "bg-leaf-soft" : "hover:bg-paper"}`}
                >
                  <span className="text-ink-soft">{it.kind === "recent" ? <IconClock size={18} /> : <IconSearch size={18} />}</span>
                  <span className="flex-1 truncate">{it.label}</span>
                  {it.kind !== "recent" && <span className="text-[11px] uppercase tracking-wide text-ink-soft">{it.kind}</span>}
                </button>
              </li>
            ))}
          </ul>
          {!showRecent && items.length === 0 && (
            <p className="px-2 py-3 text-sm text-ink-soft">Press search to look for “{q.trim()}”.</p>
          )}
          {showRecent && (
            <div className="px-2 pt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Browse categories</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Link key={c.id} href={`/search?cat=${c.id}`} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-full bg-paper px-4 text-sm ring-1 ring-line">
                    {c.short}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
