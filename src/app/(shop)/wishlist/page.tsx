"use client";

import Link from "next/link";
import { useState } from "react";
import { useHydrated, useStore } from "@/lib/store";
import { useProductsByIds } from "@/components/RecentlyViewed";
import { ProductGrid } from "@/components/ProductCard";
import { Sheet } from "@/components/Sheet";
import { IconPlus } from "@/components/Icons";

export default function WishlistPage() {
  const hydrated = useHydrated();
  const lists = useStore((s) => s.wishlists);
  const createList = useStore((s) => s.createList);
  const renameList = useStore((s) => s.renameList);
  const deleteList = useStore((s) => s.deleteList);
  const [active, setActive] = useState("all");
  const [manage, setManage] = useState(false);
  const [name, setName] = useState("");

  const ids = hydrated
    ? active === "all"
      ? [...new Set(lists.flatMap((l) => l.productIds))]
      : lists.find((l) => l.id === active)?.productIds ?? []
    : [];
  const products = useProductsByIds(ids);
  const current = lists.find((l) => l.id === active);

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Wishlist</h1>
        <button type="button" onClick={() => setManage(true)} className="min-h-11 px-2 text-sm font-semibold text-leaf" aria-haspopup="dialog">Manage lists</button>
      </div>
      <p className="text-sm text-ink-soft">Saved on this device.</p>

      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Wishlist collections">
        {[{ id: "all", name: "All saved", productIds: [...new Set(lists.flatMap((l) => l.productIds))] }, ...lists].map((l) => (
          <button key={l.id} type="button" role="tab" aria-selected={active === l.id} onClick={() => setActive(l.id)}
            className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-medium ring-1 ${active === l.id ? "bg-ink text-white ring-ink" : "bg-white ring-line"}`}>
            {l.name} <span className="text-xs opacity-70">{hydrated ? l.productIds.length : ""}</span>
          </button>
        ))}
        <button type="button" onClick={() => setManage(true)} className="flex min-h-11 shrink-0 items-center gap-1 rounded-full px-4 text-sm font-semibold text-leaf ring-1 ring-leaf">
          <IconPlus size={16} /> New list
        </button>
      </div>

      <div className="mt-4" role="tabpanel">
        {!hydrated || products === null ? (
          <div className="grid grid-cols-2 gap-2.5"><div className="skeleton aspect-[4/5]" /><div className="skeleton aspect-[4/5]" /></div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-line">
            <p className="font-semibold">{active === "all" ? "Nothing saved yet" : `“${current?.name}” is empty`}</p>
            <p className="mt-1 text-sm text-ink-soft">Tap the heart on any product to save it. Use “Save to list” on a product page to organise favourites.</p>
            <Link href="/search?collection=trending" className="mt-4 inline-flex h-12 items-center rounded-xl bg-leaf px-6 font-semibold text-white">Explore Trending</Link>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>

      <Sheet open={manage} onClose={() => setManage(false)} title="Your lists">
        <ul className="space-y-2">
          {lists.map((l) => (
            <li key={l.id} className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`ln-${l.id}`}>List name</label>
              <input id={`ln-${l.id}`} defaultValue={l.name} onBlur={(e) => renameList(l.id, e.target.value)} maxLength={40}
                className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line px-3 outline-none focus:border-leaf" />
              {l.id !== "saved" && (
                <button type="button" onClick={() => { deleteList(l.id); if (active === l.id) setActive("all"); }} className="h-11 rounded-xl px-3 text-sm font-semibold text-danger ring-1 ring-line">
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { setActive(createList(name)); setName(""); } }}>
          <label htmlFor="nl" className="sr-only">New list name</label>
          <input id="nl" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Diwali fits" maxLength={40}
            className="h-12 min-w-0 flex-1 rounded-xl border-2 border-line px-3 outline-none focus:border-leaf" />
          <button className="h-12 rounded-xl bg-leaf px-4 font-semibold text-white">Create</button>
        </form>
      </Sheet>
    </div>
  );
}
