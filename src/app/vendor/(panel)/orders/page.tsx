import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { dispatchState, PART_LABEL } from "@/lib/vendorFulfilment";
import { formatPrice } from "@/lib/format";
import type { VendorPartStatus } from "@/lib/types";

export const metadata = { title: "Seller orders", robots: { index: false } };

const TABS: { id: string; label: string; match: (s: VendorPartStatus | "cancelled") => boolean }[] = [
  { id: "new", label: "New", match: (s) => s === "new" },
  { id: "accepted", label: "To pack", match: (s) => s === "accepted" },
  { id: "packed", label: "Ready to ship", match: (s) => s === "packed" },
  { id: "shipped", label: "Shipped", match: (s) => s === "shipped" },
  { id: "delivered", label: "Delivered", match: (s) => s === "delivered" },
  { id: "issues", label: "Cancelled / issues", match: (s) => s === "cancel_requested" || s === "cancelled" },
];

const fmtDate = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function VendorOrders({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const v = await requireApprovedVendor();
  const { tab = "new" } = await searchParams;
  const db = await readDb();
  const rows = db.orders
    .filter((o) => o.status !== "payment_pending" && o.status !== "payment_failed")
    .flatMap((o) => {
      const part = o.vendorParts?.find((p) => p.vendorId === v.id);
      if (!part) return [];
      const items = o.items.filter((i) => i.vendorId === v.id);
      const state = o.status === "cancelled" ? ("cancelled" as const) : part.status;
      return [{ o, part, items, state }];
    })
    .sort((a, b) => a.part.dispatchBy.localeCompare(b.part.dispatchBy));
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];
  const list = rows.filter((r) => active.match(r.state));
  if (active.id === "delivered" || active.id === "shipped" || active.id === "issues") list.reverse();
  const now = Date.now();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link href="/vendor/shipping" className="text-sm font-medium text-leaf underline">Shipping settings</Link>
      </div>
      <nav className="-mx-4 flex gap-1 overflow-x-auto px-4" aria-label="Order status">
        {TABS.map((t) => {
          const n = rows.filter((r) => t.match(r.state)).length;
          return (
            <Link key={t.id} href={`/vendor/orders?tab=${t.id}`} aria-current={t.id === active.id ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 ${t.id === active.id ? "bg-ink text-white ring-ink" : "bg-white ring-line"}`}>
              {t.label} <span className="opacity-70">{n}</span>
            </Link>
          );
        })}
      </nav>
      {list.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-ink-soft ring-1 ring-line">No orders here.</p>
      ) : (
        <ul className="space-y-2">
          {list.map(({ o, part, items, state }) => {
            const ds = state === "cancelled" ? null : dispatchState(part, now);
            const units = items.reduce((s, i) => s + i.qty, 0);
            return (
              <li key={o.id}>
                <Link href={`/vendor/orders/${o.id}`} className="block rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-leaf">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold">{o.id}</span>
                    <span className="text-xs text-ink-soft">{fmtDate(o.createdAt)}</span>
                    <span className="ml-auto rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium">{state === "cancelled" ? "Cancelled by Krip" : PART_LABEL[part.status]}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm">{items.map((i) => `${i.qty} × ${i.title}`).join(", ")}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-ink-soft">
                    <span>{units} unit{units === 1 ? "" : "s"} · {formatPrice(items.reduce((s, i) => s + i.unitPrice * i.qty, 0))}</span>
                    <span>To {o.address.city}, {o.address.pincode}</span>
                    {ds && <span className={ds === "late" ? "font-semibold text-danger" : ds === "due_today" ? "font-semibold text-gold-ink" : ""}>
                      {ds === "late" ? "Dispatch overdue — was due " : "Dispatch by "}{fmtDate(part.dispatchBy)}
                    </span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
