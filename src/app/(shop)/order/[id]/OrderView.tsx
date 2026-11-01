"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { CustomerOrder } from "@/lib/server/orders";
import type { OrderStatus } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { toast, useStore } from "@/lib/store";
import { ProductImage } from "@/components/ProductImage";
import { IconCheck, IconInfo, IconX } from "@/components/Icons";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "placed", label: "Order placed" },
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "delivered", label: "Delivered" },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  payment_pending: "Awaiting payment",
  payment_failed: "Payment failed",
  placed: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderView({ order, token }: { order: CustomerOrder; token: string }) {
  const router = useRouter();
  const saveOrder = useStore((s) => s.saveOrder);
  const addToCart = useStore((s) => s.addToCart);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveOrder({ id: order.id, token, createdAt: order.createdAt });
  }, [order.id, order.createdAt, token, saveOrder]);

  // A short celebration the first time a successful order is shown on this device.
  useEffect(() => {
    if (!["placed", "confirmed"].includes(order.status)) return;
    try {
      const key = `krip-celebrated-${order.id}`;
      if (sessionStorage.getItem(key) || localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {}
    import("@/lib/confetti").then((m) => m.confetti());
  }, [order.id, order.status]);

  const post = async (path: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: token }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error ?? "Something went wrong");
      if (d.next) router.push(d.next);
      else router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const restore = () => {
    for (const it of order.items) {
      addToCart({ sku: it.sku, productId: it.productId, slug: it.slug, title: it.title, color: it.color, size: it.size, image: it.image, price: it.unitPrice }, it.qty);
    }
    toast({ message: "Items added back to your bag", action: { label: "View bag", href: "/cart" } });
  };

  const s = order.status;
  const reached = (st: OrderStatus) => {
    const order_ = STEPS.map((x) => x.status);
    const cur = s === "confirmed" && order.paymentMethod === "online" ? 1 : order_.indexOf(s);
    return order_.indexOf(st) <= cur;
  };

  const header =
    s === "payment_failed"
      ? { tone: "bg-danger-soft text-danger", icon: <IconX />, title: "Payment failed", text: "No payment was confirmed for this order, so nothing has been charged and your items were released." }
      : s === "payment_pending"
        ? { tone: "bg-sun-soft text-ink", icon: <IconInfo />, title: "Waiting for payment confirmation", text: "We’ll confirm your order only when the payment provider confirms the payment to our server. Just paid? Refresh this page in a minute." }
        : s === "cancelled"
          ? { tone: "bg-neutral-100 text-ink", icon: <IconX />, title: "Order cancelled", text: order.paymentMethod === "online" && order.paymentEvents.some((e) => e.type === "payment.succeeded") ? `Any refund is issued through the original payment provider.${order.demo ? " In this demo, no money was taken." : ""}` : "This order was cancelled." }
          : order.paymentMethod === "cod"
            ? { tone: "bg-leaf-soft text-leaf", icon: <IconCheck />, title: "Order placed — Cash on Delivery", text: order.demo ? "Demo order: recorded in Krip’s system for testing. It will not be shipped." : "Pay in cash when your order is delivered. We’ll share tracking details once it ships." }
            : { tone: "bg-leaf-soft text-leaf", icon: <IconCheck />, title: "Payment confirmed — order placed", text: order.demo ? (order.paymentProvider === "cashfree" ? "Confirmed by Cashfree in test mode. Test order: no real money moved and nothing will ship." : "Confirmed by the demo gateway’s signed callback. Demo order: no real money moved and nothing will ship.") : "Payment confirmed by the payment provider." };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
      <div className={`flex gap-3 rounded-2xl p-4 ${header.tone}`} role="status">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/70">{header.icon}</span>
        <div>
          <h1 className="text-lg font-semibold">{header.title}</h1>
          <p className="text-sm">{header.text}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {s === "payment_failed" && (
          <>
            <button type="button" disabled={busy} onClick={() => post("retry")} className="h-12 flex-1 rounded-xl bg-leaf px-4 font-semibold text-white disabled:opacity-60">Retry payment</button>
            <button type="button" onClick={restore} className="h-12 flex-1 rounded-xl px-4 font-semibold text-leaf ring-2 ring-leaf">Put items back in bag</button>
          </>
        )}
        {s === "payment_pending" && (
          <Link href={`/pay/${order.id}?t=${encodeURIComponent(token)}`} className="flex h-12 flex-1 items-center justify-center rounded-xl bg-leaf px-4 font-semibold text-white">Complete payment</Link>
        )}
        {(s === "placed" || s === "confirmed" || s === "payment_pending") && (
          <button type="button" disabled={busy} onClick={() => confirm("Cancel this order?") && post("cancel")} className="h-12 rounded-xl px-4 font-semibold text-ink ring-1 ring-line disabled:opacity-60">Cancel order</button>
        )}
      </div>
      {error && <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}

      <section className="rounded-2xl bg-white p-4 ring-1 ring-line" aria-labelledby="track">
        <div className="flex items-baseline justify-between">
          <h2 id="track" className="font-semibold">Order {order.id}</h2>
          <span className="text-xs text-ink-soft">{formatDate(order.createdAt, { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        {!["payment_failed", "payment_pending", "cancelled"].includes(s) && (
          <ol className="mt-4 space-y-0">
            {STEPS.map((st, i) => {
              const done = reached(st.status);
              const h = order.statusHistory.find((x) => x.status === st.status);
              return (
                <li key={st.status} className="flex gap-3">
                  <span className="flex flex-col items-center">
                    <span className={`grid h-6 w-6 place-items-center rounded-full ${done ? "bg-leaf text-white" : "bg-neutral-200"}`}>{done && <IconCheck size={14} />}</span>
                    {i < STEPS.length - 1 && <span className={`w-0.5 flex-1 ${done ? "bg-leaf" : "bg-neutral-200"}`} style={{ minHeight: 22 }} />}
                  </span>
                  <span className="pb-3 text-sm">
                    <span className={done ? "font-semibold" : "text-ink-soft"}>{st.label}</span>
                    {h && <span className="block text-xs text-ink-soft">{formatDate(h.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-2 text-xs text-ink-soft">Tracking updates appear here when the Krip team updates your order. Courier tracking links will be added once a shipping partner is connected.</p>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-line" aria-labelledby="items-title">
        <h2 id="items-title" className="mb-3 font-semibold">Items</h2>
        <ul className="space-y-3">
          {order.items.map((it) => (
            <li key={it.sku} className="flex gap-3 text-sm">
              <Link href={`/product/${it.slug}`} className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <ProductImage src={it.image} alt={it.title} sizes="56px" />
              </Link>
              <span className="flex-1">
                <span className="block font-medium">{it.title}</span>
                <span className="text-xs text-ink-soft">{it.color}{it.size ? ` · ${it.size}` : ""} · Qty {it.qty}</span>
              </span>
              <span className="font-medium">{formatPrice(it.unitPrice * it.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-line pt-3 text-sm">
          <div className="flex justify-between"><dt>Items</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 && <div className="flex justify-between text-leaf"><dt>Discount ({order.couponCode})</dt><dd>−{formatPrice(order.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{formatPrice(order.delivery)}</dd></div>
          {order.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{formatPrice(order.codFee)}</dd></div>}
          <div className="flex justify-between font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
          <div className="flex justify-between text-ink-soft"><dt>Payment</dt><dd>{order.paymentMethod === "cod" ? `Cash on Delivery${order.demo ? " (demo)" : ""}` : `Online (${order.paymentProvider}${order.demo ? " · demo" : ""})`}</dd></div>
        </dl>
      </section>

      <section className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line" aria-labelledby="addr">
        <h2 id="addr" className="mb-1 font-semibold">Delivering to</h2>
        <p>{order.address.name} · {order.address.phone}</p>
        <p className="text-ink-soft">{[order.address.line1, order.address.line2, order.address.landmark, order.address.city, order.address.state, order.address.pincode].filter(Boolean).join(", ")}</p>
      </section>

      <p className="text-center text-xs text-ink-soft">
        Save this page’s link to view your order later — it’s also listed under <Link href="/orders" className="underline">Your orders</Link> on this device.
      </p>
    </div>
  );
}
