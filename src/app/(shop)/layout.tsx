import Link from "next/link";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/HelpLinks";
import { BackBar } from "@/components/BackBar";
import { ScrollAssist } from "@/components/ScrollAssist";
import { Logo } from "@/components/Logo";
import { getLiveOffers, getSettings, getStore } from "@/lib/server/catalog";
import { DeliveryRulesProvider } from "@/components/DeliveryRules";
import { paymentConfig } from "@/lib/server/payments";
import { InstallApp } from "@/components/InstallApp";
import { FestiveStrip } from "@/components/Festive";
import { activeFestival } from "@/lib/festival";
import type { Viewport } from "next";
import { isAdmin } from "@/lib/server/auth";

// Reads live offers and store settings, so render per request.
export const dynamic = "force-dynamic";

// Festive status-bar colour on phones and in the installed app while a festival theme is on.
export function generateViewport(): Viewport {
  const f = activeFestival();
  return f ? { themeColor: f.themeColor } : {};
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [offers, store, settings] = await Promise.all([getLiveOffers(), getStore(), getSettings()]);
  const staff = store.maintenance.active ? await isAdmin() : false;

  if (store.maintenance.active && !staff) {
    return (
      <main id="main" className="grid min-h-dvh place-items-center bg-paper px-6 text-center">
        <div className="max-w-md">
          <Logo className="text-[40px]" />
          <h1 className="mt-6 text-2xl font-bold">We’ll be right back</h1>
          <p className="mt-2 text-ink-soft">{store.maintenance.message}</p>
          {store.supportEmail && <p className="mt-4 text-sm">Need help with an order? <a className="text-leaf underline" href={`mailto:${store.supportEmail}`}>{store.supportEmail}</a></p>}
        </div>
      </main>
    );
  }

  const promo = offers.length ? { label: offers[0].offer.badge, href: "/#offers" } : null;
  const festival = activeFestival();
  const ann = store.announcement;
  return (
    <DeliveryRulesProvider rules={settings.delivery}>
      <div className="contents" data-festive={festival?.id}>
      {festival && <FestiveStrip />}
      {staff && (
        <p className="bg-danger px-4 py-1.5 text-center text-xs font-semibold text-white">
          Maintenance mode is on — shoppers see a maintenance page. <Link href="/admin/settings/store" className="underline">Turn it off</Link>
        </p>
      )}
      {ann.active && ann.text && (
        <div className="bg-ink px-4 py-2 text-center text-[13px] font-medium text-white">
          {ann.href ? (
            ann.href.startsWith("/") ? <Link href={ann.href} className="underline-offset-2 hover:underline">{ann.text} →</Link> : <a href={ann.href} rel="noopener noreferrer" className="underline-offset-2 hover:underline">{ann.text} →</a>
          ) : ann.text}
        </div>
      )}
      <Header promo={promo} />
      <BackBar />
      <main id="main" className="mx-auto w-full max-w-7xl">
        {children}
      </main>
      <Footer store={store} paymentsDemo={paymentConfig().demo} />
      <div className="pb-nav bg-[#141414] md:hidden" aria-hidden />
      <BottomNav />
      <ScrollAssist />
      <InstallApp />
      </div>
    </DeliveryRulesProvider>
  );
}
