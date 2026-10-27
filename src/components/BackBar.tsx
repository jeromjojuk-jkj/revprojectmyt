"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { IconBack } from "./Icons";

// Pages that already have their own back control, or are the start.
const HIDE = ["/", "/checkout"];

let inAppSteps = 0;

/** A visible Back button on every page except home. Goes to the previous
 *  Krip page, or home when the shopper arrived from outside. */
export function BackBar() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    inAppSteps++;
  }, [pathname]);
  if (HIDE.includes(pathname) || pathname.startsWith("/pay/")) return null;
  return (
    <div className="mx-auto w-full max-w-7xl px-2 pt-2 md:px-4">
      <button
        type="button"
        onClick={() => (inAppSteps > 1 && window.history.length > 1 ? router.back() : router.push("/"))}
        className="flex h-10 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-ink hover:bg-black/5"
      >
        <IconBack size={20} /> Back
      </button>
    </div>
  );
}
