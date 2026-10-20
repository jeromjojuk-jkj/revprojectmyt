import Link from "next/link";
import { readDb } from "@/lib/server/db";
import { toPublicProduct } from "@/lib/server/catalog";
import { evaluateOffer, OFFER_THEMES, type OfferState } from "@/lib/offers";
import { offerQuickAction } from "../../actions";
import { OfferForm } from "./OfferForm";

const STATE: Record<OfferState, { label: string; cls: string }> = {
  live: { label: "Live", cls: "bg-leaf-soft text-leaf" },
  scheduled: { label: "Scheduled", cls: "bg-sun-soft text-ink" },
  ended: { label: "Ended", cls: "bg-neutral-100 text-ink-soft" },
  inactive: { label: "Off", cls: "bg-neutral-100 text-ink-soft" },
  empty: { label: "Hidden — no in-stock products", cls: "bg-danger-soft text-danger" },
};

export default async function OffersAdmin({ searchParams }: { searchParams: Promise<{ edit?: string; saved?: string }> }) {
  const { edit, saved } = await searchParams;
  const db = await readDb();
  const products = db.products.filter((p) => p.status !== "draft").map(toPublicProduct);
  const views = db.offers.map((o) => evaluateOffer(o, products));
  const editing = edit && edit !== "new" ? db.offers.find((o) => o.id === edit) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Seasonal & special offers</h1>
        <Link href="/admin/offers?edit=new" className="flex h-11 items-center rounded-xl bg-leaf px-4 text-sm font-semibold text-white">Add offer</Link>
      </div>
      <div className="rounded-2xl bg-sun-soft p-4 text-sm">
        <p className="font-semibold">Keep every tile true</p>
        <ul className="mt-1 list-disc pl-5 text-ink-soft">
          <li>“From ₹…”, style counts and “up to …% off MRP” are calculated from the catalogue — you can’t type them.</li>
          <li>A headline like “Under ₹299” must be matched by <code>max=299</code> in the link; saving is blocked otherwise.</li>
          <li>Set an end date only if the offer really ends then. Tiles hide themselves after it, and before the start date.</li>
          <li>Only mention bank or cashback offers in the terms if a real, configured partner offer exists.</li>
        </ul>
      </div>
      {saved && <p role="status" className="rounded-xl bg-leaf-soft p-3 text-sm text-leaf">Offer saved.</p>}
      <ul className="space-y-2">
        {views.map((v, i) => (
          <li key={v.offer.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 text-sm ring-1 ring-line">
            <span className="h-10 w-10 shrink-0 rounded-lg" style={{ background: OFFER_THEMES[v.offer.theme].bg }} aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{v.offer.headline} · {v.offer.subhead}</span>
              <span className="text-xs text-ink-soft">{v.offer.badge} · /search?{v.offer.query} · {v.count} in stock{v.offer.startsOn || v.offer.endsOn ? ` · ${v.offer.startsOn ?? "…"} → ${v.offer.endsOn ?? "…"}` : ""}</span>
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATE[v.state].cls}`}>{STATE[v.state].label}</span>
            <Link href={`/admin/offers?edit=${v.offer.id}`} className="flex h-9 items-center rounded-lg px-3 text-xs font-semibold ring-1 ring-line">Edit</Link>
            <form action={offerQuickAction} className="flex gap-1">
              <input type="hidden" name="id" value={v.offer.id} />
              <button name="op" value="up" disabled={i === 0} className="h-9 w-9 rounded-lg text-xs ring-1 ring-line disabled:opacity-30" aria-label="Move up">↑</button>
              <button name="op" value="down" disabled={i === views.length - 1} className="h-9 w-9 rounded-lg text-xs ring-1 ring-line disabled:opacity-30" aria-label="Move down">↓</button>
              <button name="op" value="toggle" className="h-9 rounded-lg px-2 text-xs font-semibold ring-1 ring-line">{v.offer.active ? "Turn off" : "Turn on"}</button>
              <button name="op" value="delete" className="h-9 rounded-lg px-2 text-xs font-semibold text-danger ring-1 ring-danger">Delete</button>
            </form>
          </li>
        ))}
      </ul>
      {(edit === "new" || editing) && (
        <OfferForm
          key={edit}
          initial={editing ? { ...editing, productIds: editing.productIds.join(", "), terms: editing.terms ?? "", startsOn: editing.startsOn ?? "", endsOn: editing.endsOn ?? "", active: editing.active ? "on" : "" } : { theme: "saffron", badge: "Diwali Edit", active: "on" }}
          id={editing?.id ?? ""}
        />
      )}
    </div>
  );
}
