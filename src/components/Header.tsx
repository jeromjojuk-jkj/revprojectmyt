"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { PincodeSheet } from "./PincodeSheet";
import { IconBag, IconChevron, IconHeart, IconPin, IconUser } from "./Icons";
import { cartCount, useHydrated, useStore } from "@/lib/store";

const NAV = [
  { href: "/categories", label: "Categories" },
  { href: "/drops", label: "New Drops" },
  { href: "/vibe", label: "Vibe Finder" },
];

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
    <Link
      href="/cart"
      className="relative grid h-11 w-11 place-items-center rounded-full hover:bg-black/5"
      aria-label={n ? `Bag, ${n} item${n === 1 ? "" : "s"}` : "Bag, empty"}
    >
      <IconBag size={24} />
      {n > 0 && (
        <span
          key={bump}
          className={`absolute right-0.5 top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-leaf px-1 text-[11px] font-bold text-white ring-2 ring-sun ${bump ? "badge-bump" : ""}`}
          aria-hidden
        >
          {n > 9 ? "9+" : n}
        </span>
      )}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [pinOpen, setPinOpen] = useState(false);
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

  return (
    <header ref={ref} className="sticky top-0 z-30 bg-sun" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 pb-2.5 pt-2 md:flex-row md:items-center md:gap-4 md:py-3">
        <div className="flex items-center gap-2 md:contents">
          <Link href="/" className="-ml-1 flex h-11 items-center px-1" aria-label="Krip home">
            <Logo className="text-[30px]" />
          </Link>
          <button
            type="button"
            onClick={() => setPinOpen(true)}
            className="ml-1 flex h-11 min-w-0 flex-1 items-center gap-1 rounded-xl px-2 text-left hover:bg-black/5 md:order-3 md:flex-none"
            aria-haspopup="dialog"
          >
            <IconPin size={18} className="shrink-0" />
            <span className="min-w-0 leading-tight">
              <span className="block text-[11px] text-ink/80">Deliver to</span>
              <span className="flex items-center gap-0.5 truncate text-sm font-semibold">
                {hydrated && pincode ? pincode : "Add pincode"}
                <IconChevron dir="down" size={14} />
              </span>
            </span>
          </button>
          <nav aria-label="Main" className="hidden items-center gap-1 md:order-4 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={pathname.startsWith(n.href) ? "page" : undefined}
                className="flex h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-black/5 aria-[current=page]:bg-black/10"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/wishlist" className="grid h-11 w-11 place-items-center rounded-full hover:bg-black/5" aria-label="Wishlist">
              <IconHeart size={22} />
            </Link>
            <Link href="/account" className="grid h-11 w-11 place-items-center rounded-full hover:bg-black/5" aria-label="Account">
              <IconUser size={22} />
            </Link>
          </nav>
          <div className="md:order-5">
            <CartButton />
          </div>
        </div>
        <div className="md:order-2 md:flex-1">
          <Suspense fallback={<div className="h-11 rounded-xl bg-white ring-1 ring-line" />}>
            <SearchBox />
          </Suspense>
        </div>
      </div>
      <PincodeSheet open={pinOpen} onClose={() => setPinOpen(false)} />
    </header>
  );
}
