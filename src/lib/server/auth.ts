import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { StaffUser } from "../types";
import { readDb, withDb, type DB } from "./db";
import { hashPassword, verifyPassword } from "../passwords";
import { verifyTotp } from "../totp";
import { can, findRole, type Permission, type RoleDef } from "../rbac";
import { audit, type Actor } from "./audit";

const COOKIE = "krip_admin";
const SESSION_HOURS = 8;
const IDLE_MINUTES = 120;
const DEV_PASSWORD = "krip-admin-demo";
const DEV_EMAIL = "owner@krip.local";
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

/**
 * The first Super Admin is created from ADMIN_EMAIL / ADMIN_PASSWORD the first
 * time anyone signs in to an empty staff list. After that, staff are managed in
 * Admin → Staff & roles and the env password is no longer used.
 */
export function adminPasswordStatus(): { enabled: boolean; usingDevDefault: boolean; ownerEmail: string } {
  const prod = process.env.NODE_ENV === "production";
  const ownerEmail = (process.env.ADMIN_EMAIL || DEV_EMAIL).toLowerCase();
  const secretOk = !prod || (process.env.SESSION_SECRET?.length ?? 0) >= 16;
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8 && secretOk) return { enabled: true, usingDevDefault: false, ownerEmail };
  if (!prod) return { enabled: true, usingDevDefault: true, ownerEmail };
  return { enabled: false, usingDevDefault: false, ownerEmail };
}

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

function bootstrapOwner(db: DB) {
  if (db.staff.length > 0) return;
  const s = adminPasswordStatus();
  if (!s.enabled) return;
  const now = new Date().toISOString();
  db.staff.push({
    id: "st_owner",
    email: s.ownerEmail,
    name: "Store owner",
    roleId: "super_admin",
    passwordHash: hashPassword(s.usingDevDefault ? DEV_PASSWORD : process.env.ADMIN_PASSWORD!),
    active: true,
    mfaSecret: null,
    mfaPending: null,
    failedLogins: 0,
    lockedUntil: null,
    createdAt: now,
    createdBy: "bootstrap",
    lastLoginAt: null,
    passwordChangedAt: now,
    resetTokenHash: null,
    resetTokenExpires: null,
    notificationsSeenAt: null,
  });
  audit(db, { id: "system", name: "System" }, "staff.bootstrap", "staff", "st_owner", { after: { email: s.ownerEmail, roleId: "super_admin" } });
}

// Per-IP throttle on top of the per-account lockout.
type Attempts = { count: number; first: number };
const ipAttempts = ((globalThis as unknown as { __kripIpAttempts?: Map<string, Attempts> }).__kripIpAttempts ??= new Map());

async function clientInfo() {
  const h = await headers();
  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local",
    userAgent: (h.get("user-agent") ?? "").slice(0, 200),
  };
}

export type LoginResult = { ok: true } | { ok: false; error: string; needCode?: boolean };

export async function login(emailRaw: string, password: string, code: string): Promise<LoginResult> {
  const status = adminPasswordStatus();
  if (!status.enabled) return { ok: false, error: "Admin access is disabled: set ADMIN_PASSWORD and SESSION_SECRET." };
  const email = emailRaw.trim().toLowerCase();
  const { ip, userAgent } = await clientInfo();
  const now = Date.now();
  const a = ipAttempts.get(ip) ?? { count: 0, first: now };
  if (now - a.first > 15 * 60_000) Object.assign(a, { count: 0, first: now });
  if (a.count >= 20) return { ok: false, error: "Too many attempts from this network. Try again in 15 minutes." };

  const token = crypto.randomBytes(32).toString("base64url");
  const result = await withDb((db): LoginResult => {
    bootstrapOwner(db);
    const log = (outcome: DB["loginEvents"][number]["outcome"], staffId: string | null) => {
      db.loginEvents.push({ at: new Date().toISOString(), email: email.slice(0, 120), staffId, ip, userAgent, outcome });
      if (db.loginEvents.length > 2000) db.loginEvents.splice(0, db.loginEvents.length - 2000);
    };
    const user = db.staff.find((u) => u.email === email);
    // Same message for unknown users and wrong passwords, so emails can't be probed.
    const generic: LoginResult = { ok: false, error: "Email or password is incorrect." };
    if (!user) {
      // Spend comparable time so response timing doesn't reveal which emails exist.
      verifyPassword(password, "scrypt$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86));
      a.count++;
      log("unknown_user", null);
      return generic;
    }
    if (user.lockedUntil && Date.parse(user.lockedUntil) > Date.now()) {
      log("locked", user.id);
      return { ok: false, error: "This account is locked after repeated failed attempts. Try again later or ask a Super Admin to reset it." };
    }
    if (!verifyPassword(password, user.passwordHash)) {
      a.count++;
      user.failedLogins++;
      if (user.failedLogins >= MAX_FAILS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString();
        user.failedLogins = 0;
        audit(db, { id: "system", name: "System" }, "staff.locked", "staff", user.id, { after: { lockedUntil: user.lockedUntil } });
      }
      log("bad_password", user.id);
      return generic;
    }
    if (!user.active) {
      log("inactive", user.id);
      return { ok: false, error: "This account is deactivated." };
    }
    if (user.mfaSecret) {
      if (!code) return { ok: false, error: "Enter the 6-digit code from your authenticator app.", needCode: true };
      if (!verifyTotp(user.mfaSecret, code.trim())) {
        a.count++;
        user.failedLogins++;
        log("bad_code", user.id);
        return { ok: false, error: "That code didn’t match. Check your device clock and try again.", needCode: true };
      }
    }
    user.failedLogins = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date().toISOString();
    const t = new Date();
    db.sessions = db.sessions.filter((s) => Date.parse(s.expiresAt) > Date.now() && !s.revokedAt);
    db.sessions.push({
      idHash: sha(token),
      staffId: user.id,
      createdAt: t.toISOString(),
      expiresAt: new Date(t.getTime() + SESSION_HOURS * 3600_000).toISOString(),
      lastSeenAt: t.toISOString(),
      ip,
      userAgent,
      revokedAt: null,
    });
    log("success", user.id);
    return { ok: true };
  });
  ipAttempts.set(ip, a);
  if (!result.ok) return result;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    const h = sha(token);
    await withDb((db) => {
      const s = db.sessions.find((x) => x.idHash === h);
      if (s) s.revokedAt = new Date().toISOString();
    });
  }
  jar.delete(COOKIE);
}

export interface StaffContext {
  staff: StaffUser;
  role: RoleDef;
  actor: Actor;
  sessionHash: string;
  can: (p: Permission) => boolean;
}

/** The signed-in staff member for this request, or null. Cached per request. */
export const getStaff = cache(async (): Promise<StaffContext | null> => {
  if (!adminPasswordStatus().enabled) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || token.length > 100) return null;
  const h = sha(token);
  const db = await readDb();
  const s = db.sessions.find((x) => x.idHash === h);
  const now = Date.now();
  if (!s || s.revokedAt || Date.parse(s.expiresAt) <= now || now - Date.parse(s.lastSeenAt) > IDLE_MINUTES * 60_000) return null;
  const staff = db.staff.find((u) => u.id === s.staffId);
  if (!staff || !staff.active) return null;
  // Sessions issued before a password change are no longer valid.
  if (Date.parse(staff.passwordChangedAt) > Date.parse(s.createdAt)) return null;
  const role = findRole(db.roles.map((r) => ({ ...r, permissions: r.permissions as Permission[], builtIn: false })), staff.roleId);
  if (!role) return null;
  if (now - Date.parse(s.lastSeenAt) > 5 * 60_000) {
    await withDb((d) => {
      const live = d.sessions.find((x) => x.idHash === h);
      if (live) live.lastSeenAt = new Date().toISOString();
    });
  }
  return { staff, role, actor: { id: staff.id, name: staff.name }, sessionHash: h, can: (p) => can(role, p) };
});

/** Any signed-in staff member. Use at the top of admin layouts. */
export async function requireStaff(): Promise<StaffContext> {
  const ctx = await getStaff();
  if (!ctx) redirect("/admin/login");
  return ctx;
}

/** Call at the top of every admin page and server action that needs a permission. */
export async function requirePerm(p: Permission): Promise<StaffContext> {
  const ctx = await requireStaff();
  if (!ctx.can(p)) redirect(`/admin/forbidden?need=${encodeURIComponent(p)}`);
  return ctx;
}

/** For route handlers: returns a Response to send when access is refused. */
export async function checkPerm(p: Permission): Promise<{ ctx: StaffContext; denied: null } | { ctx: null; denied: Response }> {
  const ctx = await getStaff();
  if (!ctx) return { ctx: null, denied: new Response("Unauthorized", { status: 401 }) };
  if (!ctx.can(p)) return { ctx: null, denied: new Response("Forbidden", { status: 403 }) };
  return { ctx, denied: null };
}

/** True for any valid staff session (used to bypass maintenance mode). */
export async function isAdmin(): Promise<boolean> {
  return (await getStaff()) !== null;
}

export function newResetToken() {
  const token = crypto.randomBytes(24).toString("base64url");
  return { token, hash: sha(token), expires: new Date(Date.now() + 30 * 60_000).toISOString() };
}

export const hashToken = sha;
