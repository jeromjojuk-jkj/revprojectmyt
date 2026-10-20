import { expect, test } from "@playwright/test";

const address = { name: "Test User", phone: "9876543210", email: "", line1: "221B Some Street, Block A", line2: "", landmark: "", city: "Pune", state: "Maharashtra", pincode: "411001" };
const key = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

test("public catalogue never exposes supplier or cost data", async ({ request }) => {
  const body = await (await request.get("/api/products")).text();
  expect(body).not.toMatch(/purchaseCost|supplierName|sourceRef|channelPrices|Sample Supplier/);
  expect(body).not.toContain("draft-silk-scarf");
});

test("server rejects a tampered total and recalculates", async ({ request }) => {
  const res = await request.post("/api/orders", {
    data: { idempotencyKey: key(), items: [{ sku: "P008-BLAC-M", qty: 1 }], address, paymentMethod: "cod", expectedTotal: 1 },
  });
  expect(res.status()).toBe(409);
  const d = await res.json();
  expect(d.code).toBe("total_changed");
  expect(d.details.total).toBe(249 + 49 + 20);
});

test("duplicate submits create one order", async ({ request }) => {
  const k = key();
  const payload = { idempotencyKey: k, items: [{ sku: "P008-WHIT-L", qty: 1 }], address, paymentMethod: "cod", expectedTotal: 249 + 49 + 20 };
  const [a, b] = await Promise.all([request.post("/api/orders", { data: payload }), request.post("/api/orders", { data: payload })]);
  expect(a.status()).toBe(200);
  expect(b.status()).toBe(200);
  expect((await a.json()).orderId).toBe((await b.json()).orderId);
});

test("cannot oversell a variant", async ({ request }) => {
  const { products } = await (await request.get("/api/products")).json();
  const pick = products
    .filter((p: { status: string }) => p.status === "active")
    .flatMap((p: { variants: { sku: string; stock: number }[] }) => p.variants)
    .find((v: { stock: number }) => v.stock >= 2 && v.stock <= 4) as { sku: string; stock: number };
  const order = async (qty: number) => {
    const q = await (await request.post("/api/cart/quote", { data: { items: [{ sku: pick.sku, qty }], pincode: "411001", paymentMethod: "cod" } })).json();
    return request.post("/api/orders", {
      data: { idempotencyKey: key(), items: [{ sku: pick.sku, qty }], address, paymentMethod: "cod", expectedTotal: q.quote.total },
    });
  };
  const tooMany = await order(pick.stock + 1);
  expect(tooMany.status()).toBe(409);
  expect((await tooMany.json()).code).toBe("items_unavailable");
  expect((await order(pick.stock)).status()).toBe(200);
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
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect password.")).toBeVisible();
  await page.getByLabel("Password").fill("e2e-admin-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await page.goto("/admin/products");
  await expect(page.getByText("Sample Supplier — Tiruppur Knits").first()).toBeVisible();

  // CSV import validates before committing
  await page.goto("/admin/import");
  await page.getByLabel("…or paste CSV").fill("slug,title\nfoo,Foo");
  await page.getByRole("button", { name: "Validate & preview" }).click();
  await expect(page.getByText(/Missing required column/)).toBeVisible();
});
