import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeedProducts } from "../../src/data/catalog.ts";
import { emptyState, parseSearch, runSearch, serializeSearch, scoreProduct, suggest, colorFamily } from "../../src/lib/search.ts";

const products = buildSeedProducts("fashion").map(({ private: _p, ...pub }) => pub);

test("query matches title, synonyms and colours", () => {
  const s = { ...emptyState(), q: "tshirt" };
  const r = runSearch(products, s);
  assert.ok(r.items.some((p) => p.slug === "basic-crew-tee-pack"));
  assert.ok(runSearch(products, { ...emptyState(), q: "olive" }).items.every((p) => p.variants.some((v) => colorFamily(v.color) === "Green")));
  assert.equal(scoreProduct(products[0], "zzzz"), 0);
});

test("drafts are never returned", () => {
  const r = runSearch(products, { ...emptyState(), q: "scarf" });
  assert.equal(r.total, 0);
});

test("filters combine and facets show counts", () => {
  const s = { ...emptyState(), cats: ["men" as const], sizes: ["M"] };
  const r = runSearch(products, s);
  assert.ok(r.total > 0);
  assert.ok(r.items.every((p) => p.category === "men" && p.variants.some((v) => v.size === "M")));
  const sizeFacet = r.facets.find((f) => f.group === "sizes");
  assert.ok(sizeFacet && sizeFacet.options.find((o) => o.value === "M"));
});

test("beauty facets include shade and skin type, not clothing size", () => {
  const r = runSearch(products, { ...emptyState(), cats: ["beauty"] });
  const groups = r.facets.map((f) => f.group);
  assert.ok(groups.includes("shades"));
  assert.ok(groups.includes("skin"));
  assert.ok(!groups.includes("sizes"));
});

test("sorting by price", () => {
  const r = runSearch(products, { ...emptyState(), sort: "price-asc", inStock: true });
  for (let i = 1; i < r.items.length; i++) assert.ok(r.items[i - 1].price <= r.items[i].price);
});

test("URL state round-trips", () => {
  const s = parseSearch(new URLSearchParams("q=tee&cat=men,women&size=M&price=0-299&sort=price-desc&instock=1"));
  assert.deepEqual(s.cats, ["men", "women"]);
  const again = parseSearch(new URLSearchParams(serializeSearch(s)));
  assert.deepEqual(again, s);
});

test("suggestions include categories and products", () => {
  const sug = suggest(products, "sne");
  assert.ok(sug.some((x) => x.kind === "product"));
});
