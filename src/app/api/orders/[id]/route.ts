import { NextResponse } from "next/server";
import { getOrderForCustomer, toCustomerOrder } from "@/lib/server/orders";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const t = new URL(req.url).searchParams.get("t") ?? "";
  const order = await getOrderForCustomer(id, t);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: toCustomerOrder(order) });
}
