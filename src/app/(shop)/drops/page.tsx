import { getPublicProducts } from "@/lib/server/catalog";
import { ProductGrid } from "@/components/ProductCard";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Drops" };

export default async function DropsPage() {
  const products = (await getPublicProducts()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 24);
  // Group into weekly drops by the date products were added to the catalogue.
  const groups = new Map<string, typeof products>();
  for (const p of products) {
    const d = new Date(p.createdAt);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = monday.toISOString().slice(0, 10);
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return (
    <div className="px-4 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">The drop log</p>
      <h1 className="text-xl font-semibold">New Drops</h1>
      <p className="text-sm text-ink-soft">Everything recently added to Krip, newest first.</p>
      {[...groups].map(([week, items]) => (
        <section key={week} aria-labelledby={`w-${week}`} className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-sun ring-4 ring-sun-soft" aria-hidden />
            <h2 id={`w-${week}`} className="font-semibold">Week of {formatDate(week, { day: "numeric", month: "long" })}</h2>
            <span className="text-xs text-ink-soft">{items.length} new</span>
          </div>
          <ProductGrid products={items} />
        </section>
      ))}
    </div>
  );
}
