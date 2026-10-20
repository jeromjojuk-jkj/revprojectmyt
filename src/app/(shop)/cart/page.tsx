"use client";

import Link from "next/link";
import { useState } from "react";
import { useHydrated, useStore } from "@/lib/store";
import { useQuote } from "@/lib/useQuote";
import { formatPrice, plural } from "@/lib/format";
import { MAX_QTY_PER_LINE } from "@/lib/pricing";
import { ProductImage } from "@/components/ProductImage";
import { PriceSummary } from "@/components/Summary";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { IconMinus, IconPlus, IconTrash } from "@/components/Icons";

export default function CartPage() {
  const hydrated = useHydrated();
  const cart = useStore((s) => s.cart);
  const setQty = useStore((s) => s.setQty);
  const remove = useStore((s) => s.removeFromCart);
  const pincode = useStore((s) => s.pincode);
  const couponCode = useStore((s) => s.couponCode);
  const setCoupon = useStore((s) => s.setCoupon);
  const [code, setCode] = useState(couponCode ?? "");
  const { quote, error, loading, refresh } = useQuote(cart, { pincode, couponCode, enabled: hydrated });

  if (!hydrated) {
    return (
      <div className="space-y-3 px-4 pt-4" aria-busy>
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-28" />
        <div className="skeleton h-28" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="px-4 pt-10 text-center">
        <h1 className="text-xl font-semibold">Your bag is empty</h1>
        <p className="mt-1 text-sm text-ink-soft">Find something you love — it’ll wait for you here.</p>
        <Link href="/search?collection=trending" className="mt-5 inline-flex h-12 items-center rounded-xl bg-leaf px-6 font-semibold text-white">
          Browse Trending Now
        </Link>
        <RecentlyViewed />
      </div>
    );
  }

  const lineInfo = (sku: string) => quote?.lines.find((l) => l.sku === sku);
  const blocked = !!quote && !quote.allAvailable;

  return (
    <div className="px-4 pt-4 md:grid md:grid-cols-[1fr_360px] md:gap-6">
      <div>
        <h1 className="text-xl font-semibold">Your bag</h1>
        <p className="text-sm text-ink-soft">{plural(cart.reduce((n, l) => n + l.qty, 0), "item")}</p>
        <ul className="mt-3 space-y-2.5">
          {cart.map((l) => {
            const info = lineInfo(l.sku);
            const priceChanged = info?.ok && info.unitPrice !== l.price;
            return (
              <li key={l.sku} className={`rounded-2xl bg-white p-3 ring-1 ${info && !info.ok ? "ring-danger" : "ring-line"}`}>
                <div className="flex gap-3">
                  <Link href={`/product/${l.slug}`} className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    <ProductImage src={l.image} alt={l.title} sizes="96px" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${l.slug}`} className="line-clamp-2 text-sm font-medium hover:underline">{l.title}</Link>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {l.color}
                      {l.size ? ` · Size ${l.size}` : ""}
                    </p>
                    <p className="mt-1 font-semibold">{formatPrice(info?.ok ? info.unitPrice : l.price)}</p>
                    {priceChanged && <p className="text-xs font-medium text-ink">Price updated since you added this.</p>}
                    {info && !info.ok && <p role="alert" className="mt-1 text-xs font-semibold text-danger">{info.problem}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-xl ring-1 ring-line" role="group" aria-label={`Quantity for ${l.title}`}>
                        <button type="button" aria-label="Decrease quantity" disabled={l.qty <= 1} onClick={() => setQty(l.sku, l.qty - 1)} className="grid h-11 w-11 place-items-center disabled:opacity-30">
                          <IconMinus size={18} />
                        </button>
                        <output aria-live="polite" className="w-8 text-center font-semibold">{l.qty}</output>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          disabled={l.qty >= MAX_QTY_PER_LINE || (info ? l.qty >= info.available : false)}
                          onClick={() => setQty(l.sku, l.qty + 1)}
                          className="grid h-11 w-11 place-items-center disabled:opacity-30"
                        >
                          <IconPlus size={18} />
                        </button>
                      </div>
                      <button type="button" onClick={() => remove(l.sku)} className="flex h-11 items-center gap-1 px-2 text-sm text-ink-soft hover:text-danger" aria-label={`Remove ${l.title}`}>
                        <IconTrash size={18} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="mt-5 space-y-3 md:mt-11">
        <form
          className="rounded-2xl bg-white p-4 ring-1 ring-line"
          onSubmit={(e) => {
            e.preventDefault();
            setCoupon(code.trim() ? code.trim().toUpperCase() : null);
          }}
        >
          <label htmlFor="coupon" className="text-sm font-semibold">Have a code?</label>
          <div className="mt-2 flex gap-2">
            <input id="coupon" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={20} placeholder="Enter code"
              className="h-11 min-w-0 flex-1 rounded-xl border-2 border-line px-3 uppercase outline-none focus:border-leaf" />
            {couponCode ? (
              <button type="button" onClick={() => { setCoupon(null); setCode(""); }} className="h-11 rounded-xl px-4 text-sm font-semibold text-leaf ring-2 ring-leaf">Remove</button>
            ) : (
              <button className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white">Apply</button>
            )}
          </div>
          {quote?.couponMessage && couponCode && (
            <p className={`mt-2 text-xs font-medium ${quote.couponCode ? "text-leaf" : "text-danger"}`} role="status">{quote.couponMessage}</p>
          )}
        </form>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-line" aria-busy={loading}>
          <h2 className="mb-3 font-semibold">Price details</h2>
          {error ? (
            <div role="alert" className="space-y-2">
              <p className="text-sm text-danger">{error}</p>
              <button type="button" onClick={refresh} className="h-11 rounded-xl px-4 text-sm font-semibold text-leaf ring-2 ring-leaf">Try again</button>
            </div>
          ) : quote ? (
            <PriceSummary quote={quote} />
          ) : (
            <div className="space-y-2"><div className="skeleton h-4" /><div className="skeleton h-4" /><div className="skeleton h-6" /></div>
          )}
        </div>
      </aside>

      <div className="fixed inset-x-0 z-20 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur md:static md:col-start-2 md:mt-3 md:border-0 md:bg-transparent md:p-0"
        style={{ bottom: "calc(var(--bottom-nav-h) + var(--safe-bottom))", paddingBottom: 12 }}>
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <p className="text-xs text-ink-soft">Total</p>
            <p className="font-semibold">{quote ? formatPrice(quote.total) : "…"}</p>
          </div>
          {blocked ? (
            <p className="flex-1 text-sm font-medium text-danger">Remove or update unavailable items to continue.</p>
          ) : (
            <Link
              href="/checkout"
              aria-disabled={!quote || loading}
              className={`flex h-12 flex-1 items-center justify-center rounded-xl bg-leaf font-semibold text-white ${!quote || loading ? "pointer-events-none opacity-60" : ""}`}
            >
              Continue to checkout
            </Link>
          )}
        </div>
      </div>
      <div className="h-24 md:hidden" aria-hidden />
    </div>
  );
}
