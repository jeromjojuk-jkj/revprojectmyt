"use client";

import Link from "next/link";
import { useHydrated, useStore } from "@/lib/store";
import { PincodeForm } from "@/components/PincodeSheet";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { IS_FASHION, POLICY_LINKS } from "@/lib/constants";
import { IconBag, IconChevron, IconHeart, IconSpark, IconUser } from "@/components/Icons";

export default function AccountPage() {
  const hydrated = useHydrated();
  const orders = useStore((s) => s.orders.length);
  const saved = useStore((s) => new Set(s.wishlists.flatMap((w) => w.productIds)).size);
  const clearSearches = useStore((s) => s.clearSearches);

  const links = [
    { href: "/orders", label: "Your orders", sub: hydrated ? `${orders} on this device` : "", Icon: IconBag },
    { href: "/wishlist", label: "Wishlist & lists", sub: hydrated ? `${saved} saved` : "", Icon: IconHeart },
    IS_FASHION
      ? { href: "/vibe", label: "Vibe Finder", sub: "Find styles by vibe and budget", Icon: IconSpark }
      : { href: "/swipe", label: "Swipe & Shortlist", sub: "Swipe right to shortlist things you like", Icon: IconSpark },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4">
      <div className="constellation-bg flex items-center gap-3 rounded-2xl bg-leaf p-4 text-white">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-sun text-ink"><IconUser /></span>
        <div>
          <h1 className="text-lg font-semibold">Hey there 👋</h1>
          <p className="text-sm text-white/85">You’re shopping as a guest. Your bag, wishlist and orders are saved on this device.</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {links.map(({ href, label, sub, Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">
              <Icon size={20} />
              <span className="flex-1"><span className="block font-medium">{label}</span><span className="text-xs text-ink-soft">{sub}</span></span>
              <IconChevron size={16} />
            </Link>
          </li>
        ))}
      </ul>

      {IS_FASHION && <section aria-labelledby="lab-h" className="lab-hero relative mt-4 overflow-hidden rounded-2xl p-4 text-white">
        <span className="aurora-blob a1" aria-hidden />
        <span className="aurora-blob a3" aria-hidden />
        <h2 id="lab-h" className="relative text-sm font-semibold text-sun">Your Krip Lab</h2>
        <ul className="relative mt-2 grid grid-cols-3 gap-2">
          {[["/fit", "🎲", "Build a Fit"], ["/colour-match", "🎨", "Colour Match"], ["/swipe", "💘", "Style Swipe"]].map(([href, e, t]) => (
            <li key={href}>
              <Link href={href} className="glass-tile flex flex-col items-center gap-1 rounded-xl p-2.5 text-center text-xs font-semibold">
                <span className="text-xl" aria-hidden>{e}</span>{t}
              </Link>
            </li>
          ))}
        </ul>
      </section>}

      <section className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line">
        <PincodeForm compact />
      </section>

      <section className="mt-4 rounded-2xl bg-white p-2 ring-1 ring-line" aria-labelledby="help-h">
        <h2 id="help-h" className="px-2 pt-2 font-semibold">Help & policies</h2>
        <ul>
          {POLICY_LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-12 items-center justify-between rounded-xl px-2 text-sm hover:bg-paper">
                {l.label} <IconChevron size={14} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <button type="button" onClick={clearSearches} className="mt-3 min-h-11 text-sm font-medium text-ink-soft underline">Clear search history</button>
      <RecentlyViewed />
    </div>
  );
}
