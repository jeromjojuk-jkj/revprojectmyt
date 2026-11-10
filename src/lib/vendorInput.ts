// Validation for seller registration and seller product listings (pure; unit-tested).

import type { VendorPlanId } from "./types.ts";
import { INDIAN_STATES } from "./constants.ts";
import { passwordProblem } from "./passwords.ts";

export interface VendorRegistration {
  plan: VendorPlanId;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  bankHolder: string;
  ifsc: string;
  account: string;
  upi: string;
}

const s = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validateRegistration(raw: Record<string, string>): { ok: true; value: VendorRegistration } | { ok: false; errors: Record<string, string> } {
  const e: Record<string, string> = {};
  const plan = s(raw.plan) as VendorPlanId;
  if (!["normal", "premium", "advance"].includes(plan)) e.plan = "Choose a plan.";
  const v: VendorRegistration = {
    plan,
    businessName: s(raw.businessName, 80),
    ownerName: s(raw.ownerName, 60),
    email: s(raw.email, 120).toLowerCase(),
    phone: s(raw.phone, 15).replace(/[\s-]/g, "").replace(/^(\+?91|0)(?=\d{10}$)/, ""),
    password: typeof raw.password === "string" ? raw.password : "",
    address: s(raw.address, 200),
    city: s(raw.city, 60),
    state: s(raw.state, 60),
    pincode: s(raw.pincode, 6),
    gstin: s(raw.gstin, 15).toUpperCase(),
    pan: s(raw.pan, 10).toUpperCase(),
    bankHolder: s(raw.bankHolder, 80),
    ifsc: s(raw.ifsc, 11).toUpperCase(),
    account: s(raw.account, 18).replace(/\s/g, ""),
    upi: s(raw.upi, 60),
  };
  if (v.businessName.length < 2) e.businessName = "Enter your business or shop name.";
  if (v.ownerName.length < 2) e.ownerName = "Enter the owner’s full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = "Enter a valid email.";
  if (!/^[6-9]\d{9}$/.test(v.phone)) e.phone = "Enter a valid 10-digit Indian mobile number.";
  const pw = passwordProblem(v.password, v.email);
  if (pw) e.password = pw;
  if (raw.password2 !== undefined && raw.password2 !== v.password) e.password2 = "Passwords don’t match.";
  if (v.address.length < 8) e.address = "Enter your full pickup address.";
  if (v.city.length < 2) e.city = "Enter the city.";
  if (!INDIAN_STATES.includes(v.state)) e.state = "Choose the state.";
  if (!/^[1-9]\d{5}$/.test(v.pincode)) e.pincode = "Enter a valid 6-digit pincode.";
  if (v.gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v.gstin)) e.gstin = "GSTIN looks wrong (15 characters, e.g. 29ABCDE1234F1Z5), or leave blank.";
  if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(v.pan)) e.pan = "Enter a valid PAN (e.g. ABCDE1234F).";
  if (v.bankHolder.length < 2) e.bankHolder = "Enter the bank account holder’s name.";
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(v.ifsc)) e.ifsc = "Enter a valid IFSC (e.g. SBIN0001234).";
  if (!/^\d{9,18}$/.test(v.account)) e.account = "Enter the bank account number (9–18 digits).";
  if (raw.account2 !== undefined && raw.account2.replace(/\s/g, "") !== v.account) e.account2 = "Account numbers don’t match.";
  if (v.upi && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(v.upi)) e.upi = "UPI ID looks wrong (e.g. name@okbank), or leave blank.";
  if (raw.terms !== "on") e.terms = "Please accept the seller terms.";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, value: v };
}

export interface VendorProductInput {
  title: string;
  category: string;
  subcategory: string;
  description: string;
  features: string[];
  howToUse: string[];
  price: number;
  mrp: number | null;
  stock: number;
  colour: string;
  packageContents: string;
  material: string;
  returnType: "returnable" | "non-returnable";
  images: string[];
}

const lines = (v: unknown, max = 8, len = 160) => (typeof v === "string" ? v : "").split(/\r?\n/).map((l) => l.trim().slice(0, len)).filter(Boolean).slice(0, max);

/** A seller's product listing. Image links must be https or photos uploaded to Krip. */
export function validateVendorProduct(raw: Record<string, string>, categories: string[]): { ok: true; value: VendorProductInput } | { ok: false; errors: Record<string, string> } {
  const e: Record<string, string> = {};
  const num = (k: string) => { const t = (raw[k] ?? "").trim(); return t === "" ? null : Number(t); };
  const price = num("price"), mrp = num("mrp"), stock = num("stock");
  const v: VendorProductInput = {
    title: s(raw.title, 120), category: s(raw.category, 40), subcategory: s(raw.subcategory, 60), description: s(raw.description, 1500),
    features: lines(raw.features), howToUse: lines(raw.howToUse), price: price ?? NaN, mrp, stock: stock ?? NaN,
    colour: s(raw.colour, 40) || "Standard", packageContents: s(raw.packageContents, 200), material: s(raw.material, 120),
    returnType: raw.returnType === "non-returnable" ? "non-returnable" : "returnable", images: lines(raw.images, 8, 500),
  };
  if (v.title.length < 5) e.title = "Enter a clear product name (at least 5 characters).";
  if (!categories.includes(v.category)) e.category = "Choose a category.";
  if (v.description.length < 20) e.description = "Describe the product in at least 20 characters — only facts you can back up.";
  if (!Number.isInteger(v.price) || v.price < 1 || v.price > 500000) e.price = "Enter the selling price in whole rupees.";
  if (v.mrp !== null && (!Number.isInteger(v.mrp) || v.mrp < v.price)) e.mrp = "MRP must be a whole rupee amount, not lower than the price — or leave blank.";
  if (!Number.isInteger(v.stock) || v.stock < 0 || v.stock > 100000) e.stock = "Enter the stock you have (0 or more).";
  if (!v.images.length) e.images = "Add at least one photo.";
  else if (v.images.some((u) => !/^https:\/\/\S+$/.test(u))) e.images = "Each photo must be an https:// link or an uploaded photo.";
  if (raw.rights !== "on") e.rights = "Please confirm you own these photos and may sell this product.";
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, value: v };
}
