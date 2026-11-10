"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type CashfreeSdk = (o: { mode: "sandbox" | "production" }) => { checkout: (o: { paymentSessionId: string; redirectTarget?: "_self" }) => Promise<{ error?: { message?: string } } | void> };

function loadSdk(): Promise<CashfreeSdk> {
  const w = window as unknown as { Cashfree?: CashfreeSdk };
  if (w.Cashfree) return Promise.resolve(w.Cashfree);
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => (w.Cashfree ? res(w.Cashfree) : rej(new Error("Payment page didn’t load")));
    s.onerror = () => rej(new Error("Couldn’t load the payment page"));
    document.head.appendChild(s);
  });
}

/** Pays the seller's one-time plan fee on Cashfree's page; the server confirms it with Cashfree afterwards. */
export function FeeCheckout({ fee }: { fee: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/vendor/fee-session", { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Payment service unavailable");
      const res = await (await loadSdk())({ mode: d.mode }).checkout({ paymentSessionId: d.sessionId, redirectTarget: "_self" });
      if (res && res.error) throw new Error(res.error.message ?? "Payment couldn’t start");
    } catch (e) {
      setError(`${(e as Error).message}. Nothing was charged — you can try again.`);
      setBusy(false);
    }
  };
  return (
    <div>
      <button type="button" onClick={pay} disabled={busy} className="h-12 rounded-xl bg-leaf px-6 font-semibold text-white disabled:opacity-60">{busy ? "Opening secure payment…" : `Pay ${formatPrice(fee)} securely`}</button>
      <p className="mt-1 text-xs text-ink-soft">UPI · Cards · Net banking — processed by Cashfree Payments</p>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
