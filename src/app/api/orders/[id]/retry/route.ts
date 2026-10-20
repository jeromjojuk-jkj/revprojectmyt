import { NextResponse } from "next/server";
import { OrderError, retryPayment } from "@/lib/server/orders";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const order = await retryPayment(id, String(body.t ?? ""));
    return NextResponse.json({ next: `/pay/${order.id}?t=${order.accessToken}` });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
