"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bell, Boxes, ChevronDown, ChevronsLeft, ChevronsRight, FileUp, HeartPulse, LayoutDashboard, LogOut, Map, Menu,
  Package, Receipt, ScrollText, Search, Shield, ShoppingBag, Store, Tag, Ticket, Users, UserCog, X,
} from "lucide-react";
import { breadcrumbs, type NavGroup, type NavIcon } from "@/lib/adminNav";
import { Logo } from "@/components/Logo";
import { logoutAction } from "../actions";
import { markNotificationsReadAction } from "../opsActions";

const ICONS: Record<NavIcon, React.ComponentType<{ size?: number; "aria-hidden"?: boolean }>> = {
  dashboard: LayoutDashboard, orders: ShoppingBag, products: Package, inventory: Boxes, import: FileUp, customers: Users,
  coupons: Ticket, offers: Tag, store: Store, fees: Receipt, staff: UserCog, audit: ScrollText, health: HeartPulse, roadmap: Map,
};

export interface AdminNotification {
  id: string;
  title: string;
  detail: string;
  href: string;
  at: string;
  unread: boolean;
  tone: "info" | "warn" | "danger";
}

export function AdminShell({
  nav, staff, notifications, children,
}: {
  nav: NavGroup[];
  staff: { name: string; email: string; role: string; mfa: boolean };
  notifications: AdminNotification[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [closedGroups, setClosedGroups] = useState<string[]>([]);
  const [panel, setPanel] = useState<null | "bell" | "me">(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("krip-admin-collapsed") === "1");
      setClosedGroups(JSON.parse(localStorage.getItem("krip-admin-groups") ?? "[]"));
    } catch {}
  }, []);
  useEffect(() => setDrawer(false), [pathname]);
  useEffect(() => {
    if (!panel) return;
    const onDoc = (e: PointerEvent) => !panelRef.current?.contains(e.target as Node) && setPanel(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem("krip-admin-collapsed", c ? "0" : "1"); } catch {}
      return !c;
    });
  };
  const toggleGroup = (t: string) => {
    setClosedGroups((g) => {
      const next = g.includes(t) ? g.filter((x) => x !== t) : [...g, t];
      try { localStorage.setItem("krip-admin-groups", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/")) &&
    // "/admin/settings" shouldn't light up on "/admin/settings/store".
    !(href === "/admin/settings" && pathname.startsWith("/admin/settings/store"));
  const unread = notifications.filter((n) => n.unread).length;
  const crumbs = breadcrumbs(pathname);

  const sidebar = (mobile: boolean) => (
    <nav aria-label="Admin" className="flex h-full flex-col">
      <div className={`flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-3 ${collapsed && !mobile ? "justify-center" : ""}`}>
        <Link href="/admin" className="flex items-center gap-2">
          <Logo onDark className="text-[22px]" />
          {(!collapsed || mobile) && <span className="rounded bg-sun px-1.5 py-0.5 text-[10px] font-bold text-ink">ADMIN</span>}
        </Link>
        {mobile && (
          <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="ml-auto grid h-11 w-11 place-items-center rounded-lg hover:bg-white/10"><X size={20} /></button>
        )}
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto px-2 py-3">
        {nav.map((g) => {
          const open = !closedGroups.includes(g.title) || (collapsed && !mobile);
          return (
            <div key={g.title} className="mb-2">
              {(!collapsed || mobile) && (
                <button type="button" onClick={() => toggleGroup(g.title)} aria-expanded={open}
                  className="flex h-8 w-full items-center justify-between rounded px-2 text-[11px] font-semibold uppercase tracking-wider text-white/45 hover:text-white/80">
                  {g.title}
                  <ChevronDown size={14} className={`transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden />
                </button>
              )}
              {open && (
                <ul>
                  {g.items.map((it) => {
                    const Icon = ICONS[it.icon];
                    const active = isActive(it.href);
                    return (
                      <li key={it.href}>
                        <Link href={it.href} aria-current={active ? "page" : undefined} title={collapsed && !mobile ? it.label : undefined}
                          className={`relative flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm transition-colors ${collapsed && !mobile ? "justify-center" : ""} ${active ? "bg-white/12 font-semibold text-white" : "text-white/70 hover:bg-white/6 hover:text-white"}`}>
                          {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-sun" aria-hidden />}
                          <Icon size={18} aria-hidden />
                          {(!collapsed || mobile) && <span className="truncate">{it.label}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      {!mobile && (
        <button type="button" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-11 shrink-0 items-center justify-center gap-2 border-t border-white/10 text-xs text-white/60 hover:text-white">
          {collapsed ? <ChevronsRight size={18} aria-hidden /> : <><ChevronsLeft size={18} aria-hidden /> Collapse</>}
        </button>
      )}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-paper">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden bg-[#141414] print:!hidden text-white transition-[width] md:block ${collapsed ? "w-[68px]" : "w-60"}`}>{sidebar(false)}</aside>
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#141414] text-white shadow-2xl">{sidebar(true)}</aside>
        </div>
      )}
      <div className={`transition-[padding] print:!pl-0 ${collapsed ? "md:pl-[68px]" : "md:pl-60"}`}>
        <header className="sticky top-0 z-20 border-b border-line bg-white/90 backdrop-blur print:hidden">
          <div className="flex h-14 items-center gap-2 px-3 md:px-5">
            <button type="button" onClick={() => setDrawer(true)} aria-label="Open menu" className="grid h-11 w-11 place-items-center rounded-lg hover:bg-paper md:hidden"><Menu size={20} /></button>
            <form action="/admin/search" role="search" className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-paper px-3 ring-1 ring-line focus-within:ring-2 focus-within:ring-leaf md:max-w-md">
              <Search size={16} className="shrink-0 text-ink-soft" aria-hidden />
              <input name="q" aria-label="Search orders, products, customers" placeholder="Search orders, products, customers…" className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </form>
            <div ref={panelRef} className="relative ml-auto flex items-center gap-1">
              <Link href="/" className="hidden h-10 items-center rounded-lg px-3 text-sm font-medium text-leaf hover:bg-paper sm:flex">View store</Link>
              <button type="button" onClick={() => setPanel(panel === "bell" ? null : "bell")} aria-expanded={panel === "bell"}
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} className="relative grid h-11 w-11 place-items-center rounded-lg hover:bg-paper">
                <Bell size={20} aria-hidden />
                {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
              </button>
              <button type="button" onClick={() => setPanel(panel === "me" ? null : "me")} aria-expanded={panel === "me"} aria-label="Account menu"
                className="flex h-11 items-center gap-2 rounded-lg px-1.5 hover:bg-paper">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf text-xs font-bold text-white" aria-hidden>{staff.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden text-left leading-tight lg:block"><span className="block text-sm font-medium">{staff.name}</span><span className="block text-[11px] text-ink-soft">{staff.role}</span></span>
              </button>
              {panel === "bell" && (
                <div className="absolute right-0 top-12 w-[min(92vw,380px)] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-line">
                  <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                    <p className="text-sm font-semibold">Notifications</p>
                    {unread > 0 && <form action={markNotificationsReadAction}><button className="h-9 text-xs font-semibold text-leaf">Mark all read</button></form>}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-ink-soft">You’re all caught up.</p>
                  ) : (
                    <ul className="max-h-[60vh] overflow-y-auto">
                      {notifications.map((n) => (
                        <li key={n.id}>
                          <Link href={n.href} onClick={() => setPanel(null)} className="flex gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-paper">
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.unread ? (n.tone === "danger" ? "bg-danger" : n.tone === "warn" ? "bg-sun" : "bg-leaf") : "bg-transparent"}`} aria-hidden />
                            <span className="min-w-0">
                              <span className={`block text-sm ${n.unread ? "font-semibold" : ""}`}>{n.title}</span>
                              <span className="block text-xs text-ink-soft">{n.detail}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {panel === "me" && (
                <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-line">
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold">{staff.name}</p>
                    <p className="truncate text-xs text-ink-soft">{staff.email}</p>
                    <p className="mt-1 inline-flex rounded bg-paper px-1.5 py-0.5 text-[11px]">{staff.role}</p>
                  </div>
                  <Link href="/admin/security" onClick={() => setPanel(null)} className="flex h-11 items-center gap-2 px-4 text-sm hover:bg-paper">
                    <Shield size={16} aria-hidden /> Security & sessions {!staff.mfa && <span className="ml-auto rounded bg-sun-soft px-1.5 text-[10px] font-semibold">2FA off</span>}
                  </Link>
                  <Link href="/" className="flex h-11 items-center gap-2 px-4 text-sm hover:bg-paper sm:hidden"><Store size={16} aria-hidden /> View store</Link>
                  <form action={logoutAction}>
                    <button className="flex h-11 w-full items-center gap-2 px-4 text-left text-sm text-danger hover:bg-paper"><LogOut size={16} aria-hidden /> Sign out</button>
                  </form>
                </div>
              )}
            </div>
          </div>
          {crumbs.length > 1 && (
            <nav aria-label="Breadcrumb" className="no-scrollbar overflow-x-auto border-t border-line px-3 md:px-5">
              <ol className="flex h-9 items-center gap-1.5 whitespace-nowrap text-xs text-ink-soft">
                {crumbs.map((c, i) => (
                  <li key={c.href} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden>/</span>}
                    {i === crumbs.length - 1 ? <span aria-current="page" className="font-medium text-ink">{c.label}</span> : <Link href={c.href} className="hover:text-ink hover:underline">{c.label}</Link>}
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </header>
        <main id="main" className="mx-auto max-w-7xl px-3 py-5 md:px-6 md:py-6">{children}</main>
      </div>
    </div>
  );
}
