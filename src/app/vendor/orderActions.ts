"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { withDb } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { applyVendorOp, FulfilmentError, type VendorOp } from "@/lib/vendorFulfilment";
import { validateShipping } from "@/lib/vendorPlans";

export type VendorActionState = { ok?: string; error?: string; errors?: Record<string, string> } | null;

const OPS: VendorOp[] = ["accept", "pack", "ship", "tracking", "deliver", "issue"];
const str = (fd: FormData, k: string) => (typeof fd.get(k) === "string" ? String(fd.get(k)) : "");

/** One manual order update from the seller panel. */
export async function vendorOrderAction(_: VendorActionState, fd: FormData): Promise<VendorActionState> {
  const v = await requireApprovedVendor();
  const id = str(fd, "orderId");
  const op = str(fd, "op") as VendorOp;
  if (!OPS.includes(op)) return { error: "Unknown action." };
  try {
    await withDb((db) => {
      const o = db.orders.find((x) => x.id === id);
      if (!o) throw new FulfilmentError("Order not found.");
      const what = applyVendorOp(o, v.id, op, { carrier: str(fd, "carrier"), awb: str(fd, "awb"), trackingUrl: str(fd, "trackingUrl"), update: str(fd, "update"), note: str(fd, "note") }, `Seller: ${v.businessName}`);
      audit(db, { id: v.id, name: `Seller: ${v.businessName}` }, `vendor.order.${op}`, "order", o.id, { after: { what } });
    });
  } catch (e) {
    if (e instanceof FulfilmentError) return { error: e.message };
    throw e;
  }
  revalidatePath("/vendor/orders");
  revalidatePath(`/vendor/orders/${id}`);
  const done: Record<VendorOp, string> = { accept: "Order accepted.", pack: "Marked as packed.", ship: "Marked as shipped — the customer can now track it.", tracking: "Tracking update posted.", deliver: "Marked as delivered.", issue: "Krip has been told. We’ll contact the customer." };
  return { ok: done[op] };
}

/** The seller's delivery charge and dispatch time. */
export async function saveShippingAction(_: VendorActionState, fd: FormData): Promise<VendorActionState> {
  const v = await requireApprovedVendor();
  const raw = Object.fromEntries([...fd.entries()].filter(([, x]) => typeof x === "string")) as Record<string, string>;
  const r = validateShipping(raw);
  if (!r.ok) return { errors: r.errors };
  await withDb((db) => {
    const x = db.vendors.find((y) => y.id === v.id);
    if (!x) return;
    const before = x.shipping ?? null;
    x.shipping = r.value;
    audit(db, { id: v.id, name: `Seller: ${v.businessName}` }, "vendor.shipping", "vendor", v.id, { before, after: r.value });
  });
  revalidatePath("/vendor/shipping");
  revalidatePath("/", "layout");
  return { ok: "Shipping settings saved. New orders use them straight away." };
}
