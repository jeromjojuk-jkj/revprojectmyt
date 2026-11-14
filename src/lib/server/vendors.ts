import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Vendor } from "../types";
import { readDb, withDb } from "./db";
import { hashPassword, passwordProblem, verifyPassword } from "../passwords";
import { seal } from "./vault";
import { audit } from "./audit";
import { planOf } from "../vendorPlans";
import type { VendorRegistration } from "../vendorInput";
import { cashfreeEnv, createCashfreeOrder, fetchCashfreeResult } from "./cashfree";
import { paymentConfig } from "./payments";

// Marketplace sellers: registration, sign-in sessions and the one-time plan fee.
// Sessions are server-side and revocable, like staff sessions; the cookie only holds a random token.

const COOKIE = "krip_vendor";
const SESSION_HOURS = 24 * 7;
const IDLE_HOURS = 48;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

export class VendorError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function startSession(vendorId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  await withDb((db) => {
    db.vendorSessions = db.vendorSessions.filter((s) => Date.parse(s.expiresAt) > Date.now() && !s.revokedAt);
    db.vendorSessions.push({ idHash: sha(token), vendorId, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + SESSION_HOURS * 3600_000).toISOString(), lastSeenAt: now.toISOString(), revokedAt: null });
  });
  // "lax" (not "strict") so the cookie comes back when Cashfree redirects the seller here after paying.
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_HOURS * 3600 });
}

export async function registerVendor(r: VendorRegistration): Promise<string> {
  const plan = planOf(r.plan);
  const accountEnc = await seal(r.account);
  const id = `VND-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  await withDb((db) => {
    if (db.vendors.some((v) => v.email === r.email)) throw new VendorError("A seller account with this email already exists. Sign in instead.", 409);
    if (db.vendors.some((v) => v.phone === r.phone)) throw new VendorError("A seller account with this mobile number already exists. Sign in instead.", 409);
    const now = new Date().toISOString();
    const v: Vendor = {
      id, businessName: r.businessName, ownerName: r.ownerName, email: r.email, phone: r.phone, passwordHash: hashPassword(r.password),
      address: r.address, city: r.city, state: r.state, pincode: r.pincode, gstin: r.gstin, pan: r.pan,
      bank: { holder: r.bankHolder, ifsc: r.ifsc, accountLast4: r.account.slice(-4), accountEnc, upi: r.upi },
      plan: r.plan, planFee: plan.fee, status: "pending_payment", statusNote: "",
      fee: { paid: false, paidAt: null, reference: "", demo: false, gatewayOrderIds: [], sessionId: null, sessionAt: null },
      verified: false, cashfreeVendorId: null, createdAt: now, approvedAt: null, failedLogins: 0, lockedUntil: null, passwordChangedAt: now,
    };
    db.vendors.push(v);
    audit(db, { id: v.id, name: `Seller: ${v.businessName}` }, "vendor.register", "vendor", v.id, { after: { plan: v.plan, fee: v.planFee } });
  });
  await startSession(id);
  return id;
}

/** The seller changes their own password; other devices are signed out and this one gets a fresh session. */
export async function changeVendorPassword(vendorId: string, current: string, next: string): Promise<string | null> {
  let err: string | null = null;
  await withDb((db) => {
    const v = db.vendors.find((x) => x.id === vendorId);
    if (!v) { err = "Account not found."; return; }
    if (!verifyPassword(current, v.passwordHash)) { err = "Your current password is wrong."; return; }
    const problem = passwordProblem(next, v.email);
    if (problem) { err = problem; return; }
    if (verifyPassword(next, v.passwordHash)) { err = "Choose a password you haven’t used here."; return; }
    v.passwordHash = hashPassword(next);
    v.passwordChangedAt = new Date().toISOString();
    audit(db, { id: v.id, name: `Seller: ${v.businessName}` }, "vendor.password.change", "vendor", v.id);
  });
  if (err) return err;
  await new Promise((r) => setTimeout(r, 5)); // the new session must be newer than passwordChangedAt
  await startSession(vendorId);
  return null;
}

/** Krip staff reset a seller's password to a one-time temporary one (shown once). Signs the seller out everywhere. */
export async function resetVendorPassword(vendorId: string, actor: { id: string; name: string }): Promise<string | null> {
  const temp = `Krip-${crypto.randomBytes(9).toString("base64url")}`;
  let ok = false;
  await withDb((db) => {
    const v = db.vendors.find((x) => x.id === vendorId);
    if (!v) return;
    v.passwordHash = hashPassword(temp);
    v.passwordChangedAt = new Date().toISOString();
    v.failedLogins = 0;
    v.lockedUntil = null;
    audit(db, actor, "vendor.password.reset", "vendor", v.id);
    ok = true;
  });
  return ok ? temp : null;
}

// Per-IP throttle on top of the per-account lockout.
const ipAttempts = ((globalThis as unknown as { __kripVendorIp?: Map<string, { count: number; first: number }> }).__kripVendorIp ??= new Map());

export async function loginVendor(emailRaw: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = emailRaw.trim().toLowerCase();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const a = ipAttempts.get(ip) ?? { count: 0, first: Date.now() };
  if (Date.now() - a.first > 15 * 60_000) Object.assign(a, { count: 0, first: Date.now() });
  if (a.count >= 20) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  const generic = { ok: false as const, error: "Email or password is incorrect." };
  const id = await withDb((db): string | { ok: false; error: string } => {
    const v = db.vendors.find((x) => x.email === email);
    if (!v) {
      verifyPassword(password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86));
      a.count++;
      return generic;
    }
    if (v.lockedUntil && Date.parse(v.lockedUntil) > Date.now()) return { ok: false, error: "Too many wrong passwords. Try again in 15 minutes." };
    if (!verifyPassword(password, v.passwordHash)) {
      a.count++;
      v.failedLogins++;
      if (v.failedLogins >= MAX_FAILS) {
        v.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
        v.failedLogins = 0;
      }
      return generic;
    }
    v.failedLogins = 0;
    v.lockedUntil = null;
    return v.id;
  });
  ipAttempts.set(ip, a);
  if (typeof id !== "string") return id;
  await startSession(id);
  return { ok: true };
}

export async function logoutVendor() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const h = sha(token);
    await withDb((db) => {
      const s = db.vendorSessions.find((x) => x.idHash === h);
      if (s) s.revokedAt = new Date().toISOString();
    });
  }
  jar.delete(COOKIE);
}

/** The signed-in seller for this request, or null. */
export const getVendor = cache(async (): Promise<Vendor | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const h = sha(token);
  const db = await readDb();
  const s = db.vendorSessions.find((x) => x.idHash === h);
  const now = Date.now();
  if (!s || s.revokedAt || Date.parse(s.expiresAt) <= now || now - Date.parse(s.lastSeenAt) > IDLE_HOURS * 3600_000) return null;
  const v = db.vendors.find((x) => x.id === s.vendorId);
  if (!v || Date.parse(v.passwordChangedAt) > Date.parse(s.createdAt)) return null;
  if (now - Date.parse(s.lastSeenAt) > 10 * 60_000) {
    await withDb((d) => {
      const live = d.vendorSessions.find((x) => x.idHash === h);
      if (live) live.lastSeenAt = new Date().toISOString();
    });
  }
  return v;
});

export async function requireVendor(): Promise<Vendor> {
  const v = await getVendor();
  if (!v) redirect("/vendor/login");
  return v;
}

/** A seller who may sell: fee paid and approved by Krip. */
export async function requireApprovedVendor(): Promise<Vendor> {
  const v = await requireVendor();
  if (v.status !== "approved") redirect("/vendor");
  return v;
}

// ---------- One-time plan fee ----------

const FEE_SESSION_MINUTES = 20;

/** Cashfree checkout session for the seller's plan fee. */
export async function feeCheckoutSession(origin: string): Promise<{ sessionId: string; mode: "sandbox" | "production" }> {
  const v = await requireVendor();
  if (v.fee.paid) throw new VendorError("Your plan fee is already paid.", 409);
  const pay = paymentConfig();
  if (pay.provider !== "cashfree" || !pay.onlineEnabled) throw new VendorError("Online payment isn’t available right now.", 503);
  const env = cashfreeEnv();
  if (v.fee.sessionId && v.fee.sessionAt && Date.now() - Date.parse(v.fee.sessionAt) < FEE_SESSION_MINUTES * 60_000) return { sessionId: v.fee.sessionId, mode: env.mode };
  const gatewayOrderId = `KRV-${v.id.slice(4)}-${v.fee.gatewayOrderIds.length + 1}`;
  const { sessionId } = await createCashfreeOrder({
    gatewayOrderId, amount: v.planFee, customerId: v.id, name: v.ownerName, phone: v.phone, email: v.email,
    returnUrl: `${origin}/vendor?paid=1`, notifyUrl: `${origin}/api/payments/cashfree/webhook`, note: `Krip seller ${planOf(v.plan).name} plan fee`,
  });
  await withDb((db) => {
    const x = db.vendors.find((y) => y.id === v.id);
    if (!x) return;
    x.fee.gatewayOrderIds.push(gatewayOrderId);
    x.fee.sessionId = sessionId;
    x.fee.sessionAt = new Date().toISOString();
  });
  return { sessionId, mode: env.mode };
}

function markFeePaid(v: Vendor, reference: string, demo: boolean) {
  v.fee.paid = true;
  v.fee.paidAt = new Date().toISOString();
  v.fee.reference = reference;
  v.fee.demo = demo;
  if (v.status === "pending_payment") v.status = "pending_review";
}

/** Checks a plan-fee payment with Cashfree (webhook or the seller returning). Confirms only a matching paid amount. */
export async function syncVendorFee(gatewayOrderId: string) {
  const vid = `VND-${gatewayOrderId.split("-")[1] ?? ""}`;
  const db = await readDb();
  const v = db.vendors.find((x) => x.id === vid && x.fee.gatewayOrderIds.includes(gatewayOrderId));
  if (!v) throw new VendorError("Unknown seller payment", 404);
  if (v.fee.paid) return { duplicate: true };
  const r = await fetchCashfreeResult(gatewayOrderId);
  if (r.state !== "paid") return { pending: r.state === "pending", state: r.state };
  if (Math.round(r.amount) !== v.planFee) return { mismatch: true };
  await withDb((d) => {
    const x = d.vendors.find((y) => y.id === vid);
    if (!x || x.fee.paid) return;
    markFeePaid(x, `Cashfree ${r.paymentId}`, cashfreeEnv().mode === "sandbox");
    audit(d, { id: x.id, name: `Seller: ${x.businessName}` }, "vendor.fee_paid", "vendor", x.id, { after: { amount: r.amount, reference: x.fee.reference } });
  });
  return { ok: true };
}

/** Settles a pending fee when the seller lands back on their panel. */
export async function refreshVendorFee(v: Vendor) {
  const last = v.fee.gatewayOrderIds.at(-1);
  if (v.fee.paid || !last || !cashfreeEnv().configured) return;
  try {
    await syncVendorFee(last);
  } catch (e) {
    console.error("Seller fee check failed", e);
  }
}

/** Demo mode only (no real payment provider): records a simulated fee payment. */
export async function demoPayFee() {
  if (paymentConfig().provider !== "demo") throw new VendorError("Demo payments are off.", 404);
  const v = await requireVendor();
  await withDb((db) => {
    const x = db.vendors.find((y) => y.id === v.id);
    if (!x || x.fee.paid) return;
    markFeePaid(x, `DEMO-${crypto.randomBytes(3).toString("hex").toUpperCase()}`, true);
  });
}
