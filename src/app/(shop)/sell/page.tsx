import Link from "next/link";
import { VENDOR_PLANS, commissionOf, describeCommission, unitCommission } from "@/lib/vendorPlans";
import { getSettings } from "@/lib/server/catalog";
import { formatMoney, formatPrice } from "@/lib/format";

export const metadata = { title: "Sell on Krip", description: "Register as a seller on Krip: one-time plan fee and a small commission on each product sold." };

export default async function SellOnKrip() {
  const rule = commissionOf(await getSettings());
  const c = describeCommission(rule);
  const ex = (price: number) => ({ price, fee: unitCommission(price, rule), get: price - unitCommission(price, rule) });
  const big = ex(499), small = ex(99);
  return (
    <div className="px-4 pb-10 pt-4">
      <section className="rounded-3xl bg-ink px-5 py-8 text-white md:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sun">Krip marketplace</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">Sell your products on Krip</h1>
        <p className="mt-2 max-w-xl text-white/80">Pay a one-time registration fee, list your products, and ship orders straight to customers across India. Krip keeps just <b className="text-sun">{c}</b> per product sold.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/sell/register" className="flex h-12 items-center rounded-xl bg-sun px-6 font-bold text-ink">Register as a seller</Link>
          <Link href="/vendor/login" className="flex h-12 items-center rounded-xl px-6 font-semibold ring-1 ring-white/30">Seller sign in</Link>
        </div>
      </section>

      <h2 className="mt-8 text-xl font-bold">Choose your plan</h2>
      <p className="text-sm text-ink-soft">One-time fee — no monthly charges. Same commission on every plan: {c}.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {VENDOR_PLANS.map((p) => (
          <div key={p.id} className={`flex flex-col rounded-2xl bg-white p-5 ring-1 ${p.id === "premium" ? "ring-2 ring-sun" : "ring-line"}`}>
            {p.id === "premium" && <span className="mb-2 self-start rounded-full bg-sun px-2.5 py-0.5 text-[11px] font-bold">Most popular</span>}
            <h3 className="text-lg font-bold">{p.name}</h3>
            <p className="mt-1"><span className="text-3xl font-bold">{formatPrice(p.fee)}</span> <span className="text-sm text-ink-soft">one-time</span></p>
            <ul className="mt-4 flex-1 space-y-2 text-sm">
              {[...p.perks, `Commission: ${c}`].map((x) => <li key={x} className="flex gap-2"><span aria-hidden className="text-leaf">✓</span>{x}</li>)}
            </ul>
            <Link href={`/sell/register?plan=${p.id}`} className={`mt-5 flex h-11 items-center justify-center rounded-xl font-semibold ${p.id === "premium" ? "bg-sun text-ink" : "bg-leaf text-white"}`}>Choose {p.name}</Link>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-xl font-bold">How it works</h2>
      <ol className="mt-3 grid gap-3 md:grid-cols-4">
        {[
          ["Register & pay", "Fill in your business, pickup and bank details, then pay the one-time fee securely via Cashfree."],
          ["Get approved", "Krip checks your business, tax and bank details."],
          ["List products", "Add products from your seller panel. Krip reviews each one before it goes live."],
          ["Sell & ship", "Accept, pack and ship each order with your own courier, and update the tracking from your panel. Your earnings = price + your delivery charge − Krip’s commission."],
        ].map(([t, d], i) => (
          <li key={t} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-sun text-sm font-bold">{i + 1}</span>
            <p className="mt-2 font-semibold">{t}</p>
            <p className="text-sm text-ink-soft">{d}</p>
          </li>
        ))}
      </ol>

      <h2 className="mt-8 text-xl font-bold">Good to know</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink-soft">
        <li><b className="text-ink">Commission:</b> {c}, charged on each product’s selling price. No other fees.</li>
        <li><b className="text-ink">Example:</b> you sell a {formatPrice(big.price)} product → Krip keeps {formatMoney(big.fee)} → you get {formatMoney(big.get)}. A {formatPrice(small.price)} product → Krip keeps {formatMoney(small.fee)} → you get {formatMoney(small.get)}. Your delivery charge is added on top.</li>
        <li><b className="text-ink">Shipping:</b> you ship with any courier you like. You set your own delivery charge (or free delivery above an amount you choose) and your dispatch time — the delivery charge the customer pays for your items is yours.</li>
        <li><b className="text-ink">Order updates:</b> from your seller panel you accept the order, mark it packed, add the courier and AWB number when you hand it over, post tracking updates and mark it delivered. The customer sees every update on their order page.</li>
        <li>Customers pay online for sellers’ items (Cash on Delivery isn’t offered on them yet). When automatic split is on, Cashfree sends your share straight to your bank account; otherwise Krip pays you after delivery.</li>
        <li>Festival offers and coupons on Krip are paid by Krip and apply only to Krip’s own products — your price and earnings stay the same.</li>
        <li>Only list products you’re allowed to sell: no copies of brands or cartoon characters without a licence, no banned or unsafe items. Krip may reject listings or suspend sellers who break this.</li>
      </ul>
    </div>
  );
}
