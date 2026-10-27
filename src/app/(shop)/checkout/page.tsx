"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Address, PaymentMethod, Quote } from "@/lib/types";
import { useHydrated, useStore } from "@/lib/store";
import { useQuote } from "@/lib/useQuote";
import { formatPrice } from "@/lib/format";
import { estimateDelivery, isValidPincode } from "@/lib/pincode";
import { INDIAN_STATES } from "@/lib/constants";
import { PriceSummary } from "@/components/Summary";
import { CheckoutSteps } from "@/components/CheckoutSteps";
import { ProductImage } from "@/components/ProductImage";
import { IconBack, IconInfo, IconTruck } from "@/components/Icons";
import { LocateButton } from "@/components/LocateButton";

interface Config {
  payment: { onlineEnabled: boolean; provider: string; demo: boolean; note: string };
  codFee: number;
}

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`);

function validate(a: Address): Record<string, string> {
  const e: Record<string, string> = {};
  if (a.name.trim().length < 2) e.name = "Enter the recipient’s full name.";
  if (!/^[6-9]\d{9}$/.test(a.phone.replace(/[\s-]/g, "").replace(/^\+?91/, ""))) e.phone = "Enter a valid 10-digit Indian mobile number.";
  if (a.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email)) e.email = "Enter a valid email or leave it blank.";
  if (a.line1.trim().length < 5) e.line1 = "Enter house/flat number and building or street.";
  if (a.city.trim().length < 2) e.city = "Enter your city or town.";
  if (!INDIAN_STATES.includes(a.state)) e.state = "Choose your state.";
  if (!isValidPincode(a.pincode)) e.pincode = "Enter a valid 6-digit pincode.";
  return e;
}

function Field({
  id, label, error, children, hint,
}: { id: string; label: string; error?: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-ink-soft">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `h-12 w-full rounded-xl border-2 bg-white px-3 text-base outline-none focus:border-leaf ${err ? "border-danger" : "border-line"}`;

export default function CheckoutPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const cart = useStore((s) => s.cart);
  const savedPin = useStore((s) => s.pincode);
  const setPincode = useStore((s) => s.setPincode);
  const couponCode = useStore((s) => s.couponCode);
  const saveOrder = useStore((s) => s.saveOrder);
  const clearCart = useStore((s) => s.clearCart);

  const [config, setConfig] = useState<Config | null>(null);
  const [addr, setAddr] = useState<Address>({ name: "", phone: "", email: "", line1: "", line2: "", landmark: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const cartSig = useMemo(() => JSON.stringify(cart.map((l) => [l.sku, l.qty])), [cart]);
  const [idemKey, setIdemKey] = useState<string>("");

  useEffect(() => setIdemKey(newKey()), [cartSig, method]);
  useEffect(() => {
    if (hydrated && savedPin && !addr.pincode) setAddr((a) => ({ ...a, pincode: savedPin }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, savedPin]);
  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig).catch(() => setFormError("Couldn’t load payment options. Refresh to try again."));
  }, []);

  const pinForQuote = isValidPincode(addr.pincode) ? addr.pincode : null;
  const { quote, error: quoteError, loading, setQuote } = useQuote(cart, { pincode: pinForQuote, paymentMethod: method, couponCode, enabled: hydrated && !placed });

  useEffect(() => {
    if (method === "cod" && quote && !quote.codAvailable) setMethod(null);
  }, [quote, method]);

  if (!hydrated) return <div className="space-y-3 px-4 pt-4"><div className="skeleton h-8 w-40" /><div className="skeleton h-64" /></div>;
  if (cart.length === 0 && !placed) {
    return (
      <div className="px-4 pt-10 text-center">
        <h1 className="text-xl font-semibold">Nothing to check out</h1>
        <p className="mt-1 text-sm text-ink-soft">Your bag is empty.</p>
        <Link href="/" className="mt-5 inline-flex h-12 items-center rounded-xl bg-leaf px-6 font-semibold text-white">Start shopping</Link>
      </div>
    );
  }

  const set = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "pincode") v = v.replace(/\D/g, "").slice(0, 6);
    if (k === "phone") v = v.replace(/[^\d+\s-]/g, "").slice(0, 15);
    setAddr((a) => ({ ...a, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: "" }));
  };
  const aria = (k: string) => ({ "aria-invalid": !!errors[k] || undefined, "aria-describedby": errors[k] ? `${k}-err` : undefined });
  const est = pinForQuote ? estimateDelivery(pinForQuote) : null;

  const placeOrder = async () => {
    setFormError(null);
    const errs = validate(addr);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError("Please fix the highlighted fields.");
      document.getElementById(Object.keys(errs)[0])?.focus();
      return;
    }
    if (!method) return setFormError("Choose how you’d like to pay.");
    if (!quote || !quote.allAvailable) return setFormError("Some items in your bag are unavailable. Go back to your bag to update them.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idemKey,
          items: cart.map((l) => ({ sku: l.sku, qty: l.qty })),
          address: addr,
          paymentMethod: method,
          couponCode,
          expectedTotal: quote.total,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "invalid_address" && data.details) setErrors(data.details);
        if (data.details && typeof data.details === "object" && "lines" in data.details) setQuote(data.details as Quote);
        setFormError(data.error ?? "Your order could not be placed. Nothing was charged.");
        return;
      }
      setPlaced(true);
      setPincode(addr.pincode);
      saveOrder({ id: data.orderId, token: data.token, createdAt: new Date().toISOString() });
      clearCart();
      router.replace(data.next);
    } catch {
      setFormError("Network problem — your order may not have been placed. Tap the button again; we’ll never create a duplicate order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <CheckoutSteps current={1} />
    <div className="pb-actionbar px-4 pt-3 md:pb-10">
      <div className="flex items-center gap-2">
        <Link href="/cart" aria-label="Back to bag" className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-black/5"><IconBack /></Link>
        <h1 className="text-xl font-semibold">Checkout</h1>
      </div>
      <p className="ml-9 text-xs text-ink-soft">Guest checkout — no account needed.</p>

      <div className="mt-4 md:grid md:grid-cols-[1fr_380px] md:gap-6">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            placeOrder();
          }}
          className="space-y-5"
          id="checkout-form"
        >
          <section aria-labelledby="addr-title" className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <h2 id="addr-title" className="font-semibold">Delivery address</h2>
            <LocateButton
              confirmLabel="Fill my address"
              onConfirm={(r) => {
                setAddr((a) => ({
                  ...a,
                  pincode: r.pincode ?? a.pincode,
                  city: r.city ?? a.city,
                  state: r.state && INDIAN_STATES.includes(r.state) ? r.state : a.state,
                  line2: a.line2 || r.locality || "",
                }));
                setErrors((er) => ({ ...er, pincode: "", city: "", state: "" }));
              }}
            />
            <Field id="name" label="Full name" error={errors.name}>
              <input id="name" autoComplete="name" value={addr.name} onChange={set("name")} className={inputCls(errors.name)} {...aria("name")} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="phone" label="Mobile number" error={errors.phone} hint="For delivery updates from the courier.">
                <input id="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={addr.phone} onChange={set("phone")} placeholder="10-digit mobile" className={inputCls(errors.phone)} {...aria("phone")} />
              </Field>
              <Field id="email" label="Email (optional)" error={errors.email}>
                <input id="email" type="email" inputMode="email" autoComplete="email" value={addr.email} onChange={set("email")} className={inputCls(errors.email)} {...aria("email")} />
              </Field>
            </div>
            <Field id="pincode" label="Pincode" error={errors.pincode}>
              <input id="pincode" inputMode="numeric" autoComplete="postal-code" value={addr.pincode} onChange={set("pincode")} maxLength={6} className={inputCls(errors.pincode)} {...aria("pincode")} />
            </Field>
            {est && (
              <p className="flex items-center gap-2 rounded-xl bg-leaf-soft px-3 py-2 text-sm text-leaf"><IconTruck size={18} /> {est.message} (estimate)</p>
            )}
            <Field id="line1" label="House / flat no., building, street" error={errors.line1}>
              <input id="line1" autoComplete="address-line1" value={addr.line1} onChange={set("line1")} className={inputCls(errors.line1)} {...aria("line1")} />
            </Field>
            <Field id="line2" label="Area / locality (optional)">
              <input id="line2" autoComplete="address-line2" value={addr.line2} onChange={set("line2")} className={inputCls()} />
            </Field>
            <Field id="landmark" label="Landmark (optional)">
              <input id="landmark" value={addr.landmark} onChange={set("landmark")} className={inputCls()} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="city" label="City / town" error={errors.city}>
                <input id="city" autoComplete="address-level2" value={addr.city} onChange={set("city")} className={inputCls(errors.city)} {...aria("city")} />
              </Field>
              <Field id="state" label="State" error={errors.state}>
                <select id="state" autoComplete="address-level1" value={addr.state} onChange={set("state")} className={inputCls(errors.state)} {...aria("state")}>
                  <option value="">Select</option>
                  {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section aria-labelledby="pay-title" className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-line">
            <h2 id="pay-title" className="font-semibold">Payment</h2>
            {!config ? (
              <div className="skeleton h-16" />
            ) : (
              <div role="radiogroup" aria-labelledby="pay-title" className="space-y-2">
                {config.payment.onlineEnabled ? (
                  <label className={`flex min-h-14 cursor-pointer gap-3 rounded-xl p-3 ring-2 ${method === "online" ? "bg-leaf-soft ring-leaf" : "ring-line"}`}>
                    <input type="radio" name="pay" checked={method === "online"} onChange={() => setMethod("online")} className="mt-1 h-5 w-5 accent-[#166534]" />
                    <span>
                      <span className="block font-medium">UPI / Card {config.payment.demo && <span className="ml-1 rounded bg-sun px-1.5 py-0.5 text-[11px] font-bold">DEMO</span>}</span>
                      <span className="block text-xs text-ink-soft">{config.payment.note}</span>
                    </span>
                  </label>
                ) : (
                  <p className="flex gap-2 rounded-xl bg-paper p-3 text-sm"><IconInfo size={18} className="shrink-0" />{config.payment.note}</p>
                )}
                <label className={`flex min-h-14 gap-3 rounded-xl p-3 ring-2 ${quote?.codAvailable ? "cursor-pointer" : "opacity-60"} ${method === "cod" ? "bg-leaf-soft ring-leaf" : "ring-line"}`}>
                  <input type="radio" name="pay" disabled={!quote?.codAvailable} checked={method === "cod"} onChange={() => setMethod("cod")} className="mt-1 h-5 w-5 accent-[#166534]" />
                  <span>
                    <span className="block font-medium">Cash on Delivery <span className="ml-1 rounded bg-sun px-1.5 py-0.5 text-[11px] font-bold">DEMO</span></span>
                    <span className="block text-xs text-ink-soft">
                      {quote?.codAvailable ? `${formatPrice(config.codFee)} COD fee applies. Order is recorded for the demo only — nothing ships.` : quote?.codReason ?? "Enter your pincode to check availability."}
                    </span>
                  </span>
                </label>
              </div>
            )}
          </section>
        </form>

        <aside className="mt-5 space-y-3 md:mt-0">
          <section aria-labelledby="sum-title" className="rounded-2xl bg-white p-4 ring-1 ring-line" aria-busy={loading}>
            <h2 id="sum-title" className="mb-3 font-semibold">Order summary</h2>
            <ul className="mb-3 space-y-2">
              {(quote?.lines ?? []).map((l) => (
                <li key={l.sku} className="flex gap-3 text-sm">
                  <span className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {l.image && <ProductImage src={cart.find((c) => c.sku === l.sku)?.image ?? l.image} alt="" sizes="48px" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1">{l.title}</span>
                    <span className="block text-xs text-ink-soft">{l.color}{l.size ? ` · ${l.size}` : ""} · Qty {l.qty}</span>
                    {!l.ok && <span className="block text-xs font-semibold text-danger">{l.problem}</span>}
                  </span>
                  <span className="font-medium">{formatPrice(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            {quoteError && <p role="alert" className="text-sm text-danger">{quoteError}</p>}
            {quote ? <PriceSummary quote={quote} /> : <div className="skeleton h-24" />}
          </section>
          <p className="px-1 text-xs text-ink-soft">
            By placing this order you agree to our <Link href="/help/terms" className="underline">terms</Link>,{" "}
            <Link href="/help/returns" className="underline">returns</Link> and <Link href="/help/privacy" className="underline">privacy</Link> policies.
          </p>
        </aside>
      </div>

      {formError && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{formError}</p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 pt-3 backdrop-blur md:static md:mt-4 md:border-0 md:bg-transparent md:p-0" style={{ paddingBottom: "calc(12px + var(--safe-bottom))" }}>
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div>
            <p className="text-xs text-ink-soft">Total payable</p>
            <p className="font-semibold">{quote ? formatPrice(quote.total) : "…"}</p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting || loading || !quote}
            className="h-12 flex-1 rounded-xl bg-leaf font-semibold text-white disabled:opacity-60 md:max-w-xs"
          >
            {submitting ? "Placing order…" : method === "online" ? `Continue to pay ${quote ? formatPrice(quote.total) : ""}` : "Place order"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
