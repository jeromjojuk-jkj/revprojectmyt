import Link from "next/link";
import { notFound } from "next/navigation";
import { readDb } from "@/lib/server/db";
import { productEstimates } from "@/lib/server/estimates";
import { toRawInput } from "@/lib/productInput";
import { formatPrice } from "@/lib/format";
import { ProductForm } from "./ProductForm";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const { saved } = await searchParams;
  const db = await readDb();
  const p = id === "new" ? null : db.products.find((x) => x.id === id);
  if (id !== "new" && !p) notFound();
  const est = p ? productEstimates(p, db.settings) : [];
  return (
    <div className="space-y-4">
      <Link href="/admin/products" className="text-sm text-leaf underline">← Products</Link>
      <h1 className="text-xl font-semibold">{p ? `Edit: ${p.title}` : "Add product"}</h1>
      {saved && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Saved.{p?.status === "active" ? <> <Link href={`/product/${p.slug}`} className="underline">View in store</Link></> : null}</p>}
      {p && (
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
      <ProductForm initial={p ? toRawInput(p) : { status: "draft", returnType: "returnable", returnDays: "7", shippingCost: "50", brand: "Krip Studio" }} id={p?.id ?? ""} />
    </div>
  );
}
