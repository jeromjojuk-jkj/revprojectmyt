"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DemoGateway({ orderId, token }: { orderId: string; token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "success" | "failure">(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState("upi");

  const send = async (outcome: "success" | "failure") => {
    setBusy(outcome);
    setError(null);
    try {
      const res = await fetch("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, t: token, outcome }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 409) throw new Error(d.error ?? "Payment service unavailable");
      router.replace(d.next ?? `/order/${orderId}?t=${encodeURIComponent(token)}`);
      router.refresh();
    } catch (e) {
      setError(`${(e as Error).message}. No payment was recorded — you can try again.`);
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Simulated method</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["upi", "UPI"],
            ["card", "Card"],
          ].map(([v, l]) => (
            <label key={v} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl ring-2 ${method === v ? "bg-leaf-soft ring-leaf" : "ring-line"}`}>
              <input type="radio" name="m" value={v} checked={method === v} onChange={() => setMethod(v)} className="sr-only" />
              <span className="font-medium">{l}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button type="button" disabled={!!busy} onClick={() => send("success")} className="h-12 w-full rounded-xl bg-leaf font-semibold text-white disabled:opacity-60">
        {busy === "success" ? "Confirming with server…" : "Simulate successful payment"}
      </button>
      <button type="button" disabled={!!busy} onClick={() => send("failure")} className="h-12 w-full rounded-xl font-semibold text-danger ring-2 ring-danger disabled:opacity-60">
        {busy === "failure" ? "Recording failure…" : "Simulate failed payment"}
      </button>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
