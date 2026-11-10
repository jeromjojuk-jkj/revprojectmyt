"use client";

import { useActionState } from "react";
import type { VendorAdminState } from "@/app/admin/vendorActions";

/** Small form wrapper for seller admin actions: shows the result inline. */
export function VForm({ action, hidden, children, className = "" }: {
  action: (s: VendorAdminState, fd: FormData) => Promise<VendorAdminState>;
  hidden: Record<string, string>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className={className}>
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <fieldset disabled={pending} className="contents">{children}</fieldset>
      {state?.ok && <p role="status" className="mt-2 text-sm font-medium text-leaf">{state.ok}</p>}
      {state?.error && <p role="alert" className="mt-2 text-sm text-danger">{state.error}</p>}
      {state?.secret && <p className="mt-2 rounded-lg bg-paper p-2 font-mono text-sm">{state.secret}</p>}
    </form>
  );
}
