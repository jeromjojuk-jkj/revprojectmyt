import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { formatPrice } from "@/lib/format";
import { describeCoupon, istDate } from "@/lib/coupons";
import { BOOKED } from "@/lib/orderflow";
import { Badge, Empty, Notice, PageHeader, btn, td, th } from "@/app/admin/_components/ui";
import { couponQuickAction } from "@/app/admin/opsActions";

export const metadata = { title: "Coupons & discounts" };

export default async function Coupons({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const ctx = await requirePerm("coupons.view");
  const { saved } = await searchParams;
  const db = await readDb();
  const today = istDate(new Date());
  return (
    <div>
      <PageHeader
        title="Coupons & discounts"
        description="Discounts are calculated on the server at checkout. They apply to GST-inclusive item prices, never to delivery or COD fees. Usage limits are enforced when the order is placed, inside the same lock that reserves stock."
        actions={ctx.can("coupons.create") && <Link href="/admin/coupons/new" className={btn.primary}><Plus size={16} aria-hidden /> New coupon</Link>}
      />
      {saved && <div className="mb-4"><Notice tone="green">Coupon saved.</Notice></div>}
      {db.settings.coupons.length === 0 ? <Empty title="No coupons yet">Create a code shoppers can enter in their bag.</Empty> : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-paper"><tr><th className={th}>Code</th><th className={th}>Discount</th><th className={th}>Rules</th><th className={th}>Dates (IST)</th><th className={`${th} text-right`}>Redeemed</th><th className={`${th} text-right`}>Discount given</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {db.settings.coupons.map((c) => {
                const uses = db.orders.filter((o) => o.couponCode === c.code && BOOKED(o.status) && o.status !== "cancelled");
                const given = uses.reduce((s, o) => s + o.discount, 0);
                const sales = uses.reduce((s, o) => s + o.subtotal - o.discount, 0);
                const live = c.active && (!c.startsOn || today >= c.startsOn) && (!c.endsOn || today <= c.endsOn) && (c.usageLimit === null || uses.length < c.usageLimit);
                const rules = [
                  c.minSubtotal ? `Min ${formatPrice(c.minSubtotal)}` : null,
                  c.categories.length ? `Only ${c.categories.join(", ")}` : null,
                  c.firstOrderOnly ? "First order only" : null,
                  c.perCustomerLimit !== null ? `${c.perCustomerLimit}× per customer` : null,
                  c.usageLimit !== null ? `${c.usageLimit} total` : null,
                ].filter(Boolean);
                return (
                  <tr key={c.code} className="border-t border-line">
                    <td className={td}><span className="rounded-md bg-paper px-2 py-1 font-mono text-sm font-bold ring-1 ring-line">{c.code}</span><p className="mt-1 text-xs text-ink-soft">{c.description}</p></td>
                    <td className={`${td} whitespace-nowrap`}>{describeCoupon({ ...c, minSubtotal: 0 })}</td>
                    <td className={`${td} text-xs`}>{rules.length ? rules.join(" · ") : "None"}</td>
                    <td className={`${td} whitespace-nowrap text-xs`}>{c.startsOn ?? "—"} → {c.endsOn ?? "no end"}</td>
                    <td className={`${td} text-right tabular-nums`}>{uses.length}{c.usageLimit !== null && <span className="text-ink-soft"> / {c.usageLimit}</span>}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatPrice(given)}<span className="block text-xs text-ink-soft">on {formatPrice(sales)} sales</span></td>
                    <td className={td}>{live ? <Badge tone="green">Live</Badge> : c.active ? <Badge tone="yellow">Scheduled / used up</Badge> : <Badge>Off</Badge>}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <div className="flex justify-end gap-1">
                        {ctx.can("coupons.edit") && <Link href={`/admin/coupons/${encodeURIComponent(c.code)}`} className="flex h-9 items-center rounded-lg px-3 text-xs font-semibold ring-1 ring-line hover:bg-paper">Edit</Link>}
                        {ctx.can("coupons.edit") && <form action={couponQuickAction}><input type="hidden" name="code" value={c.code} /><button name="op" value="toggle" className="h-9 rounded-lg px-3 text-xs font-semibold ring-1 ring-line hover:bg-paper">{c.active ? "Turn off" : "Turn on"}</button></form>}
                        {ctx.can("coupons.delete") && uses.length === 0 && <form action={couponQuickAction}><input type="hidden" name="code" value={c.code} /><button name="op" value="delete" className="h-9 rounded-lg px-3 text-xs font-semibold text-danger ring-1 ring-danger/30 hover:bg-danger-soft">Delete</button></form>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-ink-soft">Coupons that have been redeemed can be turned off but not deleted, so order history stays explainable. Automatic discounts, buy-X-get-Y and bundles are on the <Link href="/admin/roadmap" className="underline">roadmap</Link>.</p>
    </div>
  );
}
