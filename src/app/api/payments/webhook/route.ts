import { NextResponse } from "next/server";
import { handlePaymentWebhook, OrderError } from "@/lib/server/orders";

// Payment providers call this endpoint server-to-server. The raw body must be
// verified against the provider signature before anything is trusted.
export async function POST(req: Request) {
  const raw = await req.text();
  try {
    const result = await handlePaymentWebhook(raw, req.headers.get("x-krip-signature"));
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
