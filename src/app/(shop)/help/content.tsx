import type { ReactNode } from "react";

// Prototype policy text. Every policy must be reviewed by Krip and a legal
// advisor (Consumer Protection (E-Commerce) Rules, 2020; DPDP Act, 2023)
// before launch. Nothing here promises timelines Krip can't yet keep.

export const PAGES: Record<string, { title: string; body: ReactNode }> = {
  about: {
    title: "About Krip",
    body: (
      <>
        <p>Krip sells trending, affordable fashion, beauty and accessories for Gen Z and young adults across India. Trending looks. Your kind of price.</p>
        <h2>How we work</h2>
        <p>We source products from vendors we work with directly, check them, and sell them here and on other marketplaces. Every product page shows the seller, country of origin and return rules before you buy.</p>
        <h2>What we won’t do</h2>
        <ul>
          <li>No fake reviews, ratings or “only 2 left” warnings.</li>
          <li>No countdown timers that reset.</li>
          <li>No delivery promises we can’t keep — dates are shown as estimates.</li>
        </ul>
      </>
    ),
  },
  contact: {
    title: "Contact Krip",
    body: (
      <>
        <p>We’d love to hear from you — about an order, a size question, a return, or working with us.</p>
        <h2>Before you write</h2>
        <ul>
          <li>Order questions: open <a href="/orders">Your Orders</a> and keep your order ID handy (it looks like KRP-261020-ABC123).</li>
          <li>Returns and refunds: see the <a href="/help/refunds">Refund Policy</a> and the return rule on each product page.</li>
          <li>Sizes: every clothing and footwear page has a size chart and a Size Finder.</li>
        </ul>
        <h2>Ways to reach us</h2>
        <p>Email, phone/WhatsApp support hours and the grievance officer’s details (required under the Consumer Protection (E-Commerce) Rules, 2020) will be published here before launch. This prototype doesn’t have a staffed support channel yet.</p>
        <h2>Suppliers</h2>
        <p>Want to sell through Krip? See <a href="/help/suppliers">Sell with Krip</a>.</p>
      </>
    ),
  },
  refunds: {
    title: "Refund Policy",
    body: (
      <>
        <p>This policy explains when and how you get money back. What’s returnable is shown on each product page before you buy.</p>
        <h2>When you can get a refund</h2>
        <ul>
          <li><b>Returned items:</b> items marked “returnable”, sent back within their return window unused, unwashed and with tags attached.</li>
          <li><b>Cancelled orders:</b> orders you cancel before they’re packed.</li>
          <li><b>Problems on arrival:</b> damaged, defective or wrong items reported within 48 hours of delivery with photos (for non-returnable items like cosmetics and earrings we replace the item; if a replacement isn’t available we refund).</li>
          <li><b>Items we can’t deliver:</b> if we cancel because an item became unavailable or your pincode can’t be served.</li>
        </ul>
        <h2>Not refundable</h2>
        <ul>
          <li>Items marked “Not returnable” or “Exchange only”, except when damaged, defective or wrong.</li>
          <li>Items returned used, washed, without tags, or after the return window.</li>
        </ul>
        <h2>How refunds are paid</h2>
        <ul>
          <li><b>Paid online (UPI/card):</b> back to the original payment method through our payment provider.</li>
          <li><b>Cash on Delivery:</b> to a bank account or UPI ID you give us.</li>
          <li>The delivery charge is refunded when the whole order is cancelled before dispatch or when we sent a wrong or damaged item. The COD fee is refunded in the same cases.</li>
        </ul>
        <h2>Timing</h2>
        <p>We start the refund once a returned item passes a quality check, or immediately for cancellations. How long it then takes to reach you depends on your bank or payment provider — we’ll show the status on your order page.</p>
      </>
    ),
  },
  suppliers: {
    title: "Sell with Krip",
    body: (
      <>
        <p>Make or source fashion, beauty or accessories? Krip works with vendors who can supply authorised product photos, accurate specifications and consistent stock.</p>
        <h2>What we need from suppliers</h2>
        <ul>
          <li>Product data in our CSV format (size charts measured on the garment, materials, care, country of origin).</li>
          <li>For cosmetics: full ingredient lists, net quantity, manufacturer/importer details and expiry information from the label.</li>
          <li>Rights to the photos and descriptions you share.</li>
        </ul>
        <p>A supplier enquiry form and contact details will be published here before launch.</p>
      </>
    ),
  },
  shipping: {
    title: "Shipping & delivery",
    body: (
      <>
        <p>We ship across India through courier partners. Delivery dates shown on product pages and at checkout are estimates based on your pincode — they’re not guarantees.</p>
        <h2>Delivery charges</h2>
        <p>A flat delivery charge applies per order and is shown in your bag before you pay. If a free-delivery threshold is ever offered, it will be shown in your bag too.</p>
        <h2>Cash on Delivery</h2>
        <p>COD is available on eligible pincodes and order values, and a small COD fee applies. Eligibility is shown at checkout.</p>
        <h2>Tracking</h2>
        <p>Your order page shows the latest status. Courier tracking links will be added once a shipping partner is connected.</p>
      </>
    ),
  },
  returns: {
    title: "Returns & exchanges",
    body: (
      <>
        <p>Every product page shows whether that item can be returned or exchanged, and for how long, <b>before</b> you buy.</p>
        <h2>Typical rules</h2>
        <ul>
          <li>Most clothing, footwear and bags: return or exchange within 7 days of delivery if unused, unwashed and with tags attached.</li>
          <li>Cosmetics and earrings: not returnable for hygiene reasons. If they arrive damaged, leaking or wrong, report it within 48 hours with photos and we’ll replace it.</li>
          <li>Some items are exchange-only — this is labelled on the product page.</li>
        </ul>
        <h2>Refunds</h2>
        <p>Approved refunds are issued to the original payment method through our payment provider, or to a bank account/UPI for COD orders. Timelines depend on the provider and your bank.</p>
      </>
    ),
  },
  cancellation: {
    title: "Cancellation",
    body: (
      <>
        <p>You can cancel an order from its order page until it’s packed. Once packed or shipped, use returns instead (where the item is returnable).</p>
        <p>If you paid online, the refund for a cancelled order is issued to your original payment method through the payment provider.</p>
        <p>Krip may cancel an order if an item becomes unavailable or the address can’t be serviced. If that happens you’ll see it on your order page.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    body: (
      <>
        <p>We collect only what we need to deliver your order: name, phone, optional email, delivery address and order details.</p>
        <h2>On your device</h2>
        <p>Your bag, wishlist, recently viewed items, recent searches, saved pincode and order links are stored in your browser’s local storage. You can clear them anytime from your browser settings or the Account page.</p>
        <h2>Location</h2>
        <p>If you tap “Use my current location”, your browser asks your permission and then shares your coordinates with Krip once, to look up your pincode and city through a mapping service (OpenStreetMap in this prototype). We don’t store your coordinates. You can always type your pincode instead.</p>
        <h2>Payments</h2>
        <p>Card and UPI details are handled by the payment provider. Krip never sees or stores your full card number or UPI PIN.</p>
        <h2>Sharing</h2>
        <p>We share your delivery details with courier partners only to deliver your order. We don’t sell your data.</p>
        <h2>Your rights</h2>
        <p>You can ask us to access, correct or delete your personal data via the contact options on the Help page.</p>
      </>
    ),
  },
  terms: {
    title: "Terms of use",
    body: (
      <>
        <p>By using Krip you agree to these terms. Krip sources products from vendors and sells them to you; seller and country-of-origin details are shown on each product where supplied.</p>
        <h2>Prices</h2>
        <p>Prices include GST. Delivery and any COD fee are shown before you pay. If a price changes between adding to bag and checkout, we’ll show the new price and ask you to confirm.</p>
        <h2>Orders</h2>
        <p>An online-paid order is confirmed only after our payment provider confirms the payment to us. If a payment fails, no order is confirmed.</p>
        <h2>Other marketplaces</h2>
        <p>Some Krip products may also be sold on other marketplaces. Purchases made there follow that marketplace’s own terms.</p>
      </>
    ),
  },
};
