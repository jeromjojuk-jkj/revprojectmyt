import { NextResponse } from "next/server";
import { paymentConfig } from "@/lib/server/payments";
import { getSettings } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    payment: paymentConfig(),
    deliveryFee: s.deliveryFee,
    freeDeliveryAbove: s.freeDeliveryAbove,
    codFee: s.codFee,
    backInStockAlerts: Boolean(process.env.NOTIFY_PROVIDER),
  });
}
