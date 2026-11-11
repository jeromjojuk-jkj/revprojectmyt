import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { readDb } from "@/lib/server/db";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { VendorProductForm } from "../VendorProductForm";
import { commissionOf, describeCommission } from "@/lib/vendorPlans";
import { getSettings } from "@/lib/server/catalog";

export const metadata = { title: "Edit product", robots: { index: false } };

export default async function EditVendorProduct({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireApprovedVendor();
  const { id } = await params;
  const p = (await readDb()).products.find((x) => x.id === id && x.vendorId === v.id);
  if (!p) notFound();
  const initial: Record<string, string> = {
    id: p.id, title: p.title, category: p.category, subcategory: p.subcategory, description: p.description, features: (p.features ?? []).join("\n"), howToUse: (p.howToUse ?? []).join("\n"),
    price: String(p.price), mrp: p.mrp === null ? "" : String(p.mrp), stock: String(p.variants[0]?.stock ?? 0), colour: p.variants[0]?.color ?? "",
    packageContents: p.packageContents ?? "", material: p.material ?? "", returnType: p.returnPolicy.type, images: p.images.join("\n"),
  };
  const r = p.private.review;
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/vendor/products" className="text-sm text-leaf underline">← Products</Link>
      <h1 className="text-2xl font-bold">Edit product</h1>
      {r?.status === "rejected" && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger"><b>Krip didn’t approve this listing:</b> {r.note || "Please check the details and photos."} Fix it and save to send it again.</p>}
      <VendorProductForm initial={initial} categories={CATEGORIES.map((c) => ({ id: c.id, name: c.name }))} commission={describeCommission(commissionOf(await getSettings()))} live={p.status === "active"} />
    </div>
  );
}
