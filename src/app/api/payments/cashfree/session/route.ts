import { NextResponse } from "next/server";
import { getCashfreeSession, OrderError } from "@/lib/server/orders";
import { paymentConfig } from "@/lib/server/payments";

export async function POST(req: Request) {
  if (paymentConfig().provider !== "cashfree" || !paymentConfig().onlineEnabled) {
    return NextResponse.json({ error: "Online payment isn’t available right now." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  // SITE_URL pins the address Cashfree sends shoppers back to; otherwise use the one they're on.
  const origin = (process.env.SITE_URL?.trim() || new URL(req.url).origin).replace(/\/$/, "");
  try {
    return NextResponse.json(await getCashfreeSession(String(body.orderId ?? ""), String(body.t ?? ""), origin));
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: "Couldn’t reach the payment provider. Nothing was charged — please try again." }, { status: 502 });
  }
}
