"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { IconChevron } from "./Icons";
import { POLICY_LINKS } from "@/lib/constants";


const COLUMNS: { title: string; links: { href?: string; label: string; note?: string }[] }[] = [
  {
    title: "Get to Know Us",
    links: [
      { href: "/help/about", label: "About Krip" },
      { href: "/help/contact", label: "Contact" },
    ],
  },
  {
    // Social accounts aren't live yet, so these are labels until real links exist.
    title: "Connect with Us",
    links: [
      { label: "Instagram", note: "soon" },
      { label: "Facebook", note: "soon" },
    ],
  },
  {
    title: "Let Us Help You",
    links: [
      { href: "/account", label: "Your Account" },
      { href: "/orders", label: "Your Orders" },
      { href: "/wishlist", label: "Your Wishlist" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/search", label: "Shop All" },
      { href: "/drops", label: "New Drops" },
      { href: "/swipe", label: "Style Swipe" },
      { href: "/categories", label: "Categories" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/help/privacy", label: "Privacy Policy" },
      { href: "/help/terms", label: "Terms & Conditions" },
      { href: "/help/refunds", label: "Refund Policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-10">
      {/* Personal picks prompt (sign-in isn't connected, so picks come from this device) */}
      <section aria-labelledby="picks-title" className="border-t border-line bg-white px-4 py-8 text-center">
        <h2 id="picks-title" className="text-xl font-bold md:text-2xl">See picks for your vibe</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">Swipe through styles to train your wishlist, or answer four quick questions.</p>
        <div className="mx-auto mt-4 flex max-w-sm flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/swipe" className="flex h-11 flex-1 items-center justify-center rounded-full bg-sun px-6 text-sm font-semibold text-ink">
            Start Style Swipe
          </Link>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          New here? <Link href="/vibe" className="font-medium text-leaf underline">Take the Vibe Finder.</Link>
        </p>
      </section>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
        className="block h-12 w-full bg-[#2b2b2b] text-sm font-medium text-white hover:bg-[#333]"
      >
        Back to top
      </button>

      <div className="bg-[#1c1c1c] text-white">
        <nav aria-label="Footer" className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-6 py-10 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-2 text-[15px] font-bold">{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.href ? (
                      <Link href={l.href} className="flex min-h-10 items-center text-sm text-white/80 hover:text-white hover:underline">
                        {l.label}
                      </Link>
                    ) : (
                      <span className="flex min-h-10 items-center gap-2 text-sm text-white/60">
                        {l.label}
                        {l.note && <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">{l.note}</span>}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4 px-6 py-6">
            <Logo onDark className="text-[24px]" />
            <span className="flex h-10 items-center gap-2 rounded border border-white/30 px-3 text-sm" title="More languages coming soon">
              <span aria-hidden>🌐</span> English
            </span>
            <span className="flex h-10 items-center gap-2 rounded border border-white/30 px-3 text-sm">
              <span aria-hidden>🇮🇳</span> India
            </span>
          </div>
        </div>
        <div className="bg-[#141414] px-6 pb-6 pt-4 text-center text-xs text-white/60">
          <ul className="flex flex-wrap justify-center gap-x-4">
            {POLICY_LINKS.slice(4).map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="inline-flex min-h-10 items-center hover:underline">{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/help" className="inline-flex min-h-10 items-center gap-0.5 hover:underline">Help & contact <IconChevron size={12} /></Link>
            </li>
          </ul>
          <p>© 2026 Krip · Trending looks. Your kind of price. · Prototype: sample products, demo payments.</p>
        </div>
      </div>
    </footer>
  );
}
