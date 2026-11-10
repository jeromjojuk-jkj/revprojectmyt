import { NextResponse } from "next/server";
import { OrderError, syncCashfreePayment } from "@/lib/server/orders";
import { verifyCashfreeWebhook } from "@/lib/server/cashfree";
import { syncVendorFee, VendorError } from "@/lib/server/vendors";

// Cashfree calls this server-to-server. After checking the signature we still
// ask Cashfree's API for the order's state, so the payload itself is never trusted.
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyCashfreeWebhook(raw, req.headers.get("x-webhook-timestamp"), req.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let gatewayOrderId = "";
  try {
    gatewayOrderId = String(JSON.parse(raw)?.data?.order?.order_id ?? "");
  } catch {
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  }
  try {
    // Seller plan fees (KRV-…) and shop orders (KRP-…). Anything else (e.g. Cashfree's test event): acknowledge and ignore.
    if (/^KRV-[0-9A-F]{6}-\d+$/.test(gatewayOrderId)) return NextResponse.json(await syncVendorFee(gatewayOrderId));
    if (!/^KRP-\d{6}-[0-9A-F]{6}-\d+$/.test(gatewayOrderId)) return NextResponse.json({ ignored: true });
    return NextResponse.json(await syncCashfreePayment(gatewayOrderId));
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    if (e instanceof VendorError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    // 5xx makes Cashfree retry the webhook later.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
