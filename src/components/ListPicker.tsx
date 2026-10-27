"use client";

import { useState } from "react";
import { Sheet } from "./Sheet";
import { useStore } from "@/lib/store";
import { IconPlus } from "./Icons";

/** Organise a product into named wishlist collections. */
export function ListPicker({ productId, open, onClose }: { productId: string; open: boolean; onClose: () => void }) {
  const lists = useStore((s) => s.wishlists);
  const setInList = useStore((s) => s.setInList);
  const createList = useStore((s) => s.createList);
  const [name, setName] = useState("");
  return (
    <Sheet open={open} onClose={onClose} title="Save to a list">
      <ul className="-mx-1 space-y-1">
        {lists.map((l) => {
          const on = l.productIds.includes(productId);
          return (
            <li key={l.id}>
              <label className="flex min-h-12 items-center gap-3 rounded-xl px-2 hover:bg-paper">
                <input type="checkbox" checked={on} onChange={(e) => setInList(l.id, productId, e.target.checked)} className="h-5 w-5 accent-[#166534]" />
                <span className="flex-1 font-medium">{l.name}</span>
                <span className="text-xs text-ink-soft">{l.productIds.length}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const id = createList(name);
          setInList(id, productId, true);
          setName("");
        }}
      >
        <label htmlFor="new-list" className="sr-only">New list name</label>
        <input id="new-list" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="New list, e.g. Goa trip"
          className="h-12 min-w-0 flex-1 rounded-xl border-2 border-line px-3 outline-none focus:border-leaf" />
        <button className="flex h-12 items-center gap-1 rounded-xl bg-leaf px-4 font-semibold text-white"><IconPlus size={18} />Create</button>
      </form>
    </Sheet>
  );
}
