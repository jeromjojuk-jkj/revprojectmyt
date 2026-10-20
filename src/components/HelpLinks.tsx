import Link from "next/link";
import { Logo } from "./Logo";
import { BRAND } from "@/lib/constants";

export const POLICY_LINKS = [
  { href: "/help", label: "Help & contact" },
  { href: "/help/shipping", label: "Shipping & delivery" },
  { href: "/help/returns", label: "Returns & exchanges" },
  { href: "/help/cancellation", label: "Cancellation" },
  { href: "/help/privacy", label: "Privacy policy" },
  { href: "/help/terms", label: "Terms of use" },
];

export function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[1fr_2fr]">
        <div className="space-y-2">
          <Logo className="text-[30px]" />
          <p className="text-sm text-ink-soft">{BRAND.tagline}</p>
          <p className="text-xs text-ink-soft">
            Prototype storefront. Products, prices and images shown are sample data; payments run in demo mode.
          </p>
        </div>
        <nav aria-label="Help and policies">
          <ul className="grid grid-cols-2 gap-x-4 sm:grid-cols-3">
            {POLICY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-11 items-center text-sm text-ink hover:text-leaf hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
