import Link from "next/link";

// Diwali decorations, shown only while a festival theme is active (see lib/festival.ts).
// Greetings only: no offers, discounts or countdowns.

export function Diya({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden focusable="false">
      <path className="diya-flame" d="M32 6c5 8 8 13 8 18a8 8 0 0 1-16 0c0-5 3-10 8-18Z" fill="#ffb703" />
      <path d="M32 14c2.6 4.4 4 7.3 4 10a4 4 0 0 1-8 0c0-2.7 1.4-5.6 4-10Z" fill="#fff3b0" />
      <path d="M6 36h52c-2 12-12 20-26 20S8 48 6 36Z" fill="#c2410c" />
      <path d="M6 36h52c-.4 2.4-1.1 4.6-2.1 6.6H8.1C7.1 40.6 6.4 38.4 6 36Z" fill="#9a3412" />
      <circle cx="20" cy="47" r="2.4" fill="#ffd703" /><circle cx="32" cy="49" r="2.4" fill="#ffd703" /><circle cx="44" cy="47" r="2.4" fill="#ffd703" />
    </svg>
  );
}

function Rangoli({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden focusable="false">
      {petals.map((a) => <ellipse key={`o${a}`} cx="0" cy="-62" rx="16" ry="30" transform={`rotate(${a})`} fill={a % 60 ? "#f97316" : "#ec4899"} opacity="0.9" />)}
      {petals.map((a) => <ellipse key={`m${a}`} cx="0" cy="-38" rx="10" ry="20" transform={`rotate(${a + 15})`} fill={a % 60 ? "#ffd703" : "#22c55e"} />)}
      <circle r="26" fill="#7c1d2b" /><circle r="16" fill="#ffd703" /><circle r="7" fill="#c2410c" />
    </svg>
  );
}

/** Thin greeting strip above the header. */
export function FestiveStrip() {
  return (
    <div className="festive-strip px-4 py-1.5 text-center text-[13px] font-semibold text-[#ffe9a8]">
      <Diya className="mr-1.5 inline-block h-4 w-4 align-[-2px]" />
      Happy Diwali from Krip — wishing your home light, warmth and joy
      <Diya className="ml-1.5 inline-block h-4 w-4 align-[-2px]" />
    </div>
  );
}

/** Greeting card at the top of the homepage. */
export function DiwaliHero() {
  return (
    <section aria-labelledby="diwali-title" className="festive-hero relative mx-4 mt-3 overflow-hidden rounded-3xl px-5 py-6 text-white md:px-10 md:py-9">
      <Rangoli className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 opacity-50 md:-right-6 md:-top-14 md:h-72 md:w-72 md:opacity-90" />
      <div className="relative max-w-md pr-14 md:pr-0">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd77a]">Shubh Deepavali</p>
        <h2 id="diwali-title" className="mt-1 text-[28px] font-bold leading-tight md:text-4xl">Light up every corner this Diwali</h2>
        <p className="mt-2 text-sm text-white/85">Clean, organise and brighten your home for the festival — and find little gifts for family and friends.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/search?cat=kitchen,cleaning" className="flex h-11 items-center rounded-xl bg-sun px-5 text-sm font-bold text-ink">Diwali home prep</Link>
          <Link href="/search?collection=trending" className="flex h-11 items-center rounded-xl bg-white/15 px-5 text-sm font-semibold ring-1 ring-white/30">Gift ideas</Link>
        </div>
      </div>
      <div className="relative mt-5 flex gap-3" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => <Diya key={i} className="h-9 w-9" />)}
      </div>
    </section>
  );
}
