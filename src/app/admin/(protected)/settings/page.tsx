import { readDb } from "@/lib/server/db";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const s = (await readDb()).settings;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Fees & settings</h1>
      <SettingsForm
        initial={{
          deliveryFee: String(s.deliveryFee),
          freeDeliveryAbove: s.freeDeliveryAbove === null ? "" : String(s.freeDeliveryAbove),
          codFee: String(s.codFee),
          codMaxOrderValue: String(s.codMaxOrderValue),
          returnAllowancePct: String(s.returnAllowancePct),
          channelFees: s.channelFees.map((c) => `${c.channel} | ${c.marketplaceFeePct} | ${c.paymentFeePct} | ${c.fixedFee}`).join("\n"),
          coupons: s.coupons.map((c) => `${c.code} | ${c.amountOff} | ${c.minSubtotal} | ${c.active ? "active" : "inactive"} | ${c.description}`).join("\n"),
        }}
      />
    </div>
  );
}
