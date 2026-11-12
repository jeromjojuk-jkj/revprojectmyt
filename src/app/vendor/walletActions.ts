"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { vendorLedger } from "@/lib/vendorWallet";
import { paise } from "@/lib/vendorPlans";

export type WalletState = { ok?: string; error?: string } | null;

/** The seller asks Krip to send money from their wallet to their bank. One open request at a time. */
export async function requestWithdrawalAction(_: WalletState, fd: FormData): Promise<WalletState> {
  const v = await requireApprovedVendor();
  const amount = paise(Number(String(fd.get("amount") ?? "").trim()));
  const note = String(fd.get("note") ?? "").trim().slice(0, 200);
  if (!Number.isFinite(amount) || amount < 1) return { error: "Enter an amount of at least ₹1." };
  let err: string | null = null;
  await withDb((db) => {
    const led = vendorLedger(db, v.id);
    if (led.openWithdrawal) { err = "You already have a withdrawal waiting. Krip will process it soon."; return; }
    if (amount > led.totals.available) { err = `You can withdraw up to ₹${led.totals.available.toLocaleString("en-IN")} right now.`; return; }
    const w = { id: crypto.randomBytes(4).toString("hex"), vendorId: v.id, amount, status: "requested" as const, requestedAt: new Date().toISOString(), decidedAt: null, reference: "", note, by: null };
    db.vendorWithdrawals.push(w);
    audit(db, { id: v.id, name: `Seller: ${v.businessName}` }, "vendor.withdraw.request", "vendor", v.id, { after: { amount } });
  });
  if (err) return { error: err };
  revalidatePath("/vendor/wallet");
  return { ok: `Withdrawal of ₹${amount.toLocaleString("en-IN")} requested. Krip will send it to your bank account and you’ll see the reference here.` };
}

/** The seller cancels a withdrawal Krip hasn't processed yet. */
export async function cancelWithdrawalAction(_: WalletState, fd: FormData): Promise<WalletState> {
  const v = await requireApprovedVendor();
  const id = String(fd.get("id") ?? "");
  let ok = false;
  await withDb((db) => {
    const w = db.vendorWithdrawals.find((x) => x.id === id && x.vendorId === v.id && x.status === "requested");
    if (!w) return;
    db.vendorWithdrawals = db.vendorWithdrawals.filter((x) => x !== w);
    audit(db, { id: v.id, name: `Seller: ${v.businessName}` }, "vendor.withdraw.cancel", "vendor", v.id, { before: { amount: w.amount } });
    ok = true;
  });
  revalidatePath("/vendor/wallet");
  return ok ? { ok: "Withdrawal cancelled. The money stays in your wallet." } : { error: "That request was already processed." };
}
