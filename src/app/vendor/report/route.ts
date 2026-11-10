import { NextResponse } from "next/server";
import { readDb } from "@/lib/server/db";
import { getVendor } from "@/lib/server/vendors";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { planOf } from "@/lib/vendorPlans";

export const dynamic = "force-dynamic";

const cell = (x: unknown) => {
  let s = String(x ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // no spreadsheet formulas
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Advance plan: the seller's sales as CSV, one row per item line. */
export async function GET() {
  const v = await getVendor();
  if (!v || v.status !== "approved") return NextResponse.json({ error: "Sign in" }, { status: 401 });
  if (!planOf(v.plan).salesReports) return NextResponse.json({ error: "Sales reports are part of the Advance Business plan." }, { status: 403 });
  const led = vendorLedger(await readDb(), v.id);
  const rows = [["Order", "Date", "Order status", "SKU", "Product", "Qty", "Unit price", "Order items total", "Delivery charge", "Commission", "Your earnings", "Payout"]];
  for (const s of led.sales) {
    s.items.forEach((i, n) => rows.push([s.orderId, s.createdAt.slice(0, 10), s.part?.status ?? s.status, i.sku, i.title, String(i.qty), String(i.unitPrice),
      n === 0 ? String(s.gross) : "", n === 0 ? String(s.delivery) : "", n === 0 ? String(s.commission) : "", n === 0 ? String(s.payout) : "", n === 0 ? s.settlement : ""]));
  }
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="krip-sales-${v.id}.csv"`, "Cache-Control": "no-store" } });
}
