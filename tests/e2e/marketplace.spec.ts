import { expect, test, type Browser, type Page } from "@playwright/test";

// Full marketplace run: seller registers and pays the plan fee (demo gateway) → Krip approves →
// seller sets shipping and lists a product → Krip approves the listing → shopper buys it online →
// seller accepts, packs, ships with AWB, posts tracking and marks delivered → earnings add up.

async function adminPage(browser: Browser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill("owner@krip.local");
  await page.getByLabel("Password").fill("e2e-admin-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  return page;
}

test("seller marketplace: register → approve → list → sell → ship → earnings", async ({ page: seller, browser }) => {
  test.setTimeout(180_000);

  // 1. Register (Premium plan) and pay the one-time fee.
  await seller.goto("/sell");
  await expect(seller.getByRole("heading", { name: "Sell your products on Krip" })).toBeVisible();
  await seller.getByRole("link", { name: "Choose Premium" }).click();
  const f = (label: string, v: string) => seller.getByLabel(label, { exact: true }).fill(v);
  await f("Business / shop name", "Asha Home Store");
  await f("Owner’s full name", "Asha Rao");
  await f("Email", "asha.seller@example.com");
  await f("Mobile number", "9123456780");
  await f("Password", "kitchen-helper-2026");
  await f("Confirm password", "kitchen-helper-2026");
  await f("Address", "12 MG Road, Indiranagar");
  await f("City", "Bengaluru");
  await seller.getByLabel("State", { exact: true }).selectOption("Karnataka");
  await f("Pincode", "560038");
  await f("PAN", "ABCDE1234F");
  await f("Account holder name", "Asha Rao");
  await f("Bank account number", "123456789012");
  await f("Re-enter account number", "123456789012");
  await f("IFSC", "SBIN0001234");
  await seller.getByRole("checkbox").check();
  await seller.getByRole("button", { name: "Continue to payment" }).click();
  await expect(seller).toHaveURL(/\/vendor$/);
  await expect(seller.getByText(/pay your one-time Premium plan fee/)).toBeVisible();
  await seller.getByRole("button", { name: /Simulate payment/ }).click();
  await expect(seller.getByText(/Krip is reviewing your account/)).toBeVisible();

  // 2. Krip approves the seller.
  const admin = await adminPage(browser);
  await admin.goto("/admin/vendors");
  await admin.getByRole("link", { name: "Asha Home Store" }).click();
  await admin.getByRole("button", { name: "Approve seller" }).click();
  await expect(admin.getByText("Approved", { exact: true })).toBeVisible();

  // 3. Seller sets shipping and lists a product.
  await seller.goto("/vendor/shipping");
  await seller.getByLabel("Charge per order (₹)").fill("30");
  await seller.getByLabel(/Free delivery when/).fill("");
  await seller.getByLabel("Hand to courier within").selectOption("2");
  await seller.getByLabel("Usual courier (optional)").fill("DTDC");
  await seller.getByRole("button", { name: "Save shipping settings" }).click();
  await expect(seller.getByText("Shipping settings saved.")).toBeVisible();

  await seller.goto("/vendor/products/new");
  const p = (label: string, v: string) => seller.getByLabel(label, { exact: true }).fill(v);
  await p("Product name", "Steel Vegetable Chopper 3 Blades");
  await seller.getByLabel("Category", { exact: true }).selectOption("kitchen");
  await p("Description", "Hand-pull chopper with three stainless steel blades and a 500 ml bowl.");
  await p("Key features (one per line, up to 8)", "Three steel blades\n500 ml bowl");
  await p("Colour / variant", "Green");
  await p("Selling price (₹)", "349");
  await p("Stock you have", "7");
  await p("Photo links (one per line)", "https://example.com/chopper.jpg");
  await seller.getByRole("checkbox", { name: /I own these photos/ }).check();
  await seller.getByRole("button", { name: "Send for Krip review" }).click();
  await expect(seller).toHaveURL(/\/vendor\/products\?saved=/);
  await expect(seller.getByText("Waiting for Krip review")).toBeVisible();

  // Not visible in the shop before review.
  const search = await seller.request.get("/api/products");
  expect(await search.text()).not.toContain("Steel Vegetable Chopper 3 Blades");

  // 4. Krip approves the listing.
  await admin.goto("/admin/vendors/review");
  await expect(admin.getByText("Steel Vegetable Chopper 3 Blades")).toBeVisible();
  await admin.getByRole("button", { name: "Approve & publish" }).click();
  await expect(admin.getByText("Nothing to review")).toBeVisible();

  await seller.goto("/vendor/products");
  await expect(seller.getByText("Live", { exact: true })).toBeVisible();
  const href = await seller.getByRole("link", { name: "View" }).getAttribute("href");

  // 5. A shopper buys it online. COD is not offered for sellers' items; seller's delivery charge applies.
  const shopper = await (await browser.newContext()).newPage();
  await shopper.goto(href!);
  await expect(shopper.getByText("Asha Home Store, Bengaluru").first()).toBeVisible();
  await expect(shopper.getByText(/Packed and shipped by this seller/)).toBeVisible();
  await shopper.locator("div.fixed").getByRole("button", { name: "Add to Bag" }).click();
  await shopper.goto("/checkout");
  await shopper.getByLabel("Full name").fill("Ravi Kumar");
  await shopper.getByLabel("Mobile number").fill("9876543210");
  await shopper.getByLabel("Pincode", { exact: true }).fill("560001");
  await shopper.getByLabel("House / flat no., building, street").fill("4, Rose Villa, 2nd Main");
  await shopper.getByLabel("City / town").fill("Bengaluru");
  await shopper.getByLabel("State").selectOption("Karnataka");
  await expect(shopper.getByText(/Cash on Delivery isn’t available for items shipped by other sellers/).first()).toBeVisible();
  await expect(shopper.getByText("₹379").first()).toBeVisible(); // 349 + 30 delivery
  await shopper.getByRole("radio", { name: /UPI \/ Card/ }).check();
  await shopper.getByRole("button", { name: /Continue to pay/ }).click();
  await expect(shopper).toHaveURL(/\/pay\/KRP-/);
  await shopper.getByRole("button", { name: "Simulate successful payment" }).click();
  await expect(shopper.getByRole("heading", { name: /Payment confirmed — order placed/ })).toBeVisible();
  const orderUrl = shopper.url();

  // 6. Seller fulfils the order by hand.
  await seller.goto("/vendor");
  await expect(seller.getByText(/1 order to ship/)).toBeVisible();
  await seller.goto("/vendor/orders");
  await seller.getByRole("link", { name: /KRP-/ }).first().click();
  await expect(seller.getByText("Ravi Kumar")).toBeVisible();
  await expect(seller.getByText(/You get \(added to your wallet/)).toBeVisible();
  await expect(seller.getByText("Krip commission")).toHaveCount(0); // no commission: the whole sale is the seller's
  await expect(seller.getByText("₹379", { exact: true })).toBeVisible(); // 349 + 30 delivery
  await seller.getByRole("button", { name: "Accept order" }).click();
  await expect(seller.getByText("Order accepted.")).toBeVisible();
  await seller.getByRole("button", { name: "Mark as packed" }).click();
  await expect(seller.getByText("Marked as packed.")).toBeVisible();
  await expect(seller.getByLabel("Courier")).toHaveValue("DTDC");
  await seller.getByLabel("AWB / tracking number").fill("D98765432");
  await seller.getByRole("button", { name: "Mark as shipped" }).click();
  await expect(seller.getByText(/Marked as shipped/)).toBeVisible();
  await seller.getByLabel("Post a tracking update").selectOption("Out for delivery");
  await seller.getByRole("button", { name: "Post update" }).click();
  await expect(seller.getByText("Tracking update posted.")).toBeVisible();

  // Shopper sees the courier and the update.
  await shopper.goto(orderUrl);
  await expect(shopper.getByText("D98765432")).toBeVisible();
  await expect(shopper.getByText("Out for delivery")).toBeVisible();

  await seller.getByRole("button", { name: "Mark as delivered" }).click();
  await expect(seller.getByText(/this order is delivered/)).toBeVisible();

  // Packing slip has addresses, no prices.
  const slip = await seller.request.get(`/vendor/slip/${orderUrl.match(/KRP-[A-Z0-9-]+/)![0]}`);
  const slipHtml = await slip.text();
  expect(slipHtml).toContain("Ravi Kumar");
  expect(slipHtml).not.toContain("₹349");

  // 7. Wallet: the full ₹379 is credited on delivery; the seller withdraws; Krip pays and records the reference.
  await seller.goto("/vendor/wallet");
  await expect(seller.getByText("Available to withdraw")).toBeVisible();
  await expect(seller.getByLabel("Amount to withdraw (₹)")).toHaveValue("379");
  await seller.getByLabel("Amount to withdraw (₹)").fill("500");
  await seller.getByRole("button", { name: "Withdraw to bank" }).click();
  await expect(seller.getByText(/You can withdraw up to ₹379/)).toBeVisible();
  await seller.getByLabel("Amount to withdraw (₹)").fill("379");
  await seller.getByRole("button", { name: "Withdraw to bank" }).click();
  await expect(seller.getByText(/requested on/)).toBeVisible();

  await admin.goto("/admin/vendors/withdrawals");
  await expect(admin.getByText("Asha Home Store").first()).toBeVisible();
  await admin.getByLabel("Bank / UPI reference").fill("UTR12345678");
  await admin.getByRole("button", { name: "Mark as paid" }).click();
  await expect(admin.getByText("No withdrawal requests")).toBeVisible();

  await seller.goto("/vendor/wallet");
  await expect(seller.getByText(/ref UTR12345678/)).toBeVisible();
  await expect(seller.getByText("Available to withdraw").locator("..").getByText("₹0")).toBeVisible();

  await admin.goto("/admin/vendors");
  await admin.getByRole("link", { name: "Asha Home Store" }).click();
  await expect(admin.getByText("Wallet — ₹0")).toBeVisible();
  await admin.getByRole("button", { name: "Show full account number" }).click();
  await expect(admin.getByText("123456789012")).toBeVisible();

  // Suspending hides their products from the shop.
  await admin.getByLabel("Reason (seller sees this)", { exact: true }).fill("Testing suspension");
  await admin.getByRole("button", { name: "Suspend" }).click();
  await expect(admin.getByRole("button", { name: "Reinstate" })).toBeVisible();
  await shopper.goto(href!);
  await expect(shopper.getByText("This page wandered off")).toBeVisible();
  expect(await (await shopper.request.get("/api/products")).text()).not.toContain("Steel Vegetable Chopper 3 Blades");
});
