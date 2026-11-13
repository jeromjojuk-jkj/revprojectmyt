"use client";

import { useActionState } from "react";
import { deleteProductAction } from "@/app/admin/opsActions";

/** Permanent delete, behind a typed confirmation. */
export function DeleteProduct({ id, title, vendor }: { id: string; title: string; vendor: string | null }) {
  const [state, action, pending] = useActionState(deleteProductAction, null);
  return (
    <details className="rounded-2xl bg-white p-4 text-sm ring-1 ring-danger/30">
      <summary className="cursor-pointer font-semibold text-danger">Delete this product</summary>
      <form action={action} className="mt-3 space-y-2">
        <input type="hidden" name="id" value={id} />
        <p>
          Permanently removes <b>{title}</b>{vendor ? <> (listed by seller <b>{vendor}</b>)</> : null} from the shop and admin. This can’t be undone.
          Past orders keep their own copy of the item. To hide it but keep it, set Status to “Archived” instead.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input name="confirmDelete" aria-label="Type DELETE to confirm" placeholder="Type DELETE" autoComplete="off" className="h-10 w-36 rounded-lg border border-line px-3" />
          <button disabled={pending} className="h-10 rounded-lg bg-danger px-4 font-semibold text-white disabled:opacity-50">{pending ? "Deleting…" : "Delete permanently"}</button>
        </div>
        {state?.error && <p role="alert" className="text-danger">{state.error}</p>}
      </form>
    </details>
  );
}
