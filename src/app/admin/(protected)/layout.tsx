import Link from "next/link";
import { requireAdmin } from "@/lib/server/auth";
import { logoutAction } from "../actions";
import { Logo } from "@/components/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/offers", label: "Offers" },
  { href: "/admin/import", label: "CSV import" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Fees & settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-20 border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2">
          <Link href="/admin" className="flex items-center gap-2"><Logo className="text-[24px]" /><span className="rounded bg-ink px-1.5 py-0.5 text-[11px] font-bold text-white">ADMIN</span></Link>
          <nav aria-label="Admin" className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium hover:bg-paper">{n.label}</Link>
            ))}
          </nav>
          <Link href="/" className="hidden h-11 items-center text-sm text-leaf underline sm:flex">View store</Link>
          <form action={logoutAction}><button className="h-11 rounded-lg px-3 text-sm font-medium ring-1 ring-line">Sign out</button></form>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
