import { NextResponse } from "next/server";
import { createOrder, OrderError } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const order = await createOrder({
      idempotencyKey: body.idempotencyKey,
      items: body.items,
      address: body.address ?? {},
      paymentMethod: body.paymentMethod,
      couponCode: body.couponCode ?? null,
      expectedTotal: Number(body.expectedTotal),
    });
    return NextResponse.json({
      orderId: order.id,
      token: order.accessToken,
      status: order.status,
      next: order.status === "payment_pending" ? `/pay/${order.id}?t=${order.accessToken}` : `/order/${order.id}?t=${order.accessToken}`,
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return NextResponse.json({ error: e.message, code: e.code, details: e.extra ?? null }, { status: e.status });
    }
    console.error(e);
    return NextResponse.json({ error: "Something went wrong. Your order was not placed." }, { status: 500 });
  }
}
