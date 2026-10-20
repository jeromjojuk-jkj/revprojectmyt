import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { orderEstimate } from "@/lib/server/estimates";
import { formatPrice } from "@/lib/format";
import { paymentConfig } from "@/lib/server/payments";
import { resetDemoAction } from "../actions";

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const db = await readDb();
  const { reset } = await searchParams;
  const active = db.products.filter((p) => p.status === "active").length;
  const draft = db.products.filter((p) => p.status === "draft").length;
  const oos = db.products.filter((p) => p.status === "out-of-stock" || p.variants.every((v) => v.stock === 0)).length;
  const lowVariants = db.products.flatMap((p) => p.variants.filter((v) => v.stock > 0 && v.stock <= 3).map((v) => ({ p, v })));
  const live = db.orders.filter((o) => !["payment_pending", "payment_failed", "cancelled"].includes(o.status));
  const toFulfil = db.orders.filter((o) => ["placed", "confirmed", "packed"].includes(o.status));
  const est = live.reduce((s, o) => s + orderEstimate(o, db.products, db.settings).contribution, 0);
  const pay = paymentConfig();

  const Card = ({ label, value, href }: { label: string; value: string | number; href?: string }) => {
    const inner = (<><p className="text-xs text-ink-soft">{label}</p><p className="text-2xl font-semibold">{value}</p></>);
    return href ? <Link href={href} className="rounded-2xl bg-white p-4 ring-1 ring-line hover:ring-leaf">{inner}</Link> : <div className="rounded-2xl bg-white p-4 ring-1 ring-line">{inner}</div>;
  };

  return (
    <div className="space-y-6">
      {reset && <p className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Demo data reset to the sample catalogue.</p>}
      <h1 className="text-xl font-semibold">Overview</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card label="Active products" value={active} href="/admin/products?status=active" />
        <Card label="Drafts" value={draft} href="/admin/products?status=draft" />
        <Card label="Out of stock" value={oos} href="/admin/products?status=out-of-stock" />
        <Card label="Orders to fulfil" value={toFulfil.length} href="/admin/orders" />
      </div>
      <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <p className="text-xs text-ink-soft">Estimated contribution across {live.length} live orders</p>
        <p className="text-2xl font-semibold">{formatPrice(est)} <span className="text-xs font-normal text-ink-soft">(estimate)</span></p>
        <p className="mt-1 text-xs text-ink-soft">Revenue − purchase cost − shipping cost − payment/marketplace fees − return allowance. Not accounting profit; excludes overheads, GST settlement and actual returns.</p>
      </div>
      <section className="rounded-2xl bg-white p-4 ring-1 ring-line">
        <h2 className="font-semibold">Integration status</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li><b>Payments:</b> {pay.demo ? "Demo gateway (no real money)" : pay.onlineEnabled ? pay.provider : "Not connected"} — {pay.note}</li>
          <li><b>Cash on Delivery:</b> Demo — orders are recorded, no courier connected.</li>
          <li><b>Back-in-stock alerts:</b> {process.env.NOTIFY_PROVIDER ? `Provider “${process.env.NOTIFY_PROVIDER}” configured` : "Not offered — no notification service connected."}</li>
          <li><b>Marketplace sync:</b> Not connected. Products are added manually or via validated CSV import; outbound links to real Krip listings can be added per product.</li>
          <li><b>Datastore:</b> Local JSON file (prototype). Use a transactional database before running multiple servers.</li>
        </ul>
      </section>
      {lowVariants.length > 0 && (
        <section className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <h2 className="font-semibold">Low stock (≤ 3 units) — internal only</h2>
          <ul className="mt-2 grid gap-1 text-sm md:grid-cols-2">
            {lowVariants.slice(0, 20).map(({ p, v }) => (
              <li key={v.sku}><Link href={`/admin/products/${p.id}`} className="text-leaf underline">{p.title}</Link> — {v.color}{v.size ? ` / ${v.size}` : ""}: {v.stock}</li>
            ))}
          </ul>
        </section>
      )}
      <form action={resetDemoAction}>
        <button className="h-11 rounded-xl px-4 text-sm font-semibold text-danger ring-1 ring-danger">Reset demo data (deletes all orders and edits)</button>
      </form>
    </div>
  );
}
