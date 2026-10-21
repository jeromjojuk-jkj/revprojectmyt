import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { deriveCustomers } from "@/lib/server/customers";
import { filterOrders } from "@/lib/orderQuery";
import { formatPrice } from "@/lib/format";
import { STATUS_LABEL } from "@/lib/orderflow";
import { Card, Empty, PageHeader } from "@/app/admin/_components/ui";

export const metadata = { title: "Search" };

export default async function AdminSearch({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requireStaff();
  const q = ((await searchParams).q ?? "").trim();
  const db = await readDb();
  const lq = q.toLowerCase();
  // An exact order ID goes straight to the order.
  if (ctx.can("orders.view") && db.orders.some((o) => o.id === q.toUpperCase())) redirect(`/admin/orders/${q.toUpperCase()}`);
  const orders = q && ctx.can("orders.view") ? filterOrders(db.orders, { q }).slice(0, 10) : [];
  const products = q && ctx.can("products.view") ? db.products.filter((p) => `${p.title} ${p.id} ${p.brand} ${p.variants.map((v) => v.sku).join(" ")}`.toLowerCase().includes(lq)).slice(0, 10) : [];
  const digits = q.replace(/\D/g, "");
  const customers = q && ctx.can("customers.view") ? deriveCustomers(db).filter((c) => c.name.toLowerCase().includes(lq) || c.email.toLowerCase().includes(lq) || (digits.length >= 4 && c.phone.includes(digits))).slice(0, 10) : [];
  const total = orders.length + products.length + customers.length;
  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title={q ? `Results for “${q}”` : "Search"} description="Searches orders, products and customers you have access to." />
      {!q ? <Empty title="Type in the search bar above">Order ID, customer name, phone, email, SKU or product title.</Empty> : total === 0 ? <Empty title="Nothing found">Try an order ID like KRP-261020-ABC123, a phone number, or a SKU.</Empty> : (
        <>
          {orders.length > 0 && <Card title={`Orders (${orders.length})`}><ul className="divide-y divide-line">{orders.map((o) => <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex justify-between gap-2 py-2.5 text-sm hover:text-leaf"><span><b>{o.id}</b> · {o.address.name}</span><span className="text-ink-soft">{STATUS_LABEL[o.status]} · {formatPrice(o.total)}</span></Link></li>)}</ul></Card>}
          {products.length > 0 && <Card title={`Products (${products.length})`}><ul className="divide-y divide-line">{products.map((p) => <li key={p.id}><Link href={`/admin/products/${p.id}`} className="flex justify-between gap-2 py-2.5 text-sm hover:text-leaf"><span>{p.title}</span><span className="text-ink-soft">{p.status} · {formatPrice(p.price)}</span></Link></li>)}</ul></Card>}
          {customers.length > 0 && <Card title={`Customers (${customers.length})`}><ul className="divide-y divide-line">{customers.map((c) => <li key={c.id}><Link href={`/admin/customers/${c.id}`} className="flex justify-between gap-2 py-2.5 text-sm hover:text-leaf"><span>{c.name}</span><span className="text-ink-soft">{c.bookedOrders} orders · {formatPrice(c.spend)}</span></Link></li>)}</ul></Card>}
        </>
      )}
    </div>
  );
}
