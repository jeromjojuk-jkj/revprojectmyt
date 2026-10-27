import { checkPerm } from "@/lib/server/auth";
import { readDb, withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { filterOrders } from "@/lib/orderQuery";
import { paymentStateOf, refundedAmount } from "@/lib/orderflow";
import { toCsvRow } from "@/lib/csv";

export async function GET(req: Request) {
  const { ctx, denied } = await checkPerm("orders.export");
  if (denied) return denied;
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const rows = filterOrders((await readDb()).orders, sp);
  const out = [toCsvRow(["order_id", "created_at", "status", "payment_status", "payment_method", "customer", "phone", "email", "city", "state", "pincode", "items", "subtotal", "discount", "coupon", "delivery", "cod_fee", "total", "refunded", "carrier", "awb", "demo"])];
  for (const o of rows) {
    const s = o.shipments?.at(-1);
    out.push(toCsvRow([o.id, o.createdAt, o.status, paymentStateOf(o), o.paymentMethod, o.address.name, o.address.phone, o.address.email, o.address.city, o.address.state, o.address.pincode,
      o.items.map((i) => `${i.qty}x ${i.sku}`).join("; "), o.subtotal, o.discount, o.couponCode ?? "", o.delivery, o.codFee, o.total, refundedAmount(o), s?.carrier ?? "", s?.awb ?? "", o.demo ? "yes" : "no"]));
  }
  // Exports contain customer personal data, so each one is audited.
  await withDb((db) => audit(db, ctx.actor, "order.export", "order", "csv", { after: { rows: rows.length, filters: sp } }));
  return new Response(out.join("\r\n"), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="krip-orders-${new Date().toISOString().slice(0, 10)}.csv"`, "cache-control": "no-store" },
  });
}
