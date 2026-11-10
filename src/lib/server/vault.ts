import "server-only";
import crypto from "node:crypto";
import { getSecret } from "./db";

// Small AES-256-GCM helper for sensitive fields kept in the datastore (vendor bank account numbers).
// The key is derived from SESSION_SECRET, so it never sits next to the data.

async function key() {
  return crypto.createHash("sha256").update(`krip-vault:${await getSecret("session")}`).digest();
}

export async function seal(plain: string): Promise<string> {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", await key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return `v1.${iv.toString("base64url")}.${c.getAuthTag().toString("base64url")}.${enc.toString("base64url")}`;
}

export async function unseal(sealed: string): Promise<string | null> {
  try {
    const [v, iv, tag, enc] = sealed.split(".");
    if (v !== "v1") return null;
    const d = crypto.createDecipheriv("aes-256-gcm", await key(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(enc, "base64url")), d.final()]).toString("utf8");
  } catch {
    return null;
  }
}
