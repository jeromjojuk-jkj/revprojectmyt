import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/server/catalog";
import { suggest } from "@/lib/search";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  return NextResponse.json({ suggestions: suggest(await getPublicProducts(), q) });
}
