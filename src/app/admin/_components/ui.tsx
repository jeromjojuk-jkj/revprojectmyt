import Link from "next/link";

// Small shared building blocks for admin pages (server-renderable).

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = "" }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-4 ring-1 ring-line md:p-5 ${className}`}>
      {(title || actions) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

const TONES = {
  neutral: "bg-paper text-ink ring-line",
  green: "bg-leaf-soft text-leaf ring-leaf/20",
  yellow: "bg-sun-soft text-ink ring-sun/40",
  red: "bg-danger-soft text-danger ring-danger/20",
  blue: "bg-sky-50 text-sky-800 ring-sky-200",
  dark: "bg-ink text-white ring-ink",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${TONES[tone]}`}>{children}</span>;
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-line bg-white px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "yellow", children }: { tone?: "yellow" | "green" | "red" | "blue"; children: React.ReactNode }) {
  const cls = { yellow: "bg-sun-soft", green: "bg-leaf-soft text-leaf", red: "bg-danger-soft text-danger", blue: "bg-sky-50 text-sky-900" }[tone];
  return <div role={tone === "red" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export const btn = {
  primary: "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-leaf px-4 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50",
  secondary: "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold ring-1 ring-line hover:bg-paper disabled:opacity-50",
  danger: "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-danger ring-1 ring-danger/40 hover:bg-danger-soft disabled:opacity-50",
  dark: "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-50",
};

export const field = "h-10 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20";
export const label = "mb-1 block text-xs font-semibold text-ink-soft";

export function Table({ children, minWidth = 720 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
      <table className="w-full text-sm" style={{ minWidth }}>{children}</table>
    </div>
  );
}
export const th = "px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-soft";
export const td = "px-3 py-2.5 align-top";

/** Builds a URL for the same page with some query params changed. */
export function withParams(base: string, current: Record<string, string | undefined>, changes: Record<string, string | number | null | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) if (v) sp.set(k, v);
  for (const [k, v] of Object.entries(changes)) {
    if (v === null || v === undefined || v === "") sp.delete(k);
    else sp.set(k, String(v));
  }
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

export function Pagination({ base, params, page, pages, total }: { base: string; params: Record<string, string | undefined>; page: number; pages: number; total: number }) {
  if (pages <= 1) return <p className="mt-3 text-xs text-ink-soft">{total} result{total === 1 ? "" : "s"}</p>;
  return (
    <nav aria-label="Pagination" className="mt-3 flex items-center justify-between gap-2 text-sm">
      <p className="text-xs text-ink-soft">Page {page} of {pages} · {total} results</p>
      <div className="flex gap-2">
        {page > 1 ? <Link className={btn.secondary} href={withParams(base, params, { page: page - 1 })}>Previous</Link> : <span className={`${btn.secondary} opacity-40`}>Previous</span>}
        {page < pages ? <Link className={btn.secondary} href={withParams(base, params, { page: page + 1 })}>Next</Link> : <span className={`${btn.secondary} opacity-40`}>Next</span>}
      </div>
    </nav>
  );
}

export function paginate<T>(rows: T[], pageRaw: string | undefined, size = 25) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const page = Math.min(pages, Math.max(1, Number(pageRaw) || 1));
  return { page, pages, total: rows.length, rows: rows.slice((page - 1) * size, page * size) };
}

export function SortLink({ base, params, col, children }: { base: string; params: Record<string, string | undefined>; col: string; children: React.ReactNode }) {
  const [cur, dir] = (params.sort ?? "").split(":");
  const active = cur === col;
  const next = active && dir === "asc" ? "desc" : "asc";
  return (
    <Link href={withParams(base, params, { sort: `${col}:${next}`, page: null })} className="inline-flex items-center gap-1 hover:text-ink">
      {children}
      <span aria-hidden className={active ? "text-ink" : "opacity-30"}>{active && dir === "asc" ? "▲" : "▼"}</span>
    </Link>
  );
}
