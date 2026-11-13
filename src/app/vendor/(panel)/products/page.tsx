import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { planOf, shippingOf } from "@/lib/vendorPlans";
import { formatPrice } from "@/lib/format";
import { toggleFeaturedAction } from "@/app/vendor/productActions";
import { DeleteVendorProduct } from "./DeleteVendorProduct";

export const metadata = { title: "Seller products", robots: { index: false } };

export default async function VendorProducts({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string }> }) {
  const v = await requireApprovedVendor();
  const { saved, deleted } = await searchParams;
  const db = await readDb();
  const plan = planOf(v.plan);
  const mine = db.products.filter((p) => p.vendorId === v.id && p.status !== "archived").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const featured = mine.filter((p) => p.private.featured).length;
  const canAdd = plan.productLimit === null || mine.length < plan.productLimit;
  const badge = (p: (typeof mine)[number]) => {
    const r = p.private.review?.status;
    if (r === "pending") return ["Waiting for Krip review", "bg-sun-soft"];
    if (r === "rejected") return ["Not approved — edit & resend", "bg-danger-soft text-danger"];
    if (p.status === "active") return p.variants.every((x) => x.stock <= 0) ? ["Live · out of stock", "bg-danger-soft text-danger"] : ["Live", "bg-leaf-soft text-leaf"];
    if (p.status === "out-of-stock") return ["Out of stock", "bg-danger-soft text-danger"];
    return ["Hidden", "bg-paper"];
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-ink-soft">{mine.length} of {plan.productLimit ?? "unlimited"} on your {plan.name} plan{plan.featuredSlots ? ` · ${featured}/${plan.featuredSlots} featured on the homepage` : ""}</p>
        </div>
        {canAdd ? <Link href="/vendor/products/new" className="flex h-11 items-center rounded-xl bg-leaf px-5 font-semibold text-white">Add a product</Link>
          : <p className="text-sm text-danger">Product limit reached for your plan.</p>}
      </div>
      {saved && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm font-medium text-leaf">Saved. If anything needs Krip’s review, you’ll see it here once it’s checked.</p>}
      {deleted && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm font-medium text-leaf">Product deleted.</p>}
      {shippingOf(v).onHoliday && <p className="rounded-xl bg-sun-soft p-3 text-sm">Holiday mode is on — your products are hidden from the shop. <Link href="/vendor/shipping" className="underline">Change</Link></p>}
      {mine.length === 0 ? <p className="rounded-2xl bg-white p-6 text-center text-ink-soft ring-1 ring-line">No products yet. Add your first one — Krip reviews it before it goes live.</p> : (
        <ul className="space-y-2">
          {mine.map((p) => {
            const [label, cls] = badge(p);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images[0]} alt="" className="size-16 shrink-0 rounded-lg bg-paper object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 font-medium">{p.title}</p>
                  <p className="text-sm text-ink-soft">{formatPrice(p.price)} · stock {p.variants.reduce((s, x) => s + x.stock, 0)} · SKU {p.variants[0]?.sku}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
                  {p.private.review?.status === "rejected" && p.private.review.note && <p className="mt-1 text-xs text-danger">{p.private.review.note}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.featuredSlots > 0 && p.status === "active" && (
                    <form action={toggleFeaturedAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button disabled={!p.private.featured && featured >= plan.featuredSlots} className="h-10 rounded-xl px-3 text-sm font-medium ring-1 ring-line disabled:opacity-50">{p.private.featured ? "★ Featured" : "☆ Feature"}</button>
                    </form>
                  )}
                  {p.status === "active" && <Link href={`/product/${p.slug}`} className="flex h-10 items-center rounded-xl px-3 text-sm font-medium ring-1 ring-line">View</Link>}
                  <Link href={`/vendor/products/${p.id}`} className="flex h-10 items-center rounded-xl bg-ink px-3 text-sm font-medium text-white">Edit</Link>
                  <DeleteVendorProduct id={p.id} title={p.title} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
