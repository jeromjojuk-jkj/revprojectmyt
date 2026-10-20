"use client";

import Link from "next/link";
import { useToasts } from "@/lib/store";
import { IconCheck, IconInfo, IconX } from "./Icons";

export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[60] flex flex-col items-center gap-2 px-4"
      style={{ bottom: "calc(var(--bottom-nav-h) + var(--safe-bottom) + 96px)" }}
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm shadow-lg ${
            t.tone === "error" ? "bg-danger text-white" : "bg-ink text-white"
          }`}
        >
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${t.tone === "error" ? "bg-white/20" : "bg-sun text-ink"}`}>
            {t.tone === "error" || t.tone === "info" ? <IconInfo size={16} /> : <IconCheck size={16} />}
          </span>
          <span className="flex-1">{t.message}</span>
          {t.action && (
            <Link href={t.action.href} className="font-semibold text-sun underline-offset-2 hover:underline" onClick={() => dismiss(t.id)}>
              {t.action.label}
            </Link>
          )}
          <button aria-label="Dismiss" className="-mr-1 grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" onClick={() => dismiss(t.id)}>
            <IconX size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
