import type { Offer } from "../lib/types.ts";
import { IS_FASHION } from "../lib/constants.ts";

// SAMPLE seasonal offers. Each headline is true by construction: the tile's
// link applies the same price cap, so every product it opens matches.
const FASHION_OFFERS: Offer[] = [
  {
    id: "o-kurtas", headline: "Under ₹999", subhead: "Kurtas & kurtis", badge: "Diwali Edit", theme: "saffron",
    query: "type=Ethnic Wear&max=999", productIds: ["p104", "p007"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-beauty", headline: "Under ₹299", subhead: "Lips, eyes & glow", badge: "Diwali Edit", theme: "red",
    query: "cat=beauty&max=299", productIds: ["p301", "p304"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-jeans", headline: "Under ₹999", subhead: "Jeans for every fit", badge: "Diwali Edit", theme: "purple",
    query: "type=Jeans&max=999", productIds: ["p103", "p005"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-jewellery", headline: "Festive sparkle", subhead: "Jhumkas, hoops & charms", badge: "Diwali Edit", theme: "green",
    query: "cat=jewellery", productIds: ["p503", "p501"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-aura", headline: "The Aura Edit", subhead: "Soft-glow fits for every day", badge: "New season", theme: "pink",
    query: "collection=aura-edit", productIds: ["p101", "p402"], terms: null, startsOn: null, endsOn: null, active: true,
  },
];

const HOME_OFFERS: Offer[] = [
  {
    id: "o-baby", headline: "Baby-proof your sockets", subhead: "15 socket covers in one pack", badge: "Launch edit", theme: "pink",
    query: "cat=baby-safety", productIds: ["k001"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-cleaning", headline: "Under ₹199", subhead: "Cleaning & laundry helpers", badge: "Launch edit", theme: "saffron",
    query: "cat=cleaning&max=199", productIds: ["k005", "k004"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-kitchen", headline: "Under ₹349", subhead: "Kitchen helpers", badge: "Launch edit", theme: "green",
    query: "cat=kitchen&max=349", productIds: ["k011", "k010"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-care", headline: "Self-care at home", subhead: "Ice roller & face ice bath", badge: "Launch edit", theme: "purple",
    query: "cat=personal-care", productIds: ["k008", "k007"], terms: null, startsOn: null, endsOn: null, active: true,
  },
];

// SAMPLE seasonal offers for the current store mode.
export const SEED_OFFERS: Offer[] = IS_FASHION ? FASHION_OFFERS : HOME_OFFERS;
