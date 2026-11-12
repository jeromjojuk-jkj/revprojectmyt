// Shared domain types. Anything in `ProductPrivate` must never reach the browser
// except through authenticated admin routes — see toPublicProduct() in catalog.ts.

export type FashionCategoryId = "men" | "women" | "beauty" | "footwear" | "bags" | "jewellery" | "accessories";
export type HomeCategoryId = "kitchen" | "cleaning" | "baby-safety" | "personal-care" | "kids-learning" | "fitness" | "car-garden" | "mobile";
export type CategoryId = FashionCategoryId | HomeCategoryId;

export type VibeId = "campus" | "streetwear" | "everyday" | "date-night" | "festive";

export type ProductStatus = "draft" | "active" | "out-of-stock" | "archived";

export type ArtKind =
  | "tee" | "shirt" | "hoodie" | "jeans" | "cargo" | "dress" | "kurti" | "top" | "skirt" | "coord"
  | "sneaker" | "slide" | "heel" | "boot"
  | "tote" | "sling" | "backpack"
  | "earrings" | "necklace" | "bracelet"
  | "lipstick" | "serum" | "palette" | "kajal" | "cream"
  | "cap" | "sunglasses" | "watch" | "belt" | "scrunchie"
  // Home & gadgets
  | "chopper" | "peeler" | "bottle" | "cloth" | "brush" | "organizer" | "hook" | "lock" | "corner"
  | "holder" | "nightlight" | "clip" | "stand" | "timer";

export interface Variant {
  sku: string;
  /** Colour name, or shade name for cosmetics. */
  color: string;
  colorHex: string;
  /** null for one-size / no-size products. */
  size: string | null;
  stock: number;
}

export interface SizeGuide {
  unit: "in" | "cm";
  headers: string[];
  rows: string[][];
  howToMeasure: string;
}

export interface ReturnPolicy {
  type: "returnable" | "exchange-only" | "non-returnable";
  days: number;
  note: string;
}

export interface BeautyInfo {
  ingredients: string;
  quantity: string;
  skinTypes: string[];
  usage: string;
  manufacturer: string;
  shelfLife: string;
  expiryNote?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  photos: string[];
  /** Only true when linked to a delivered Krip order. */
  purchaseVerified: boolean;
}

export interface ChannelListing {
  /** e.g. "Amazon", "Flipkart", "Meesho" — a real Krip listing on that marketplace. */
  channel: string;
  url: string;
}

export interface ProductPublic {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: CategoryId;
  subcategory: string;
  description: string;
  price: number;
  /** Only shown when supplied. */
  mrp: number | null;
  images: string[];
  /** Optional vertical product reel (MP4/WebM), shown first in the gallery. */
  video?: string | null;
  /** Short "why you'll like it" points, taken from the supplier's product information. */
  features?: string[];
  /** Step-by-step usage instructions. */
  howToUse?: string[];
  variants: Variant[];
  sizeGuide: SizeGuide | null;
  fit: string | null;
  material: string | null;
  care: string[];
  packageContents: string | null;
  origin: string | null;
  seller: string | null;
  styleTags: string[];
  vibes: VibeId[];
  collections: string[];
  returnPolicy: ReturnPolicy;
  beauty: BeautyInfo | null;
  reviews: Review[];
  channelListings: ChannelListing[];
  createdAt: string;
  status: ProductStatus;
  isSample: boolean;
  /** Set when a marketplace vendor sells this product; absent/null = sold by Krip. */
  vendorId?: string | null;
  /** Vendor has a Premium/Advance plan and passed Krip's checks. */
  sellerVerified?: boolean;
}

export interface ChannelPrice {
  channel: string;
  price: number;
}

export interface ProductPrivate {
  supplierName: string;
  sourceRef: string;
  purchaseCost: number;
  /** Krip's own estimate of outbound shipping cost per unit. */
  shippingCost: number;
  /** Other costs per unit: packing, labels, inserts, etc. */
  otherCost?: number;
  channelPrices: ChannelPrice[];
  /** Admin confirmed Krip is authorised to use the images and descriptions. */
  rightsConfirmed?: boolean;
  /** Vendor products: Krip's review before (and after content edits to) going live. */
  review?: { status: "pending" | "approved" | "rejected"; note: string; at: string } | null;
  /** Vendor products picked for the homepage "From our sellers" row (plan allowance). */
  featured?: boolean;
}

export interface ProductRecord extends ProductPublic {
  private: ProductPrivate;
}

export interface ChannelFee {
  channel: string;
  /** Marketplace commission as % of selling price. */
  marketplaceFeePct: number;
  /** Payment gateway fee as % of selling price. */
  paymentFeePct: number;
  /** Fixed per-order fee in ₹ (closing/pick-and-pack fees etc.). */
  fixedFee: number;
}

export type CouponKind = "fixed" | "percent";

export interface Coupon {
  code: string;
  description: string;
  /** fixed = ₹ off; percent = % off the eligible subtotal. */
  kind: CouponKind;
  /** ₹ for fixed coupons, % (1–90) for percent coupons. */
  amountOff: number;
  /** Cap on a percent discount in ₹. null = no cap. */
  maxDiscount: number | null;
  minSubtotal: number;
  active: boolean;
  /** yyyy-mm-dd (IST), inclusive. null = no limit. */
  startsOn: string | null;
  endsOn: string | null;
  /** Total redemptions allowed across all customers. null = unlimited. */
  usageLimit: number | null;
  /** Redemptions allowed per customer (by phone number). null = unlimited. */
  perCustomerLimit: number | null;
  /** Only for customers with no earlier booked order. */
  firstOrderOnly: boolean;
  /** Restrict to these categories; empty = whole bag. */
  categories: CategoryId[];
}

/** Redemption context, known only at checkout. Counts exclude failed/cancelled orders. */
export interface CouponUsage {
  total: number;
  byCustomer: number;
  customerHasOrders: boolean;
}

/** Delivery times (in working days, Sundays excluded) and the note shoppers see. */
export interface DeliveryRules {
  metroMin: number;
  metroMax: number;
  standardMin: number;
  standardMax: number;
  remoteMin: number;
  remoteMax: number;
  /** Allow Cash on Delivery to remote pincodes (north-east, J&K, islands). */
  codRemote: boolean;
  /** Shown on product pages and at checkout, e.g. dispatch time and courier info. */
  note: string;
}

/** Automatic % off the bag around a festival (see lib/festivalOffers.ts). */
export interface FestivalOffer {
  id: string;
  name: string;
  /** Main festival day, yyyy-mm-dd (India time). */
  date: string;
  /** Festival length in days (offer ends after the last one). */
  days: number;
  /** The offer starts this many days before the festival. */
  leadDays: number;
  percentOff: number;
  /** ₹ cap on the discount; null = no cap. */
  maxDiscount: number | null;
  minSubtotal: number;
  enabled: boolean;
  /** Lunar-calendar date that should be confirmed before it starts. */
  checkDate: boolean;
  tier: "big" | "standard";
}

export type VendorPlanId = "normal" | "premium" | "advance";
export type VendorStatus = "pending_payment" | "pending_review" | "approved" | "rejected" | "suspended";

/** A marketplace seller (server only). */
export interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  passwordHash: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  /** Bank details for payouts; account number stored encrypted. */
  bank: { holder: string; ifsc: string; accountLast4: string; accountEnc: string; upi: string };
  plan: VendorPlanId;
  planFee: number;
  status: VendorStatus;
  statusNote: string;
  /** Plan fee payment. */
  fee: { paid: boolean; paidAt: string | null; reference: string; demo: boolean; gatewayOrderIds: string[]; sessionId: string | null; sessionAt: string | null };
  /** Checked by Krip (KYC / documents); shows a "Verified seller" badge on Premium and Advance. */
  verified: boolean;
  /** Vendor id at Cashfree Easy Split, once created there. */
  cashfreeVendorId: string | null;
  createdAt: string;
  approvedAt: string | null;
  failedLogins: number;
  lockedUntil: string | null;
  passwordChangedAt: string;
  /** How the seller ships. Set by the seller in their panel. */
  shipping?: VendorShipping;
}

/** A seller's own delivery charge and dispatch promise. They ship with their own courier. */
export interface VendorShipping {
  /** Delivery charge (₹) per order for this seller's items; 0 = free delivery. */
  fee: number;
  /** Free delivery when the seller's items in an order total at least this (₹); null = never. */
  freeAbove: number | null;
  /** Working days to hand the parcel to the courier after an order. */
  handlingDays: number;
  /** Usual courier, prefilled when shipping. */
  courier: string;
  /** Shop holidays: no new dispatch deadlines while on. */
  onHoliday: boolean;
}

export type VendorPartStatus = "new" | "accepted" | "packed" | "shipped" | "delivered" | "cancel_requested";

/** One seller's share of an order and its fulfilment, updated by the seller from their panel. */
export interface VendorPart {
  vendorId: string;
  status: VendorPartStatus;
  /** Delivery charge the shopper paid for this seller's items (₹); goes to the seller. */
  delivery: number;
  /** Latest time to hand over to the courier. */
  dispatchBy: string;
  history: { status: VendorPartStatus | "tracking" | "issue"; at: string; note?: string }[];
  shipmentId: string | null;
}

export interface VendorSession { idHash: string; vendorId: string; createdAt: string; expiresAt: string; lastSeenAt: string; revokedAt: string | null }

/** Money Krip sent from a seller's wallet to their bank (bank transfer / UPI). */
export interface VendorPayout { id: string; vendorId: string; amount: number; reference: string; at: string; by: string; note: string; withdrawalId?: string | null }

/** A seller asking to move money from their Krip wallet to their bank account. */
export interface VendorWithdrawal {
  id: string;
  vendorId: string;
  amount: number;
  status: "requested" | "paid" | "rejected";
  requestedAt: string;
  decidedAt: string | null;
  /** Bank / UPI reference once paid. */
  reference: string;
  /** Seller's note, or Krip's reason when rejected. */
  note: string;
  by: string | null;
}

/** A manual wallet correction by Krip, e.g. a return refunded to the customer (negative) or a goodwill credit. */
export interface VendorAdjustment { id: string; vendorId: string; amount: number; reason: string; at: string; by: string; orderId: string | null }

export interface Settings {
  deliveryFee: number;
  /** null = no free-delivery threshold configured. */
  freeDeliveryAbove: number | null;
  codFee: number;
  codMaxOrderValue: number;
  /** Expected return cost as % of selling price, used only for estimates. */
  returnAllowancePct: number;
  channelFees: ChannelFee[];
  coupons: Coupon[];
  delivery: DeliveryRules;
  festivalOffers?: FestivalOffer[];
  /** Krip's commission on marketplace sellers' sales: a % of the selling price, lower for cheap products. */
  vendorCommission?: CommissionRule;
  /** Old flat ₹-per-unit commission (replaced by vendorCommission). */
  vendorCommissionPerUnit?: number;
  /** When sellers moved to wallets (all sale money credited to the seller; Easy Split paused). */
  vendorWalletSince?: string;
}

/** Commission as a % of each product's selling price: lowPct when the price is ≤ upTo (₹), highPct above. */
export interface CommissionRule { upTo: number; lowPct: number; highPct: number }

export type PaymentMethod = "online" | "cod";

export type OrderStatus =
  | "payment_pending"
  | "payment_failed"
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderNote {
  at: string;
  by: string;
  text: string;
}

export interface Shipment {
  id: string;
  carrier: string;
  awb: string;
  trackingUrl: string | null;
  createdAt: string;
  createdBy: string;
  events: { at: string; status: string; note?: string }[];
  /** Vendor who shipped this parcel; absent = Krip. */
  vendorId?: string | null;
}

export interface RefundRecord {
  id: string;
  amount: number;
  reason: string;
  /** demo = no money moved (demo order); provider = refund issued in the payment provider / bank, reference recorded here. */
  mode: "demo" | "provider" | "cod-manual";
  reference: string;
  at: string;
  by: string;
}

export interface OrderItem {
  productId: string;
  slug: string;
  sku: string;
  title: string;
  color: string;
  size: string | null;
  image: string;
  unitPrice: number;
  qty: number;
  /** Marketplace vendor for this line; absent = Krip's own stock. */
  vendorId?: string | null;
}

export interface Address {
  name: string;
  phone: string;
  email: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

export interface PaymentEvent {
  id: string;
  provider: string;
  type: "payment.succeeded" | "payment.failed";
  at: string;
  amount: number;
  reference: string;
}

export interface Order {
  id: string;
  accessToken: string;
  idempotencyKey: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  delivery: number;
  codFee: number;
  discount: number;
  couponCode: string | null;
  /** Festival offer applied to this order, if any. */
  festivalOffer?: string | null;
  total: number;
  address: Address;
  paymentMethod: PaymentMethod;
  paymentProvider: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string; note?: string }[];
  paymentEvents: PaymentEvent[];
  /** Stock is held for pending online payments until this time. */
  reservationExpiresAt: string | null;
  stockHeld: boolean;
  demo: boolean;
  /** Current payment session with an online gateway (Cashfree). Server only. */
  gateway?: { orderId: string; sessionId: string; createdAt: string } | null;
  /** Every gateway order id ever created for this order, so late payments are still matched. */
  gatewayOrderIds?: string[];
  /** Easy Split: vendor shares sent with the current Cashfree order (₹). */
  vendorSplits?: { vendorId: string; amount: number }[] | null;
  /** Marketplace sellers' parts of this order (their items, delivery charge and fulfilment). */
  vendorParts?: VendorPart[];
  /** Krip's commission rule, fixed when the order was placed. */
  commissionRule?: CommissionRule;
  /** Older orders: flat ₹ commission per seller unit. */
  commissionPerUnit?: number;
  /** Admin-only fields below. Never sent to shoppers. */
  onHold?: boolean;
  notes?: OrderNote[];
  assignee?: string | null;
  shipments?: Shipment[];
  refunds?: RefundRecord[];
  codCollectedAt?: string | null;
}

export interface QuoteLine {
  sku: string;
  qty: number;
  ok: boolean;
  problem: string | null;
  productId: string | null;
  slug: string | null;
  title: string;
  color: string;
  size: string | null;
  image: string;
  unitPrice: number;
  mrp: number | null;
  available: number;
  lineTotal: number;
}

export interface Quote {
  lines: QuoteLine[];
  subtotal: number;
  delivery: number;
  codFee: number;
  discount: number;
  couponCode: string | null;
  couponMessage: string | null;
  /** Festival offer applied instead of a coupon, e.g. "Christmas offer (25% off)". */
  festivalOffer: string | null;
  /** Delivery split by who ships: null = Krip, else the seller's id. Sums to `delivery`. */
  deliveryParts: { vendorId: string | null; name: string; amount: number }[];
  total: number;
  itemCount: number;
  allAvailable: boolean;
  codAvailable: boolean;
  codReason: string | null;
}

export type OfferTheme = "saffron" | "red" | "green" | "purple" | "pink" | "ink";

/**
 * A seasonal/special offer tile on the homepage. Prices and style counts on
 * the tile are computed from the catalogue at render time, never typed in.
 */
export interface Offer {
  id: string;
  /** Big line, e.g. "Under ₹299". Must be true for every product the link shows. */
  headline: string;
  /** e.g. "Kurtas & kurtis". */
  subhead: string;
  /** Season or campaign band, e.g. "Diwali Edit". */
  badge: string;
  theme: OfferTheme;
  /** Search query string the tile opens, e.g. "type=Ethnic Wear&max=999". */
  query: string;
  /** Up to 2 products whose images illustrate the tile. */
  productIds: string[];
  /** Real offer terms, shown behind a "T&C apply" link. null = no terms line. */
  terms: string | null;
  /** yyyy-mm-dd, IST. null = no start/end shown or enforced. */
  startsOn: string | null;
  endsOn: string | null;
  active: boolean;
}

/** Public store profile, edited in Admin → Store settings. Blank fields are hidden on the storefront. */
export interface StoreProfile {
  name: string;
  legalName: string;
  supportEmail: string;
  supportPhone: string;
  whatsapp: string;
  supportHours: string;
  address: string;
  gstin: string;
  grievanceName: string;
  grievanceEmail: string;
  acceptedPayments: string[];
  social: { instagram: string; facebook: string; youtube: string; x: string };
  announcement: { active: boolean; text: string; href: string };
  maintenance: { active: boolean; message: string };
  lowStockThreshold: number;
}

// ---- Admin / back-office records (server only) ----

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
  /** scrypt$<saltB64>$<hashB64>. Never plaintext. */
  passwordHash: string;
  active: boolean;
  /** Base32 TOTP secret, set only after the user verifies a code. */
  mfaSecret: string | null;
  /** Pending TOTP secret during setup. */
  mfaPending: string | null;
  failedLogins: number;
  lockedUntil: string | null;
  createdAt: string;
  createdBy: string;
  lastLoginAt: string | null;
  passwordChangedAt: string;
  /** sha256 of a one-time reset token, and its expiry. */
  resetTokenHash: string | null;
  resetTokenExpires: string | null;
  notificationsSeenAt: string | null;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  privileged: boolean;
}

export interface AdminSession {
  /** sha256 of the cookie token; the token itself is never stored. */
  idHash: string;
  staffId: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
  ip: string;
  userAgent: string;
  revokedAt: string | null;
}

export interface LoginEvent {
  at: string;
  email: string;
  staffId: string | null;
  ip: string;
  userAgent: string;
  outcome: "success" | "bad_password" | "bad_code" | "locked" | "inactive" | "unknown_user" | "rate_limited";
}

export interface AuditEntry {
  seq: number;
  at: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: "ok" | "denied" | "failed";
  before?: unknown;
  after?: unknown;
  requestId: string;
  /** sha256(prevHash + this entry without hash). Breaks if any earlier entry is edited or removed. */
  hash: string;
}

export type MovementReason =
  | "order_reserved" | "order_released" | "received" | "returned" | "damaged" | "lost" | "correction" | "audit_count" | "product_edit" | "import";

export interface InventoryMovement {
  id: string;
  at: string;
  sku: string;
  productId: string;
  delta: number;
  balanceAfter: number;
  reason: MovementReason;
  ref: string;
  by: string;
}

export interface CustomerMeta {
  notes: OrderNote[];
  groups: string[];
}
