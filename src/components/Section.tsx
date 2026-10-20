import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevron } from "./Icons";

export function Section({
  id,
  title,
  kicker,
  href,
  hrefLabel = "See all",
  children,
  className = "",
}: {
  id?: string;
  title: string;
  kicker?: string;
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const hid = id ? `${id}-title` : undefined;
  return (
    <section aria-labelledby={hid} className={`px-4 pt-7 ${className}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          {kicker && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">{kicker}</p>}
          <h2 id={hid} className="text-lg font-semibold leading-tight md:text-xl">{title}</h2>
        </div>
        {href && (
          <Link href={href} className="flex min-h-11 shrink-0 items-center gap-0.5 text-sm font-semibold text-leaf">
            {hrefLabel} <IconChevron size={16} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
