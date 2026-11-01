import "server-only";
import crypto from "node:crypto";
import { getSecret } from "./db";
import { cashfreeEnv } from "./cashfree";

export interface PaymentConfig {
  /** Can shoppers choose online payment at all? */
  onlineEnabled: boolean;
  provider: string;
  /** True when no real money can move: the built-in demo gateway or a gateway's test mode. */
  demo: boolean;
  note: string;
}

/**
 * Online payments are only offered through a configured provider. With no
 * provider, the prototype exposes a clearly-labelled demo gateway that moves
 * no money. Cashfree is supported (PAYMENT_PROVIDER=cashfree); payments are
 * confirmed only by asking Cashfree server-side, never from a browser redirect.
 */
export function paymentConfig(): PaymentConfig {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase();
  if (provider === "cashfree") {
    const cf = cashfreeEnv();
    if (!cf.configured) {
      return { onlineEnabled: false, provider, demo: false, note: "Cashfree is selected but CASHFREE_APP_ID / CASHFREE_SECRET_KEY are missing, so online payment is switched off." };
    }
    return cf.live
      ? { onlineEnabled: true, provider, demo: false, note: "UPI, cards, net banking and wallets — secured by Cashfree." }
      : { onlineEnabled: true, provider, demo: true, note: "Cashfree test mode — use Cashfree’s test UPI/cards. No real money moves." };
  }
  if (provider) {
    return {
      onlineEnabled: false,
      provider,
      demo: false,
      note: `Payment provider “${provider}” is configured but no adapter is implemented in this prototype, so online payment is switched off.`,
    };
  }
  if (process.env.DEMO_PAYMENTS !== "false") {
    return {
      onlineEnabled: true,
      provider: "demo",
      demo: true,
      note: "Demo gateway — simulates UPI/card outcomes. No real money moves.",
    };
  }
  return { onlineEnabled: false, provider: "none", demo: false, note: "Online payment is not configured." };
}

export interface GatewayEvent {
  id: string;
  provider: string;
  type: "payment.succeeded" | "payment.failed";
  orderId: string;
  amount: number;
  reference: string;
  createdAt: string;
}

export async function signPayload(raw: string) {
  const secret = await getSecret("payment");
  return crypto.createHmac("sha256", secret).update(raw).digest("hex");
}

export async function verifySignature(raw: string, signature: string | null) {
  if (!signature || !/^[0-9a-f]{64}$/i.test(signature)) return false;
  const expected = Buffer.from(await signPayload(raw), "hex");
  const got = Buffer.from(signature, "hex");
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}
