import type { ReactNode } from "react";

// Store policies shown under /help. Krip should read these and adjust them to how
// it actually operates. Nothing here promises timelines Krip can't keep.

export const PAGES: Record<string, { title: string; body: ReactNode }> = {
  about: {
    title: "About Krip",
    body: (
      <>
        <p>Krip sells useful home gadgets and everyday essentials — kitchen tools, cleaning helpers, baby-safety products and personal-care items — delivered across India.</p>
        <h2>How we work</h2>
        <p>We source products from suppliers we work with directly and sell them here. Every product page shows what’s in the box, how to use it, and its return rule before you buy.</p>
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
        <p>We’d love to hear from you — about an order, a product question, a return, or working with us.</p>
        <h2>Before you write</h2>
        <ul>
          <li>Order questions: open <a href="/orders">Your Orders</a> and keep your order ID handy (it looks like KRP-261020-ABC123).</li>
          <li>Returns and refunds: see the <a href="/help/refunds">Refund Policy</a> and the return rule on each product page.</li>
          <li>Product questions: each product page lists what’s in the box, sizes and how to use it.</li>
        </ul>
        <h2>Suppliers</h2>
        <p>Want to sell through Krip? See <a href="/help/suppliers">Sell with Krip</a>.</p>
      </>
    ),
  },
  refunds: {
    title: "Return & Refund Policy",
    body: (
      <>
        <p>This policy explains when and how you get money back. Whether an item can be returned is shown on each product page before you buy.</p>
        <h2>When you can get a refund</h2>
        <ul>
          <li><b>Returned items:</b> items marked “returnable”, sent back within their return window, unused and in the original packaging.</li>
          <li><b>Cancelled orders:</b> orders you cancel before they’re packed.</li>
          <li><b>Problems on arrival:</b> damaged, defective, leaking or wrong items reported within 48 hours of delivery with photos. For non-returnable items we replace the item; if a replacement isn’t available we refund.</li>
          <li><b>Items we can’t deliver:</b> if we cancel because an item became unavailable or your pincode can’t be served.</li>
        </ul>
        <h2>Not refundable</h2>
        <ul>
          <li>Items marked “Not returnable” (for example cleaning chemicals and personal-care or hygiene products), except when damaged, defective or wrong.</li>
          <li>Items returned used, without their original packaging, or after the return window.</li>
        </ul>
        <h2>How refunds are paid</h2>
        <ul>
          <li><b>Paid online (UPI/card/net banking):</b> back to the original payment method through our payment provider.</li>
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
        <p>Make or source useful home, kitchen, cleaning, baby-safety or personal-care products? Krip works with suppliers who can provide authorised product photos, accurate specifications and consistent stock.</p>
        <h2>What we need from suppliers</h2>
        <ul>
          <li>Product details: what’s in the pack, sizes, materials and how to use it.</li>
          <li>For personal-care and cleaning products: ingredients or composition, net quantity, manufacturer/importer details and expiry information from the label.</li>
          <li>Rights to the photos and descriptions you share.</li>
        </ul>
        <p>Get in touch through <a href="/help/contact">Contact Us</a>.</p>
      </>
    ),
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    body: (
      <>
        <p>We ship across India through courier partners. Delivery dates shown on product pages and at checkout are estimates based on your pincode — they’re not guarantees.</p>
        <h2>Delivery charges</h2>
        <p>A flat delivery charge applies per order and is shown in your bag before you pay. If a free-delivery threshold is offered, it’s shown in your bag too.</p>
        <h2>Cash on Delivery</h2>
        <p>COD is available on eligible pincodes and order values, and a small COD fee applies. Eligibility is shown at checkout.</p>
        <h2>Tracking</h2>
        <p>Your order page shows the latest status. Once your order ships, the courier name, AWB number and tracking link (when the courier provides one) appear there.</p>
      </>
    ),
  },
  returns: {
    title: "Returns & Refunds",
    body: (
      <>
        <p>Every product page shows whether that item can be returned, and for how long, <b>before</b> you buy.</p>
        <h2>Typical rules</h2>
        <ul>
          <li>Most home and kitchen products: return within 7 days of delivery if unused and in the original packaging.</li>
          <li>Cleaning chemicals, personal-care and hygiene products: not returnable once delivered. If they arrive damaged, leaking or wrong, report it within 48 hours with photos and we’ll replace it.</li>
        </ul>
        <h2>Refunds</h2>
        <p>Approved refunds are issued to the original payment method through our payment provider, or to a bank account/UPI for COD orders. Timelines depend on the provider and your bank.</p>
      </>
    ),
  },
  cancellation: {
    title: "Cancellation Policy",
    body: (
      <>
        <p>You can cancel an order from its order page until it’s packed. Once packed or shipped, use returns instead (where the item is returnable).</p>
        <p>If you paid online, the refund for a cancelled order is issued to your original payment method through the payment provider.</p>
        <p>Krip may cancel an order if an item becomes unavailable or the address can’t be serviced. If that happens you’ll see it on your order page.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p>We collect only what we need to deliver your order: name, phone, optional email, delivery address and order details.</p>
        <h2>On your device</h2>
        <p>Your bag, wishlist, recently viewed items, recent searches, saved pincode and order links are stored in your browser’s local storage. You can clear them anytime from your browser settings or the Account page.</p>
        <h2>Location</h2>
        <p>If you tap “Use my current location”, your browser asks your permission and then shares your coordinates with Krip once, to look up your pincode and city through a mapping service (OpenStreetMap). We don’t store your coordinates. You can always type your pincode instead.</p>
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
    title: "Terms & Conditions",
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
  faq: {
    title: "Help Center & FAQs",
    body: (
      <>
        <h2>Orders</h2>
        <p><b>Where’s my order?</b> Open <a href="/orders">Your Orders</a>. Once your order ships, the courier name and AWB number appear on the order page.</p>
        <p><b>Can I change my address after ordering?</b> Not from the site yet. Cancel the order before it’s packed and place it again with the right address.</p>
        <p><b>How do I cancel?</b> From the order page, until the order is packed. See the <a href="/help/cancellation">Cancellation Policy</a>.</p>
        <h2>Payments</h2>
        <p><b>When is my order confirmed?</b> For online payments, only after the payment provider confirms the payment to us. For Cash on Delivery, as soon as it’s placed.</p>
        <p><b>Is COD available?</b> On eligible pincodes and order values. Checkout shows whether it’s available for you, and the COD fee, before you place the order.</p>
        <p><b>My money was deducted but the order shows payment failed.</b> Contact us with your order ID. Banks usually reverse failed debits automatically; we’ll check with the payment provider.</p>
        <h2>Products and returns</h2>
        <p><b>What’s in the box?</b> Every product page lists the pack contents, sizes and how to use it.</p>
        <p><b>Can I return or exchange this?</b> Each product page shows its return or exchange rule before you buy. See <a href="/help/returns">Returns & Refunds</a> and the <a href="/help/exchange">Exchange Policy</a>.</p>
        <h2>Account</h2>
        <p><b>Do I need an account?</b> No. Your bag, wishlist and order links are saved on this device.</p>
      </>
    ),
  },
  exchange: {
    title: "Exchange Policy",
    body: (
      <>
        <p>If an item arrives damaged, defective or wrong, we’ll exchange it for the right one. Whether an item can also be returned, and for how many days, is shown on its product page before you buy.</p>
        <h2>Conditions</h2>
        <ul>
          <li>Ask for the exchange within the window shown on the product page, counted from delivery.</li>
          <li>Report a damaged, defective or wrong item within 48 hours of delivery, with photos.</li>
          <li>Keep the item and its original packaging until the exchange is sorted.</li>
          <li>Exchanges depend on the item being in stock. If it isn’t, we’ll refund you.</li>
        </ul>
        <h2>Not exchangeable</h2>
        <ul>
          <li>Items you’ve used, or that are marked “Not returnable”, unless they arrived damaged, defective or wrong.</li>
        </ul>
        <h2>How to ask</h2>
        <p>Contact us with your order ID and photos of the problem. See <a href="/help/contact">Contact Us</a>.</p>
      </>
    ),
  },
  cookies: {
    title: "Cookie Policy",
    body: (
      <>
        <p>This page explains what Krip stores in your browser.</p>
        <h2>Cookies</h2>
        <p>The shopping site doesn’t set advertising or analytics cookies. The only cookie Krip sets is a strictly necessary sign-in cookie for Krip staff using the admin area.</p>
        <h2>Local storage on your device</h2>
        <p>Your bag, wishlist, recently viewed items, recent searches, saved pincode and links to your orders are kept in your browser’s local storage so they’re there next time. They aren’t sent to us until you place an order. You can clear them anytime from your browser settings.</p>
        <h2>Third parties</h2>
        <p>If analytics, advertising or chat tools are added later, this page will list them and, where required, ask for your consent first.</p>
      </>
    ),
  },
};
