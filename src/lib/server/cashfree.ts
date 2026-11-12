import "server-only";
import crypto from "node:crypto";

// Cashfree Payment Gateway (PG API version 2023-08-01).
// The browser only ever gets a payment_session_id. Whether an order is paid is
// decided here, server-side, by asking Cashfree — never from a browser redirect.

const API_VERSION = "2023-08-01";

export function cashfreeEnv() {
  const appId = process.env.CASHFREE_APP_ID?.trim() ?? "";
  const secret = process.env.CASHFREE_SECRET_KEY?.trim() ?? "";
  const live = process.env.CASHFREE_ENV?.trim().toLowerCase() === "production";
  return {
    configured: Boolean(appId && secret),
    appId,
    secret,
    live,
    mode: live ? ("production" as const) : ("sandbox" as const),
    // CASHFREE_API_BASE is for automated tests against a stand-in API only.
    base: process.env.CASHFREE_API_BASE?.trim() || (live ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg"),
  };
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const env = cashfreeEnv();
  const res = await fetch(env.base + path, {
    method,
    headers: {
      "x-client-id": env.appId,
      "x-client-secret": env.secret,
      "x-api-version": API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) throw new Error(`Cashfree ${method} ${path} failed (${res.status}): ${data.message ?? "no message"}`);
  return data;
}

export interface CashfreeOrderInput {
  gatewayOrderId: string;
  amount: number;
  customerId: string;
  name: string;
  phone: string;
  email: string;
  returnUrl: string;
  notifyUrl: string;
  note: string;
  /** Easy Split: amounts (₹) sent straight to marketplace vendors; the rest settles to Krip. */
  splits?: { vendorId: string; amount: number }[];
}

export async function createCashfreeOrder(i: CashfreeOrderInput): Promise<{ sessionId: string }> {
  const d = await call<{ payment_session_id?: string }>("POST", "/orders", {
    order_id: i.gatewayOrderId,
    order_amount: i.amount,
    order_currency: "INR",
    customer_details: {
      customer_id: i.customerId,
      customer_name: i.name.slice(0, 50),
      customer_phone: i.phone,
      ...(i.email ? { customer_email: i.email } : {}),
    },
    order_meta: { return_url: i.returnUrl, notify_url: i.notifyUrl },
    order_note: i.note.slice(0, 200),
    ...(i.splits?.length ? { order_splits: i.splits.map((s) => ({ vendor_id: s.vendorId, amount: Math.round(s.amount * 100) / 100 })) } : {}),
  });
  if (!d.payment_session_id) throw new Error("Cashfree did not return a payment session.");
  return { sessionId: d.payment_session_id };
}

export type CashfreeResult =
  | { state: "paid"; paymentId: string; amount: number; at: string }
  | { state: "failed"; paymentId: string; amount: number; at: string; reason: string }
  | { state: "closed"; reason: string }
  | { state: "pending" };

interface CfPayment {
  cf_payment_id: string | number;
  payment_status: string;
  payment_amount: number;
  payment_time?: string;
  payment_completion_time?: string;
  payment_message?: string;
}

/** Asks Cashfree for the current state of one gateway order. */
export async function fetchCashfreeResult(gatewayOrderId: string): Promise<CashfreeResult> {
  const id = encodeURIComponent(gatewayOrderId);
  const order = await call<{ order_status?: string }>("GET", `/orders/${id}`);
  const payments = await call<CfPayment[]>("GET", `/orders/${id}/payments`);
  const when = (p: CfPayment) => Date.parse(p.payment_completion_time ?? p.payment_time ?? "") || 0;
  const list = (Array.isArray(payments) ? payments : []).sort((a, b) => when(b) - when(a));
  const ok = list.find((p) => p.payment_status === "SUCCESS");
  if (order.order_status === "PAID" && ok) {
    return { state: "paid", paymentId: String(ok.cf_payment_id), amount: Number(ok.payment_amount), at: ok.payment_completion_time ?? new Date().toISOString() };
  }
  if (order.order_status === "EXPIRED" || order.order_status === "TERMINATED") {
    return { state: "closed", reason: `Cashfree order ${order.order_status.toLowerCase()}` };
  }
  const last = list[0];
  if (last && ["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(last.payment_status)) {
    return {
      state: "failed",
      paymentId: String(last.cf_payment_id),
      amount: Number(last.payment_amount),
      at: last.payment_completion_time ?? new Date().toISOString(),
      reason: last.payment_status === "USER_DROPPED" ? "Payment was not completed" : (last.payment_message || "Payment failed"),
    };
  }
  return { state: "pending" };
}

/** Webhook signature: base64(HMAC-SHA256(timestamp + rawBody, secret key)). */
export function verifyCashfreeWebhook(raw: string, timestamp: string | null, signature: string | null): boolean {
  const env = cashfreeEnv();
  if (!env.configured || !timestamp || !signature) return false;
  const expected = crypto.createHmac("sha256", env.secret).update(timestamp + raw).digest();
  let got: Buffer;
  try {
    got = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

/**
 * Easy Split (paused): sellers are paid from their Krip wallets for now. These helpers are kept for when
 * Cashfree activates Easy Split; nothing calls them at the moment.
 * Easy Split is on when CASHFREE_EASY_SPLIT=on and Cashfree has enabled split payments for the account.
 */
export const easySplitEnabled = () => cashfreeEnv().configured && process.env.CASHFREE_EASY_SPLIT?.trim().toLowerCase() === "on";

/** Registers a marketplace vendor with Cashfree Easy Split so order splits can pay them directly. */
export async function createCashfreeVendor(v: {
  vendorId: string; name: string; email: string; phone: string; accountNumber: string; accountHolder: string; ifsc: string; pan: string; gstin: string;
}): Promise<{ vendorId: string }> {
  await call("POST", "/easy-split/vendors", {
    vendor_id: v.vendorId,
    status: "ACTIVE",
    name: v.name.slice(0, 100),
    email: v.email,
    phone: v.phone,
    verify_account: true,
    dashboard_access: false,
    bank: { account_number: v.accountNumber, account_holder: v.accountHolder, ifsc: v.ifsc },
    kyc_details: { account_type: "BUSINESS", business_type: "Ecommerce", pan: v.pan, ...(v.gstin ? { gst: v.gstin } : {}) },
  });
  return { vendorId: v.vendorId };
}
