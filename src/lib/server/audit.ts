import "server-only";
import crypto from "node:crypto";
import type { AuditEntry } from "../types";
import type { DB } from "./db";

export interface Actor {
  id: string;
  name: string;
}

export const SYSTEM_ACTOR: Actor = { id: "system", name: "System" };

const SECRET_KEYS = /password|token|secret|mfa|accessToken|idempotency|cookie|card|cvv/i;
const MAX_ENTRIES = 20_000;

/** Removes secrets before anything reaches the log. */
export function redact(v: unknown, depth = 0): unknown {
  if (depth > 6 || v === null || typeof v !== "object") return typeof v === "string" && v.length > 2000 ? v.slice(0, 2000) + "…" : v;
  if (Array.isArray(v)) return v.slice(0, 100).map((x) => redact(x, depth + 1));
  return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, SECRET_KEYS.test(k) ? "[redacted]" : redact(x, depth + 1)]));
}

function entryHash(prev: string, e: Omit<AuditEntry, "hash">) {
  return crypto.createHash("sha256").update(prev).update(JSON.stringify(e)).digest("hex");
}

/** Appends a hash-chained entry. Call inside withDb so it commits with the change it describes. */
export function audit(
  db: DB,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string,
  extra: { before?: unknown; after?: unknown; outcome?: AuditEntry["outcome"] } = {},
) {
  const last = db.audit[db.audit.length - 1];
  const e: Omit<AuditEntry, "hash"> = {
    seq: (last?.seq ?? 0) + 1,
    at: new Date().toISOString(),
    actorId: actor.id,
    actorName: actor.name,
    action,
    entityType,
    entityId,
    outcome: extra.outcome ?? "ok",
    ...(extra.before !== undefined ? { before: redact(extra.before) } : {}),
    ...(extra.after !== undefined ? { after: redact(extra.after) } : {}),
    requestId: crypto.randomUUID(),
  };
  db.audit.push({ ...e, hash: entryHash(last?.hash ?? "", e) });
  // Oldest entries roll off; the chain is verified from the first retained entry.
  if (db.audit.length > MAX_ENTRIES) db.audit.splice(0, db.audit.length - MAX_ENTRIES);
}

/** Returns the seq of the first entry whose hash doesn't match, or null when the chain is intact. */
export function verifyAuditChain(entries: AuditEntry[]): number | null {
  for (let i = 1; i < entries.length; i++) {
    const { hash, ...rest } = entries[i];
    if (entryHash(entries[i - 1].hash, rest) !== hash) return entries[i].seq;
  }
  return null;
}
