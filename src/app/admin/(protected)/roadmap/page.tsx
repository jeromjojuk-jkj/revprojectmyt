import { requirePerm } from "@/lib/server/auth";
import { Card, PageHeader } from "@/app/admin/_components/ui";

export const metadata = { title: "Roadmap" };

// Modules from the admin brief that are not built yet. Listed here instead of
// as sidebar links to empty pages.
const LATER: { area: string; items: string[]; needs?: string }[] = [
  { area: "Platform", items: ["PostgreSQL with migrations, row-level locks and point-in-time backups", "Object storage for product images and documents", "Background job queue with retries", "Structured logging and error monitoring"], needs: "A hosted Postgres (e.g. Neon, Supabase, RDS) and object storage bucket" },
  { area: "Returns & exchanges", items: ["Customer return requests with photos", "Pickup scheduling, inspection and restock decisions", "Exchange and replacement orders", "Store credit"] },
  { area: "Payments", items: ["Razorpay / Cashfree / PayU adapter with signed webhooks", "Refunds through the provider API", "Settlement reconciliation, fees and chargeback records"], needs: "A payment provider account and API keys" },
  { area: "Shipping", items: ["Courier aggregator integration (Shiprocket, Delhivery…)", "Label generation and automatic tracking events", "Shipping zones and weight/price-based rates", "RTO and courier cost reports"], needs: "A courier account and API keys" },
  { area: "Catalogue", items: ["Brands and attribute sets", "Nested categories editor", "Product bundles, digital products and gift cards", "Media library with image compression", "SEO fields, sitemap and redirects"] },
  { area: "Inventory & procurement", items: ["Multiple warehouses and transfers", "Suppliers directory and purchase orders", "Goods received notes and partial receipts", "Reorder suggestions"] },
  { area: "Customers & marketing", items: ["Customer accounts and sign-in", "Marketing consent capture", "Email / SMS / WhatsApp campaigns (with consent and unsubscribe)", "Abandoned cart and back-in-stock alerts", "Loyalty, referrals and gift cards", "Automatic discounts, buy-X-get-Y, bundles"], needs: "Messaging providers and consent capture at checkout" },
  { area: "Content", items: ["Homepage builder and banners", "Editable policy pages with drafts, scheduling and revision history", "Blog", "Navigation menu editor"] },
  { area: "Reviews & support", items: ["Verified-purchase reviews with moderation", "Product Q&A", "Helpdesk tickets with SLAs and saved replies"] },
  { area: "Finance", items: ["GST tax classes and HSN codes", "GST-compliant invoice numbering and credit notes", "Accounting exports and P&L"], needs: "Validation with your accountant" },
  { area: "API & integrations", items: ["API keys and scopes", "Outgoing webhooks with delivery history", "Marketplace listings sync (only where the marketplace allows it)"] },
];

export default async function Roadmap() {
  await requirePerm("dashboard.view");
  return (
    <div className="max-w-5xl">
      <PageHeader title="Roadmap" description="What’s built is in the sidebar. These modules from the admin brief aren’t built yet, so they don’t appear as menu items that lead nowhere." />
      <div className="grid gap-4 md:grid-cols-2">
        {LATER.map((g) => (
          <Card key={g.area} title={g.area}>
            <ul className="list-disc space-y-1 pl-5 text-sm">{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
            {g.needs && <p className="mt-3 rounded-lg bg-sun-soft px-3 py-2 text-xs"><b>Needs:</b> {g.needs}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
