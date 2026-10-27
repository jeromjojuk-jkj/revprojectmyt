"use client";

import { toast } from "@/lib/store";
import { IconShare } from "./Icons";

export function ShareButton({ title, path, className = "" }: { title: string; path: string; className?: string }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      aria-label={`Share ${title}`}
      onClick={async () => {
        const url = new URL(path, window.location.origin).toString();
        if (navigator.share) {
          try {
            await navigator.share({ title: `${title} on krip`, text: `Found this on krip: ${title}`, url });
            return;
          } catch (e) {
            if ((e as DOMException).name === "AbortError") return;
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          toast({ message: "Link copied — paste it anywhere", tone: "info" });
        } catch {
          window.prompt("Copy this link:", url);
        }
      }}
    >
      <IconShare size={20} />
    </button>
  );
}
