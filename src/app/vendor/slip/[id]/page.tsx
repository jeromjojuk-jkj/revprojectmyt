import { notFound } from "next/navigation";
import { readDb } from "@/lib/server/db";
import { requireApprovedVendor } from "@/lib/server/vendors";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Packing slip", robots: { index: false } };

/** Printable packing slip / address label for the seller's part of an order. No prices on it (it travels with the parcel). */
export default async function PackingSlip({ params }: { params: Promise<{ id: string }> }) {
  const v = await requireApprovedVendor();
  const { id } = await params;
  const db = await readDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o || !o.vendorParts?.some((p) => p.vendorId === v.id) || ["payment_pending", "payment_failed", "cancelled"].includes(o.status)) notFound();
  const items = o.items.filter((i) => i.vendorId === v.id);
  const a = o.address;
  return (
    <div className="mx-auto max-w-[680px] bg-white p-6 text-[14px] text-black print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <p className="text-sm text-ink-soft">Print this and stick it on the parcel.</p>
        <PrintButton />
      </div>
      <div className="rounded-lg border-2 border-black p-4">
        <div className="flex justify-between gap-4 border-b-2 border-black pb-3">
          <div><p className="text-xs font-bold uppercase">Order</p><p className="font-mono text-lg font-bold">{o.id}</p></div>
          <div className="text-right"><p className="text-xs font-bold uppercase">Prepaid</p><p>{new Date(o.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-b-2 border-black py-3">
          <div>
            <p className="text-xs font-bold uppercase">Deliver to</p>
            <p className="mt-1 leading-snug"><b>{a.name}</b><br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}{a.landmark ? <><br />Near {a.landmark}</> : null}<br />{a.city}, {a.state}<br /><b className="text-lg">{a.pincode}</b><br />Ph: {a.phone}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase">From (return address)</p>
            <p className="mt-1 leading-snug"><b>{v.businessName}</b><br />{v.address}<br />{v.city}, {v.state} – {v.pincode}<br />Ph: {v.phone}{v.gstin ? <><br />GSTIN: {v.gstin}</> : null}</p>
            <p className="mt-2 text-xs">Sold via Krip (kripkart.com)</p>
          </div>
        </div>
        <table className="mt-3 w-full text-left">
          <thead><tr className="border-b border-black"><th className="py-1">Item</th><th className="py-1">SKU</th><th className="py-1 text-right">Qty</th></tr></thead>
          <tbody>{items.map((i) => <tr key={i.sku} className="border-b border-black/20"><td className="py-1">{i.title}{[i.option, i.size].filter(Boolean).length ? ` (${[i.option, i.size].filter(Boolean).join(", ")})` : ""}</td><td className="py-1 font-mono">{i.sku}</td><td className="py-1 text-right">{i.qty}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
