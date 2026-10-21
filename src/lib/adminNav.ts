import type { Permission } from "./rbac.ts";

// Admin sidebar. Only modules that are built appear here; each item needs a
// permission, and the server re-checks it on the page itself.

export type NavIcon =
  | "dashboard" | "orders" | "products" | "inventory" | "import" | "customers" | "coupons" | "offers"
  | "store" | "fees" | "staff" | "audit" | "health" | "roadmap";

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  perm: Permission;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavGroup[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: "dashboard", perm: "dashboard.view" }] },
  {
    title: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "orders", perm: "orders.view" },
      { href: "/admin/products", label: "Products", icon: "products", perm: "products.view" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory", perm: "inventory.view" },
      { href: "/admin/import", label: "CSV import", icon: "import", perm: "products.create" },
    ],
  },
  { title: "Customers", items: [{ href: "/admin/customers", label: "Customers", icon: "customers", perm: "customers.view" }] },
  {
    title: "Growth & marketing",
    items: [
      { href: "/admin/coupons", label: "Coupons & discounts", icon: "coupons", perm: "coupons.view" },
      { href: "/admin/offers", label: "Offer tiles", icon: "offers", perm: "offers.view" },
    ],
  },
  { title: "Storefront", items: [{ href: "/admin/settings/store", label: "Store & footer", icon: "store", perm: "storefront.view" }] },
  { title: "Finance", items: [{ href: "/admin/settings", label: "Fees & charges", icon: "fees", perm: "finance.view" }] },
  {
    title: "System",
    items: [
      { href: "/admin/staff", label: "Staff & roles", icon: "staff", perm: "staff.view" },
      { href: "/admin/audit", label: "Audit log", icon: "audit", perm: "audit.view" },
      { href: "/admin/system", label: "System health", icon: "health", perm: "system.view" },
      { href: "/admin/roadmap", label: "Roadmap", icon: "roadmap", perm: "dashboard.view" },
    ],
  },
];

export function navFor(can: (p: Permission) => boolean): NavGroup[] {
  return ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => can(i.perm)) })).filter((g) => g.items.length > 0);
}

const CRUMB: Record<string, string> = {
  admin: "Admin", orders: "Orders", products: "Products", inventory: "Inventory", movements: "Stock ledger", import: "CSV import",
  customers: "Customers", coupons: "Coupons", offers: "Offer tiles", settings: "Fees & charges", store: "Store & footer",
  staff: "Staff & roles", roles: "Roles", audit: "Audit log", system: "System health", roadmap: "Roadmap", security: "Security",
  search: "Search", new: "New", print: "Print", forbidden: "No access",
};

export function breadcrumbs(pathname: string): { href: string; label: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  return parts.map((p, i) => ({ href: "/" + parts.slice(0, i + 1).join("/"), label: CRUMB[p] ?? decodeURIComponent(p) }));
}
