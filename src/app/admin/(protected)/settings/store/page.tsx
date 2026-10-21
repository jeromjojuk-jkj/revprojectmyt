import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { PageHeader } from "@/app/admin/_components/ui";
import { StoreForm } from "./StoreForm";

export const metadata = { title: "Store & footer" };

export default async function StoreSettings() {
  const ctx = await requirePerm("storefront.view");
  const s = (await readDb()).store;
  const initial: Record<string, string> = {
    name: s.name, legalName: s.legalName, supportEmail: s.supportEmail, supportPhone: s.supportPhone, whatsapp: s.whatsapp, supportHours: s.supportHours,
    address: s.address, gstin: s.gstin, grievanceName: s.grievanceName, grievanceEmail: s.grievanceEmail,
    instagram: s.social.instagram, facebook: s.social.facebook, youtube: s.social.youtube, x: s.social.x,
    announcementActive: s.announcement.active ? "on" : "", announcementText: s.announcement.text, announcementHref: s.announcement.href,
    maintenanceActive: s.maintenance.active ? "on" : "", maintenanceMessage: s.maintenance.message, lowStockThreshold: String(s.lowStockThreshold),
  };
  return (
    <div className="max-w-4xl">
      <PageHeader title="Store & footer" description="Public details shown in the storefront footer, the Contact page and on packing slips. Blank fields are hidden from shoppers — only fill in real, working details." />
      <StoreForm initial={initial} payments={s.acceptedPayments} canEdit={ctx.can("storefront.manage")} />
    </div>
  );
}
