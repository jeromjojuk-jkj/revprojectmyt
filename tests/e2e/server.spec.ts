import { expect, test } from "@playwright/test";

const address = { name: "Test User", phone: "9876543210", email: "", line1: "221B Some Street, Block A", line2: "", landmark: "", city: "Pune", state: "Maharashtra", pincode: "411001" };
const key = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

test("public catalogue never exposes supplier or cost data", async ({ request }) => {
  const body = await (await request.get("/api/products")).text();
  expect(body).not.toMatch(/purchaseCost|supplierName|sourceRef|channelPrices|Sample Supplier/);
  expect(body).not.toContain("compressed-face-towel-tablets");
});

test("server rejects a tampered total and recalculates", async ({ request }) => {
  const res = await request.post("/api/orders", {
    data: { idempotencyKey: key(), items: [{ sku: "K009-TEAL", qty: 1 }], address, paymentMethod: "cod", expectedTotal: 1 },
  });
  expect(res.status()).toBe(409);
  const d = await res.json();
  expect(d.code).toBe("total_changed");
  expect(d.details.total).toBe(249 + 49 + 20);
});

test("duplicate submits create one order", async ({ request }) => {
  const k = key();
  const payload = { idempotencyKey: k, items: [{ sku: "K006-ML", qty: 1 }], address, paymentMethod: "cod", expectedTotal: 249 + 49 + 20 };
  const [a, b] = await Promise.all([request.post("/api/orders", { data: payload }), request.post("/api/orders", { data: payload })]);
  expect(a.status()).toBe(200);
  expect(b.status()).toBe(200);
  expect((await a.json()).orderId).toBe((await b.json()).orderId);
});

test("cannot oversell a variant", async ({ request }) => {
  const { products } = await (await request.get("/api/products")).json();
  // The variant with the least stock; orders are capped at 5 per line, so drain it in steps.
  const pick = products
    .filter((p: { status: string }) => p.status === "active")
    .flatMap((p: { variants: { sku: string; stock: number }[] }) => p.variants)
    .filter((v: { stock: number }) => v.stock >= 2)
    .sort((a: { stock: number }, b: { stock: number }) => a.stock - b.stock)[0] as { sku: string; stock: number };
  const order = async (qty: number) => {
    const q = await (await request.post("/api/cart/quote", { data: { items: [{ sku: pick.sku, qty }], pincode: "411001", paymentMethod: "cod" } })).json();
    return request.post("/api/orders", {
      data: { idempotencyKey: key(), items: [{ sku: pick.sku, qty }], address, paymentMethod: "cod", expectedTotal: q.quote.total },
    });
  };
  let left = pick.stock;
  while (left > 4) {
    expect((await order(4)).status()).toBe(200);
    left -= 4;
  }
  const tooMany = await order(left + 1);
  expect(tooMany.status()).toBe(409);
  expect((await tooMany.json()).code).toBe("items_unavailable");
  expect((await order(left)).status()).toBe(200);
  const soldOut = await order(1);
  expect(soldOut.status()).toBe(409);
});

test("payment webhook rejects unsigned events", async ({ request }) => {
  const res = await request.post("/api/payments/webhook", {
    data: JSON.stringify({ id: "x", type: "payment.succeeded", orderId: "KRP-1", amount: 1 }),
    headers: { "x-krip-signature": "0".repeat(64), "content-type": "application/json" },
  });
  expect(res.status()).toBe(401);
});

test("admin requires sign-in and shows private costs only after login", async ({ page, request }) => {
  const unauth = await request.get("/admin/export", { maxRedirects: 0 });
  expect(unauth.status()).toBe(401);
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill("owner@krip.local");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();
  await page.getByLabel("Password").fill("e2e-admin-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/products");
  await expect(page.getByText("Costs · est. profit")).toBeVisible();
  const csv = await page.request.get("/admin/export");
  expect(await csv.text()).toContain("Supplier (confirm in admin)");

  // CSV import validates before committing
  await page.goto("/admin/import");
  await page.getByLabel("…or paste CSV").fill("slug,title\nfoo,Foo");
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await expect(page.getByText(/Missing required column/)).toBeVisible();
});

test("site is installable: manifest, icons, service worker and offline page", async ({ request }) => {
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.display).toBe("standalone");
  expect(m.short_name).toBe("Krip");
  expect(m.icons.some((i: { sizes: string; purpose?: string }) => i.sizes === "512x512" && i.purpose === "maskable")).toBe(true);
  for (const i of m.icons as { src: string }[]) expect((await request.get(i.src)).status()).toBe(200);
  const sw = await request.get("/sw.js");
  expect(sw.status()).toBe(200);
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  expect((await request.get("/offline")).status()).toBe(200);
});

test("health check for uptime monitors: ok, uncached, nothing sensitive", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toContain("no-store");
  const d = await res.json();
  expect(d.status).toBe("ok");
  expect(d.checks.datastore).toBe("ok");
  expect(JSON.stringify(d)).not.toMatch(/secret|token|password|redis|upstash|@/i);
  expect((await request.head("/api/health")).status()).toBe(200);
});
