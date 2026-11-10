import { NextResponse } from "next/server";
import { feeCheckoutSession, VendorError } from "@/lib/server/vendors";

export async function POST(req: Request) {
  const origin = (process.env.SITE_URL?.trim() || new URL(req.url).origin).replace(/\/$/, "");
  try {
    return NextResponse.json(await feeCheckoutSession(origin));
  } catch (e) {
    if (e instanceof VendorError) return NextResponse.json({ error: e.message }, { status: e.status });
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Couldn’t reach the payment provider. Nothing was charged — please try again." }, { status: 502 });
  }
}
