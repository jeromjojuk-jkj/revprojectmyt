import Link from "next/link";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { vendorLedger } from "@/lib/server/vendorLedger";
import { commissionOf, describeCommission, noCommission, planOf } from "@/lib/vendorPlans";
import { formatMoney, formatPrice } from "@/lib/format";
import { Badge, Card, Empty, Notice, PageHeader, Table, btn, field, label, td, th } from "@/app/admin/_components/ui";
import type { VendorStatus } from "@/lib/types";
import { VForm } from "./VForm";
import { STATUS } from "./status";
import { commissionAction } from "@/app/admin/vendorActions";

export const metadata = { title: "Sellers" };
export const dynamic = "force-dynamic";


export default async function Sellers({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await requirePerm("vendors.view");
  const { status } = await searchParams;
  const db = await readDb();
  const all = [...db.vendors].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const list = status ? all.filter((v) => v.status === status) : all;
  const pendingListings = db.products.filter((p) => p.vendorId && p.private.review?.status === "pending").length;
  const rule = commissionOf(db.settings);
  const openW = db.vendorWithdrawals.filter((w) => w.status === "requested");
  const fees = all.filter((v) => v.fee.paid && !v.fee.demo).reduce((s, v) => s + v.planFee, 0);
  return (
    <div className="space-y-4">
      <PageHeader title="Sellers" description="Marketplace sellers: one-time plan fee, ₹ commission per unit sold, and they ship their own orders." actions={ctx.can("vendors.approve") ? <Link href="/admin/vendors/review" className={btn.primary}>Listing review ({pendingListings})</Link> : null} />
      <Notice tone="blue">Customers pay Krip. Each seller’s full sale (price + their delivery charge{noCommission(rule) ? "" : " − commission"}) goes into their wallet when the order is delivered. Sellers request withdrawals; you send the money and mark it paid.</Notice>
      {openW.length > 0 && <Notice tone="yellow"><b>{openW.length} withdrawal request{openW.length > 1 ? "s" : ""}</b> waiting ({formatMoney(openW.reduce((a, w) => a + w.amount, 0))}). <Link href="/admin/vendors/withdrawals" className="font-semibold underline">Pay sellers →</Link></Notice>}
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/vendors" className={!status ? btn.dark : btn.secondary}>All {all.length}</Link>
        {(Object.keys(STATUS) as VendorStatus[]).map((s) => <Link key={s} href={`/admin/vendors?status=${s}`} className={status === s ? btn.dark : btn.secondary}>{STATUS[s][0]} {all.filter((v) => v.status === s).length}</Link>)}
      </div>
      {list.length === 0 ? <Empty title="No sellers yet">Sellers register at kripkart.com/sell.</Empty> : (
        <Table minWidth={860}>
          <thead><tr><th className={th}>Seller</th><th className={th}>Plan</th><th className={th}>Status</th><th className={th}>Products</th><th className={th}>Sales</th><th className={th}>Wallet</th><th className={th}>Joined</th></tr></thead>
          <tbody className="divide-y divide-line">
            {list.map((v) => {
              const led = vendorLedger(db, v.id);
              const n = db.products.filter((p) => p.vendorId === v.id && p.status === "active").length;
              return (
                <tr key={v.id}>
                  <td className={td}><Link href={`/admin/vendors/${v.id}`} className="font-semibold text-leaf underline">{v.businessName}</Link><div className="text-xs text-ink-soft">{v.id} · {v.city}, {v.state}</div></td>
                  <td className={td}>{planOf(v.plan).name}<div className="text-xs text-ink-soft">{formatPrice(v.planFee)} {v.fee.paid ? (v.fee.demo ? "(test)" : "paid") : "unpaid"}</div></td>
                  <td className={td}><Badge tone={STATUS[v.status][1]}>{STATUS[v.status][0]}</Badge>{v.verified && <div className="mt-1"><Badge tone="blue">Verified</Badge></div>}</td>
                  <td className={td}>{n} live</td>
                  <td className={td}>{formatPrice(led.totals.gross)}<div className="text-xs text-ink-soft">{led.totals.units} units · {formatMoney(led.totals.commission)} commission</div></td>
                  <td className={td}>{formatMoney(led.totals.balance)}{led.openWithdrawal && <div><Badge tone="yellow">Withdrawal {formatMoney(led.openWithdrawal.amount)}</Badge></div>}</td>
                  <td className={td}>{new Date(v.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Plan fees received">
          <p className="text-2xl font-bold">{formatPrice(fees)}</p>
          <p className="text-xs text-ink-soft">Real payments only (test payments excluded).</p>
        </Card>
        <Card title="Commission on sellers’ sales">
          <p className="font-semibold">{noCommission(rule) ? "No commission — sellers get 100% of each sale" : describeCommission(rule)}</p>
          {ctx.can("finance.manage") && (
            <VForm action={commissionAction} hidden={{}} className="mt-3 flex flex-wrap items-end gap-2">
              <div><label className={label} htmlFor="c-low">% for products up to the limit</label><input id="c-low" name="lowPct" inputMode="decimal" defaultValue={rule.lowPct} className={`${field} w-24`} /></div>
              <div><label className={label} htmlFor="c-upto">Price limit (₹)</label><input id="c-upto" name="upTo" inputMode="numeric" defaultValue={rule.upTo} className={`${field} w-24`} /></div>
              <div><label className={label} htmlFor="c-high">% above the limit</label><input id="c-high" name="highPct" inputMode="decimal" defaultValue={rule.highPct} className={`${field} w-24`} /></div>
              <button className={btn.primary}>Save</button>
            </VForm>
          )}
          <p className="mt-2 text-xs text-ink-soft">Charged on each product’s selling price (per unit). The Sell on Krip page and seller panel show this automatically. Orders already placed keep the commission they were placed with.</p>
        </Card>
      </div>
    </div>
  );
}
