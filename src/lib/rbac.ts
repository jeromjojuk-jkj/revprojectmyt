// Role-based access control. Permissions are "module.action" strings. Every
// admin page, server action and admin route checks them on the server; the
// sidebar only hides what the server would refuse anyway.

export const MODULES = {
  dashboard: "Dashboard",
  orders: "Orders",
  products: "Products",
  inventory: "Inventory",
  customers: "Customers",
  coupons: "Coupons & discounts",
  vendors: "Marketplace vendors",
  offers: "Offer tiles",
  storefront: "Store settings & content",
  finance: "Fees & financial estimates",
  staff: "Staff & roles",
  audit: "Audit log",
  system: "System health",
} as const;
export type ModuleId = keyof typeof MODULES;

export const ACTIONS = {
  view: "View",
  create: "Create",
  edit: "Edit",
  delete: "Delete / archive",
  approve: "Approve",
  refund: "Refund",
  export: "Export",
  manage: "Manage settings",
} as const;
export type ActionId = keyof typeof ACTIONS;

export type Permission = `${ModuleId}.${ActionId}`;

/** Which actions mean something for each module (shown in the role editor). */
export const MODULE_ACTIONS: Record<ModuleId, ActionId[]> = {
  dashboard: ["view"],
  orders: ["view", "edit", "approve", "refund", "export"],
  products: ["view", "create", "edit", "delete", "export"],
  inventory: ["view", "edit", "export"],
  customers: ["view", "edit", "export"],
  coupons: ["view", "create", "edit", "delete"],
  vendors: ["view", "edit", "approve", "manage"],
  offers: ["view", "create", "edit", "delete"],
  storefront: ["view", "manage"],
  finance: ["view", "manage"],
  staff: ["view", "create", "edit", "delete", "manage"],
  audit: ["view", "export"],
  system: ["view", "manage"],
};

export const ALL_PERMISSIONS: Permission[] = (Object.keys(MODULE_ACTIONS) as ModuleId[]).flatMap((m) =>
  MODULE_ACTIONS[m].map((a) => `${m}.${a}` as Permission),
);

const all = (m: ModuleId) => MODULE_ACTIONS[m].map((a) => `${m}.${a}` as Permission);
const view = (...ms: ModuleId[]) => ms.map((m) => `${m}.view` as Permission);

export interface RoleDef {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  builtIn: boolean;
  /** Privileged roles should use two-step sign-in. */
  privileged: boolean;
}

export const BUILT_IN_ROLES: RoleDef[] = [
  { id: "super_admin", name: "Super Admin", description: "Everything, including staff, roles and system settings.", permissions: ALL_PERMISSIONS, builtIn: true, privileged: true },
  {
    id: "store_manager", name: "Store Manager", description: "Runs the store day to day. No staff or system administration.", builtIn: true, privileged: true,
    permissions: [...all("dashboard"), ...all("orders"), ...all("products"), ...all("inventory"), ...all("customers"), ...all("coupons"), ...all("offers"), ...all("storefront"), ...all("vendors"), "finance.view", "audit.view"],
  },
  { id: "catalog_manager", name: "Catalog Manager", description: "Products, offer tiles and catalogue imports.", builtIn: true, privileged: false, permissions: [...view("dashboard", "inventory"), ...all("products"), ...all("offers")] },
  { id: "inventory_manager", name: "Inventory Manager", description: "Stock levels and adjustments.", builtIn: true, privileged: false, permissions: [...view("dashboard", "products", "orders"), ...all("inventory")] },
  { id: "order_manager", name: "Order Manager", description: "Order fulfilment, shipments and holds. Cannot refund.", builtIn: true, privileged: false, permissions: [...view("dashboard", "products", "inventory", "customers"), "orders.view", "orders.edit", "orders.approve", "orders.export"] },
  { id: "support_agent", name: "Support Agent", description: "Looks up orders and customers and adds notes.", builtIn: true, privileged: false, permissions: [...view("orders", "customers", "products"), "customers.edit"] },
  { id: "marketing_manager", name: "Marketing Manager", description: "Coupons, offer tiles, announcement bar.", builtIn: true, privileged: false, permissions: [...view("dashboard", "products"), ...all("coupons"), ...all("offers"), ...all("storefront")] },
  { id: "finance_manager", name: "Finance Manager", description: "Refunds, fees, financial estimates and exports.", builtIn: true, privileged: true, permissions: [...view("dashboard", "products", "customers", "audit"), "orders.view", "orders.refund", "orders.export", ...all("finance")] },
  { id: "analyst", name: "Read-Only Analyst", description: "Can look at everything that isn’t staff or security data. Changes nothing.", builtIn: true, privileged: false, permissions: view("dashboard", "orders", "products", "inventory", "customers", "coupons", "offers", "finance") },
];

export function findRole(roles: RoleDef[], id: string): RoleDef | undefined {
  return BUILT_IN_ROLES.find((r) => r.id === id) ?? roles.find((r) => r.id === id);
}

export function can(role: RoleDef | undefined, p: Permission): boolean {
  return !!role && role.permissions.includes(p);
}

export const isPermission = (s: string): s is Permission => (ALL_PERMISSIONS as string[]).includes(s);

/**
 * A staff member may only hand out permissions they hold themselves, which
 * prevents privilege escalation through the role editor or staff invites.
 */
export function canGrant(actor: RoleDef, target: RoleDef): boolean {
  return target.permissions.every((p) => actor.permissions.includes(p));
}
