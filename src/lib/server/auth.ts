import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSecret } from "./db";

const COOKIE = "krip_admin";
const SESSION_HOURS = 8;
const DEV_PASSWORD = "krip-admin-demo";

export function adminPasswordStatus(): { enabled: boolean; usingDevDefault: boolean } {
  const prod = process.env.NODE_ENV === "production";
  const secretOk = !prod || (process.env.SESSION_SECRET?.length ?? 0) >= 16;
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8 && secretOk) return { enabled: true, usingDevDefault: false };
  if (!prod) return { enabled: true, usingDevDefault: true };
  return { enabled: false, usingDevDefault: false };
}

function expectedPassword() {
  const s = adminPasswordStatus();
  if (!s.enabled) return null;
  return s.usingDevDefault ? DEV_PASSWORD : process.env.ADMIN_PASSWORD!;
}

// Basic brute-force protection (per process).
type Attempts = { count: number; first: number; lockedUntil: number };
const attempts = ((globalThis as unknown as { __kripAttempts?: Map<string, Attempts> }).__kripAttempts ??= new Map());

async function sign(value: string) {
  return crypto.createHmac("sha256", await getSecret("session")).update(value).digest("base64url");
}

export async function login(password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const expected = expectedPassword();
  if (!expected) return { ok: false, error: "Admin access is disabled: set ADMIN_PASSWORD." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const a = attempts.get(ip) ?? { count: 0, first: now, lockedUntil: 0 };
  if (a.lockedUntil > now) return { ok: false, error: "Too many attempts. Try again in a few minutes." };
  const h = (s: string) => crypto.createHash("sha256").update(s).digest();
  if (!crypto.timingSafeEqual(h(password), h(expected))) {
    if (now - a.first > 10 * 60_000) Object.assign(a, { count: 0, first: now });
    a.count++;
    if (a.count >= 5) a.lockedUntil = now + 10 * 60_000;
    attempts.set(ip, a);
    return { ok: false, error: "Incorrect password." };
  }
  attempts.delete(ip);
  const exp = String(now + SESSION_HOURS * 3600_000);
  const nonce = crypto.randomBytes(8).toString("hex");
  const payload = `${exp}.${nonce}`;
  (await cookies()).set(COOKIE, `${payload}.${await sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  if (!adminPasswordStatus().enabled) return false;
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return false;
  const parts = v.split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  if (!(Number(exp) > Date.now())) return false;
  const expected = Buffer.from(await sign(`${exp}.${nonce}`));
  const got = Buffer.from(sig);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
