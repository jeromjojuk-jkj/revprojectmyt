import { NextResponse, type NextRequest } from "next/server";

// Host routing for the admin subdomain (admin.kripkart.com):
// - its home page opens the admin panel (which shows the login when signed out)
// - shop pages asked for on it are sent to the main site
// - /admin on the main site is sent to the admin subdomain
// ADMIN_HOST overrides the admin host name; by default any host starting with "admin." is it.

const ADMIN_PREFIX = "admin.";

function isAdminHost(host: string) {
  const configured = process.env.ADMIN_HOST?.trim().toLowerCase();
  return configured ? host === configured : host.startsWith(ADMIN_PREFIX);
}

/** The admin subdomain for this host, or null to leave /admin where it is. */
function adminHostFor(host: string) {
  const configured = process.env.ADMIN_HOST?.trim().toLowerCase();
  if (configured) return configured;
  // Only the store's own domain (from SITE_URL) is moved; previews, localhost and other domains keep /admin.
  let siteHost = "";
  try {
    siteHost = new URL(process.env.SITE_URL ?? "").hostname.toLowerCase();
  } catch {
    return null;
  }
  const bare = siteHost.replace(/^www\./, "");
  return bare && host.replace(/^www\./, "") === bare ? ADMIN_PREFIX + bare : null;
}

function shopOrigin(host: string, proto: string) {
  const site = process.env.SITE_URL?.trim().replace(/\/$/, "");
  return site || `${proto}://${host.slice(ADMIN_PREFIX.length)}`;
}

export function proxy(req: NextRequest) {
  const host = (req.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const { pathname, search } = req.nextUrl;
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");

  if (isAdminHost(host)) {
    if (pathname === "/") return NextResponse.redirect(`${proto}://${host}/admin`);
    // Admin pages, APIs and files (images, icons) stay here; shop pages go to the main site.
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/") || pathname.startsWith("/art/") || /\.[a-z0-9]+$/i.test(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(shopOrigin(host, proto) + pathname + search);
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const admin = adminHostFor(host);
    if (admin && process.env.ADMIN_SUBDOMAIN_ONLY !== "false") return NextResponse.redirect(`${proto}://${admin}${pathname}${search}`);
  }
  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals; everything else passes through the checks above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
