import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getOrderForCustomer, handlePaymentWebhook, OrderError } from "@/lib/server/orders";
import { paymentConfig, signPayload, type GatewayEvent } from "@/lib/server/payments";

// DEMO GATEWAY. Plays the role of an external payment provider: it produces a
// signed event and delivers it through the same webhook verification path a
// real provider would use. Disabled unless the demo gateway is active.
export async function POST(req: Request) {
  if (paymentConfig().provider !== "demo") return NextResponse.json({ error: "Demo gateway disabled" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  const order = await getOrderForCustomer(String(body.orderId ?? ""), String(body.t ?? ""));
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status !== "payment_pending") {
    return NextResponse.json({ error: "This payment is no longer pending." }, { status: 409 });
  }
  const outcome = body.outcome === "success" ? "payment.succeeded" : "payment.failed";
  const event: GatewayEvent = {
    id: `demo_evt_${crypto.randomUUID()}`,
    provider: "demo",
    type: outcome,
    orderId: order.id,
    amount: order.total,
    reference: `DEMO-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  const raw = JSON.stringify(event);
  try {
    await handlePaymentWebhook(raw, await signPayload(raw));
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  return NextResponse.json({ next: `/order/${order.id}?t=${encodeURIComponent(String(body.t))}` });
}
