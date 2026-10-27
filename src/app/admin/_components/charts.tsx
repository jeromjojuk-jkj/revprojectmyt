import { formatPrice } from "@/lib/format";

// Dependency-free SVG charts, rendered on the server. Each one carries a text
// equivalent for screen readers.

export function ColumnChart({ data, valueLabel, money = false }: { data: { label: string; value: number }[]; valueLabel: string; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 640, H = 180, pad = 24;
  const bw = (W - pad) / Math.max(1, data.length);
  const fmt = (v: number) => (money ? formatPrice(v) : String(v));
  const total = data.reduce((s, d) => s + d.value, 0);
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t));
  const showEvery = Math.ceil(data.length / 10);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 22}`} className="h-auto w-full" role="img" aria-label={`${valueLabel} by day. Total ${fmt(total)}. Highest ${fmt(max)}.`}>
        {ticks.map((t) => {
          const y = H - (t / max) * (H - 10);
          return (
            <g key={t}>
              <line x1={pad} x2={W} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.08} />
              <text x={0} y={y + 3} fontSize={9} fill="currentColor" fillOpacity={0.5}>{money ? (t >= 1000 ? `${Math.round(t / 100) / 10}k` : t) : t}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * (H - 10);
          return (
            <g key={d.label}>
              <rect x={pad + i * bw + bw * 0.15} y={H - h} width={bw * 0.7} height={Math.max(h, d.value ? 2 : 0)} rx={Math.min(4, bw * 0.2)} className="fill-leaf">
                <title>{`${d.label}: ${fmt(d.value)}`}</title>
              </rect>
              {i % showEvery === 0 && <text x={pad + i * bw + bw / 2} y={H + 15} fontSize={9} textAnchor="middle" fill="currentColor" fillOpacity={0.55}>{d.label.slice(5)}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export function BarList({ rows, money = true, empty = "No data in this period." }: { rows: [string, number][]; money?: boolean; empty?: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-ink-soft">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <ul className="space-y-2">
      {rows.map(([k, v]) => (
        <li key={k} className="text-sm">
          <div className="flex justify-between gap-2"><span className="truncate capitalize">{k.replace(/_/g, " ")}</span><span className="font-semibold tabular-nums">{money ? formatPrice(v) : v}</span></div>
          <div className="mt-1 h-2 rounded-full bg-paper"><div className="h-2 rounded-full bg-gradient-to-r from-leaf to-emerald-400" style={{ width: `${(v / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - (v / max) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-8 w-full" aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" className="text-leaf" />
    </svg>
  );
}
