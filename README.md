# krip

**Trending looks. Your kind of price.**

A mobile-first Indian fashion storefront prototype: men’s and women’s clothing, cosmetics, footwear, bags,
jewellery and accessories. It has a working shopper journey (browse → filter → product → variant → bag →
checkout → order tracking) and a protected admin area for reselling operations.

> ⚠️ **Prototype.** The catalogue is labelled sample data with generated illustrations rather than product photos.
> Payments run through a clearly labelled **demo gateway**, and no real money moves.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server (admin password defaults to `krip-admin-demo`) |
| `npm run build && npm start` | Production build/server (requires the env vars below for admin) |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests: search, filters, pricing, CSV import, validation (Node test runner) |
| `npm run test:e2e` | Playwright mobile journeys against a fresh production build |

For Playwright in an environment with a preinstalled Chromium, set `PW_CHROMIUM_PATH=/path/to/chrome`.

### Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `ADMIN_PASSWORD` | Admin sign-in (8+ chars). **Required in production**; admin is disabled without it. |
| `SESSION_SECRET` | Signs admin session cookies (16+ chars). **Required in production.** |
| `PAYMENT_PROVIDER` | Name of a real provider. With no adapter implemented, setting it **disables** online payment instead of faking it. |
| `PAYMENT_WEBHOOK_SECRET` | HMAC secret used to verify payment webhooks. |
| `DEMO_PAYMENTS` | `true` (default) enables the demo gateway when no provider is set; `false` hides online payment. |
| `NOTIFY_PROVIDER` | Back-in-stock alerts are offered only when a notification service is connected. |
| `KRIP_DATA_DIR` | Location of the prototype JSON datastore (default `.data`). |

Data is created from the sample catalogue on first run. **Admin → Overview → Reset demo data** restores it.

## Connected vs demo

| Feature | Status |
| --- | --- |
| Catalogue, search, suggestions, filters, sorting, facets | ✅ Working (server data) |
| Server-side price, stock and order-total validation | ✅ Working: totals are recomputed on the server, and a changed total returns `409` with a fresh quote |
| Overselling protection | ✅ Stock is reserved in a serialised write; pending online payments hold stock for 15 min |
| Duplicate-order protection | ✅ Idempotency key per checkout attempt |
| Guest bag, wishlist + named lists, recently viewed, recent searches, pincode | ✅ Persisted on the device (localStorage) |
| Admin: products, variants, images, supplier, costs, channel prices, status | ✅ Working, password protected |
| Validated CSV import (all-or-nothing) and CSV export | ✅ Working |
| Contribution estimates (per product/channel and per order) | ✅ Working, labelled as estimates |
| Order fulfilment status and customer tracking timeline | ✅ Working (statuses updated manually in admin) |
| Online payment (UPI/card) | 🟡 **Demo gateway.** It produces HMAC-signed events through the same webhook verification path a real provider would use. No money moves. |
| Cash on Delivery | 🟡 **Demo.** Orders are recorded; there is no courier integration. |
| Delivery estimates and serviceability | 🟡 Sample pincode rules in `src/lib/pincode.ts`, shown as estimates |
| Product data and images | 🟡 Sample data and generated SVG illustrations (`/art/*`), labelled on the product page |
| Reviews and ratings | ⚪ None shown. The UI only displays real reviews, and rating sorts stay hidden until there are enough of them. |
| Back-in-stock alerts | ⚪ Not offered, because no notification service is connected |
| Account sign-in / cross-device sync | ⚪ Not connected; guest checkout only |
| Marketplace sync (Amazon/Flipkart/Meesho) | ⚪ Not built. Products are entered manually or by CSV. Each product can link out to a real Krip listing elsewhere, with a clear label. |
| Courier tracking links | ⚪ Not connected |

## Shopper features

- **Marketplace-style top bar:** a charcoal main bar with the logo, delivery pincode, a search box with a category picker and a yellow search button, "Hello, guest / Account & Lists", "Returns & Orders" and the bag count. Below it, a green department strip has an "All" menu, category links and the live season promo, e.g. "Diwali Edit | Live now". The promo only shows while an offer is live.
  The bottom nav has Home, Categories, Drops, Wishlist and Account. Fixed bars respect safe areas.
  Touch targets are at least 44px, and the layout is tested for no horizontal overflow at 360px.
- **Homepage (shopping-led):** category shortcuts → one campaign banner (Aura Edit) → Trending Now
  (curated, with no fake popularity) → budget edits under ₹299/₹499/₹999 → New Drops → Shop Your Vibe →
  Complete the Look → beauty and accessories → help links.
- **Search & discovery:**
  - Search covers product, category, colour family and style tags, with synonyms.
  - Suggestions, recent searches and category-specific facets: size/fit/colour/material for clothing,
    shade/skin type for beauty, and price bands.
  - Applied-filter chips, clear all, live result counts and an empty state with a reset action.
  - Filters live in the URL, and scroll position is restored when you come back from a product.
- **Product cards:** press-scale feedback, a heart pop on wishlist, and a second image on desktop hover only.
  A labelled **Quick View** bottom sheet lets you pick a variant and add to bag. Adding shows a toast with "View bag".
- **Product page:**
  - Swipeable gallery with tap-to-zoom, plus colour and size pickers that show stock status.
  - A size guide with garment measurements (in/cm), and fit, fabric, care, package contents, seller and origin.
  - A pincode delivery estimate and the item's own return/exchange policy.
  - For cosmetics: ingredients, quantity, shade, usage, manufacturer, shelf life and hygiene return rules.
  - Native share with a copy-link fallback, Complete the Look, related products and recently viewed.
  - Sticky **Add to Bag / Buy Now**. A valid in-stock variant is required before anything goes in the bag.
- **Seasonal & special offers:** a swipeable rail of bold offer tiles (e.g. "Under ₹999 · Kurtas & kurtis · Diwali Edit"), managed in **Admin → Offers**. "From ₹…", style counts and "up to …% off MRP" are computed from the catalogue. A headline like "Under ₹299" must be backed by `max=299` in the tile's link, so saving is blocked otherwise. Optional start/end dates hide tiles automatically, and terms show behind "T&C apply" only when entered. There are no countdowns, invented bank offers or delivery promises.
- **New-gen extras:**
  - **Style Swipe** (`/swipe`): swipe right to save to your wishlist, left to skip. Buttons and arrow keys work too.
  - **Shop by colour** swatches.
  - **Voice search**: a mic in the search box, shown only where the browser supports speech recognition.
  - **Ask a friend**: share your bag as a link. The friend sees the items and can add them to their own bag, with prices and stock re-checked on the server.
- **Motion:**
  - Product illustrations get studio lighting, depth, a fabric texture and a floor shadow.
  - On desktop, cards tilt in 3D with a light glare.
  - Cards rise in as you scroll, where the browser supports scroll-driven animation.
  - Adding to bag flies a thumbnail into the bag icon.
  - All motion respects reduced-motion settings.
- **Footer:** a "See picks for your vibe" prompt, Back to top, four link columns (Get to Know Us, Connect with Us, Sell with Krip, Let Us Help You) and English / India chips. Social links say "soon" until real accounts exist.
- **Vibe Finder:** four questions (who, vibe, budget, what). Results say they're based only on those answers.
- **Complete the Look:** each piece shows its own price and variant picker, plus a combined total and "Add selected to bag".
- **Checkout:**
  - Guest checkout with Indian address, phone and pincode validation, and a server-calculated summary
    (items, discount, delivery, COD fee, total).
  - Payment success comes only from a verified callback. A failed payment shows as failed, releases the stock,
    and offers retry or "put items back in bag".
  - Order history (on this device), a tracking timeline, and cancellation before packing.
- **Policies:** Help & contact, shipping, returns, cancellation, privacy and terms. These are prototype text and need legal review.

## Admin (`/admin`)

- Products: list with search and status filter, supplier/source ref, cost, price and estimated contribution
  per channel. You can edit everything, including variants, images, size guides, beauty label info and
  return rules. Products can be draft, active or out-of-stock. Activating one requires confirming Krip may
  use the photos and descriptions.
- CSV import: template download, preview with row-level errors, and all-or-nothing commit. Export includes private columns.
- Orders: fulfilment actions (confirm → packed → shipped → delivered, or cancel), payment events, history,
  and estimated contribution per order.
- Fees & settings: delivery fee, optional free-delivery threshold, COD fee and limit, return allowance,
  channel fee rates, and coupon codes.
- Supplier, cost and channel-pricing data live in `product.private`. `toPublicProduct()` strips it from
  every shopper response, and an e2e test checks that it never reaches the public API.

## Architecture

```
src/
  app/(shop)/…           storefront routes (App Router)
  app/admin/…            login + protected admin (server actions re-check auth)
  app/api/…              quote, orders, payments (webhook + demo gateway), pincode, search, products
  app/art/[file]         generated SVG sample illustrations
  components/            UI: Sheet (native <dialog>), ProductCard, QuickView, VariantPicker, Gallery…
  data/catalog.ts        SAMPLE catalogue + curated looks
  lib/                   pure logic: search, pricing, pincode, CSV, product validation (unit tested)
  lib/server/            server-only: datastore, auth, orders/payments, estimates
```

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 and Zustand.
  Poppins is self-hosted via `@fontsource`. There is no animation library: CSS transitions run at 150–250 ms
  and respect `prefers-reduced-motion`.
- **Accessibility:**
  - Semantic landmarks and a skip link.
  - Dialogs use native `<dialog>`, which gives a focus trap, Esc to close and an inert background.
  - Radio-group variant pickers, an ARIA combobox for search, live regions for toasts and counts, and visible focus rings.
  - Palette contrast: white on green #166534 ≈ 7:1. Charcoal on brand yellow #FFD703 ≈ 13:1 (sampled from the logo); green on yellow ≈ 5:1. Muted gold #B89548 is decorative only; small gold-toned text uses a darker #7A5F22 (≈5.6:1).

## Deploying to Vercel (demo)

1. In Vercel, **Add New → Project → Import** `jeromjojuk-jkj/revprojectmyt` (framework: Next.js, defaults are fine).
2. Pick the branch to deploy (`main` after the PR is merged, or `claude/elegant-planck-7ou45x` for a preview).
3. Add environment variables: `ADMIN_PASSWORD` (8+ chars) and `SESSION_SECRET` (16+ chars, e.g. `openssl rand -hex 32`). Leave `DEMO_PAYMENTS` unset to use the demo gateway.
4. Deploy. Every push to the branch redeploys automatically.

**Limitation:** on Vercel the prototype datastore lives in each serverless instance’s temporary storage. Orders, stock changes and admin edits can reset or differ between requests/instances. That’s acceptable for a click-through demo; real use needs a hosted database (step 1 below).

### Before going live

1. Replace the JSON datastore (`src/lib/server/db.ts`) with a transactional database that uses row-level locks.
2. Implement a payment adapter (create order → provider checkout → signed webhook → `handlePaymentWebhook`).
3. Connect a courier for serviceability, rates and tracking. Replace the sample pincode rules.
4. Load real, authorised product photos and supplier specifications. Remove the sample catalogue.
5. Publish real contact and grievance-officer details. Have the policies reviewed (Consumer Protection (E-Commerce) Rules, DPDP Act).
6. Add customer accounts if cross-device order history is needed.
