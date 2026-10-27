"use client";

import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { useStore } from "@/lib/store";
import { estimateDelivery, isValidPincode } from "@/lib/pincode";
import { LocateButton } from "./LocateButton";

export function PincodeForm({ onSaved, compact = false }: { onSaved?: () => void; compact?: boolean }) {
  const saved = useStore((s) => s.pincode);
  const setPincode = useStore((s) => s.setPincode);
  const [value, setValue] = useState(saved ?? "");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setValue(saved ?? ""), [saved]);
  const est = saved ? estimateDelivery(saved) : null;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValidPincode(value)) return setError("Enter a valid 6-digit pincode.");
        setError(null);
        setPincode(value);
        onSaved?.();
      }}
      className="space-y-2"
    >
      <label htmlFor={compact ? "pin-inline" : "pin-sheet"} className="text-sm font-semibold">
        Delivery pincode
      </label>
      <div className="flex gap-2">
        <input
          id={compact ? "pin-inline" : "pin-sheet"}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={value}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="e.g. 560001"
          aria-invalid={!!error}
          aria-describedby={error ? "pin-err" : undefined}
          className="h-12 min-w-0 flex-1 rounded-xl border-2 border-line bg-white px-3 text-base tracking-widest outline-none focus:border-leaf"
        />
        <button className="h-12 rounded-xl bg-leaf px-5 font-semibold text-white">Check</button>
      </div>
      {error && <p id="pin-err" role="alert" className="text-sm text-danger">{error}</p>}
      {!compact && (
        <LocateButton
          onConfirm={(r) => {
            if (!r.pincode) return;
            setValue(r.pincode);
            setError(null);
            setPincode(r.pincode);
            onSaved?.();
          }}
        />
      )}
      {est && !error && (
        <div className="rounded-xl bg-leaf-soft px-3 py-2 text-sm" aria-live="polite">
          <p className="font-semibold text-leaf">{est.message}</p>
          <p className="text-xs text-ink-soft">
            Estimate for {saved} under sample delivery rules · {est.codEligible ? "Cash on Delivery may be available" : "Cash on Delivery not available"}
          </p>
        </div>
      )}
    </form>
  );
}

export function PincodeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Where should we deliver?">
      <PincodeForm onSaved={onClose} />
      <p className="mt-4 text-xs text-ink-soft">
        Delivery estimates depend on your pincode and our courier partner. They’re estimates, not guarantees.
      </p>
    </Sheet>
  );
}
