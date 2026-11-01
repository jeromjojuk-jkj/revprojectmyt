"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";

type CashfreeSdk = (opts: { mode: "sandbox" | "production" }) => {
  checkout: (opts: { paymentSessionId: string; redirectTarget?: "_self" | "_blank" | "_top" | "_modal" }) => Promise<{ error?: { message?: string } } | void>;
};

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadSdk(): Promise<CashfreeSdk> {
  const w = window as unknown as { Cashfree?: CashfreeSdk };
  if (w.Cashfree) return Promise.resolve(w.Cashfree);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK_URL;
    s.async = true;
    s.onload = () => (w.Cashfree ? resolve(w.Cashfree) : reject(new Error("Payment page didn’t load")));
    s.onerror = () => reject(new Error("Couldn’t load the payment page. Check your connection"));
    document.head.appendChild(s);
  });
}

export function CashfreeCheckout({ orderId, token, total }: { orderId: string; token: string; total: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/cashfree/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, t: token }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Payment service unavailable");
      const cashfree = (await loadSdk())({ mode: d.mode });
      // Cashfree takes over this tab and sends the shopper back to the order page,
      // where the server checks with Cashfree before showing any result.
      const r = await cashfree.checkout({ paymentSessionId: d.sessionId, redirectTarget: "_self" });
      if (r && r.error) throw new Error(r.error.message ?? "Payment couldn’t start");
    } catch (e) {
      setError(`${(e as Error).message}. Nothing was charged — you can try again.`);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <button type="button" disabled={busy} onClick={pay} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60">
        {busy ? "Opening secure payment…" : `Pay ${formatPrice(total)} securely`}
      </button>
      <p className="text-center text-xs text-ink-soft">UPI · Cards · Net banking · Wallets — processed by Cashfree Payments</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
