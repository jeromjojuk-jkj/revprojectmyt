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
    // A white panel on the grey page, like the shelves of a big marketplace app.
    <section aria-labelledby={hid} className={`mt-2 bg-white px-4 pb-4 pt-3.5 md:mx-4 md:mt-3 md:rounded-lg ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id={hid} className="text-[17px] font-bold leading-tight md:text-xl">{title}</h2>
          {kicker && <p className="mt-0.5 text-xs text-ink-soft">{kicker}</p>}
        </div>
        {href && (
          <Link href={href} aria-label={`${hrefLabel}: ${title}`} className="flex h-9 shrink-0 items-center gap-0.5 rounded-full bg-leaf pl-3.5 pr-2.5 text-[13px] font-semibold text-white">
            {hrefLabel} <IconChevron size={15} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
