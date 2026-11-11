import { NextResponse } from "next/server";
import { readDb } from "@/lib/server/db";
import { paymentConfig } from "@/lib/server/payments";

export const dynamic = "force-dynamic";

const TIMEOUT_MS = 8000;

/**
 * Health check for uptime monitors (e.g. UptimeRobot, every 5 minutes).
 * 200 + {"status":"ok"} when the app can read its datastore; 503 + {"status":"down"} when it can't.
 * Public on purpose, so it says nothing sensitive: no data, hostnames, keys or error details.
 */
async function check() {
  const started = Date.now();
  let datastore: "ok" | "down" = "down";
  try {
    const db = await Promise.race([
      readDb(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("datastore timeout")), TIMEOUT_MS)),
    ]);
    if (Array.isArray(db.products) && db.settings) datastore = "ok";
  } catch (e) {
    console.error("Health check: datastore failed", e);
  }
  const ok = datastore === "ok";
  return NextResponse.json(
    {
      status: ok ? "ok" : "down",
      checks: { datastore, payments: paymentConfig().onlineEnabled ? "ok" : "off" },
      ms: Date.now() - started,
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex" } },
  );
}

export const GET = check;

/** Some monitors use HEAD; same check, no body. */
export async function HEAD() {
  const res = await check();
  return new NextResponse(null, { status: res.status, headers: res.headers });
}
