import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import type { AdminSession, AuditEntry, CustomerMeta, CustomRole, InventoryMovement, LoginEvent, Offer, Order, ProductRecord, Settings, StaffUser, StoreProfile } from "../types";
import { normalizeCoupon } from "../coupons";
import { buildSeedProducts } from "@/data/catalog";
import { SEED_OFFERS } from "@/data/offers";

// Prototype datastore: a single JSON file with an in-process write lock.
// It is enough to demonstrate server-side validation, idempotency and stock
// locking on a single Node process. Use a transactional database (Postgres,
// etc.) with row-level locks before running more than one server instance.

export interface DB {
  version: 1;
  products: ProductRecord[];
  orders: Order[];
  settings: Settings;
  processedPaymentEvents: string[];
  offers: Offer[];
  store: StoreProfile;
  staff: StaffUser[];
  roles: CustomRole[];
  sessions: AdminSession[];
  loginEvents: LoginEvent[];
  audit: AuditEntry[];
  movements: InventoryMovement[];
  /** Keyed by customer id (hash of phone number). */
  customers: Record<string, CustomerMeta>;
}

export const DEFAULT_STORE: StoreProfile = {
  name: "Krip",
  legalName: "",
  supportEmail: "",
  supportPhone: "",
  whatsapp: "",
  supportHours: "",
  address: "",
  gstin: "",
  grievanceName: "",
  grievanceEmail: "",
  acceptedPayments: [],
  social: { instagram: "", facebook: "", youtube: "", x: "" },
  announcement: { active: false, text: "", href: "" },
  maintenance: { active: false, message: "We’re updating the store. Please check back soon." },
  lowStockThreshold: 3,
};

export const DEFAULT_SETTINGS: Settings = {
  deliveryFee: 49,
  freeDeliveryAbove: null,
  codFee: 20,
  codMaxOrderValue: 3000,
  returnAllowancePct: 8,
  channelFees: [
    { channel: "Krip", marketplaceFeePct: 0, paymentFeePct: 2, fixedFee: 0 },
  ],
  coupons: [
    normalizeCoupon({ code: "AURA50", description: "Sample code: ₹50 off orders of ₹699 or more", amountOff: 50, minSubtotal: 699, active: true }),
  ],
};

// Serverless hosts (e.g. Vercel) only allow writes under the OS temp dir, and
// that storage is per-instance and temporary — fine for a demo, not for real orders.
const DATA_DIR = process.env.KRIP_DATA_DIR
  ? path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.KRIP_DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), "krip-data")
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type G = { __kripDb?: DB; __kripLock?: Promise<unknown> };
const g = globalThis as unknown as G;

function seed(): DB {
  return {
    version: 1,
    products: buildSeedProducts(),
    orders: [],
    settings: structuredClone(DEFAULT_SETTINGS),
    processedPaymentEvents: [],
    offers: structuredClone(SEED_OFFERS),
    ...emptyBackOffice(),
  };
}

function emptyBackOffice() {
  return {
    store: structuredClone(DEFAULT_STORE),
    staff: [] as StaffUser[],
    roles: [] as CustomRole[],
    sessions: [] as AdminSession[],
    loginEvents: [] as LoginEvent[],
    audit: [] as AuditEntry[],
    movements: [] as InventoryMovement[],
    customers: {} as Record<string, CustomerMeta>,
  };
}

/** Upgrades datastores written by earlier versions in place. */
function migrate(db: DB) {
  db.offers ??= structuredClone(SEED_OFFERS);
  const fresh = emptyBackOffice();
  for (const k of Object.keys(fresh) as (keyof typeof fresh)[]) (db as unknown as Record<string, unknown>)[k] ??= fresh[k];
  db.store = { ...structuredClone(DEFAULT_STORE), ...db.store, social: { ...DEFAULT_STORE.social, ...db.store.social } };
  db.settings.coupons = db.settings.coupons.map(normalizeCoupon);
}

async function load(): Promise<DB> {
  if (g.__kripDb) return g.__kripDb;
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    g.__kripDb = JSON.parse(raw) as DB;
    migrate(g.__kripDb);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
    g.__kripDb = seed();
    await persist(g.__kripDb);
  }
  return g.__kripDb;
}

async function persist(db: DB) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 1));
  await fs.rename(tmp, DB_FILE);
}

/** Read-only snapshot. Callers must not mutate the returned object. */
export async function readDb(): Promise<DB> {
  await g.__kripLock;
  return load();
}

/**
 * Serialised read-modify-write. All stock and order mutations go through here,
 * so two checkouts can never sell the same last unit.
 */
export async function withDb<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const prev = g.__kripLock ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  g.__kripLock = prev.then(() => next);
  await prev.catch(() => {});
  try {
    const db = await load();
    const snapshot = JSON.stringify(db);
    try {
      const result = await fn(db);
      await persist(db);
      return result;
    } catch (e) {
      // Roll back in-memory changes made before the failure.
      g.__kripDb = JSON.parse(snapshot) as DB;
      throw e;
    }
  } finally {
    release();
  }
}

export async function resetDb() {
  return withDb((db) => {
    const fresh = seed();
    db.products = fresh.products;
    db.orders = [];
    db.settings = fresh.settings;
    db.processedPaymentEvents = [];
    db.offers = fresh.offers;
    // Staff, roles and the audit trail survive a demo-data reset.
    db.movements = [];
    db.customers = {};
    db.store = fresh.store;
  });
}

export async function getSecret(name: "session" | "payment"): Promise<string> {
  const env = name === "session" ? process.env.SESSION_SECRET : process.env.PAYMENT_WEBHOOK_SECRET;
  if (env && env.length >= 16) return env;
  if (process.env.NODE_ENV === "production" && name === "session") {
    throw new Error("SESSION_SECRET must be set (16+ chars) in production.");
  }
  // Development/demo fallback: a random secret persisted in the data dir.
  const file = path.join(DATA_DIR, `.${name}-secret`);
  try {
    return (await fs.readFile(file, "utf8")).trim();
  } catch {
    const s = crypto.randomBytes(32).toString("hex");
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(file, s, { mode: 0o600 });
    return s;
  }
}
