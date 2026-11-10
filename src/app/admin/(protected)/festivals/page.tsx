import { requirePerm } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { offerStatus, offerWindow, istDay, describeFestivalOffer } from "@/lib/festivalOffers";
import { PageHeader } from "@/app/admin/_components/ui";
import { FestivalRow } from "./FestivalRow";

export const metadata = { title: "Festival offers" };
export const dynamic = "force-dynamic";

export default async function FestivalOffers() {
  const ctx = await requirePerm("coupons.view");
  const db = await readDb();
  const list = db.settings.festivalOffers ?? [];
  const now = new Date();
  const fmt = (d: string) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  return (
    <div>
      <PageHeader
        title="Festival offers"
        description="Each offer is a % off the shopper’s bag. It starts automatically the set number of days before the festival and ends by itself when the festival day is over — nothing to switch off. It doesn’t stack with coupons: the shopper gets whichever saves more."
      />
      <div className="space-y-3">
        {list.map((f) => {
          const w = offerWindow(f);
          return (
            <FestivalRow
              key={f.id}
              offer={f}
              canEdit={ctx.can("coupons.edit")}
              canDelete={ctx.can("coupons.delete")}
              status={offerStatus(f, now)}
              window={`${fmt(istDay(w.start))} – ${fmt(istDay(w.end - 1))}`}
              summary={describeFestivalOffer(f)}
            />
          );
        })}
        {ctx.can("coupons.edit") && <FestivalRow offer={null} canEdit canDelete={false} status="off" window="" summary="" />}
      </div>
    </div>
  );
}
