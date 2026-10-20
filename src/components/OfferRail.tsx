"use client";

import Link from "next/link";
import { useState } from "react";
import type { OfferView } from "@/lib/offers";
import { OFFER_THEMES } from "@/lib/offers";
import { imageForColor } from "@/lib/art";
import { formatDate, formatPrice, plural } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { Sheet } from "./Sheet";

export function OfferCard({ view, priority = false, onTerms }: { view: OfferView; priority?: boolean; onTerms?: () => void }) {
  const { offer } = view;
  const bg = OFFER_THEMES[offer.theme].bg;
  const facts = [
    view.fromPrice !== null ? `From ${formatPrice(view.fromPrice)}` : null,
    plural(view.count, "style"),
    view.maxDiscount ? `up to ${view.maxDiscount}% off MRP` : null,
  ].filter(Boolean).join(" · ");
  return (
    <article className="press-card relative flex h-full flex-col overflow-hidden rounded-2xl p-3 text-white" style={{ background: bg }}>
      {/* faint halo + constellation, the Krip motif */}
      <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/25" />
      <span aria-hidden className="constellation-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <h3 className="text-[26px] font-bold leading-[1.05] tracking-tight">
          <Link href={`/search?${offer.query}`} className="after:absolute after:inset-0 after:z-10 after:content-['']">
            {offer.headline}
          </Link>
        </h3>
        <p className="mt-0.5 text-[15px] font-medium leading-snug">{offer.subhead}</p>
        <p className="mb-3 mt-1 text-[11px] text-white/90">{facts}</p>
      </div>
      <div className="relative mt-3 grid flex-1 grid-cols-2 gap-1 overflow-hidden rounded-xl bg-white/15 p-1">
        {view.images.map((im, i) => (
          <div key={im.src + i} className={`relative min-h-[104px] overflow-hidden rounded-lg bg-white ${view.images.length === 1 ? "col-span-2" : ""}`}>
            <ProductImage src={imageForColor(im.src, im.hex)} alt="" sizes="(min-width:768px) 140px, 30vw" priority={priority} />
          </div>
        ))}
      </div>
      <div className="relative -mt-3 flex flex-col items-center">
        <span className="z-[1] rounded-full bg-white px-3 py-1 text-xs font-bold" style={{ color: bg }}>Shop now</span>
        <span className="-mt-2 w-full rounded-xl bg-sun px-2 pb-1.5 pt-3 text-center text-[17px] font-bold leading-tight text-ink">{offer.badge}</span>
      </div>
      {(offer.endsOn || offer.terms) && (
        <div className="relative z-20 mt-1.5 flex items-center justify-between text-[11px] text-white/90">
          <span>{offer.endsOn ? `Offer ends ${formatDate(offer.endsOn + "T12:00:00+05:30", { day: "numeric", month: "short" })}` : ""}</span>
          {offer.terms && (
            <button type="button" onClick={onTerms} className="min-h-8 px-1 underline underline-offset-2" aria-haspopup="dialog">
              T&amp;C apply
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export function OfferRail({ offers }: { offers: OfferView[] }) {
  const [terms, setTerms] = useState<OfferView | null>(null);
  if (!offers.length) return null;
  return (
    <section aria-labelledby="offers-title" className="pt-4">
      <h2 id="offers-title" className="sr-only">Special offers</h2>
      <ul className="no-scrollbar flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 scroll-px-4">
        {offers.map((v, i) => (
          <li key={v.offer.id} className="w-[58%] max-w-[250px] shrink-0 snap-start sm:w-[42%] md:w-[230px]">
            <OfferCard view={v} priority={i < 2} onTerms={() => setTerms(v)} />
          </li>
        ))}
      </ul>
      <Sheet open={!!terms} onClose={() => setTerms(null)} title="Offer terms">
        {terms && (
          <div className="space-y-2 text-sm">
            <p className="font-semibold">{terms.offer.headline} — {terms.offer.subhead}</p>
            <p className="text-ink-soft">{terms.offer.terms}</p>
            {terms.offer.endsOn && <p className="text-ink-soft">Valid until {formatDate(terms.offer.endsOn + "T12:00:00+05:30", { day: "numeric", month: "long", year: "numeric" })} (IST).</p>}
          </div>
        )}
      </Sheet>
    </section>
  );
}
