import { expect, test, type Page } from "@playwright/test";

async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `horizontal overflow on ${page.url()}`).toBeLessThanOrEqual(0);
}

async function fillAddress(page: Page) {
  await page.getByLabel("Full name").fill("Asha Rao");
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Pincode", { exact: true }).fill("560001");
  await page.getByLabel("House / flat no., building, street").fill("12, Lake View Apartments, 3rd Cross");
  await page.getByLabel("City / town").fill("Bengaluru");
  await page.getByLabel("State").selectOption("Karnataka");
}

test("browse → filter → product → variant → bag → COD checkout", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Trending Now" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Under ₹999" }).first()).toBeVisible();
  await noHorizontalOverflow(page);

  // Search with suggestions
  const search = page.getByRole("combobox", { name: "Search Krip" });
  await search.fill("oversized");
  await expect(page.getByRole("option").first()).toBeVisible();
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=oversized/);
  await expect(page.getByRole("heading", { name: /Results for “oversized”/ })).toBeVisible();

  // Filter sheet: pick a size, apply, see chip
  await page.getByRole("button", { name: /^Filter/ }).click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: /^M \(/ }).click();
  await sheet.getByRole("button", { name: /Show \d+ results?/ }).click();
  await expect(page).toHaveURL(/size=M/);
  await expect(page.getByRole("button", { name: "Remove filter M" })).toBeVisible();
  await noHorizontalOverflow(page);

  // Product page
  await page.getByRole("link", { name: "Constellation Oversized Tee" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Constellation Oversized Tee" })).toBeVisible();
  await noHorizontalOverflow(page);

  // Variant required
  const actionbar = page.locator("div.fixed").filter({ has: page.getByRole("button", { name: "Buy Now" }) });
  await actionbar.getByRole("button", { name: "Add to Bag" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please select a size" })).toBeVisible();

  // Out-of-stock size can't be added
  await page.getByRole("radio", { name: "L, out of stock" }).click({ force: true });
  await actionbar.getByRole("button", { name: "Add to Bag" }).click();
  await expect(page.getByRole("alert").filter({ hasText: /out of stock/i })).toBeVisible();

  await page.getByRole("radio", { name: "M", exact: true }).click();
  await actionbar.getByRole("button", { name: "Add to Bag" }).click();
  await expect(page.getByRole("status").getByText(/Added to bag/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Bag, 1 item/ })).toBeVisible();

  // Back to results keeps filters
  await page.goBack();
  await expect(page).toHaveURL(/size=M/);

  // Cart
  await page.goto("/cart");
  await expect(page.getByRole("heading", { name: "Your bag" })).toBeVisible();
  await page.getByRole("button", { name: "Increase quantity" }).click();
  await expect(page.locator("output")).toHaveText("2");
  await expect(page.getByText("Total payable")).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByRole("link", { name: "Continue to checkout" }).click();

  // Checkout validation then COD
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();
  await page.getByRole("button", { name: /Place order|Continue to pay/ }).click();
  await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
  await fillAddress(page);
  await expect(page.getByText(/Estimated delivery/)).toBeVisible();
  await page.getByRole("radio", { name: /Cash on Delivery/ }).check();
  await expect(page.getByText("Cash on Delivery fee")).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByRole("button", { name: "Place order" }).click();

  await expect(page).toHaveURL(/\/order\/KRP-/);
  await expect(page.getByRole("heading", { name: /Order placed — Cash on Delivery/ })).toBeVisible();
  await expect(page.getByText(/Demo order/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Bag, empty" })).toBeVisible();

  // Order history
  await page.goto("/orders");
  await expect(page.getByText("Order placed").first()).toBeVisible();
});

test("online payment: failure is never shown as success, retry then succeeds", async ({ page }) => {
  await page.goto("/product/halo-hoop-earrings");
  // One-size product: no size needed
  await page.locator("div.fixed").getByRole("button", { name: "Add to Bag" }).click();
  await page.goto("/checkout");
  await fillAddress(page);
  await page.getByRole("radio", { name: /UPI \/ Card/ }).check();
  await page.getByRole("button", { name: /Continue to pay/ }).click();

  await expect(page).toHaveURL(/\/pay\/KRP-/);
  await expect(page.getByText(/No real money moves/)).toBeVisible();
  await page.getByRole("button", { name: "Simulate failed payment" }).click();
  await expect(page.getByRole("heading", { name: "Payment failed" })).toBeVisible();
  await expect(page.getByText(/Payment confirmed/)).toHaveCount(0);

  await page.getByRole("button", { name: "Retry payment" }).click();
  await expect(page).toHaveURL(/\/pay\/KRP-/);
  await page.getByRole("button", { name: "Simulate successful payment" }).click();
  await expect(page.getByRole("heading", { name: /Payment confirmed — order placed/ })).toBeVisible();
});

test("unavailable product cannot be bought", async ({ page }) => {
  await page.goto("/product/chelsea-ankle-boots");
  await expect(page.getByText("Out of stock").first()).toBeVisible();
  await expect(page.locator("div.fixed").getByRole("button", { name: "Out of stock" })).toBeDisabled();
});

test("empty search state offers reset", async ({ page }) => {
  await page.goto("/search?q=tee&max=100");
  await expect(page.getByText("Nothing matches… yet")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page).toHaveURL(/\/search\?q=tee$/);
  await expect(page.getByRole("link", { name: "Basic Crew Tee" })).toBeVisible();
});

test("quick view bottom sheet adds a valid variant", async ({ page }) => {
  await page.goto("/search?cat=beauty");
  await page.getByRole("button", { name: "Quick view: Velvet Matte Lipstick" }).click();
  const dlg = page.getByRole("dialog", { name: "Quick View" });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: "Add to Bag" }).click();
  await expect(dlg).toBeHidden();
  await expect(page.getByRole("status").getByText(/Added to bag/)).toBeVisible();
});

test("key pages have no horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  for (const path of ["/", "/categories", "/drops", "/wishlist", "/account", "/vibe", "/looks", "/look/campus-uniform", "/product/aura-slip-midi-dress", "/product/velvet-matte-lipstick", "/help/returns", "/cart"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await noHorizontalOverflow(page);
  }
});

test("seasonal offer tile opens a matching, price-capped listing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("heading", { name: "Under ₹299" }).getByRole("link").click();
  await expect(page).toHaveURL(/max=299/);
  await expect(page.locator("article").first()).toBeVisible();
  const prices = await page.locator("article span.font-semibold.text-ink").allInnerTexts();
  expect(prices.length).toBeGreaterThan(0);
  for (const p of prices) expect(Number(p.replace(/[₹,]/g, ""))).toBeLessThanOrEqual(299);
});

test("Style Swipe saves to the wishlist", async ({ page }) => {
  await page.goto("/swipe");
  await expect(page.getByRole("heading", { name: "Style Swipe" })).toBeVisible();
  await page.getByRole("button", { name: /^Save / }).click();
  await page.getByRole("button", { name: /^Skip / }).click();
  await expect(page.getByText(/1 saved/)).toBeVisible();
  await page.goto("/wishlist");
  await expect(page.locator("article")).toHaveCount(1);
});

test("a shared bag link can be added to your own bag", async ({ page }) => {
  await page.goto("/cart?share=P008-BLAC-M*2,NOPE*1");
  await expect(page.getByText("A friend shared a bag with you")).toBeVisible();
  await expect(page.getByText(/no longer available/)).toBeVisible();
  await page.getByRole("button", { name: "Add to my bag" }).click();
  await expect(page.getByRole("heading", { name: "Your bag" })).toBeVisible();
  await expect(page.locator("output")).toHaveText("2");
});

test("footer has back-to-top and help columns", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Let Us Help You" })).toBeVisible();
  await page.getByRole("button", { name: "Back to top" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
});
