import { expect, test, type Page } from "@playwright/test";
import { IS_FASHION } from "../../src/lib/constants.ts";

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
  await search.fill("cleaner");
  await expect(page.getByRole("option").first()).toBeVisible();
  await search.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=cleaner/);
  await expect(page.getByRole("heading", { name: /Results for “cleaner”/ })).toBeVisible();

  // Filter sheet: pick a colour, apply, see chip
  await page.getByRole("button", { name: /^Filter/ }).click();
  const sheet = page.getByRole("dialog", { name: "Filters" });
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: /^Blue \(/ }).click();
  await sheet.getByRole("button", { name: /Show \d+ results?/ }).click();
  await expect(page).toHaveURL(/color=Blue/);
  await expect(page.getByRole("button", { name: "Remove filter Blue" })).toBeVisible();
  await noHorizontalOverflow(page);

  // Product page
  await page.getByRole("link", { name: "Caster Drainex Instant Drain Cleaner, Pack of 5" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Caster Drainex Instant Drain Cleaner, Pack of 5" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Key features" })).toBeVisible();
  await expect(page.getByText("Add a cup of water and leave it for 30 minutes.")).toBeVisible();
  await noHorizontalOverflow(page);
  const actionbar = page.locator("div.fixed").filter({ has: page.getByRole("button", { name: "Buy Now" }) });
  await actionbar.getByRole("button", { name: "Add to Bag" }).click();
  await expect(page.getByRole("status").getByText(/Added to bag/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Bag, 1 item/ })).toBeVisible();

  // Back to results keeps filters
  await page.goBack();
  await expect(page).toHaveURL(/color=Blue/);

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
  await page.goto("/product/rechargeable-electric-arc-lighter");
  // Single-option product: nothing to choose
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

test("empty search state offers reset", async ({ page }) => {
  await page.goto("/search?q=sponge&max=50");
  await expect(page.getByText("Nothing matches… yet")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page).toHaveURL(/\/search\?q=sponge$/);
  await expect(page.getByRole("link", { name: "Magic Eraser Cleaning Sponge, Pack of 4" })).toBeVisible();
});

test("quick view bottom sheet adds a valid variant", async ({ page }) => {
  await page.goto("/search?cat=kitchen");
  await page.getByRole("button", { name: "Quick view: 2-in-1 Oil Sprayer & Pourer Bottle" }).click();
  const dlg = page.getByRole("dialog", { name: "Quick View" });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: "Add to Bag" }).click();
  await expect(dlg).toBeHidden();
  await expect(page.getByRole("status").getByText(/Added to bag/)).toBeVisible();
});

test("key pages have no horizontal overflow at 360px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  for (const path of ["/", "/categories", "/drops", "/wishlist", "/account", "/swipe", "/product/daluci-baby-safety-socket-covers", "/product/soap-dispenser-with-sponge-holder", "/search?cat=personal-care", "/help/returns", "/cart"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await noHorizontalOverflow(page);
  }
});

test("seasonal offer tile opens a matching, price-capped listing", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("heading", { name: "Under ₹199" }).getByRole("link").click();
  await expect(page).toHaveURL(/max=199/);
  await expect(page.locator("article").first()).toBeVisible();
  const prices = await page.locator("article span.font-semibold.text-ink").allInnerTexts();
  expect(prices.length).toBeGreaterThan(0);
  for (const p of prices) expect(Number(p.replace(/[₹,]/g, ""))).toBeLessThanOrEqual(199);
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
  await page.goto("/cart?share=K009-TEAL*2,NOPE*1");
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

test("live location: asks only on tap and never applies a guess silently", async ({ page, context }) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 12.9352, longitude: 77.6245 });
  await page.goto("/");
  await page.getByRole("button", { name: /Add pincode/ }).first().click();
  await page.getByRole("button", { name: "Use my current location" }).click();
  // With a reachable geocoder the exact pincode is offered for confirmation;
  // offline it falls back to the nearest city and asks for the pincode.
  await expect(page.getByText(/Bengaluru|560\d{3}/).first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: /Add pincode/ }).first()).toBeVisible();
});

test("location outside India is refused", async ({ request }) => {
  const res = await request.post("/api/locate", { data: { lat: 51.5, lon: -0.12 } });
  expect(res.status()).toBe(422);
});

test("back button returns to the previous page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Back", exact: true })).toHaveCount(0);
  await page.getByRole("link", { name: "Kitchen", exact: true }).first().click();
  await expect(page).toHaveURL(/cat=kitchen/);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("product rows and offers only move when swiped (no automatic sliding)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /Pause slides|Pause offers/ })).toHaveCount(0);
  const offers = page.locator("#offers ul");
  if (await offers.count()) {
    const start = await offers.evaluate((el) => el.scrollLeft);
    await page.waitForTimeout(5500);
    expect(await offers.evaluate((el) => el.scrollLeft)).toBe(start);
  }
});

test("Krip Lab: Build a Fit totals, Colour Match reads a sample, Size Finder suggests a size", async ({ page }) => {
  test.skip(!IS_FASHION, "Fashion-only tools are hidden while Krip sells home gadgets.");
  await page.goto("/fit");
  await expect(page.getByRole("heading", { name: /Swipe each row/ })).toBeVisible();
  await expect(page.getByText(/pieces · individual prices added up/)).toBeVisible();
  await page.goto("/colour-match");
  await page.getByRole("button", { name: "Try a sample" }).click();
  await expect(page.getByText("Colours we found")).toBeVisible();
  await expect(page.getByText(/in stock$/).first()).toBeVisible();
  await page.goto("/product/constellation-oversized-tee");
  await page.getByRole("button", { name: /Find my size/ }).click();
  await page.getByLabel(/Your chest/).fill("37");
  await page.getByRole("dialog").getByRole("button", { name: "Find my size" }).click();
  await expect(page.getByText("Suggested size")).toBeVisible();
  await page.getByRole("button", { name: /^Select / }).click();
  await expect(page.getByRole("radio", { name: "S", exact: true })).toHaveAttribute("aria-checked", "true");
});

test("footer columns and legal pages", async ({ page }) => {
  await page.goto("/");
  for (const h of ["Get to Know Us", "Connect with Us", "Let Us Help You", "Shop", "Customer Support", "Legal & Policies"]) {
    await expect(page.getByRole("heading", { name: h, exact: true })).toBeVisible();
  }
  const footer = page.getByRole("navigation", { name: "Footer" });
  for (const l of ["Help Center / FAQs", "Exchange Policy", "Order Tracking", "Cookie Policy", "Shipping Policy"]) await expect(footer.getByRole("link", { name: l })).toBeVisible();
  // WhatsApp support only appears once a number is configured.
  await expect(footer.getByRole("link", { name: "WhatsApp Support" })).toHaveCount(0);
  await expect(page.getByText("© 2026 Krip. All rights reserved.")).toBeVisible();
  await expect(page.getByText("Currency: INR (₹)")).toBeVisible();
  await footer.getByRole("link", { name: "Return & Refund Policy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Return & Refund Policy" })).toBeVisible();
  await page.goto("/help/cookies");
  await expect(page.getByRole("heading", { level: 1, name: "Cookie Policy" })).toBeVisible();
  await page.goto("/help/contact");
  await expect(page.getByRole("heading", { level: 1, name: "Contact Krip" })).toBeVisible();
});

test("slash key focuses search", async ({ page }) => {
  await page.goto("/drops");
  await page.waitForLoadState("networkidle");
  await page.locator("body").click({ position: { x: 5, y: 600 } });
  await page.keyboard.press("/");
  await expect(page.getByRole("combobox", { name: "Search Krip" })).toBeFocused();
});

test("typed search text is visible (not white on the white field)", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("combobox", { name: "Search Krip" });
  await input.click();
  await input.pressSequentially("drain");
  await expect(input).toHaveValue("drain");
  const { color, bg } = await input.evaluate((el) => ({
    color: getComputedStyle(el).color,
    bg: getComputedStyle(el.closest("form")!).backgroundColor,
  }));
  expect(color).not.toBe(bg);
  const option = page.getByRole("option").first();
  await expect(option).toBeVisible();
  const optColor = await option.locator("button span").nth(1).evaluate((el) => getComputedStyle(el).color);
  expect(optColor).not.toBe("rgb(255, 255, 255)");
});
