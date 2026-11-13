"use client";

import { deleteVendorProductAction } from "@/app/vendor/productActions";

/** Delete button with a confirmation prompt. */
export function DeleteVendorProduct({ id, title, wide = false }: { id: string; title: string; wide?: boolean }) {
  return (
    <form
      action={deleteVendorProductAction}
      onSubmit={(e) => {
        if (!window.confirm(`Delete “${title}” permanently? It disappears from the shop and can’t be undone. Orders already placed still need shipping.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={`h-10 rounded-xl px-3 text-sm font-medium text-danger ring-1 ring-danger/40 hover:bg-danger-soft ${wide ? "w-full sm:w-auto sm:px-6" : ""}`}>Delete</button>
    </form>
  );
}
