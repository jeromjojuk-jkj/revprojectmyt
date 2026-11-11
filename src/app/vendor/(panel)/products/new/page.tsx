import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { VendorProductForm } from "../VendorProductForm";
import { commissionOf, describeCommission } from "@/lib/vendorPlans";
import { getSettings } from "@/lib/server/catalog";

export const metadata = { title: "Add a product", robots: { index: false } };

export default async function NewVendorProduct() {
  await requireApprovedVendor();
  return (
    <div className="max-w-3xl space-y-4">
      <Link href="/vendor/products" className="text-sm text-leaf underline">← Products</Link>
      <h1 className="text-2xl font-bold">Add a product</h1>
      <VendorProductForm initial={{}} categories={CATEGORIES.map((c) => ({ id: c.id, name: c.name }))} commission={describeCommission(commissionOf(await getSettings()))} live={false} />
    </div>
  );
}
