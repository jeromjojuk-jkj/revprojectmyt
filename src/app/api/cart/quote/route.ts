import { NextResponse } from "next/server";
import { readDb } from "@/lib/server/db";
import { toPublicProduct } from "@/lib/server/catalog";
import { computeQuote } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items)) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const db = await readDb();
  const quote = computeQuote(
    {
      items: body.items.slice(0, 30),
      pincode: typeof body.pincode === "string" ? body.pincode : null,
      paymentMethod: body.paymentMethod === "cod" ? "cod" : body.paymentMethod === "online" ? "online" : null,
      couponCode: typeof body.couponCode === "string" ? body.couponCode.slice(0, 30) : null,
    },
    db.products.filter((p) => p.status !== "draft" && p.status !== "archived").map(toPublicProduct),
    db.settings,
  );
  return NextResponse.json({ quote });
}
