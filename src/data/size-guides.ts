import type { SizeGuide } from "../lib/types.ts";

// Garment measurements for the SAMPLE catalogue. Each real product should carry
// the supplier's own measured chart — these are not universal size standards.

export const TOP_REGULAR: SizeGuide = {
  unit: "in",
  headers: ["Size", "Chest", "Length", "Shoulder"],
  rows: [
    ["S", "38", "27", "17"],
    ["M", "40", "28", "17.5"],
    ["L", "42", "29", "18"],
    ["XL", "44", "30", "18.5"],
    ["XXL", "46", "31", "19"],
  ],
  howToMeasure: "Garment measured flat: chest across armpits ×2, length from highest shoulder point to hem.",
};

export const TOP_OVERSIZED: SizeGuide = {
  unit: "in",
  headers: ["Size", "Chest", "Length", "Shoulder"],
  rows: [
    ["S", "42", "27.5", "20"],
    ["M", "44", "28.5", "21"],
    ["L", "46", "29.5", "22"],
    ["XL", "48", "30.5", "23"],
  ],
  howToMeasure: "Oversized cut — garment chest is ~6 in larger than body chest. Size down for a closer fit.",
};

export const WOMEN_TOP: SizeGuide = {
  unit: "in",
  headers: ["Size", "Bust", "Waist", "Length"],
  rows: [
    ["XS", "32", "26", "20"],
    ["S", "34", "28", "20.5"],
    ["M", "36", "30", "21"],
    ["L", "38", "32", "21.5"],
    ["XL", "40", "34", "22"],
  ],
  howToMeasure: "Garment measured flat. Bust across the fullest part ×2; length from shoulder to hem.",
};

export const DRESS: SizeGuide = {
  unit: "in",
  headers: ["Size", "Bust", "Waist", "Hip", "Length"],
  rows: [
    ["XS", "32", "26", "36", "44"],
    ["S", "34", "28", "38", "44.5"],
    ["M", "36", "30", "40", "45"],
    ["L", "38", "32", "42", "45.5"],
    ["XL", "40", "34", "44", "46"],
  ],
  howToMeasure: "Garment measured flat. Length from shoulder to hem.",
};

export const KURTI: SizeGuide = {
  unit: "in",
  headers: ["Size", "Bust", "Waist", "Hip", "Length"],
  rows: [
    ["S", "36", "33", "40", "44"],
    ["M", "38", "35", "42", "44"],
    ["L", "40", "37", "44", "45"],
    ["XL", "42", "39", "46", "45"],
    ["XXL", "44", "41", "48", "46"],
  ],
  howToMeasure: "Garment measured flat. Relaxed straight cut with side slits.",
};

export const BOTTOM_MEN: SizeGuide = {
  unit: "in",
  headers: ["Size", "Waist", "Hip", "Inseam", "Length"],
  rows: [
    ["28", "28", "36", "30", "39"],
    ["30", "30", "38", "30", "39.5"],
    ["32", "32", "40", "31", "40"],
    ["34", "34", "42", "31", "40.5"],
    ["36", "36", "44", "31", "41"],
  ],
  howToMeasure: "Waist measured along the waistband, unstretched. Inseam from crotch seam to hem.",
};

export const BOTTOM_WOMEN: SizeGuide = {
  unit: "in",
  headers: ["Size", "Waist", "Hip", "Length"],
  rows: [
    ["26", "26", "36", "39"],
    ["28", "28", "38", "39"],
    ["30", "30", "40", "39.5"],
    ["32", "32", "42", "39.5"],
    ["34", "34", "44", "40"],
  ],
  howToMeasure: "Waist measured along the waistband, unstretched. Length from waistband to hem.",
};

export const SKIRT: SizeGuide = {
  unit: "in",
  headers: ["Size", "Waist", "Hip", "Length"],
  rows: [
    ["XS", "25", "35", "16"],
    ["S", "27", "37", "16.5"],
    ["M", "29", "39", "17"],
    ["L", "31", "41", "17.5"],
  ],
  howToMeasure: "Waist measured unstretched across the waistband ×2.",
};

export const FOOTWEAR_UNISEX: SizeGuide = {
  unit: "cm",
  headers: ["UK", "EU", "US (M)", "Foot length"],
  rows: [
    ["UK 4", "37", "5", "22.9"],
    ["UK 5", "38", "6", "23.7"],
    ["UK 6", "39", "7", "24.6"],
    ["UK 7", "41", "8", "25.4"],
    ["UK 8", "42", "9", "26.2"],
    ["UK 9", "43", "10", "27.1"],
    ["UK 10", "44", "11", "27.9"],
  ],
  howToMeasure: "Stand on paper, mark heel and longest toe, measure the distance. Between sizes? Go up.",
};

export const FOOTWEAR_WOMEN: SizeGuide = {
  unit: "cm",
  headers: ["UK", "EU", "Foot length"],
  rows: [
    ["UK 3", "36", "22.0"],
    ["UK 4", "37", "22.9"],
    ["UK 5", "38", "23.7"],
    ["UK 6", "39", "24.6"],
    ["UK 7", "40", "25.4"],
  ],
  howToMeasure: "Stand on paper, mark heel and longest toe, measure the distance. Between sizes? Go up.",
};
