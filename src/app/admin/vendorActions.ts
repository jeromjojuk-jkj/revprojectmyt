"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requirePerm } from "@/lib/server/auth";
import { withDb, readDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { unseal } from "@/lib/server/vault";
import { createCashfreeVendor, easySplitEnabled } from "@/lib/server/cashfree";
import { planOf } from "@/lib/vendorPlans";
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

/** Records money Krip paid the seller outside Cashfree (bank transfer / UPI). */
export async function vendorPayoutAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.manage");
  const id = str(fd, "id", 20);
  const amount = Number(str(fd, "amount", 10));
  const reference = str(fd, "reference", 80);
  if (!Number.isInteger(amount) || amount < 1 || amount > 10_000_000) return { error: "Enter the amount paid in whole rupees." };
  if (reference.length < 4) return { error: "Enter the bank / UPI transaction reference." };
  await withDb((db) => {
    if (!db.vendors.some((x) => x.id === id)) return;
    const p = { id: crypto.randomBytes(4).toString("hex"), vendorId: id, amount, reference, at: new Date().toISOString(), by: actor.name, note: str(fd, "note", 200) };
    db.vendorPayouts.push(p);
    audit(db, actor, "vendor.payout", "vendor", id, { after: { amount, reference } });
  });
  refresh(id);
  return { ok: `Payout of ₹${amount} recorded.` };
}

/** Registers the seller with Cashfree Easy Split so online orders pay them directly. */
export async function vendorCashfreeAction(_: VendorAdminState, fd: FormData): Promise<VendorAdminState> {
  const { actor } = await requirePerm("vendors.manage");
  if (!easySplitEnabled()) return { error: "Easy Split is off. Ask Cashfree to enable split payments, then set CASHFREE_EASY_SPLIT=on in Vercel." };
  const id = str(fd, "id", 20);
  const v = (await readDb()).vendors.find((x) => x.id === id);
  if (!v) return { error: "Seller not found." };
  if (v.status !== "approved") return { error: "Approve the seller first." };
  const acc = await unseal(v.bank.accountEnc);
  if (!acc) return { error: "Couldn’t read the bank account number." };
  try {
    await createCashfreeVendor({ vendorId: v.id, name: v.businessName, email: v.email, phone: v.phone, accountNumber: acc, accountHolder: v.bank.holder, ifsc: v.bank.ifsc, pan: v.pan, gstin: v.gstin });
  } catch (e) {
    return { error: `Cashfree refused: ${(e as Error).message.slice(0, 200)}` };
  }
  await withDb((db) => {
    const x = db.vendors.find((y) => y.id === id);
    if (x) x.cashfreeVendorId = x.id;
    audit(db, actor, "vendor.cashfree", "vendor", id);
  });
  refresh(id);
  return { ok: "Added to Cashfree Easy Split. Their share of new online orders goes to them directly." };
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
      p.status = p.variants.some((x) => x.stock > 0) ? "active" : "out-of-stock";
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
  const n = Number(str(fd, "rate", 6));
  if (!Number.isInteger(n) || n < 0 || n > 1000) return { error: "Enter ₹0–₹1000 per unit." };
  await withDb((db) => {
    const before = db.settings.vendorCommissionPerUnit;
    db.settings.vendorCommissionPerUnit = n;
    audit(db, actor, "settings.vendor_commission", "settings", "vendorCommissionPerUnit", { before, after: n });
  });
  refresh();
  return { ok: `Commission set to ₹${n} per unit for new orders. Orders already placed keep their rate.` };
}
