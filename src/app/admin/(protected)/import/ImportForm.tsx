"use client";

import { useActionState, useRef } from "react";
import { importAction } from "../../actions";

export function ImportForm() {
  const [state, action, pending] = useActionState(importAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const res = state && "result" in state ? state : null;
  return (
    <form ref={formRef} action={action} className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <label htmlFor="file" className="text-sm font-medium">CSV file</label>
      <input id="file" name="file" type="file" accept=".csv,text/csv" className="block w-full text-sm" />
      <label htmlFor="csv" className="text-sm font-medium">…or paste CSV</label>
      <textarea id="csv" name="csv" rows={6} className="w-full rounded-xl border-2 border-line px-3 py-2 font-mono text-xs" />
      <div className="flex flex-wrap gap-2">
        <button name="mode" value="preview" disabled={pending} className="h-11 rounded-xl px-4 font-semibold ring-2 ring-leaf text-leaf disabled:opacity-60">Validate & preview</button>
        <button name="mode" value="commit" disabled={pending || !res || res.result.errors.length > 0 || res.committed} className="h-11 rounded-xl bg-leaf px-4 font-semibold text-white disabled:opacity-40">Import {res && !res.committed ? res.result.preview.length : ""} products</button>
      </div>
      {state && "error" in state && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      {res && (
        <div className="space-y-2 text-sm" role="status">
          {res.committed ? (
            <p className="rounded-xl bg-leaf-soft p-3 text-leaf">Imported {res.result.preview.length} products. They’re in the Products list{res.result.preview.some((p) => p.status === "draft") ? " as drafts" : ""}.</p>
          ) : (
            <p>{res.result.rowCount} rows → {res.result.preview.length} valid products, {res.result.errors.length} errors.</p>
          )}
          {res.result.errors.length > 0 && (
            <ul className="max-h-64 overflow-y-auto rounded-xl bg-danger-soft p-3 text-xs text-danger">
              {res.result.errors.map((e, i) => <li key={i}>{e.row ? `Row ${e.row}` : "File"}{e.slug ? ` (${e.slug})` : ""}: {e.message}</li>)}
            </ul>
          )}
          {!res.committed && res.result.preview.length > 0 && (
            <ul className="text-xs text-ink-soft">{res.result.preview.map((p) => <li key={p.slug}>{p.title} — {p.variants} variants — {p.status}</li>)}</ul>
          )}
        </div>
      )}
    </form>
  );
}
