"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CustomerOrder } from "@/lib/server/orders";
import { useHydrated, useStore } from "@/lib/store";
import { formatDate, formatPrice } from "@/lib/format";
import { STATUS_LABEL } from "../order/[id]/OrderView";
import { IconChevron } from "@/components/Icons";

export default function OrdersPage() {
  const hydrated = useHydrated();
  const saved = useStore((s) => s.orders);
  const [orders, setOrders] = useState<(CustomerOrder & { token: string })[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    Promise.all(
      saved.map((o) =>
        fetch(`/api/orders/${o.id}?t=${encodeURIComponent(o.token)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d ? { ...d.order, token: o.token } : null)),
      ),
    )
      .then((list) => setOrders(list.filter(Boolean)))
      .catch(() => setFailed(true));
  }, [hydrated, saved]);

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <h1 className="text-xl font-semibold">Your orders</h1>
      <p className="text-sm text-ink-soft">Orders placed from this device. Sign-in to sync across devices isn’t connected in this prototype.</p>
      {failed && <p role="alert" className="mt-4 text-sm text-danger">Couldn’t load orders. Check your connection and refresh.</p>}
      {!orders && !failed && <div className="mt-4 space-y-2"><div className="skeleton h-20" /><div className="skeleton h-20" /></div>}
      {orders && orders.length === 0 && (
        <div className="mt-8 text-center">
          <p className="font-semibold">No orders yet</p>
          <Link href="/" className="mt-4 inline-flex h-12 items-center rounded-xl bg-leaf px-6 font-semibold text-white">Start shopping</Link>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {orders?.map((o) => (
          <li key={o.id}>
            <Link href={`/order/${o.id}?t=${encodeURIComponent(o.token)}`} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
              <span className="flex-1">
                <span className="block font-semibold">{o.id}</span>
                <span className="text-xs text-ink-soft">
                  {formatDate(o.createdAt, { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((n, i) => n + i.qty, 0)} items · {formatPrice(o.total)}
                </span>
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${o.status === "payment_failed" ? "bg-danger-soft text-danger" : o.status === "cancelled" ? "bg-neutral-100" : "bg-leaf-soft text-leaf"}`}>
                {STATUS_LABEL[o.status]}
              </span>
              <IconChevron size={16} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
