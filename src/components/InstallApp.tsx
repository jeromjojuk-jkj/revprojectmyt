"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./Logo";

// Registers the service worker and offers "Install the Krip app":
// - Android/Chrome/Edge: the browser's own install prompt, behind our banner.
// - iPhone/iPad Safari: a short how-to (Share → Add to Home Screen), as Safari has no prompt.
// Hidden once installed, and for 14 days after "Not now".

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

const DISMISS_KEY = "krip-install-dismissed";
const SNOOZE_DAYS = 14;

function snoozed() {
  try {
    const t = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    return Date.now() - t < SNOOZE_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function standalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export function InstallApp() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (standalone() || snoozed()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const onInstalled = () => setShow(false);
    window.addEventListener("appinstalled", onInstalled);
    // iOS Safari only (not Chrome/Firefox on iOS, and not in-app browsers like Instagram's).
    const ua = navigator.userAgent;
    const iosSafari = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Instagram|FBAN|FBAV/.test(ua);
    let t: ReturnType<typeof setTimeout> | undefined;
    if (iosSafari) t = setTimeout(() => { setIos(true); setShow(true); }, 8000);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
  };

  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    setEvt(null);
    if (outcome === "accepted") setShow(false);
    else dismiss();
  };

  if (!show) return null;
  return (
    <div
      role="dialog"
      aria-label="Install the Krip app"
      className="fixed inset-x-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink p-3 text-white shadow-2xl md:bottom-6"
      style={{ bottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + 12px)" }}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white">
        <LogoMark className="h-8 w-auto" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Install the Krip app</p>
        {ios ? (
          <p className="text-xs text-white/80">Tap <b>Share</b> <span aria-hidden>⎙</span> then <b>Add to Home Screen</b>.</p>
        ) : (
          <p className="text-xs text-white/80">Opens full screen from your home screen.</p>
        )}
      </div>
      {!ios && (
        <button type="button" onClick={install} className="h-10 shrink-0 rounded-xl bg-sun px-4 text-sm font-bold text-ink">
          Install
        </button>
      )}
      <button type="button" onClick={dismiss} aria-label="Not now" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white/70 hover:text-white">
        ✕
      </button>
    </div>
  );
}
