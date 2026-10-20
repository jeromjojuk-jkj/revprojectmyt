import { NextResponse } from "next/server";
import { estimateDelivery } from "@/lib/pincode";

export async function GET(_req: Request, ctx: { params: Promise<{ pin: string }> }) {
  const { pin } = await ctx.params;
  const est = estimateDelivery(pin);
  if (!est) return NextResponse.json({ error: "Enter a valid 6-digit pincode." }, { status: 400 });
  return NextResponse.json({ estimate: est });
}
