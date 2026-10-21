import { notFound } from "next/navigation";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { formatDate, formatPrice } from "@/lib/format";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Packing slip" };

export default async function PrintOrder({ params }: { params: Promise<{ id: string }> }) {
  await requirePerm("orders.view");
  const { id } = await params;
  const db = await readDb();
  const o = db.orders.find((x) => x.id === id);
  if (!o) notFound();
  const s = db.store;
  const a = o.address;
  const from = [s.legalName || s.name, s.address, s.gstin && `GSTIN ${s.gstin}`].filter(Boolean);
  return (
    <div className="mx-auto max-w-3xl bg-white p-6 text-sm text-black print:p-0">
      <div className="mb-4 flex justify-end print:hidden"><PrintButton /></div>
      {[{ title: "Packing slip", prices: false }, { title: "Order receipt", prices: true }].map((doc, di) => (
        <section key={doc.title} className={di === 1 ? "mt-10 border-t-2 border-dashed border-neutral-300 pt-10 print:break-before-page print:border-0 print:pt-0" : ""}>
          <header className="flex justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{doc.title}</h1>
              <p>Order <b>{o.id}</b> · {formatDate(o.createdAt, { day: "numeric", month: "short", year: "numeric" })}</p>
              <p>{o.paymentMethod === "cod" ? `Cash on Delivery — collect ${formatPrice(o.total)}` : "Prepaid"}</p>
            </div>
            <div className="text-right text-xs">{from.map((l) => <p key={l} className="whitespace-pre-line">{l}</p>)}</div>
          </header>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div><p className="text-xs font-semibold uppercase text-neutral-500">Ship to</p><p className="mt-1 leading-relaxed">{a.name}<br />{a.line1}{a.line2 && <><br />{a.line2}</>}{a.landmark && <><br />Near {a.landmark}</>}<br />{a.city}, {a.state} {a.pincode}<br />Phone {a.phone}</p></div>
            {o.shipments?.at(-1) && <div><p className="text-xs font-semibold uppercase text-neutral-500">Shipment</p><p className="mt-1">{o.shipments.at(-1)!.carrier}<br />AWB {o.shipments.at(-1)!.awb}</p></div>}
          </div>
          <table className="mt-5 w-full border-collapse">
            <thead><tr className="border-b-2 border-black text-left text-xs uppercase"><th className="py-1.5">Item</th><th>SKU</th><th className="text-right">Qty</th>{doc.prices && <><th className="text-right">Price</th><th className="text-right">Amount</th></>}</tr></thead>
            <tbody>
              {o.items.map((it) => (
                <tr key={it.sku} className="border-b border-neutral-200">
                  <td className="py-1.5">{it.title}<span className="block text-xs text-neutral-500">{it.color}{it.size ? ` · ${it.size}` : ""}</span></td>
                  <td className="font-mono text-xs">{it.sku}</td>
                  <td className="text-right">{it.qty}</td>
                  {doc.prices && <><td className="text-right">{formatPrice(it.unitPrice)}</td><td className="text-right">{formatPrice(it.unitPrice * it.qty)}</td></>}
                </tr>
              ))}
            </tbody>
          </table>
          {doc.prices ? (
            <>
              <dl className="ml-auto mt-3 w-64 space-y-1">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(o.subtotal)}</dd></div>
                {o.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{formatPrice(o.discount)}</dd></div>}
                <div className="flex justify-between"><dt>Delivery</dt><dd>{formatPrice(o.delivery)}</dd></div>
                {o.codFee > 0 && <div className="flex justify-between"><dt>COD fee</dt><dd>{formatPrice(o.codFee)}</dd></div>}
                <div className="flex justify-between border-t border-black pt-1 font-bold"><dt>Total</dt><dd>{formatPrice(o.total)}</dd></div>
              </dl>
              <p className="mt-4 text-xs text-neutral-500">Prices include GST. This receipt is not a GST tax invoice: tax rates and HSN codes aren’t configured yet, so tax isn’t itemised. Validate invoice requirements with your accountant before issuing tax invoices.</p>
            </>
          ) : (
            <p className="mt-4 text-xs text-neutral-500">Check each item against this slip before sealing the package.</p>
          )}
        </section>
      ))}
    </div>
  );
}
