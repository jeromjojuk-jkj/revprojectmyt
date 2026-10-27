"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { IconX } from "./Icons";

/**
 * Accessible bottom sheet (mobile) / dialog (desktop) on native <dialog>:
 * focus is trapped, Esc closes, the page behind is inert.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  side = false,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: boolean;
  labelledBy?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handle = () => onCloseRef.current();
    d.addEventListener("close", handle);
    return () => d.removeEventListener("close", handle);
  }, []);

  return (
    <dialog
      ref={ref}
      className={`sheet ${side ? "sheet-side" : ""}`}
      aria-labelledby={labelledBy ?? titleId}
      onClick={(e) => {
        // Tap on the backdrop closes.
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="flex max-h-[inherit] flex-col" style={{ maxHeight: "inherit", height: side ? "100%" : undefined }}>
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 pt-2 pb-2">
          <div className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-neutral-300 md:hidden" aria-hidden />
          <h2 id={titleId} className="pt-2 text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-neutral-100"
            aria-label="Close"
          >
            <IconX />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{open ? children : null}</div>
        {footer && open ? (
          <div className="border-t border-line bg-white px-4 pt-3" style={{ paddingBottom: "calc(12px + var(--safe-bottom))" }}>
            {footer}
          </div>
        ) : (
          <div style={{ height: "var(--safe-bottom)" }} />
        )}
      </div>
    </dialog>
  );
}
