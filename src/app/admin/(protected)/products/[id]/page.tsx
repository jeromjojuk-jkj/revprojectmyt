import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/server/db";
import { requirePerm } from "@/lib/server/auth";
import { duplicateProductAction } from "@/app/admin/opsActions";
import { productEstimates } from "@/lib/server/estimates";
import { toRawInput } from "@/lib/productInput";
import { formatPrice } from "@/lib/format";
import { ProductForm } from "./ProductForm";
import { DeleteProduct } from "./DeleteProduct";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const ctx = await requirePerm(id === "new" ? "products.create" : "products.view");
  const db = await readDb();
  const p = id === "new" ? null : db.products.find((x) => x.id === id);
  if (id !== "new" && !p) notFound();
  const est = p && ctx.can("finance.view") ? productEstimates(p, db.settings) : [];
  const history = p ? db.audit.filter((a) => a.entityType === "product" && (a.entityId === p.id || a.entityId.split(",").includes(p.id))).slice(-15).reverse() : [];
  const moves = p ? db.movements.filter((m) => m.productId === p.id).slice(-10).reverse() : [];
  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="text-sm text-leaf underline">← Products</Link>
      <h1 className="text-xl font-semibold">{p ? `Edit: ${p.title}` : "Add product"}</h1>
      {saved && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Saved.{p?.status === "active" ? <> <Link href={`/product/${p.slug}`} className="underline">View in store</Link></> : null}</p>}
      {p && ctx.can("products.create") && (
        <form action={duplicateProductAction}><input type="hidden" name="id" value={p.id} /><button className="h-10 rounded-lg px-4 text-sm font-semibold ring-1 ring-line">Duplicate as draft</button></form>
      )}
      {est.length > 0 && (
        <div className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line">
          <p className="font-semibold">Estimated contribution per unit</p>
          <ul className="mt-1 flex flex-wrap gap-4">
            {est.map((e) => (
              <li key={e.channel}>{e.channel}: {e.contribution === null ? "no price set" : `${formatPrice(e.contribution)} (${e.marginPct}%) · fees ${formatPrice(e.fees!)} · returns ${formatPrice(e.returns!)}`}</li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-ink-soft">Estimate = price − purchase cost − shipping − fees − return allowance.</p>
        </div>
      )}
      {p && (history.length > 0 || moves.length > 0) && (
        <details className="rounded-2xl bg-white p-4 text-sm ring-1 ring-line">
          <summary className="cursor-pointer font-semibold">Change history & stock movements</summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <ul className="space-y-1 text-xs">{history.map((h) => <li key={h.seq}><b>{h.action}</b> · {h.actorName} · {new Date(h.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</li>)}</ul>
            <ul className="space-y-1 text-xs">{moves.map((m) => <li key={m.id}><span className="font-mono">{m.sku}</span> {m.delta > 0 ? `+${m.delta}` : m.delta} → {m.balanceAfter} · {m.reason} · {m.ref}</li>)}</ul>
          </div>
        </details>
      )}
      <ProductForm initial={p ? toRawInput(p) : { status: "draft", returnType: "returnable", returnDays: "7", shippingCost: "50", brand: "Krip Studio" }} id={p?.id ?? ""} />
      {p && ctx.can("products.delete") && <DeleteProduct id={p.id} title={p.title} vendor={p.vendorId ? db.vendors.find((v) => v.id === p.vendorId)?.businessName ?? p.vendorId : null} />}
    </div>
  );
}
