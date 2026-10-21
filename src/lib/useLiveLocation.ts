"use client";

import { useCallback, useState } from "react";
import type { LocateResult } from "./geo";

export type LocateState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "done"; result: LocateResult }
  | { status: "error"; message: string };

const MESSAGES: Record<number, string> = {
  1: "Location permission was blocked. Allow location for this site in your browser settings, or enter your pincode.",
  2: "We couldn’t get your location. Check that location/GPS is on, or enter your pincode.",
  3: "Finding your location took too long. Try again outdoors or enter your pincode.",
};

/** Asks for the device location only when the shopper taps the button. */
export function useLiveLocation() {
  const [state, setState] = useState<LocateState>({ status: "idle" });
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "error", message: "This browser can’t share location. Enter your pincode instead." });
      return;
    }
    setState({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/locate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          });
          const d = await res.json();
          if (!res.ok) return setState({ status: "error", message: d.error ?? "Couldn’t look up your address." });
          setState({ status: "done", result: d.result });
        } catch {
          setState({ status: "error", message: "Network problem while looking up your address. Enter your pincode instead." });
        }
      },
      (err) => setState({ status: "error", message: MESSAGES[err.code] ?? MESSAGES[2] }),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  return { state, locate, supported, reset: () => setState({ status: "idle" }) };
}
