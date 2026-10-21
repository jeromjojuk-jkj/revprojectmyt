import type { StoreProfile } from "./types.ts";

// Validation for Admin → Store settings. Everything here is shown publicly
// (footer, Contact page), so only real, verifiable details belong in it.

export const PAYMENT_METHOD_CHOICES = ["UPI", "Credit cards", "Debit cards", "Net banking", "Wallets", "Cash on Delivery"] as const;

const SOCIAL_HOSTS: Record<keyof StoreProfile["social"], string[]> = {
  instagram: ["instagram.com", "www.instagram.com"],
  facebook: ["facebook.com", "www.facebook.com", "m.facebook.com"],
  youtube: ["youtube.com", "www.youtube.com"],
  x: ["x.com", "twitter.com", "www.x.com", "www.twitter.com"],
};

export function validateStoreProfile(raw: Record<string, string | undefined>, multi: Record<string, string[]>): { ok: true; value: StoreProfile } | { ok: false; errors: Record<string, string> } {
  const e: Record<string, string> = {};
  const s = (k: string, max = 200) => (raw[k] ?? "").trim().slice(0, max);
  const email = (k: string) => {
    const v = s(k, 120);
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) e[k] = "Enter a valid email or leave blank.";
    return v;
  };
  const phone = (k: string) => {
    const v = s(k, 20);
    if (v && !/^\+?[0-9][0-9\s-]{7,16}$/.test(v)) e[k] = "Enter a phone number with digits, spaces or dashes.";
    return v;
  };
  const url = (k: string, hosts?: string[]) => {
    const v = s(k, 300);
    if (!v) return "";
    try {
      const u = new URL(v);
      if (u.protocol !== "https:") throw new Error();
      if (hosts && !hosts.includes(u.hostname)) {
        e[k] = `Use a link on ${hosts[0]}.`;
        return v;
      }
      return u.toString();
    } catch {
      e[k] = "Use a full https:// link.";
      return v;
    }
  };
  const internalOrUrl = (k: string) => {
    const v = s(k, 300);
    if (!v || v.startsWith("/")) {
      if (v.startsWith("//")) e[k] = "Use a path like /search?q=kurta or a full https:// link.";
      return v;
    }
    return url(k);
  };
  const gstin = s("gstin", 15).toUpperCase();
  if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin)) e.gstin = "GSTIN should be 15 characters, e.g. 27ABCDE1234F1Z5.";
  const lowStock = Number(s("lowStockThreshold") || "3");
  if (!(Number.isInteger(lowStock) && lowStock >= 0 && lowStock <= 1000)) e.lowStockThreshold = "Whole number from 0 to 1000.";
  const name = s("name", 60);
  if (name.length < 2) e.name = "Enter the store name.";
  const announcementText = s("announcementText", 140);
  const announcementActive = raw.announcementActive === "on";
  if (announcementActive && announcementText.length < 3) e.announcementText = "Write the announcement before switching it on.";
  const maintenanceMessage = s("maintenanceMessage", 300) || "We’re updating the store. Please check back soon.";
  const acceptedPayments = (multi.acceptedPayments ?? []).filter((m) => (PAYMENT_METHOD_CHOICES as readonly string[]).includes(m));
  const value: StoreProfile = {
    name,
    legalName: s("legalName", 120),
    supportEmail: email("supportEmail"),
    supportPhone: phone("supportPhone"),
    whatsapp: phone("whatsapp"),
    supportHours: s("supportHours", 120),
    address: s("address", 400),
    gstin,
    grievanceName: s("grievanceName", 80),
    grievanceEmail: email("grievanceEmail"),
    acceptedPayments,
    social: {
      instagram: url("instagram", SOCIAL_HOSTS.instagram),
      facebook: url("facebook", SOCIAL_HOSTS.facebook),
      youtube: url("youtube", SOCIAL_HOSTS.youtube),
      x: url("x", SOCIAL_HOSTS.x),
    },
    announcement: { active: announcementActive, text: announcementText, href: internalOrUrl("announcementHref") },
    maintenance: { active: raw.maintenanceActive === "on", message: maintenanceMessage },
    lowStockThreshold: lowStock,
  };
  return Object.keys(e).length ? { ok: false, errors: e } : { ok: true, value };
}

export const whatsappLink = (n: string) => `https://wa.me/${n.replace(/\D/g, "").replace(/^(?=\d{10}$)/, "91")}`;
