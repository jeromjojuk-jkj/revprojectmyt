import Link from "next/link";
import { getPublicProducts } from "@/lib/server/catalog";
import { CATEGORIES, COLLECTIONS, VIBES } from "@/lib/constants";
import { ProductImage } from "@/components/ProductImage";
import { IconChevron } from "@/components/Icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const products = await getPublicProducts();
  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-semibold">Categories</h1>
      <ul className="mt-3 space-y-2.5">
        {CATEGORIES.map((c) => {
          const items = products.filter((p) => p.category === c.id);
          const subs = [...new Set(items.map((p) => p.subcategory))].sort();
          return (
            <li key={c.id} className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              <Link href={`/search?cat=${c.id}`} className="flex items-center gap-3 p-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-paper">
                  <ProductImage src={`/art/${c.art}-${c.hex}-2.svg`} alt="" sizes="64px" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{c.name}</span>
                  <span className="text-xs text-ink-soft">{items.length} styles</span>
                </span>
                <IconChevron size={18} />
              </Link>
              {subs.length > 1 && (
                <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-3">
                  {subs.map((s) => (
                    <Link key={s} href={`/search?cat=${c.id}&type=${encodeURIComponent(s)}`} className="flex min-h-10 shrink-0 items-center rounded-full bg-paper px-3 text-xs font-medium ring-1 ring-line">
                      {s}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <h2 className="mt-7 text-lg font-semibold">Collections</h2>
      <ul className="mt-2 grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {Object.entries(COLLECTIONS).map(([id, c]) => (
          <li key={id}>
            <Link href={`/search?collection=${id}`} className="constellation-bg flex h-full flex-col rounded-2xl bg-leaf p-4 text-white">
              <span className="font-semibold">{c.name}</span>
              <span className="text-xs text-white/80">{c.line}</span>
            </Link>
          </li>
        ))}
      </ul>
      <h2 className="mt-7 text-lg font-semibold">Vibes</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {VIBES.map((v) => (
          <Link key={v.id} href={`/search?vibe=${v.id}`} className="flex min-h-11 items-center rounded-full bg-white px-4 text-sm font-medium ring-1 ring-line">{v.name}</Link>
        ))}
      </div>
    </div>
  );
}
