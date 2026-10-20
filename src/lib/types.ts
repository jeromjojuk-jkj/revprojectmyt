// Shared domain types. Anything in `ProductPrivate` must never reach the browser
// except through authenticated admin routes — see toPublicProduct() in catalog.ts.

export type CategoryId =
  | "men"
  | "women"
  | "beauty"
  | "footwear"
  | "bags"
  | "jewellery"
  | "accessories";

export type VibeId = "campus" | "streetwear" | "everyday" | "date-night" | "festive";

export type ProductStatus = "draft" | "active" | "out-of-stock";

export type ArtKind =
  | "tee" | "shirt" | "hoodie" | "jeans" | "cargo" | "dress" | "kurti" | "top" | "skirt" | "coord"
  | "sneaker" | "slide" | "heel" | "boot"
  | "tote" | "sling" | "backpack"
  | "earrings" | "necklace" | "bracelet"
  | "lipstick" | "serum" | "palette" | "kajal" | "cream"
  | "cap" | "sunglasses" | "watch" | "belt" | "scrunchie";

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
  channelPrices: ChannelPrice[];
  /** Admin confirmed Krip is authorised to use the images and descriptions. */
  rightsConfirmed?: boolean;
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

export interface Coupon {
  code: string;
  description: string;
  amountOff: number;
  minSubtotal: number;
  active: boolean;
}

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
}

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
