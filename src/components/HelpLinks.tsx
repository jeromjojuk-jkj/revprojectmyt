"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import type { StoreProfile } from "@/lib/types";
import { whatsappLink } from "@/lib/storeProfile";

type FooterLink = { href?: string; label: string; note?: string; external?: boolean };

function columns(store: StoreProfile): { title: string; links: FooterLink[] }[] {
  const social = (label: string, href: string): FooterLink => (href ? { label, href, external: true } : { label, note: "soon" });
  const extraSocial = [
    store.social.youtube && { label: "YouTube", href: store.social.youtube, external: true },
    store.social.x && { label: "X", href: store.social.x, external: true },
  ].filter(Boolean) as FooterLink[];
  return [
    {
      title: "Get to Know Us",
      links: [
        { href: "/help/about", label: "About Krip" },
        { href: "/help/contact", label: "Contact" },
      ],
    },
    {
      // Social accounts show as labels until real profile links are added in Admin → Store settings.
      title: "Connect with Us",
      links: [social("Instagram", store.social.instagram), social("Facebook", store.social.facebook), ...extraSocial],
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
      title: "Customer Support",
      links: [
        { href: "/help/contact", label: "Contact Us" },
        { href: "/help/faq", label: "Help Center / FAQs" },
        { href: "/help/shipping", label: "Shipping & Delivery" },
        { href: "/help/returns", label: "Returns & Refunds" },
        { href: "/help/exchange", label: "Exchange Policy" },
        { href: "/orders", label: "Order Tracking" },
        { href: "/help/cancellation", label: "Cancellation Policy" },
        // Only shown once a real WhatsApp support number is configured.
        ...(store.whatsapp ? [{ href: whatsappLink(store.whatsapp), label: "WhatsApp Support", external: true }] : []),
      ],
    },
    {
      title: "Legal & Policies",
      links: [
        { href: "/help/privacy", label: "Privacy Policy" },
        { href: "/help/terms", label: "Terms & Conditions" },
        { href: "/help/refunds", label: "Return & Refund Policy" },
        { href: "/help/shipping", label: "Shipping Policy" },
        { href: "/help/cancellation", label: "Cancellation Policy" },
        { href: "/help/cookies", label: "Cookie Policy" },
      ],
    },
  ];
}

const linkCls = "flex min-h-10 items-center text-sm text-white/80 hover:text-white hover:underline";

export function Footer({ store }: { store: StoreProfile }) {
  const toTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const contact = [
    store.supportEmail && { label: "Email", value: store.supportEmail, href: `mailto:${store.supportEmail}` },
    store.supportPhone && { label: "Phone", value: store.supportPhone, href: `tel:${store.supportPhone.replace(/[\s-]/g, "")}` },
    store.supportHours && { label: "Hours", value: store.supportHours },
    store.address && { label: "Address", value: store.address },
  ].filter(Boolean) as { label: string; value: string; href?: string }[];

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

      <div className="bg-[#1c1c1c] text-white">
        <nav aria-label="Footer" className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-6 py-10 sm:grid-cols-3 lg:grid-cols-6">
          {columns(store).map((col) => (
            <div key={col.title}>
              <h2 className="mb-2 text-[15px] font-bold">{col.title}</h2>
              <ul>
                {col.links.map((l) => (
                  <li key={col.title + l.label}>
                    {l.href && l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkCls}>{l.label}</a>
                    ) : l.href ? (
                      <Link href={l.href} className={linkCls}>{l.label}</Link>
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

        {(contact.length > 0 || store.acceptedPayments.length > 0) && (
          <section aria-label="Contact and payments" className="border-t border-white/10">
            <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 text-sm md:grid-cols-2">
              {contact.length > 0 && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                  {contact.map((c) => (
                    <div key={c.label} className="contents">
                      <dt className="text-white/50">{c.label}</dt>
                      <dd className="whitespace-pre-line text-white/85">{c.href ? <a href={c.href} className="hover:underline">{c.value}</a> : c.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {store.acceptedPayments.length > 0 && (
                <div>
                  <p className="text-white/50">We accept</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {store.acceptedPayments.map((m) => (
                      <li key={m} className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-white/85">{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="border-t border-white/10 bg-[#141414]">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-5 text-xs text-white/70 md:flex-row md:justify-between">
            <div className="flex items-center gap-3">
              <Logo onDark className="text-[22px]" />
              <p>© 2026 Krip. All rights reserved.</p>
            </div>
            <ul className="flex flex-wrap items-center justify-center gap-2" aria-label="Region settings">
              <li className="flex h-9 items-center gap-1.5 rounded border border-white/25 px-3"><span aria-hidden>🇮🇳</span> Country / Region: India</li>
              <li className="flex h-9 items-center rounded border border-white/25 px-3">Currency: INR (₹)</li>
              <li className="flex h-9 items-center gap-1.5 rounded border border-white/25 px-3" title="More languages coming soon"><span aria-hidden>🌐</span> Language: English</li>
              <li>
                <button type="button" onClick={toTop} className="flex h-11 items-center gap-1 rounded bg-white/10 px-4 font-semibold text-white hover:bg-white/20">
                  <span aria-hidden>↑</span> Back to Top
                </button>
              </li>
            </ul>
          </div>
          <p className="pb-4 text-center text-[11px] text-white/40">Prototype: sample products, demo payments.</p>
        </div>
      </div>
    </footer>
  );
}
