import Link from "next/link";
import { getLiveOffers, getPublicProducts } from "@/lib/server/catalog";
import { OfferRail } from "@/components/OfferRail";
import { CATEGORIES, BUDGETS, VIBES } from "@/lib/constants";
import { LOOKS } from "@/data/catalog";
import { ProductGrid, ProductRail } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductImage";
import { Section } from "@/components/Section";
import { LookCard } from "@/components/LookCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { POLICY_LINKS } from "@/components/HelpLinks";
import { IconChevron, IconSpark } from "@/components/Icons";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [products, offers] = await Promise.all([getPublicProducts(), getLiveOffers()]);
  const inStock = (p: (typeof products)[number]) => p.status === "active" && p.variants.some((v) => v.stock > 0);
  const trending = products.filter((p) => p.collections.includes("trending")).sort((a, b) => Number(inStock(b)) - Number(inStock(a))).slice(0, 8);
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const beautyAcc = products.filter((p) => ["beauty", "jewellery", "accessories"].includes(p.category) && inStock(p)).slice(0, 10);

  return (
    <div className="pb-4">
      {/* 2. Category shortcuts */}
      <nav aria-label="Shop by category" className="pt-3">
        <ul className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1 md:justify-center">
          {CATEGORIES.map((c) => (
            <li key={c.id} className="shrink-0">
              <Link href={`/search?cat=${c.id}`} className="pressable flex w-[68px] flex-col items-center gap-1.5 text-center">
                <span className="relative h-[64px] w-[64px] overflow-hidden rounded-2xl bg-white ring-1 ring-line">
                  <ProductImage src={`/art/${c.art}-${c.hex}-2.svg`} alt="" sizes="64px" priority />
                </span>
                <span className="text-[12px] font-medium leading-tight">{c.short}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 3. Seasonal & special offers (admin-managed). Falls back to the single campaign banner. */}
      {offers.length > 0 ? (
        <OfferRail offers={offers} />
      ) : (
      <div className="px-4 pt-4">
        <Link
          href="/search?collection=aura-edit"
          className="pressable constellation-bg relative flex min-h-[148px] items-center overflow-hidden rounded-2xl bg-leaf p-4 text-white md:min-h-[180px] md:p-8"
        >
          <span aria-hidden className="absolute -right-10 -top-10 h-56 w-56 rounded-full border border-sun/50" />
          <span aria-hidden className="absolute -right-2 top-4 h-40 w-40 rounded-full bg-sun/15" />
          <div className="relative z-10 max-w-[62%] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sun">The Aura Edit</p>
            <p className="text-xl font-semibold leading-tight md:text-3xl">Soft-glow fits for every day</p>
            <span className="inline-flex h-11 items-center gap-1 rounded-xl bg-sun px-4 text-sm font-semibold text-ink">
              Shop the edit <IconChevron size={16} />
            </span>
          </div>
          <div className="absolute bottom-0 right-2 h-[140px] w-[112px] md:right-10 md:h-[170px] md:w-[136px]" aria-hidden>
            <ProductImage src="/art/dress-e6cfa4-1.svg" alt="" sizes="140px" priority className="rounded-t-[60px]" />
          </div>
        </Link>
      </div>
      )}

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
                  <span className="text-[11px] font-medium text-ink/80">{count} styles</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Section>

      <RecentlyViewed />

      {/* 6. New Drops */}
      <Section id="drops" title="New Drops" kicker="Just landed" href="/drops" hrefLabel="All drops">
        <ProductRail products={newest} />
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
        <Link href="/vibe" className="mt-3 flex min-h-12 items-center justify-between rounded-xl bg-white px-4 text-sm ring-1 ring-line">
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

      {/* 10. Help */}
      <Section id="help" title="Need a hand?">
        <ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {POLICY_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-12 items-center justify-between rounded-xl bg-white px-3 text-sm ring-1 ring-line">
                {l.label} <IconChevron size={14} />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
