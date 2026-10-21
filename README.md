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
| `npm run dev` | Development server (first admin: `owner@krip.local` / `krip-admin-demo`) |
| `npm run build && npm start` | Production build/server (requires the env vars below for admin) |
| `npm run typecheck` | TypeScript check |
| `npm test` | Unit tests: search, pricing, coupons, roles, TOTP, passwords, order rules, metrics, CSV import (Node test runner) |
| `npm run test:e2e` | Playwright storefront and admin journeys against a fresh production build |

For Playwright in an environment with a preinstalled Chromium, set `PW_CHROMIUM_PATH=/path/to/chrome`.

### Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
| --- | --- |
| `ADMIN_EMAIL` | Email of the first Super Admin, created the first time anyone signs in (default `owner@krip.local`). |
| `ADMIN_PASSWORD` | That first Super Admin's password (8+ chars). **Required in production**; admin is disabled without it. Once the account exists, change the password in Admin → Security; further staff are invited from Admin → Staff & roles. |
| `SESSION_SECRET` | Required in production (16+ chars); also signs development fallbacks. Admin sessions are random tokens stored server-side (hashed) so they can be revoked. |
| `PAYMENT_PROVIDER` | Name of a real provider. With no adapter implemented, setting it **disables** online payment instead of faking it. |
| `PAYMENT_WEBHOOK_SECRET` | HMAC secret used to verify payment webhooks. |
| `DEMO_PAYMENTS` | `true` (default) enables the demo gateway when no provider is set; `false` hides online payment. |
| `NOTIFY_PROVIDER` | Back-in-stock alerts are offered only when a notification service is connected. |
| `KRIP_DATA_DIR` | Location of the prototype JSON datastore (default `.data`). |

Data is created from the sample catalogue on first run. **Admin → Dashboard → Reset demo data** restores it (staff, roles and the audit log are kept).

## Connected vs demo

| Feature | Status |
| --- | --- |
| Catalogue, search, suggestions, filters, sorting, facets | ✅ Working (server data) |
| Server-side price, stock and order-total validation | ✅ Working: totals are recomputed on the server, and a changed total returns `409` with a fresh quote |
| Overselling protection | ✅ Stock is reserved in a serialised write; pending online payments hold stock for 15 min |
| Duplicate-order protection | ✅ Idempotency key per checkout attempt |
| Guest bag, wishlist + named lists, recently viewed, recent searches, pincode | ✅ Persisted on the device (localStorage) |
| Admin: staff accounts, roles and permissions, 2-step sign-in, audit log | ✅ Working, enforced on the server |
| Admin: products, variants, images, supplier, costs, channel prices, status, bulk edits | ✅ Working |
| Admin: orders, shipments, holds, refunds (recorded), inventory ledger, customers, coupons, store settings | ✅ Working (see Admin below for what's recorded vs. integrated) |
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
| Courier tracking | 🟡 Courier, AWB and tracking updates are recorded by staff and shown to the customer; no courier API is connected |
| Refunds | 🟡 Recorded with the provider/bank reference; there is no refund API, so real refunds are issued in the provider's dashboard |
| Email / SMS / WhatsApp | ⚪ Not connected. Staff invites and password resets use one-time links shared by a Super Admin |

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
- **Live location:**
  - **Use my current location** appears in the pincode sheet and at checkout. The browser asks permission only after the tap.
  - The server reverse-geocodes the coordinates through OpenStreetMap Nominatim (`GEOCODE_PROVIDER`; set `GEOCODE_USER_AGENT` to identify your app). It is rate-limited and India-only, and coordinates are not stored.
  - The shopper always confirms the detected pincode.
  - If no geocoder is reachable, it shows the nearest city as "approximate" and asks for the pincode. It never guesses one.
- **Meesho-style shopping aids:**
  - "New" and "Trending" card badges, plus return info on each card.
  - One-tap quick filters: Women, Men, Under ₹299/₹499, In stock, Price low→high.
  - Product page: product highlights, a seller card and Share on WhatsApp.
  - A Bag → Address & payment → Pay → Confirmed progress stepper.
  - Price details with Total MRP, Discount on MRP and a "You save ₹X" banner. This only appears when a real MRP exists.
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
- **Krip Lab (futuristic tools):**
  - **Build a Fit** (`/fit`): swipe four rows (top/dress, bottom, footwear, extra) into an outfit. It has a 🎲 Surprise-me shuffle, a live total and "Save fit".
  - **Colour Match** (`/colour-match`): pick any photo, and its dominant colours are read on the device with a canvas. They map to shop colour families, and you can shop the in-stock matches. The photo is never uploaded.
  - **Size Finder** on product pages: one body measurement is compared with that item's own size chart, with a snug, regular or relaxed preference. It suggests a size and the next size up.
  - **Spotlight 3D**: a dark stage where you drag to turn the product, with lighting and a reflection.
- **UI polish:**
  - A frosted-glass header on scroll and an animated aurora glow behind the offers.
  - Glass "Krip Lab" tiles, shimmering New/Trending badges, and confetti the first time a successful order shows.
  - Smooth page cross-fades in the demo.
  - All of it respects reduced-motion settings.
- **Navigation & motion extras:**
  - A **Back** button at the top of every page except home. It returns to the previous Krip page, or home if you arrived from outside.
  - **Moving product slides**: New Drops and Beauty & accessories glide continuously, and the offer tiles auto-advance every 4.5 s.
  - Slides pause on touch, hover or keyboard focus, and each row has a Pause/Play button.
  - With reduced motion on, slides stay still and become normal swipe rows.
- **UX helpers:**
  - A scroll-progress line under the header and a floating "scroll to top" button.
  - Press `/` or Ctrl/⌘+K anywhere to jump to search.
  - "Recently viewed" now sits near the top of home for returning shoppers.
  - The Account page doubles as a hub with Krip Lab shortcuts.
- **Footer:** a "See picks for your vibe" prompt, Back to top, five link columns (Get to Know Us: About, Contact · Connect with Us: Instagram, Facebook · Let Us Help You: Account, Orders, Wishlist · Shop: Shop All, New Drops, Style Swipe, Categories · Legal: Privacy, Terms & Conditions, Refund Policy) and English / India chips. Social links say "soon" until real accounts exist.
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

A grouped, collapsible sidebar shows only the modules a person's role allows. The top bar has global search (order ID, phone, email, AWB, SKU, customer), breadcrumbs, a notification centre and the account menu. The layout works on phones (the sidebar becomes a drawer).

| Module | What it does |
| --- | --- |
| **Dashboard** | 7/30/90-day KPIs with comparison to the previous period: gross sales, discounts, refunds, net sales, total revenue, orders, AOV, new vs returning customers. It also shows daily sales, sales by category, payment method and state, order status, top products, recent orders and a "needs attention" queue. Every formula is defined in `src/lib/metrics.ts` and shown as a tooltip. Conversion and return rates are listed as "not measured" rather than invented. |
| **Orders** | Status tabs, search and filters (status, payment status, method, dates, value, hold/review flags), sorting, pagination and CSV export. The order page has a state-aware action panel: confirm, pack, ship (courier + AWB + tracking link), tracking updates, deliver, COD collected, hold/release, cancel (releases stock) and refund (capped at money received minus earlier refunds). It also shows internal notes, a full timeline and a printable packing slip and receipt. Order, payment and fulfilment states are separate (`src/lib/orderflow.ts`). |
| **Products** | Table with thumbnails, sort, filters, column visibility, bulk activate/draft/archive, bulk category and price changes (never above MRP), duplicate-as-draft, store preview and per-product change history. The full editor covers variants, images, size guides, beauty info, return rules, supplier and costs. Archived products leave the storefront but stay in records. |
| **Inventory** | Available / held (unpaid online orders) / allocated (sold, not shipped) per variant, low-stock and sold-out views, stock value at cost, and adjustments with a reason. The **stock ledger** records every change (orders, releases, adjustments, imports, product edits) with the resulting balance. |
| **Customers** | Guest shoppers grouped by phone number: orders, lifetime spend, AOV, addresses, segments (new, returning, frequent, high value, inactive, unfinished payment, refunded), manual groups, internal notes and an audited CSV export. |
| **Coupons** | Fixed or % off with a cap, minimum order, start/end dates (IST), total and per-customer limits, first-order-only and category restrictions, with redemption and discount reporting. Limits are enforced inside the order-creation lock, so two shoppers can't both take the last redemption. |
| **Offer tiles, CSV import** | As before. |
| **Store & footer** | Support email/phone/WhatsApp/hours, business address, GSTIN, grievance officer, accepted payment methods and social links. These feed the storefront footer and Contact page, and blank fields stay hidden. Also the announcement bar, maintenance mode (shoppers see a maintenance page and checkout is refused; staff still see the store) and the low-stock threshold. |
| **Fees & charges** | Delivery and COD fees, the free-delivery threshold, return allowance and channel fee rates (used for contribution estimates). |
| **Staff & roles** | Invite staff with a one-time link, change roles, deactivate, unlock, reset password or 2FA, sign out everywhere, and view sign-in history. 9 built-in roles (Super Admin, Store/Catalog/Inventory/Order/Marketing/Finance Manager, Support Agent, Read-Only Analyst) plus custom roles from a module × action permission grid. You can never grant more than you have, and at least one Super Admin always remains. |
| **Security** | Change password (ends all sessions), TOTP two-step sign-in, active sessions with revoke, and your own sign-in history. |
| **Audit log** | Every staff and system change with before/after values and a request ID. Secrets are redacted. Entries are hash-chained and verified on view, so tampering with the datastore shows up. |
| **System health** | Datastore, secrets, payments, webhooks, reservations, stock integrity, audit chain, 2FA coverage, plus integrations and backups that aren't connected yet. |
| **Roadmap** | Modules from the admin brief that aren't built yet, and what each needs. |

Security model:
- Passwords are hashed with scrypt.
- Sessions are random tokens stored hashed on the server: 8 hours absolute, 2 hours idle, and revocable. Changing a password or role ends them.
- An account locks for 15 minutes after 5 failed attempts, and each IP is throttled.
- Cookies are `httpOnly`, `SameSite=Strict` and `Secure` in production.
- Every page, server action and admin route checks a permission on the server (`requirePerm` / `checkPerm`). Hidden links are also refused by the server.
- Supplier and cost data stays in `product.private` and is only shown to finance roles. `toPublicProduct()` strips it from every shopper response.

## Architecture

```
src/
  app/(shop)/…           storefront routes (App Router)
  app/admin/…            login + protected admin (server actions re-check auth)
  app/api/…              quote, orders, payments (webhook + demo gateway), pincode, search, products
  app/art/[file]         generated SVG sample illustrations
  components/            UI: Sheet (native <dialog>), ProductCard, QuickView, VariantPicker, Gallery…
  data/catalog.ts        SAMPLE catalogue + curated looks
  lib/                   pure logic (unit tested): search, pricing, coupons, rbac, orderflow,
                         metrics, orderQuery, storeProfile, totp, passwords, CSV, product validation
  lib/server/            server-only: datastore, auth/sessions, audit, inventory ledger, customers,
                         orders/payments, estimates
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
5. Fill in Admin → Store & footer with real contact and grievance-officer details. Have the policies reviewed (Consumer Protection (E-Commerce) Rules, DPDP Act).
6. Turn on two-step sign-in for every Super Admin, Store Manager and Finance Manager.
7. Add customer accounts if cross-device order history is needed.
