import { isAdmin } from "@/lib/server/auth";
import { CSV_COLUMNS } from "@/lib/productInput";
import { toCsvRow } from "@/lib/csv";

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const ex: Record<string, string> = {
    slug: "example-linen-shirt", title: "Example Linen Shirt", brand: "Krip Studio", category: "men", subcategory: "Shirts",
    description: "Supplier-provided factual description.", price: "799", mrp: "", status: "draft",
    image_urls: "https://example.com/your-authorised-photo-1.jpg|https://example.com/your-authorised-photo-2.jpg",
    sku: "EXLS-WHT-M", color: "White", color_hex: "#fafafa", size: "M", stock: "10", fit: "Regular", material: "Linen blend",
    care: "Hand wash cold|Dry in shade", package_contents: "1 shirt", origin: "India", seller: "", style_tags: "linen, shirt",
    vibes: "everyday", collections: "", return_type: "returnable", return_days: "7", return_note: "Return within 7 days if unused with tags.",
    supplier_name: "Your Supplier", source_ref: "SUP-123", purchase_cost: "350", shipping_cost: "50", rights_confirmed: "yes",
  };
  const ex2 = { ...ex, sku: "EXLS-WHT-L", size: "L", stock: "6" };
  const body = [toCsvRow([...CSV_COLUMNS]), toCsvRow(CSV_COLUMNS.map((c) => ex[c] ?? "")), toCsvRow(CSV_COLUMNS.map((c) => (ex2 as Record<string, string>)[c] ?? ""))].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="krip-import-template.csv"' } });
}
