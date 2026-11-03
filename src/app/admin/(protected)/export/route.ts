import { checkPerm } from "@/lib/server/auth";
import { readDb, withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { CSV_COLUMNS } from "@/lib/productInput";
import { toCsvRow } from "@/lib/csv";

const PRIVATE_COLUMNS = ["supplier_name", "source_ref", "purchase_cost", "shipping_cost", "other_cost"] as const;

// Staff with products.export; private supplier and cost columns only for finance roles.
export async function GET() {
  const { ctx, denied } = await checkPerm("products.export");
  if (denied) return denied;
  const db = await readDb();
  const out = [toCsvRow([...CSV_COLUMNS])];
  for (const p of db.products) {
    for (const v of p.variants) {
      const row: Record<string, string | number> = {
        slug: p.slug, title: p.title, brand: p.brand, category: p.category, subcategory: p.subcategory, description: p.description,
        price: p.price, mrp: p.mrp ?? "", status: p.status, image_urls: p.images.join("|"), sku: v.sku, color: v.color,
        color_hex: "#" + v.colorHex, size: v.size ?? "", stock: v.stock, fit: p.fit ?? "", material: p.material ?? "",
        care: p.care.join("|"), package_contents: p.packageContents ?? "", origin: p.origin ?? "", seller: p.seller ?? "",
        style_tags: p.styleTags.join(", "), vibes: p.vibes.join(", "), collections: p.collections.join(", "),
        return_type: p.returnPolicy.type, return_days: p.returnPolicy.days, return_note: p.returnPolicy.note,
        ingredients: p.beauty?.ingredients ?? "", quantity: p.beauty?.quantity ?? "", skin_types: p.beauty?.skinTypes.join(", ") ?? "",
        usage: p.beauty?.usage ?? "", manufacturer: p.beauty?.manufacturer ?? "", shelf_life: p.beauty?.shelfLife ?? "",
        supplier_name: p.private.supplierName, source_ref: p.private.sourceRef, purchase_cost: p.private.purchaseCost,
        shipping_cost: p.private.shippingCost, other_cost: p.private.otherCost ?? 0, rights_confirmed: p.private.rightsConfirmed ? "yes" : "",
      };
      // Supplier and cost columns need finance access.
      if (!ctx.can("finance.view")) for (const k of PRIVATE_COLUMNS) row[k] = "";
      out.push(toCsvRow(CSV_COLUMNS.map((c) => row[c])));
    }
  }
  await withDb((db) => audit(db, ctx.actor, "product.export", "product", "csv", { after: { rows: out.length - 1, withCosts: ctx.can("finance.view") } }));
  return new Response(out.join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="krip-products.csv"', "Cache-Control": "no-store" },
  });
}
