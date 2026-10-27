import crypto from "node:crypto";

// scrypt password hashes: "scrypt$<salt>$<hash>" (base64url).
const KEYLEN = 64;
const OPTS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, OPTS);
  return `scrypt$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64url");
  const got = crypto.scryptSync(password, Buffer.from(salt, "base64url"), expected.length, OPTS);
  return crypto.timingSafeEqual(expected, got);
}

/** Minimum policy for staff passwords. Returns an error message or null. */
export function passwordProblem(pw: string, email = ""): string | null {
  if (pw.length < 10) return "Use at least 10 characters.";
  if (pw.length > 200) return "Use at most 200 characters.";
  if (/^(.)\1+$/.test(pw)) return "Don’t repeat a single character.";
  if (email && pw.toLowerCase().includes(email.split("@")[0].toLowerCase()) && email.split("@")[0].length >= 4) return "Don’t include your email name in the password.";
  if (["password123", "krip-admin-demo", "qwertyuiop", "1234567890"].includes(pw.toLowerCase())) return "That password is too common.";
  return null;
}
