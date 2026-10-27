import { NextResponse } from "next/server";
import { cancelOrderByCustomer, OrderError, toCustomerOrder } from "@/lib/server/orders";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  try {
    const order = await cancelOrderByCustomer(id, String(body.t ?? ""));
    return NextResponse.json({ order: toCustomerOrder(order) });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
}
