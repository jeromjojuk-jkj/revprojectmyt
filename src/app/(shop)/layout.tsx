import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/HelpLinks";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto w-full max-w-7xl">
        {children}
      </main>
      <Footer />
      <div className="pb-nav md:hidden" aria-hidden />
      <BottomNav />
    </>
  );
}
