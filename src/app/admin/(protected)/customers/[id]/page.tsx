import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { deriveCustomers } from "@/lib/server/customers";
import { formatDate, formatPrice } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_LABEL, paymentStateOf } from "@/lib/orderflow";
import { Badge, Card, PageHeader } from "@/app/admin/_components/ui";
import { CustomerNotes } from "./CustomerNotes";

export const metadata = { title: "Customer" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requirePerm("customers.view");
  const { id } = await params;
  const db = await readDb();
  const c = deriveCustomers(db).find((x) => x.id === id);
  if (!c) notFound();
  const notes = db.customers[id]?.notes ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title={c.name} description={<>Customer since {formatDate(c.firstOrderAt, { day: "numeric", month: "short", year: "numeric" })} · guest checkout (no account)</>} />
      <div className="flex flex-wrap gap-1">{c.segments.map((s) => <Badge key={s}>{s}</Badge>)}{c.groups.map((g) => <Badge key={g} tone="blue">{g}</Badge>)}</div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[["Orders", String(c.bookedOrders)], ["Lifetime spend", formatPrice(c.spend)], ["Average order", formatPrice(c.aov)], ["Last order", formatDate(c.lastOrderAt, { day: "numeric", month: "short" })]].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-white p-4 ring-1 ring-line"><p className="text-xs text-ink-soft">{l}</p><p className="text-xl font-bold tabular-nums">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title={`Orders (${c.orders.length})`}>
            <ul className="divide-y divide-line">
              {[...c.orders].reverse().map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-2 py-2.5 text-sm hover:text-leaf">
                    <span><b>{o.id}</b><span className="block text-xs text-ink-soft">{formatDate(o.createdAt, { day: "numeric", month: "short", year: "numeric" })} · {o.items.reduce((s, i) => s + i.qty, 0)} items</span></span>
                    <span className="text-right"><span className="block font-semibold tabular-nums">{formatPrice(o.total)}</span><span className="text-xs text-ink-soft">{STATUS_LABEL[o.status]} · {PAYMENT_LABEL[paymentStateOf(o)]}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Internal notes & groups">
            <ul className="mb-3 space-y-2 text-sm">
              {notes.length === 0 && <li className="text-ink-soft">No notes yet.</li>}
              {[...notes].reverse().map((n, i) => <li key={i} className="rounded-lg bg-paper px-3 py-2"><p>{n.text}</p><p className="text-xs text-ink-soft">{n.by} · {formatDate(n.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</p></li>)}
            </ul>
            {ctx.can("customers.edit") && <CustomerNotes id={c.id} groups={c.groups.join(", ")} />}
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Contact">
            <p className="text-sm"><a className="text-leaf" href={`tel:${c.phone}`}>{c.phone}</a></p>
            {c.email && <p className="truncate text-sm"><a className="text-leaf" href={`mailto:${c.email}`}>{c.email}</a></p>}
            <p className="mt-2 text-xs text-ink-soft">Marketing consent isn’t collected at checkout yet, so don’t add this customer to campaigns.</p>
          </Card>
          <Card title={`Addresses (${c.addresses.length})`}>
            <ul className="space-y-3 text-sm">{c.addresses.map((a, i) => <li key={i}><address className="not-italic">{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}, {a.state} {a.pincode}</address></li>)}</ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
