import Link from "next/link";
import { Logo } from "@/components/Logo";
import { requireVendor } from "@/lib/server/vendors";
import { planOf } from "@/lib/vendorPlans";
import { vendorLogoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function VendorPanelLayout({ children }: { children: React.ReactNode }) {
  const v = await requireVendor();
  const live = v.status === "approved";
  const links: [string, string][] = [["/vendor", "Dashboard"], ...(live ? ([["/vendor/products", "Products"], ["/vendor/orders", "Orders"], ["/vendor/shipping", "Shipping"], ["/vendor/earnings", "Earnings"]] as [string, string][]) : [])];
  return (
    <div className="min-h-dvh bg-paper">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/vendor" className="flex items-center gap-2"><Logo onDark className="text-[24px]" /><span className="rounded bg-sun px-1.5 py-0.5 text-[11px] font-bold text-ink">SELLER</span></Link>
          <nav className="order-last flex w-full gap-1 overflow-x-auto md:order-none md:w-auto">
            {links.map(([href, label]) => <Link key={href} href={href} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10">{label}</Link>)}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden text-white/80 sm:inline">{v.businessName} · {planOf(v.plan).name}</span>
            <form action={vendorLogoutAction}><button className="rounded-lg px-3 py-2 font-medium ring-1 ring-white/30 hover:bg-white/10">Sign out</button></form>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
