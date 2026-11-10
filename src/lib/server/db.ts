import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import type { AdminSession, AuditEntry, CustomerMeta, CustomRole, InventoryMovement, LoginEvent, Offer, Order, ProductRecord, Settings, StaffUser, StoreProfile } from "../types";
import { normalizeCoupon } from "../coupons";
import { buildSeedProducts, CATALOG_VERSION, IMAGE_ORDER_FIXES, IMAGE_RENAMES } from "@/data/catalog";
import { DEFAULT_DELIVERY } from "@/lib/pincode";
import { DEFAULT_FESTIVAL_OFFERS } from "@/lib/festivalOffers";
import { SEED_OFFERS } from "@/data/offers";

// Prototype datastore: a single JSON file with an in-process write lock.
// It is enough to demonstrate server-side validation, idempotency and stock
// locking on a single Node process. Use a transactional database (Postgres,
// etc.) with row-level locks before running more than one server instance.

export interface DB {
  version: 1;
  /** Bumped when new catalogue products should be added to existing stores. */
  catalogVersion?: number;
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
  coupons: [],
  delivery: { ...DEFAULT_DELIVERY },
  festivalOffers: structuredClone(DEFAULT_FESTIVAL_OFFERS),
};

function seed(): DB {
  return {
    version: 1,
    catalogVersion: CATALOG_VERSION,
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
  // The demo seeded a sample code; switch it off so it can't discount real orders.
  for (const c of db.settings.coupons) if (c.code === "AURA50" && c.description.startsWith("Sample code")) c.active = false;
  db.settings.delivery = { ...DEFAULT_DELIVERY, ...db.settings.delivery };
  db.settings.festivalOffers ??= structuredClone(DEFAULT_FESTIVAL_OFFERS);
  // Catalogue additions reach existing stores once; products removed or edited in admin aren't touched.
  if ((db.catalogVersion ?? 1) < CATALOG_VERSION) {
    const have = new Set(db.products.map((p) => p.id));
    db.products.push(...buildSeedProducts().filter((p) => !have.has(p.id)));
    for (const p of db.products) p.images = p.images.map((u) => IMAGE_RENAMES[u] ?? u);
    for (const f of IMAGE_ORDER_FIXES) {
      const p = db.products.find((x) => x.id === f.id);
      if (p && p.images.join("|") === f.from.join("|")) p.images = [...f.to];
    }
    db.catalogVersion = CATALOG_VERSION;
  }
}

// Two storage backends:
// - Redis (Upstash REST) when KV_REST_API_URL / UPSTASH_REDIS_REST_URL is set. Shared by
//   every server instance, so it survives Vercel's short-lived instances.
// - A local JSON file otherwise. On serverless hosts that file sits in the OS temp dir,
//   is per-instance and resets — fine for a demo, not for real orders or admin sign-in.
const DATA_DIR = process.env.KRIP_DATA_DIR
  ? path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.KRIP_DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), "krip-data")
    : path.resolve(/*turbopackIgnore: true*/ process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const REDIS_URL = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/$/, "");
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "";
const DB_KEY = "krip:db";
const REV_KEY = "krip:rev";
/** How long one instance may reuse its copy for reads before asking Redis again. */
const READ_CACHE_MS = 1000;

export function storageBackend(): "redis" | "file" {
  return REDIS_URL && REDIS_TOKEN ? "redis" : "file";
}

type G = { __kripDb?: DB; __kripRev?: string; __kripReadAt?: number; __kripLock?: Promise<unknown> };
const g = globalThis as unknown as G;

async function redis<T>(command: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { result?: T; error?: string };
  if (!res.ok || body.error) throw new Error(`Datastore (Redis) error: ${body.error ?? res.status}`);
  return body.result as T;
}

// Write only if nobody else wrote since we read; returns the new revision, or -1 on conflict.
const CAS_SCRIPT = "if (redis.call('GET', KEYS[2]) or '0') == ARGV[1] then redis.call('SET', KEYS[1], ARGV[2]); return redis.call('INCR', KEYS[2]) else return -1 end";

class WriteConflict extends Error {}

/** Fetches the latest copy from storage (Redis) or the in-process copy (file). */
async function load(fresh = false): Promise<DB> {
  if (storageBackend() === "redis") {
    if (!fresh && g.__kripDb && Date.now() - (g.__kripReadAt ?? 0) < READ_CACHE_MS) return g.__kripDb;
    const [raw, rev] = await redis<[string | null, string | null]>(["MGET", DB_KEY, REV_KEY]);
    let db: DB;
    if (raw) {
      db = JSON.parse(raw) as DB;
      migrate(db);
      g.__kripRev = rev ?? "0";
    } else {
      // Empty Redis: seed it. If another instance seeded first, read theirs.
      db = seed();
      g.__kripRev = rev ?? "0";
      try {
        await persist(db);
        return db;
      } catch (e) {
        if (e instanceof WriteConflict) return load(true);
        throw e;
      }
    }
    g.__kripDb = db;
    g.__kripReadAt = Date.now();
    return db;
  }
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
  if (storageBackend() === "redis") {
    const rev = await redis<number>(["EVAL", CAS_SCRIPT, 2, DB_KEY, REV_KEY, g.__kripRev ?? "0", JSON.stringify(db)]);
    if (rev === -1) throw new WriteConflict("Another server instance wrote first.");
    g.__kripRev = String(rev);
    g.__kripDb = db;
    g.__kripReadAt = Date.now();
    return;
  }
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
 * so two checkouts can never sell the same last unit. With Redis, a write that
 * loses a race with another instance is re-run on the latest data.
 */
export async function withDb<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const prev = g.__kripLock ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  g.__kripLock = prev.then(() => next);
  await prev.catch(() => {});
  try {
    for (let attempt = 0; ; attempt++) {
      const db = await load(true);
      const snapshot = JSON.stringify(db);
      try {
        const result = await fn(db);
        await persist(db);
        return result;
      } catch (e) {
        // Roll back in-memory changes made before the failure.
        g.__kripDb = JSON.parse(snapshot) as DB;
        if (e instanceof WriteConflict && attempt < 20) {
          // Brief random back-off so racing instances don't collide again.
          await new Promise((r) => setTimeout(r, Math.random() * 20 * (attempt + 1)));
          continue;
        }
        throw e;
      }
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
