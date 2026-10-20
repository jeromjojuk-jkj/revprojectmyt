import type { Offer } from "../lib/types.ts";

// SAMPLE seasonal offers. Each headline is true by construction: the tile's
// link applies the same price cap, so every product it opens matches.
export const SEED_OFFERS: Offer[] = [
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
