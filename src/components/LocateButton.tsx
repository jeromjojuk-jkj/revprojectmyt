"use client";

import type { LocateResult } from "@/lib/geo";
import { useLiveLocation } from "@/lib/useLiveLocation";

function IconTarget({ spinning }: { spinning: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className={spinning ? "animate-spin" : ""}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

/**
 * "Use my current location". The browser asks for permission only after the tap.
 * The detected address is shown for confirmation — never applied silently.
 */
export function LocateButton({ onConfirm, confirmLabel = "Use this pincode" }: { onConfirm: (r: LocateResult) => void; confirmLabel?: string }) {
  const { state, locate, supported, reset } = useLiveLocation();
  if (!supported) return null;
  return (
    <div className="space-y-2" aria-live="polite">
      <button
        type="button"
        onClick={locate}
        disabled={state.status === "locating"}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-leaf-soft px-4 text-sm font-semibold text-leaf ring-1 ring-leaf/30 disabled:opacity-70"
      >
        <IconTarget spinning={state.status === "locating"} />
        {state.status === "locating" ? "Finding you…" : "Use my current location"}
      </button>
      {state.status === "done" && (
        <div className="rounded-xl bg-white p-3 text-sm ring-1 ring-line">
          {state.result.pincode ? (
            <>
              <p className="font-semibold">📍 {state.result.pincode} · {state.result.label}</p>
              <p className="text-xs text-ink-soft">{[state.result.city, state.result.state].filter(Boolean).join(", ")} · please confirm it’s right</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => { onConfirm(state.result); reset(); }} className="h-10 rounded-lg bg-leaf px-4 text-sm font-semibold text-white">
                  {confirmLabel}
                </button>
                <button type="button" onClick={reset} className="h-10 rounded-lg px-3 text-sm font-medium ring-1 ring-line">Not right</button>
              </div>
            </>
          ) : (
            <p>
              You seem to be <b>{state.result.label}</b>
              {state.result.source === "approximate" ? " (approximate)" : ""}, but we couldn’t find an exact pincode. Please type it in.
            </p>
          )}
        </div>
      )}
      {state.status === "error" && <p role="alert" className="text-sm text-danger">{state.message}</p>}
      <p className="text-[11px] text-ink-soft">Your location is used once to look up your pincode and isn’t stored.</p>
    </div>
  );
}
