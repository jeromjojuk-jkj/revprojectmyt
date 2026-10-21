import { expect, test, type Page } from "@playwright/test";

const OWNER = { email: "owner@krip.local", password: "e2e-admin-password" };
const address = { name: "Meera Iyer", phone: "9123456780", email: "meera@example.com", line1: "12 Lake View Road, Flat 4", line2: "", landmark: "", city: "Chennai", state: "Tamil Nadu", pincode: "411001" };
// Most admin work happens on a laptop; one test below covers the phone drawer.
test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false });

const key = () => `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("button", { name: "Account menu" })).toBeVisible();
}

async function signOut(page: Page) {
  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/admin\/login/);
}

test("admin shell: dashboard, grouped sidebar, search, breadcrumbs", async ({ page }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await expect(page.getByRole("heading", { level: 1, name: /Good (morning|afternoon|evening), Store/ })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Admin" });
  for (const g of ["Overview", "Commerce", "Customers", "Growth & marketing", "Storefront", "Finance", "System"]) await expect(nav.getByRole("button", { name: g })).toBeVisible();
  await expect(page.getByText("Net sales").first()).toBeVisible();
  await page.getByRole("link", { name: "30d" }).click();
  await page.getByRole("searchbox", { name: /Search orders/ }).or(page.getByLabel(/Search orders, products/)).fill("P008");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: /Results for/ })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Breadcrumb" }).getByText("Search")).toBeVisible();
  // Collapsing the sidebar keeps icons with labels as tooltips.
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await page.getByRole("button", { name: "Expand sidebar" }).click();
});

test("admin on a phone: menu drawer", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await signIn(page, OWNER.email, OWNER.password);
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "Admin menu" }).getByRole("link", { name: "Inventory" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Inventory" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await ctx.close();
});

test("store settings drive the storefront footer, announcement and maintenance mode", async ({ page, browser }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/settings/store");
  await page.getByLabel("Support email").fill("help@krip");
  await page.getByRole("button", { name: "Save store settings" }).click();
  await expect(page.getByText("Enter a valid email or leave blank.")).toBeVisible();
  await page.getByLabel("Support email").fill("help@krip.example");
  await page.getByLabel("WhatsApp support number").fill("98765 43210");
  await page.getByLabel("Instagram URL").fill("https://www.instagram.com/krip.example");
  await page.getByLabel("UPI").check();
  await page.getByLabel("Show announcement above the header").check();
  await page.getByLabel("Text", { exact: true }).fill("New drops every Friday");
  await page.getByRole("button", { name: "Save store settings" }).click();
  await expect(page.getByText("Saved. The storefront footer")).toBeVisible();

  const shopper = await browser.newPage();
  await shopper.goto("/");
  await expect(shopper.getByText("New drops every Friday")).toBeVisible();
  const footer = shopper.getByRole("navigation", { name: "Footer" });
  await expect(footer.getByRole("link", { name: "Instagram" })).toHaveAttribute("href", "https://www.instagram.com/krip.example");
  await expect(footer.getByRole("link", { name: "WhatsApp Support" })).toHaveAttribute("href", "https://wa.me/919876543210");
  await expect(shopper.getByRole("region", { name: "Contact and payments" }).getByRole("link", { name: "help@krip.example" })).toBeVisible();
  await expect(shopper.getByRole("region", { name: "Contact and payments" }).getByText("UPI")).toBeVisible();
  await shopper.goto("/help/contact");
  await expect(shopper.getByRole("article").getByRole("link", { name: "help@krip.example" })).toBeVisible();

  // Maintenance mode: shoppers are blocked, staff still see the store.
  await page.getByLabel(/Maintenance mode/).check();
  await page.getByRole("button", { name: "Save store settings" }).click();
  await expect(page.getByText("Saved. The storefront footer")).toBeVisible();
  await shopper.goto("/");
  await expect(shopper.getByRole("heading", { name: "We’ll be right back" })).toBeVisible();
  const blocked = await shopper.request.post("/api/orders", { data: { idempotencyKey: key(), items: [{ sku: "P008-BLAC-M", qty: 1 }], address, paymentMethod: "cod", expectedTotal: 318 } });
  expect(blocked.status()).toBe(503);
  await page.goto("/");
  await expect(page.getByText("Maintenance mode is on")).toBeVisible();

  await page.goto("/admin/settings/store");
  await page.getByLabel(/Maintenance mode/).uncheck();
  await page.getByLabel("Show announcement above the header").uncheck();
  await page.getByLabel("WhatsApp support number").fill("");
  await page.getByRole("button", { name: "Save store settings" }).click();
  await expect(page.getByText("Saved. The storefront footer")).toBeVisible();
  await shopper.goto("/");
  await expect(shopper.getByText("New drops every Friday")).toHaveCount(0);
  await shopper.close();
});

test("coupon rules are enforced at checkout, and an order runs through fulfilment, refund and audit", async ({ page, request }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/coupons/new");
  await page.getByLabel("Code").fill("ONCE10");
  await page.getByText("% off", { exact: true }).click();
  await page.getByLabel("Percent off").fill("10");
  await page.getByLabel("Maximum discount ₹ (optional)").fill("100");
  await page.getByLabel(/^Per customer/).fill("1");
  await page.getByRole("button", { name: "Save coupon" }).click();
  await expect(page.getByText("Coupon saved.")).toBeVisible();
  await expect(page.getByRole("cell", { name: /ONCE10/ })).toBeVisible();

  // Place an order with the coupon, then try to reuse it with the same phone number.
  const items = [{ sku: "P008-BLAC-M", qty: 2 }];
  const quote = await (await request.post("/api/cart/quote", { data: { items, pincode: "411001", paymentMethod: "cod", couponCode: "ONCE10" } })).json();
  expect(quote.quote.discount).toBe(49); // 10% of 498, floored
  const placed = await request.post("/api/orders", { data: { idempotencyKey: key(), items, address, paymentMethod: "cod", couponCode: "ONCE10", expectedTotal: quote.quote.total } });
  expect(placed.status(), await placed.text()).toBe(200);
  const { orderId } = await placed.json();
  const again = await request.post("/api/orders", { data: { idempotencyKey: key(), items, address, paymentMethod: "cod", couponCode: "ONCE10", expectedTotal: quote.quote.total } });
  expect(again.status()).toBe(409);
  expect((await again.json()).code).toBe("coupon_invalid");

  // Fulfilment with state checks.
  await page.goto(`/admin/orders?q=${orderId}`);
  await page.getByRole("link", { name: orderId }).click();
  await expect(page.getByRole("heading", { level: 1, name: orderId })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark packed" })).toHaveCount(0);
  await page.getByRole("button", { name: "Confirm order" }).click();
  await expect(page.getByRole("button", { name: "Mark packed" })).toBeVisible();
  await page.getByRole("button", { name: "Put on hold" }).click();
  await page.getByLabel("Reason for hold").fill("Confirm landmark with customer");
  await page.getByRole("button", { name: "Hold order" }).click();
  await expect(page.getByText("On hold", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Mark packed" })).toHaveCount(0);
  await page.getByRole("button", { name: "Release hold" }).click();
  await page.getByRole("button", { name: "Mark packed" }).click();
  await page.getByRole("button", { name: "Create shipment" }).click();
  await page.getByLabel("Courier").fill("Delhivery");
  await page.getByLabel("AWB / tracking number").fill("bad awb!");
  await page.getByRole("button", { name: "Mark shipped" }).click();
  await expect(page.getByText(/Enter the AWB/)).toBeVisible();
  await page.getByLabel("AWB / tracking number").fill("DL998877");
  await page.getByRole("button", { name: "Mark shipped" }).click();
  await expect(page.getByText(/Delhivery · AWB/)).toBeVisible();
  await page.getByRole("button", { name: "Mark delivered" }).click();
  await page.getByRole("button", { name: "Mark COD collected" }).click();
  await expect(page.getByText("COD collected").first()).toBeVisible();
  await page.getByRole("button", { name: "Record refund" }).click();
  await page.getByLabel(/^Amount/).fill("99999");
  await page.getByLabel("Reason").fill("Size issue");
  await page.getByRole("button", { name: "Record refund" }).last().click();
  await expect(page.getByText(/Refund can’t exceed/)).toBeVisible();
  await page.getByLabel(/^Amount/).fill("100");
  await page.getByRole("button", { name: "Record refund" }).last().click();
  await expect(page.getByText("Partially refunded").first()).toBeVisible();
  await page.getByLabel("Internal note").fill("Customer called, happy now");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Customer called, happy now")).toBeVisible();

  // The customer sees the shipment but not internal notes.
  const pub = await (await request.get(`/api/orders/${orderId}?t=${(await placed.json()).token}`)).text();
  expect(pub).toContain("DL998877");
  expect(pub).not.toContain("Customer called");

  // Stock ledger and audit trail recorded it all.
  await page.goto(`/admin/inventory/movements?q=${orderId}`);
  await expect(page.getByRole("cell", { name: "Order reserved" }).first()).toBeVisible();
  await page.goto("/admin/audit?entity=order");
  await expect(page.getByText(/Integrity check passed/)).toBeVisible();
  await expect(page.getByText("order.refund").first()).toBeVisible();

  // Customer profile and segments
  await page.goto("/admin/customers?q=Meera");
  await page.getByRole("link", { name: "Meera Iyer" }).click();
  await expect(page.getByText("Lifetime spend").first()).toBeVisible();
});

test("staff roles: invite, least privilege, server-side enforcement, lockout", async ({ page, browser }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/staff");
  await page.getByLabel("Name").fill("Ravi Support");
  await page.getByLabel("Work email").fill("ravi@krip.example");
  await page.locator("#sr").selectOption({ label: "Support Agent" });
  await page.getByRole("button", { name: "Create invite link" }).click();
  const link = await page.getByLabel("One-time link").inputValue();
  expect(link).toContain("/admin/reset?token=");

  const ravi = await browser.newPage();
  await ravi.goto(link);
  await ravi.getByLabel("New password").fill("krip-admin-demo");
  await ravi.getByLabel("Confirm password").fill("krip-admin-demo");
  await ravi.getByRole("button", { name: "Set password" }).click();
  await expect(ravi.getByText("That password is too common.")).toBeVisible();
  await ravi.getByLabel("New password").fill("mango-lantern-river-7");
  await ravi.getByLabel("Confirm password").fill("mango-lantern-river-7");
  await ravi.getByRole("button", { name: "Set password" }).click();
  await expect(ravi.getByText("Password set.")).toBeVisible();
  // The invite link works only once.
  await ravi.goto(link);
  await ravi.getByLabel("New password").fill("another-long-password");
  await ravi.getByLabel("Confirm password").fill("another-long-password");
  await ravi.getByRole("button", { name: "Set password" }).click();
  await expect(ravi.getByText(/invalid or has expired/)).toBeVisible();

  await signIn(ravi, "ravi@krip.example", "mango-lantern-river-7");
  const nav = ravi.getByRole("navigation", { name: "Admin" });
  await expect(nav.getByRole("link", { name: "Orders" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Staff & roles" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Coupons & discounts" })).toHaveCount(0);
  // Hidden links are also refused by the server.
  await ravi.goto("/admin/staff");
  await expect(ravi.getByRole("heading", { name: "You don’t have access to this" })).toBeVisible();
  expect((await ravi.request.get("/admin/orders/export")).status()).toBe(403);
  expect((await ravi.request.get("/admin/export")).status()).toBe(403);
  await signOut(ravi);

  // Five wrong passwords lock the account.
  for (let i = 0; i < 5; i++) {
    await ravi.getByLabel("Email").fill("ravi@krip.example");
    await ravi.getByLabel("Password").fill(`wrong-${i}-password`);
    await ravi.getByRole("button", { name: "Sign in" }).click();
    await expect(ravi.getByText("Email or password is incorrect.")).toBeVisible();
  }
  await ravi.getByLabel("Password").fill("mango-lantern-river-7");
  await ravi.getByRole("button", { name: "Sign in" }).click();
  await expect(ravi.getByText(/account is locked/)).toBeVisible();
  await ravi.close();

  await page.goto("/admin/staff");
  await expect(page.getByRole("row", { name: /Ravi Support/ }).getByText("Locked")).toBeVisible();
  await page.goto("/admin/staff?tab=logins");
  await expect(page.getByText("bad password").first()).toBeVisible();
});

test("two-step sign-in can be set up and is required afterwards", async ({ page }) => {
  await signIn(page, OWNER.email, OWNER.password);
  await page.goto("/admin/security");
  await page.getByRole("button", { name: "Set up two-step sign-in" }).click();
  const key = (await page.locator("code.select-all").innerText()).replace(/\s/g, "");
  const code = await page.evaluate(async (secret) => {
    const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let bits = 0, value = 0;
    const out: number[] = [];
    for (const ch of secret) { value = (value << 5) | B32.indexOf(ch); bits += 5; if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; } }
    const k = await crypto.subtle.importKey("raw", new Uint8Array(out), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
    const msg = new ArrayBuffer(8);
    new DataView(msg).setUint32(4, Math.floor(Date.now() / 30000));
    const h = new Uint8Array(await crypto.subtle.sign("HMAC", k, msg));
    const o = h[19] & 15;
    const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
    return String(n % 1e6).padStart(6, "0");
  }, key);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: "Verify and turn on" }).click();
  await expect(page.getByText("Two-step sign-in is on.")).toBeVisible();
  await signOut(page);
  await page.getByLabel("Email").fill(OWNER.email);
  await page.getByLabel("Password").fill(OWNER.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByLabel("Authentication code")).toBeVisible();
  await page.getByLabel("Authentication code").fill("000000");
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByText("That code didn’t match.")).toBeVisible();
  // Turn it back off so later test files can sign in with a password only.
  await page.getByLabel("Authentication code").fill(code);
  await page.getByRole("button", { name: "Verify and sign in" }).click();
  await expect(page.getByRole("navigation", { name: "Admin" })).toBeVisible();
  await page.goto("/admin/security");
  await page.getByLabel("Password to turn off").fill(OWNER.password);
  await page.getByRole("button", { name: "Turn off" }).click();
  await expect(page.getByText("Two-step sign-in is off.")).toBeVisible();
});
