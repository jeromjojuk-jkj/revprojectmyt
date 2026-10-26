import { test } from "node:test";
import assert from "node:assert/strict";
import { importCsv, validateProductInput } from "../../src/lib/productInput.ts";
import { parseCsv, toCsvRow } from "../../src/lib/csv.ts";
import { isValidPincode } from "../../src/lib/pincode.ts";

const header = "slug,title,category,subcategory,description,price,image_urls,sku,color,color_hex,size,stock,return_note,supplier_name,purchase_cost,status,rights_confirmed";
const ctx = () => {
  let n = 0;
  return { existingSlugs: new Set<string>(), existingSkus: new Set<string>(), nextId: () => `x${++n}`, now: "2026-10-20T00:00:00Z" };
};

test("CSV parser handles quotes and commas", () => {
  assert.deepEqual(parseCsv('a,"b, c","d ""q"""\n1,2,3'), [["a", "b, c", 'd "q"'], ["1", "2", "3"]]);
  assert.equal(toCsvRow(["=cmd()", "x"]), "'=cmd(),x");
});

test("rows sharing a slug become one product with variants", () => {
  const csv = [
    header,
    'linen-shirt,Linen Shirt,kitchen,Shirts,A breezy linen shirt.,799,https://cdn.example.com/a.jpg,LS-WHT-M,White,#fafafa,M,4,Return in 7 days,Supplier A,350,draft,',
    'linen-shirt,Linen Shirt,kitchen,Shirts,A breezy linen shirt.,799,https://cdn.example.com/a.jpg,LS-WHT-L,White,#fafafa,L,2,Return in 7 days,Supplier A,350,draft,',
  ].join("\n");
  const r = importCsv(csv, ctx());
  assert.deepEqual(r.errors, []);
  assert.equal(r.products.length, 1);
  assert.equal(r.products[0].variants.length, 2);
  assert.equal(r.products[0].private.purchaseCost, 350);
});

test("invalid rows are reported and nothing is valid for that slug", () => {
  const csv = [header, "bad-one,X,shoes,Y,short,-5,ftp://x,!!,Red,red,,abc,,,,active,"].join("\n");
  const r = importCsv(csv, ctx());
  assert.equal(r.products.length, 0);
  const msgs = r.errors.map((e) => e.message).join(" | ");
  for (const k of ["title", "category", "price", "images", "variants", "returnNote", "supplierName", "purchaseCost", "rightsConfirmed"]) {
    assert.ok(msgs.includes(k), `expected error for ${k}: ${msgs}`);
  }
});

test("cosmetics require label information", () => {
  const r = validateProductInput(
    { title: "Lip Balm", category: "beauty", subcategory: "Lips", description: "A tinted lip balm.", price: "199", images: "https://x.com/a.jpg", variants: "LB-1 | Cherry | #aa0000 | | 5", returnNote: "Hygiene", supplierName: "S", purchaseCost: "80" },
    { existingSlugs: new Set(), existingSkus: new Set(), id: "p1", createdAt: "" },
  );
  assert.equal(r.ok, false);
  if (!r.ok) for (const k of ["ingredients", "quantity", "manufacturer", "shelfLife"]) assert.ok(r.errors[k]);
});

test("MRP below price is rejected", () => {
  const r = validateProductInput(
    { title: "Tee", category: "men", subcategory: "T-Shirts", description: "A plain tee shirt.", price: "500", mrp: "400", images: "https://x.com/a.jpg", variants: "T-1 | Black | #000000 | M | 5", returnNote: "7 days", supplierName: "S", purchaseCost: "100" },
    { existingSlugs: new Set(), existingSkus: new Set(), id: "p1", createdAt: "" },
  );
  assert.equal(r.ok, false);
});

test("pincode validation", () => {
  assert.ok(isValidPincode("560001"));
  assert.ok(!isValidPincode("060001"));
  assert.ok(!isValidPincode("56001"));
});
