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
    id: "o-kitchen", headline: "Under ₹349", subhead: "Kitchen helpers", badge: "Launch edit", theme: "saffron",
    query: "cat=kitchen&max=349", productIds: ["h001", "h003"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-baby", headline: "Baby-proof your home", subhead: "Cabinet locks & corner guards", badge: "Launch edit", theme: "pink",
    query: "cat=baby-safety", productIds: ["h301", "h302"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-storage", headline: "Under ₹399", subhead: "Organise every drawer", badge: "Launch edit", theme: "green",
    query: "cat=storage&max=399", productIds: ["h201", "h202"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-gadgets", headline: "Under ₹299", subhead: "Clever little gadgets", badge: "Launch edit", theme: "purple",
    query: "cat=gadgets,electricals&max=299", productIds: ["h601", "h501"], terms: null, startsOn: null, endsOn: null, active: true,
  },
  {
    id: "o-cleaning", headline: "Under ₹199", subhead: "Cleaning made easier", badge: "Launch edit", theme: "red",
    query: "cat=cleaning&max=199", productIds: ["h101", "h102"], terms: null, startsOn: null, endsOn: null, active: true,
  },
];

// SAMPLE seasonal offers for the current store mode.
export const SEED_OFFERS: Offer[] = IS_FASHION ? FASHION_OFFERS : HOME_OFFERS;
