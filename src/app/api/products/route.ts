import { NextResponse } from "next/server";
import { getPublicProducts, getPublicProductsByIds } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ids = new URL(req.url).searchParams.get("ids");
  const products = ids
    ? await getPublicProductsByIds(ids.split(",").slice(0, 100))
    : await getPublicProducts();
  return NextResponse.json({ products });
}
