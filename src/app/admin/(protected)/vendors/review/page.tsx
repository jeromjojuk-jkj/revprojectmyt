import Link from "next/link";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { CATEGORY_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { Card, Empty, PageHeader, btn, field } from "@/app/admin/_components/ui";
import { VForm } from "../VForm";
import { reviewListingAction } from "@/app/admin/vendorActions";

export const metadata = { title: "Listing review" };
export const dynamic = "force-dynamic";

export default async function ListingReview() {
  await requirePerm("vendors.approve");
  const db = await readDb();
  const queue = db.products.filter((p) => p.vendorId && p.private.review?.status === "pending").sort((a, b) => (a.private.review!.at).localeCompare(b.private.review!.at));
  return (
    <div className="space-y-4">
      <PageHeader title="Listing review" description="Every seller product is checked before it goes live, and again when the seller changes its name, photos or description. Reject copies of brands or cartoon characters without a licence, unsafe or banned items, and claims the seller can’t back up." />
      {queue.length === 0 ? <Empty title="Nothing to review">New seller listings appear here.</Empty> : queue.map((p) => {
        const v = db.vendors.find((x) => x.id === p.vendorId);
        return (
          <Card key={p.id} title={p.title} actions={<span className="text-xs text-ink-soft">by <Link href={`/admin/vendors/${p.vendorId}`} className="text-leaf underline">{v?.businessName ?? p.vendorId}</Link> · sent {new Date(p.private.review!.at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>}>
            <div className="grid gap-4 md:grid-cols-[280px_1fr]">
              <div className="grid grid-cols-3 gap-2">
                {p.images.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="aspect-square w-full rounded-lg bg-paper object-contain ring-1 ring-line" />
                  </a>
                ))}
              </div>
              <div className="space-y-2 text-sm">
                <p><b>{formatPrice(p.price)}</b>{p.mrp ? <> · MRP {formatPrice(p.mrp)}</> : null} · {CATEGORY_NAME[p.category] ?? p.category} / {p.subcategory} · {p.variants[0]?.color} · stock {p.variants[0]?.stock ?? 0} · {p.returnPolicy.type}</p>
                <p className="whitespace-pre-line text-ink-soft">{p.description}</p>
                {(p.features?.length ?? 0) > 0 && <ul className="list-disc pl-5">{p.features!.map((f) => <li key={f}>{f}</li>)}</ul>}
                {p.material && <p>Material: {p.material}</p>}
                {p.packageContents && <p>In the box: {p.packageContents}</p>}
                <div className="flex flex-wrap items-start gap-2 pt-2">
                  <VForm action={reviewListingAction} hidden={{ id: p.id, op: "approve" }}><button className={btn.primary}>Approve & publish</button></VForm>
                  <VForm action={reviewListingAction} hidden={{ id: p.id, op: "reject" }} className="flex flex-wrap items-start gap-2">
                    <input name="note" placeholder="What the seller must fix" className={`${field} w-72`} aria-label="Reason" />
                    <button className={btn.danger}>Send back</button>
                  </VForm>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
