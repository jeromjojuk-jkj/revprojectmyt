import { getPublicProducts } from "@/lib/server/catalog";
import { LOOKS } from "@/data/catalog";
import { LookCard } from "@/components/LookCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Complete the Look" };

export default async function LooksPage() {
  const products = await getPublicProducts();
  return (
    <div className="px-4 pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">Modern Legends</p>
      <h1 className="text-xl font-semibold">Complete the Look</h1>
      <p className="text-sm text-ink-soft">Outfits styled by the Krip team. Pick the pieces you want — each is priced individually.</p>
      <ul className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {LOOKS.map((l) => (
          <li key={l.id}><LookCard look={l} products={products} /></li>
        ))}
      </ul>
    </div>
  );
}
