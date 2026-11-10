import type { FestivalOffer } from "@/lib/types";
import { describeFestivalOffer, offerEndsLabel } from "@/lib/festivalOffers";

/** Shown across the shop while a festival offer runs. Applied automatically in the bag. */
export function FestivalOfferBar({ offer }: { offer: FestivalOffer }) {
  return (
    <div className={`px-4 py-2 text-center text-[13px] font-semibold ${offer.tier === "big" ? "bg-sun text-ink" : "bg-leaf text-white"}`} role="status">
      {offer.name} offer: {describeFestivalOffer(offer)} · applied automatically in your bag · ends {offerEndsLabel(offer)}
    </div>
  );
}
