import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { requirePerm } from "@/lib/server/auth";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  await requirePerm("finance.view");
  const s = (await readDb()).settings;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Delivery & charges</h1>
      <p className="text-sm text-ink-soft">Delivery times, delivery instructions, shopper charges and the cost assumptions behind contribution estimates. Coupons now live in <Link href="/admin/coupons" className="text-leaf underline">Coupons & discounts</Link>.</p>
      <SettingsForm
        initial={{
          deliveryFee: String(s.deliveryFee),
          freeDeliveryAbove: s.freeDeliveryAbove === null ? "" : String(s.freeDeliveryAbove),
          codFee: String(s.codFee),
          codMaxOrderValue: String(s.codMaxOrderValue),
          returnAllowancePct: String(s.returnAllowancePct),
          metroMin: String(s.delivery.metroMin),
          metroMax: String(s.delivery.metroMax),
          standardMin: String(s.delivery.standardMin),
          standardMax: String(s.delivery.standardMax),
          remoteMin: String(s.delivery.remoteMin),
          remoteMax: String(s.delivery.remoteMax),
          codRemote: s.delivery.codRemote ? "on" : "",
          deliveryNote: s.delivery.note,
          channelFees: s.channelFees.map((c) => `${c.channel} | ${c.marketplaceFeePct} | ${c.paymentFeePct} | ${c.fixedFee}`).join("\n"),
        }}
      />
    </div>
  );
}
