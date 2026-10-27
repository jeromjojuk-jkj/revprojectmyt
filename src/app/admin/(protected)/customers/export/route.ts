import { checkPerm } from "@/lib/server/auth";
import { readDb, withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { deriveCustomers } from "@/lib/server/customers";
import { toCsvRow } from "@/lib/csv";

export async function GET(req: Request) {
  const { ctx, denied } = await checkPerm("customers.export");
  if (denied) return denied;
  const sp = new URL(req.url).searchParams;
  const segment = sp.get("segment");
  const rows = deriveCustomers(await readDb()).filter((c) => !segment || c.segments.includes(segment));
  const out = [toCsvRow(["customer_id", "name", "phone", "email", "orders", "lifetime_spend", "aov", "first_order", "last_order", "segments", "groups"])];
  for (const c of rows) out.push(toCsvRow([c.id, c.name, c.phone, c.email, c.bookedOrders, c.spend, c.aov, c.firstOrderAt, c.lastOrderAt, c.segments.join("; "), c.groups.join("; ")]));
  await withDb((db) => audit(db, ctx.actor, "customer.export", "customer", "csv", { after: { rows: rows.length, segment } }));
  return new Response(out.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="krip-customers-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
