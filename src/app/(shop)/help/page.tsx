import Link from "next/link";
import { POLICY_LINKS } from "@/components/HelpLinks";
import { IconChevron } from "@/components/Icons";

export const metadata = { title: "Help & contact" };

export default function HelpPage() {
  return (
    <div className="prose-krip mx-auto max-w-2xl px-4 pt-4">
      <h1 className="text-xl font-semibold">Help & contact</h1>
      <p>Questions about an order, size or return? We’re here to help.</p>
      <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-line">
        <h2 className="!mt-0">Contact us</h2>
        <p>
          Contact channels (email, phone/WhatsApp and grievance officer details required under the Consumer Protection (E-Commerce) Rules) will be
          published here before launch. This prototype does not have a staffed support channel.
        </p>
        <p className="text-sm">Have your order ID (e.g. KRP-261020-ABC123) ready — you’ll find it on your order page.</p>
      </div>
      <h2>Common questions</h2>
      <ul>
        <li><b>Where’s my order?</b> Open <Link href="/orders">Your orders</Link> to see the latest status.</li>
        <li><b>Which size should I pick?</b> Every clothing and footwear page has a size guide with garment measurements.</li>
        <li><b>Can I return this?</b> Each product page shows its return or exchange eligibility before you buy.</li>
      </ul>
      <ul className="!list-none !pl-0 mt-4 space-y-2">
        {POLICY_LINKS.slice(1).map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="flex min-h-12 items-center justify-between rounded-xl bg-white px-4 !text-ink !no-underline ring-1 ring-line">
              {l.label} <IconChevron size={14} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
