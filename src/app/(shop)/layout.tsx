import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/HelpLinks";
import { getLiveOffers } from "@/lib/server/catalog";

// Reads live offers for the header promo, so render per request.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const offers = await getLiveOffers();
  const promo = offers.length ? { label: offers[0].offer.badge, href: "/#offers" } : null;
  return (
    <>
      <Header promo={promo} />
      <main id="main" className="mx-auto w-full max-w-7xl">
        {children}
      </main>
      <Footer />
      <div className="pb-nav bg-[#141414] md:hidden" aria-hidden />
      <BottomNav />
    </>
  );
}
