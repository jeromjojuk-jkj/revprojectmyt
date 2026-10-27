"use client";

import { useState } from "react";
import { toast, useHydrated, useStore } from "@/lib/store";
import { IconHeart } from "./Icons";

export function WishlistButton({
  productId,
  title,
  className = "",
  size = 20,
  withLabel = false,
}: {
  productId: string;
  title: string;
  className?: string;
  size?: number;
  withLabel?: boolean;
}) {
  const hydrated = useHydrated();
  const on = useStore((s) => s.wishlists.some((w) => w.productIds.includes(productId)));
  const toggle = useStore((s) => s.toggleWishlist);
  const [pop, setPop] = useState(0);
  const active = hydrated && on;
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const nowOn = toggle(productId);
        setPop((n) => n + 1);
        toast({
          message: nowOn ? "Saved to your wishlist" : "Removed from wishlist",
          action: nowOn ? { label: "View", href: "/wishlist" } : undefined,
          tone: "info",
        });
      }}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
    >
      <span key={pop} className={pop ? "heart-pop" : ""} style={{ color: active ? "#be123c" : undefined }}>
        <IconHeart size={size} filled={active} />
      </span>
      {withLabel && <span className="text-sm font-medium">{active ? "Saved" : "Wishlist"}</span>}
    </button>
  );
}
