"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { PincodeSheet } from "./PincodeSheet";
import { IconBag, IconChevron, IconMenu, IconPin } from "./Icons";
import { Sheet } from "./Sheet";
import { CATEGORIES, VIBES } from "@/lib/constants";
import { cartCount, useHydrated, useStore } from "@/lib/store";

const STRIP = [
  { href: "/search?cat=women", label: "Women" },
  { href: "/search?cat=men", label: "Men" },
  { href: "/search?cat=footwear", label: "Footwear" },
  { href: "/search?cat=beauty", label: "Beauty" },
  { href: "/search?cat=bags", label: "Bags" },
  { href: "/search?cat=jewellery", label: "Jewellery" },
  { href: "/search?cat=accessories", label: "Accessories" },
  { href: "/drops", label: "New Drops" },
  { href: "/search?max=499&sort=price-asc", label: "Under ₹499" },
  { href: "/looks", label: "Complete the Look" },
  { href: "/vibe", label: "Vibe Finder" },
];

// Thin outline on hover/focus, like a marketplace top bar.
const hit = "rounded-md ring-1 ring-transparent hover:ring-white/80 focus-visible:ring-white";

export function CartButton() {
  const hydrated = useHydrated();
  const count = useStore((s) => cartCount(s.cart));
  const [bump, setBump] = useState(0);
  const prev = useRef(count);
  useEffect(() => {
    if (hydrated && count > prev.current) setBump((b) => b + 1);
    prev.current = count;
  }, [count, hydrated]);
  const n = hydrated ? count : 0;
  return (
    <Link href="/cart" className={`flex h-11 items-end gap-0.5 px-1.5 pb-1 ${hit}`} aria-label={n ? `Bag, ${n} item${n === 1 ? "" : "s"}` : "Bag, empty"}>
      <span className="relative">
        <IconBag size={28} />
        <span key={bump} aria-hidden className={`absolute left-1/2 top-[9px] -translate-x-1/2 text-[13px] font-bold leading-none text-sun ${bump ? "badge-bump" : ""}`}>
          {n > 99 ? "99+" : n}
        </span>
      </span>
      <span className="hidden text-sm font-bold sm:inline">Bag</span>
    </Link>
  );
}

function AllMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const groups: { title: string; links: { href: string; label: string }[] }[] = [
    { title: "Trending", links: [{ href: "/search?collection=trending", label: "Trending Now" }, { href: "/drops", label: "New Drops" }, { href: "/#offers", label: "Seasonal offers" }, { href: "/looks", label: "Complete the Look" }, { href: "/vibe", label: "Vibe Finder" }] },
    { title: "Shop by category", links: CATEGORIES.map((c) => ({ href: `/search?cat=${c.id}`, label: c.name })) },
    { title: "Shop by vibe", links: VIBES.map((v) => ({ href: `/search?vibe=${v.id}`, label: v.name })) },
    { title: "Help & settings", links: [{ href: "/account", label: "Your account" }, { href: "/orders", label: "Your orders" }, { href: "/wishlist", label: "Wishlist & lists" }, { href: "/help", label: "Help & contact" }, { href: "/help/returns", label: "Returns & exchanges" }] },
  ];
  return (
    <Sheet open={open} onClose={onClose} title="Hello, guest" side>
      <nav aria-label="All departments" className="-mx-2 space-y-5">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="px-2 pb-1 text-sm font-bold">{g.title}</p>
            <ul>
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={onClose} className="flex min-h-11 items-center justify-between rounded-lg px-2 text-[15px] hover:bg-paper">
                    {l.label} <IconChevron size={16} className="text-ink-soft" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </Sheet>
  );
}

export function Header({ promo }: { promo?: { label: string; href: string } | null }) {
  const pathname = usePathname();
  const [pinOpen, setPinOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hydrated = useHydrated();
  const pincode = useStore((s) => s.pincode);
  const ref = useRef<HTMLElement>(null);

  // Expose the live header height so sticky toolbars and panels sit right below it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pin = hydrated && pincode ? pincode : null;
  const deliver = (
    <button type="button" onClick={() => setPinOpen(true)} aria-haspopup="dialog" className={`flex h-11 min-w-0 items-center gap-1 px-1.5 text-left ${hit}`}>
      <IconPin size={18} className="mt-2 shrink-0" />
      <span className="min-w-0 leading-tight">
        <span className="block text-xs text-white/75">{pin ? `Delivering to ${pin}` : "Deliver to"}</span>
        <span className="block truncate text-sm font-bold">{pin ? "Update location" : "Add pincode"}</span>
      </span>
    </button>
  );

  return (
    <header ref={ref} className="sticky top-0 z-30 text-white" style={{ paddingTop: "env(safe-area-inset-top, 0px)", background: "#171717" }}>
      {/* Main bar */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 gap-y-2 px-2 py-1.5 md:flex-nowrap md:gap-2 md:px-4">
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="All departments" aria-haspopup="dialog" className={`grid h-11 w-10 place-items-center md:hidden ${hit}`}>
          <IconMenu size={24} />
        </button>
        <Link href="/" className={`flex h-11 items-center px-1.5 ${hit}`} aria-label="krip home">
          <Logo onDark className="text-[26px]" />
        </Link>
        <div className="hidden md:block">{deliver}</div>
        <div className="order-last w-full px-1 md:order-none md:flex-1 md:px-0">
          <Suspense fallback={<div className="h-11 rounded-lg bg-white" />}>
            <SearchBox />
          </Suspense>
        </div>
        <Link href="/account" className={`ml-auto flex h-11 flex-col justify-center px-1.5 leading-tight md:ml-0 ${hit}`}>
          <span className="text-xs text-white/75">Hello, guest</span>
          <span className="flex items-center gap-0.5 text-sm font-bold">
            <span className="hidden sm:inline">Account &amp; Lists</span>
            <span className="sm:hidden">Account</span>
            <IconChevron dir="down" size={12} />
          </span>
        </Link>
        <Link href="/orders" className={`hidden h-11 flex-col justify-center px-1.5 leading-tight md:flex ${hit}`}>
          <span className="text-xs text-white/75">Returns</span>
          <span className="text-sm font-bold">&amp; Orders</span>
        </Link>
        <CartButton />
      </div>

      {/* Department strip */}
      <nav aria-label="Departments" className="bg-leaf">
        <div className="mx-auto flex h-10 max-w-7xl items-center gap-1 px-2 md:px-4">
          <button type="button" onClick={() => setMenuOpen(true)} aria-haspopup="dialog" className={`hidden h-8 shrink-0 items-center gap-1 px-2 text-sm font-bold md:flex ${hit}`}>
            <IconMenu size={20} /> All
          </button>
          <ul className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            <li className="shrink-0 md:hidden">
              <button type="button" onClick={() => setPinOpen(true)} className={`flex h-8 items-center gap-1 px-2 text-[13px] ${hit}`} aria-haspopup="dialog">
                <IconPin size={15} /> {pin ? `Delivering to ${pin}` : "Add pincode"}
              </button>
            </li>
            {promo && (
              <li className="shrink-0 md:hidden">
                <Link href={promo.href} className={`flex h-8 items-center px-2 text-[13px] font-bold text-sun ${hit}`}>{promo.label}</Link>
              </li>
            )}
            {STRIP.map((l) => (
              <li key={l.href} className="shrink-0">
                <Link href={l.href} aria-current={pathname === l.href ? "page" : undefined} className={`flex h-8 items-center whitespace-nowrap px-2 text-[13px] md:text-sm ${hit}`}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {promo && (
            <Link href={promo.href} className={`hidden h-8 shrink-0 items-center gap-1.5 px-2 text-[15px] font-bold md:flex ${hit}`}>
              <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-sun shadow-[0_0_0_3px_rgba(255,215,3,0.3)]" />
              {promo.label} <span className="font-normal text-white/80">|</span> <span className="text-sun">Live now</span>
              <IconChevron size={16} />
            </Link>
          )}
        </div>
      </nav>
      <PincodeSheet open={pinOpen} onClose={() => setPinOpen(false)} />
      <AllMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
