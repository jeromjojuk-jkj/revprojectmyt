"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconGrid, IconHeart, IconHome, IconSpark, IconUser } from "./Icons";
import { useHydrated, useStore } from "@/lib/store";

const ITEMS = [
  { href: "/", label: "Home", Icon: IconHome, match: (p: string) => p === "/" },
  { href: "/categories", label: "Categories", Icon: IconGrid, match: (p: string) => p.startsWith("/categories") || p.startsWith("/search") },
  { href: "/drops", label: "Drops", Icon: IconSpark, match: (p: string) => p.startsWith("/drops") },
  { href: "/wishlist", label: "Wishlist", Icon: IconHeart, match: (p: string) => p.startsWith("/wishlist") },
  { href: "/account", label: "Account", Icon: IconUser, match: (p: string) => ["/account", "/orders", "/order/"].some((x) => p.startsWith(x)) },
];

/** Hidden where a page has its own sticky action bar (product, checkout, payment). */
export const HIDE_BOTTOM_NAV = ["/product/", "/checkout", "/pay/"];

export function BottomNav() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const wishCount = useStore((s) => new Set(s.wishlists.flatMap((w) => w.productIds)).size);
  if (HIDE_BOTTOM_NAV.some((p) => pathname.startsWith(p))) return null;
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <ul className="mx-auto grid h-[var(--bottom-nav-h)] max-w-lg grid-cols-5">
        {ITEMS.map(({ href, label, Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${active ? "text-leaf" : "text-ink-soft"}`}
              >
                {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-sun" aria-hidden />}
                <span className="relative">
                  <Icon size={22} />
                  {href === "/wishlist" && hydrated && wishCount > 0 && (
                    <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-sun px-1 text-[10px] font-bold text-ink" aria-label={`${wishCount} saved`}>
                      {wishCount}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
