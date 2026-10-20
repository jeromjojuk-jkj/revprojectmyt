import type { ReactNode } from "react";

// Prototype policy text. Every policy must be reviewed by Krip and a legal
// advisor (Consumer Protection (E-Commerce) Rules, 2020; DPDP Act, 2023)
// before launch. Nothing here promises timelines Krip can't yet keep.

export const PAGES: Record<string, { title: string; body: ReactNode }> = {
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
