import { requireApprovedVendor } from "@/lib/server/vendors";
import { shippingOf } from "@/lib/vendorPlans";
import { ShippingForm } from "./ShippingForm";

export const metadata = { title: "Shipping settings", robots: { index: false } };

export default async function VendorShipping() {
  const v = await requireApprovedVendor();
  const s = shippingOf(v);
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Shipping settings</h1>
      <p className="text-sm text-ink-soft">You ship your orders yourself with any courier. These settings apply to your products only — Krip’s own products have Krip’s delivery charge. The delivery charge a customer pays for your items is added to your earnings.</p>
      <ShippingForm initial={{ fee: String(s.fee), freeAbove: s.freeAbove === null ? "" : String(s.freeAbove), handlingDays: String(s.handlingDays), courier: s.courier, onHoliday: s.onHoliday }} pickup={`${v.address}, ${v.city}, ${v.state} – ${v.pincode}`} />
    </div>
  );
}
