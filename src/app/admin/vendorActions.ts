"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/server/auth";
import { withDb, readDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { unseal } from "@/lib/server/vault";
import { resetVendorPassword } from "@/lib/server/vendors";
import { vendorLedger } from "@/lib/vendorWallet";
import { describeCommission, planOf, validateCommission } from "@/lib/vendorPlans";
import type { VendorStatus } from "@/lib/types";

export type VendorAdminState = { ok?: string; error?: string; secret?: string } | null;

const str = (fd: FormData, k: string, max = 300) => (typeof fd.get(k) === "string" ? String(fd.get(k)).trim().slice(0, max) : "");

function refresh(id?: string) {
  revalidatePath("/admin/vendors");
  if (id) revalidatePath(`/admin/vendors/${id}`);
  revalidatePath("/", "layout");
}

/** approve | reject | suspend | reinstate a seller account. */
export async function vendorStatusAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.approve");
  const id = str(fd, "id", 20);
  const op = str(fd, "op", 20);
  const note = str(fd, "note");
  const next: Record<string, VendorStatus> = { approve: "approved", reject: "rejected", suspend: "suspended", reinstate: "approved" };
  if (!next[op]) return { error: "Unknown action." };
  if ((op === "reject" || op === "suspend") && note.length < 5) return { error: "Write the reason — the seller sees it." };
  let err: string | null = null;
  await withDb((db) => {
    const v = db.vendors.find((x) => x.id === id);
    if (!v) { err = "Seller not found."; return; }
    if (op === "approve" && v.status !== "pending_review") { err = "Only sellers who paid the fee and are waiting for review can be approved."; return; }
    if (op === "reinstate" && v.status !== "suspended") { err = "Only suspended sellers can be reinstated."; return; }
    if (op === "reject" && !["pending_review", "pending_payment"].includes(v.status)) { err = "Use suspend for an approved seller."; return; }
    const before = v.status;
    v.status = next[op];
    v.statusNote = op === "approve" || op === "reinstate" ? "" : note;
    if (op === "approve") v.approvedAt = new Date().toISOString();
    if (op === "suspend") {
      // Their sessions end; their products drop out of the shop automatically (see sellableProducts).
      for (const s of db.vendorSessions) if (s.vendorId === v.id && !s.revokedAt) s.revokedAt = new Date().toISOString();
      for (const p of db.products) if (p.vendorId === v.id) p.private.featured = false;
    }
    audit(db, actor, `vendor.${op}`, "vendor", v.id, { before: { status: before }, after: { status: v.status, note } });
  });
  if (err) return { error: err };
  refresh(id);
  return { ok: { approve: "Seller approved. They can add products now.", reject: "Seller rejected.", suspend: "Seller suspended — their products are hidden.", reinstate: "Seller reinstated." }[op] };
}

/** Verified-seller badge (Premium / Advance only) after Krip has checked their documents. */
export async function vendorVerifyAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.approve");
  const id = str(fd, "id", 20);
  let msg = "";
  await withDb((db) => {
    const v = db.vendors.find((x) => x.id === id);
    if (!v) return;
    v.verified = !v.verified;
    const badge = v.verified && planOf(v.plan).verifiedBadge;
    for (const p of db.products) if (p.vendorId === v.id) p.sellerVerified = badge;
    msg = v.verified ? (planOf(v.plan).verifiedBadge ? "Marked as verified — the badge now shows on their products." : "Marked as verified (their plan has no public badge).") : "Verification removed.";
    audit(db, actor, "vendor.verify", "vendor", v.id, { after: { verified: v.verified } });
  });
  refresh(id);
  return { ok: msg };
}

/** Shows the full bank account number once, for a manual payout. Audited. */
export async function revealBankAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.manage");
  const id = str(fd, "id", 20);
  const v = (await readDb()).vendors.find((x) => x.id === id);
  if (!v) return { error: "Seller not found." };
  const acc = await unseal(v.bank.accountEnc);
  await withDb((db) => audit(db, actor, "vendor.bank.reveal", "vendor", id));
  if (!acc) return { error: "Couldn’t decrypt the account number (was the session secret changed?)." };
  return { secret: acc };
}

const money = (raw: string) => {
  const n = Number(raw);
  return Number.isFinite(n) && Math.abs(Math.round(n * 100) - n * 100) <= 1e-6 ? Math.round(n * 100) / 100 : NaN;
};

/** Records money Krip sent from the seller's wallet to their bank without a request (bank transfer / UPI). */
export async function vendorPayoutAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.manage");
  const id = str(fd, "id", 20);
  const amount = money(str(fd, "amount", 12));
  const reference = str(fd, "reference", 80);
  if (!(amount >= 0.01 && amount <= 10_000_000)) return { error: "Enter the amount paid, e.g. 489 or 489.02." };
  if (reference.length < 4) return { error: "Enter the bank / UPI transaction reference." };
  let err: string | null = null;
  await withDb((db) => {
    if (!db.vendors.some((x) => x.id === id)) { err = "Seller not found."; return; }
    const led = vendorLedger(db, id);
    if (amount > led.totals.available) { err = `Only ₹${led.totals.available} is free in this seller’s wallet${led.totals.requested ? " (a withdrawal request is holding the rest — pay that instead)" : ""}.`; return; }
    db.vendorPayouts.push({ id: crypto.randomBytes(4).toString("hex"), vendorId: id, amount, reference, at: new Date().toISOString(), by: actor.name, note: str(fd, "note", 200), withdrawalId: null });
    audit(db, actor, "vendor.payout", "vendor", id, { after: { amount, reference } });
  });
  if (err) return { error: err };
  refresh(id);
  return { ok: `Payout of ₹${amount} recorded.` };
}

/** Pay or reject a seller's withdrawal request. Paying records the bank / UPI reference the seller sees. */
export async function withdrawalAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.manage");
  const id = str(fd, "id", 20);
  const op = str(fd, "op", 10);
  const reference = str(fd, "reference", 80);
  const note = str(fd, "note", 200);
  if (op !== "paid" && op !== "reject") return { error: "Unknown action." };
  if (op === "paid" && reference.length < 4) return { error: "Enter the bank / UPI transaction reference after sending the money." };
  if (op === "reject" && note.length < 5) return { error: "Tell the seller why (they see this)." };
  let err: string | null = null;
  let vendorId = "";
  await withDb((db) => {
    const w = db.vendorWithdrawals.find((x) => x.id === id);
    if (!w || w.status !== "requested") { err = "This request was already handled or cancelled."; return; }
    vendorId = w.vendorId;
    const now = new Date().toISOString();
    w.decidedAt = now;
    w.by = actor.name;
    if (op === "paid") {
      w.status = "paid";
      w.reference = reference;
      db.vendorPayouts.push({ id: crypto.randomBytes(4).toString("hex"), vendorId: w.vendorId, amount: w.amount, reference, at: now, by: actor.name, note: "Withdrawal sent to your bank", withdrawalId: w.id });
    } else {
      w.status = "rejected";
      w.note = note;
    }
    audit(db, actor, `vendor.withdraw.${op}`, "vendor", w.vendorId, { after: { amount: w.amount, reference, note } });
  });
  if (err) return { error: err };
  refresh(vendorId);
  revalidatePath("/admin/vendors/withdrawals");
  return { ok: op === "paid" ? "Marked as paid. The seller sees the reference in their wallet." : "Request rejected; the money stays in the seller’s wallet." };
}

/** Manual wallet correction, e.g. −₹349 for a returned item refunded to the customer. */
export async function walletAdjustmentAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.manage");
  const id = str(fd, "id", 20);
  const amount = money(str(fd, "amount", 12));
  const reason = str(fd, "reason", 200);
  const orderId = str(fd, "orderId", 40) || null;
  if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 10_000_000) return { error: "Enter an amount, e.g. -349 to take money out or 50 to add." };
  if (reason.length < 5) return { error: "Give a reason — the seller sees it in their wallet." };
  await withDb((db) => {
    if (!db.vendors.some((x) => x.id === id)) return;
    db.vendorAdjustments.push({ id: crypto.randomBytes(4).toString("hex"), vendorId: id, amount, reason, at: new Date().toISOString(), by: actor.name, orderId });
    audit(db, actor, "vendor.wallet.adjust", "vendor", id, { after: { amount, reason, orderId } });
  });
  refresh(id);
  return { ok: `Wallet ${amount > 0 ? "credited" : "debited"} ₹${Math.abs(amount)}.` };
}

/** Approve or reject a seller's product listing. */
export async function reviewListingAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.approve");
  const id = str(fd, "id", 40);
  const op = str(fd, "op", 10);
  const note = str(fd, "note");
  if (op !== "approve" && op !== "reject") return { error: "Unknown action." };
  if (op === "reject" && note.length < 5) return { error: "Tell the seller what to fix." };
  let err: string | null = null;
  await withDb((db) => {
    const p = db.products.find((x) => x.id === id && x.vendorId);
    if (!p) { err = "Listing not found."; return; }
    const now = new Date().toISOString();
    p.private.review = { status: op === "approve" ? "approved" : "rejected", note: op === "reject" ? note : "", at: now };
    if (op === "approve") {
      p.private.rightsConfirmed = true;
      // Always "active": the shop shows "Out of stock" from the stock count, and it sells again as soon as the seller restocks.
      p.status = "active";
    } else {
      p.status = "draft";
      p.private.featured = false;
    }
    audit(db, actor, `vendor.listing.${op}`, "product", p.id, { after: { note } });
  });
  if (err) return { error: err };
  revalidatePath("/admin/vendors/review");
  revalidatePath("/", "layout");
  return { ok: op === "approve" ? "Approved — it’s live." : "Sent back to the seller." };
}

export async function commissionAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("finance.manage");
  const r = validateCommission({ upTo: str(fd, "upTo", 8), lowPct: str(fd, "lowPct", 6), highPct: str(fd, "highPct", 6) });
  if (!r.ok) return { error: r.error };
  await withDb((db) => {
    const before = db.settings.vendorCommission ?? null;
    db.settings.vendorCommission = r.value;
    audit(db, actor, "settings.vendor_commission", "settings", "vendorCommission", { before, after: r.value });
  });
  refresh();
  revalidatePath("/sell");
  return { ok: `Saved: ${describeCommission(r.value)}. Applies to new orders; orders already placed keep theirs.` };
}

/** Gives the seller a temporary password (shown once here) when they've forgotten theirs. */
export async function vendorPasswordResetAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.manage");
  const temp = await resetVendorPassword(str(fd, "id", 20), actor);
  if (!temp) return { error: "Seller not found." };
  return { ok: "Temporary password (shown once) — send it to the seller privately and ask them to change it after signing in:", secret: temp };
}
