import Link from "next/link";
import { getFeaturedSellerProducts, getLiveOffers, getPublicProducts } from "@/lib/server/catalog";
import { OfferRail } from "@/components/OfferRail";
import { CATEGORIES, BUDGETS, VIBES, IS_FASHION } from "@/lib/constants";
import { LOOKS } from "@/data/catalog";
import { ProductGrid, ProductRail } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Section } from "@/components/Section";
import { LookCard } from "@/components/LookCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { IconChevron, IconSpark } from "@/components/Icons";
import { colorFamily } from "@/lib/search";
import { DiwaliHero } from "@/components/Festive";
import { activeFestival } from "@/lib/festival";

const COLOUR_ROW = [
  { name: "Black", css: "radial-gradient(circle at 30% 30%, #555, #111)" },
  { name: "White", css: "radial-gradient(circle at 30% 30%, #fff, #e6e3dc)" },
  { name: "Blue", css: "radial-gradient(circle at 30% 30%, #8aa7e0, #1e3a8a)" },
  { name: "Green", css: "radial-gradient(circle at 30% 30%, #b5d3a6, #3f6b35)" },
  { name: "Red", css: "radial-gradient(circle at 30% 30%, #f28b8b, #9b1c1c)" },
  { name: "Pink", css: "radial-gradient(circle at 30% 30%, #f9c4d8, #be185d)" },
  { name: "Yellow", css: "radial-gradient(circle at 30% 30%, #fff1a6, #d4a017)" },
  { name: "Brown", css: "radial-gradient(circle at 30% 30%, #d7b48c, #6b4423)" },
  { name: "Purple", css: "radial-gradient(circle at 30% 30%, #d9c6fb, #6b21a8)" },
  { name: "Gold", css: "radial-gradient(circle at 30% 30%, #f6e2a0, #a67c1a)" },
  { name: "Grey", css: "radial-gradient(circle at 30% 30%, #d4d4d8, #6b7280)" },
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, offers, sellerPicks] = await Promise.all([getPublicProducts(), getLiveOffers(), getFeaturedSellerProducts()]);
  const inStock = (p: (typeof products)[number]) => p.status === "active" && p.variants.some((v) => v.stock > 0);
  const trending = products.filter((p) => p.collections.includes("trending")).sort((a, b) => Number(inStock(b)) - Number(inStock(a))).slice(0, 8);
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const colourCounts: Record<string, number> = {};
  for (const p of products.filter(inStock)) for (const f of new Set(p.variants.filter((v) => v.stock > 0).map((v) => colorFamily(v.color)))) colourCounts[f] = (colourCounts[f] ?? 0) + 1;
  const beautyAcc = products.filter((p) => ["beauty", "jewellery", "accessories"].includes(p.category) && inStock(p)).slice(0, 10);
  // Home range: a row per category that has something in stock.
  const categoryRows = CATEGORIES.map((c) => ({ c, items: products.filter((p) => p.category === c.id && inStock(p)) })).filter((r) => r.items.length > 0);

  return (
    <div className="pb-4">
      {activeFestival()?.id === "diwali" && <DiwaliHero />}
      {/* 2. Category shortcuts */}
      <nav aria-label="Shop by category" className="pt-3">
        <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 md:justify-center">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link href={`/search?cat=${c.id}`} className="pressable flex w-[68px] flex-col items-center gap-1.5 text-center">
                <span className="relative h-[64px] w-[64px] overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                  <ProductImage src={c.image ?? `/art/${c.art}-${c.hex}-2.svg`} alt="" sizes="64px" priority fit="cover" />
                </span>
                <span className="text-[12px] font-medium leading-tight">{c.short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 3. Seasonal & special offers (admin-managed). Falls back to the single campaign banner. */}
      {offers.length > 0 ? (
        <div className="aurora-band relative">
          <OfferRail offers={offers} />
        </div>
      ) : (
      <div className="px-4 pt-4">
        <Link
          href={IS_FASHION ? "/search?collection=aura-edit" : "/drops"}
          className="pressable constellation-bg relative flex min-h-[148px] items-center overflow-hidden rounded-2xl bg-leaf p-4 text-white md:min-h-[180px] md:p-8"
        >
          <span aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full border border-sun/50" />
          <span aria-hidden className="absolute -right-2 top-4 h-40 w-40 rounded-full bg-sun/15" />
          <div className="relative z-10 max-w-[62%] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sun">{IS_FASHION ? "The Aura Edit" : "Just landed"}</p>
            <p className="text-xl font-semibold leading-tight md:text-3xl">{IS_FASHION ? "Soft-glow fits for every day" : "Clever little things for every room"}</p>
            <span className="inline-flex h-11 items-center gap-1 rounded-xl bg-sun px-4 text-sm font-semibold text-ink">
              {IS_FASHION ? "Shop the edit" : "See what’s new"} <IconChevron size={16} />
            </span>
          </div>
          <div className="absolute bottom-0 right-2 h-[140px] w-[112px] md:right-10 md:h-[170px] md:w-[136px]" aria-hidden>
            <ProductImage src={IS_FASHION ? "/art/dress-e6cfa4-1.svg" : "/art/organizer-d6b98c-1.svg"} alt="" sizes="140px" priority fit="cover" className="rounded-t-[60px]" />
          </div>
        </Link>
      </div>
      )}

      {/* Returning shoppers pick up where they left off (hidden for first visits). */}
      <RecentlyViewed />

      {/* 4. Trending */}
      <Section id="trending" title="Trending Now" kicker="Curated by the Krip team" href="/search?collection=trending">
        <ProductGrid products={trending} priorityCount={4} />
      </Section>

      {/* 5. Budget edits */}
      <Section id="budget" title="Budget edits" kicker="Your kind of price">
        <ul className="grid grid-cols-3 gap-2.5">
          {BUDGETS.map((b, i) => {
            const count = products.filter((p) => p.price <= b.max && inStock(p)).length;
            return (
              <li key={b.max}>
                <Link
                  href={`/search?max=${b.max}&sort=price-asc`}
                  className={`pressable flex h-full flex-col justify-between gap-3 rounded-2xl p-3 ring-1 ring-line ${i === 0 ? "bg-sun" : i === 1 ? "bg-white" : "bg-leaf-soft"}`}
                >
                  <span className="text-[11px] font-medium text-ink/80">Everything</span>
                  <span className="text-lg font-bold leading-none md:text-2xl">{b.label}</span>
                  <span className="text-[11px] font-medium text-ink/80">{count} {IS_FASHION ? "styles" : "items"}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>


      {sellerPicks.length > 0 && (
        <Section id="sellers" title="From our sellers" kicker="Featured by sellers on the Krip marketplace" href="/sell" hrefLabel="Sell on Krip">
          <ProductRail products={sellerPicks} />
        </Section>
      )}

      {/* 6. New Drops */}
      <Section id="drops" title="New Drops" kicker="Just landed" href="/drops" hrefLabel="All drops">
        <ProductRail products={newest} />
      </Section>

      {!IS_FASHION && (
        <>
          {categoryRows.map(({ c, items }) => (
            <Section key={c.id} id={`cat-${c.id}`} title={c.name} kicker={`${items.length} ${items.length === 1 ? "item" : "items"} in stock`} href={`/search?cat=${c.id}`}>
              <ProductRail products={items.slice(0, 10)} />
            </Section>
          ))}
          <Section id="swipe" title="Can’t decide?" kicker="Swipe to shortlist">
            <Link href="/swipe" className="constellation-bg flex min-h-16 items-center justify-between gap-3 overflow-hidden rounded-2xl bg-ink px-4 py-3 text-white">
              <span>
                <span className="block font-semibold">Swipe right on things you like</span>
                <span className="block text-xs text-white/75">They go straight to your wishlist</span>
              </span>
              <span className="swipe-cards relative h-14 w-16 shrink-0" aria-hidden>
                <span className="absolute inset-0 rotate-[-10deg] rounded-lg bg-sun" />
                <span className="absolute inset-0 rotate-[6deg] rounded-lg bg-leaf ring-2 ring-white/70" />
              </span>
            </Link>
          </Section>
        </>
      )}

      {IS_FASHION && (
        <>
      {/* Shop by colour */}
      <Section id="colour" title="Shop by colour" kicker="Pick a shade">
        <ul className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:justify-center">
          {COLOUR_ROW.filter((c) => colourCounts[c.name]).map((c) => (
            <li key={c.name} className="shrink-0">
              <Link href={`/search?color=${c.name}`} className="pressable flex w-16 flex-col items-center gap-1.5 text-center">
                <span className="swatch-orb h-14 w-14 rounded-full ring-1 ring-black/10" style={{ background: c.css }} />
                <span className="text-[12px] font-medium">{c.name}</span>
                <span className="text-[10px] text-ink-soft">{colourCounts[c.name]} styles</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* 7. Shop your vibe */}
      <Section id="vibes" title="Shop Your Vibe" kicker="Pick a mood">
        <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:grid md:grid-cols-5 md:overflow-visible">
          {VIBES.map((v, i) => (
            <li key={v.id} className="w-[38%] shrink-0 sm:w-[28%] md:w-auto">
              <Link
                href={`/search?vibe=${v.id}`}
                className={`pressable relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl p-3 ${i % 2 ? "bg-leaf text-white" : "bg-ink text-white"}`}
              >
                <span aria-hidden className="absolute -right-6 -top-6 h-28 w-28 rounded-full border border-sun/60" />
                <span aria-hidden className="absolute right-3 top-3 h-2 w-2 rounded-full bg-sun" />
                <span className="text-base font-semibold">{v.name}</span>
                <span className="text-[11px] text-white/80">{v.line}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/swipe" className="constellation-bg mt-3 flex min-h-16 items-center justify-between gap-3 overflow-hidden rounded-2xl bg-ink px-4 py-3 text-white">
          <span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-sun">New · Style Swipe</span>
            <span className="block font-semibold">Swipe right on styles you love</span>
            <span className="block text-xs text-white/75">Saves straight to your wishlist</span>
          </span>
          <span className="swipe-cards relative h-14 w-16 shrink-0" aria-hidden>
            <span className="absolute inset-0 rotate-[-10deg] rounded-lg bg-sun" />
            <span className="absolute inset-0 rotate-[6deg] rounded-lg bg-leaf ring-2 ring-white/70" />
          </span>
        </Link>
        <Link href="/vibe" className="mt-2 flex min-h-12 items-center justify-between rounded-xl bg-white px-4 text-sm ring-1 ring-line">
          <span className="flex items-center gap-2">
            <IconSpark size={18} className="text-gold-ink" />
            <span><b>Not sure?</b> Try the Vibe Finder — 4 quick questions</span>
          </span>
          <IconChevron size={16} />
        </Link>
      </Section>

      {/* 8. Complete the look */}
      <Section id="looks" title="Complete the Look" kicker="Modern Legends" href="/looks" hrefLabel="All looks">
        <ul className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 md:grid md:grid-cols-4 md:overflow-visible">
          {LOOKS.slice(0, 4).map((l) => (
            <li key={l.id} className="w-[64%] shrink-0 sm:w-[40%] md:w-auto">
              <LookCard look={l} products={products} />
            </li>
          ))}
        </ul>
      </Section>

      {/* 9. Beauty & accessories */}
      <Section id="beauty" title="Beauty & accessories" kicker="Finishing touches" href="/search?cat=beauty,jewellery,accessories">
        <ProductRail products={beautyAcc} />
      </Section>

        </>
      )}
    </div>
  );
}
