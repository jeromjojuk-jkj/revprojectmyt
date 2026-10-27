"use client";

import { useEffect, useState } from "react";
import type { PaymentMethod, Quote } from "./types";
import type { CartLine } from "./store";

/** Server-calculated totals for the current bag. The browser never decides the price. */
export function useQuote(cart: CartLine[], opts: { pincode?: string | null; paymentMethod?: PaymentMethod | null; couponCode?: string | null; enabled?: boolean }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const key = JSON.stringify([cart.map((l) => [l.sku, l.qty]), opts.pincode, opts.paymentMethod, opts.couponCode]);

  useEffect(() => {
    if (opts.enabled === false) return;
    if (cart.length === 0) {
      setQuote(null);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((l) => ({ sku: l.sku, qty: l.qty })),
        pincode: opts.pincode ?? null,
        paymentMethod: opts.paymentMethod ?? null,
        couponCode: opts.couponCode ?? null,
      }),
      signal: ctrl.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("quote failed");
        const d = await r.json();
        setQuote(d.quote);
        setError(null);
        setLoading(false);
      })
      .catch((e) => {
        if ((e as Error).name === "AbortError") return;
        setError("Couldn’t refresh prices. Check your connection and try again.");
        setLoading(false);
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, nonce, opts.enabled]);

  return { quote, error, loading, refresh: () => setNonce((n) => n + 1), setQuote };
}
