/**
 * Krip logo: the tag mark with a “k”, plus the wordmark.
 * On yellow surfaces (`onYellow`) the mark is reversed to charcoal so it stays visible.
 */
export function LogoMark({ onYellow = false, className = "" }: { onYellow?: boolean; className?: string }) {
  const tag = onYellow ? "#171717" : "#FFD703";
  const k = onYellow ? "#FFD703" : "#FFFFFF";
  return (
    <svg viewBox="0 0 320 400" className={className} aria-hidden focusable="false">
      <path
        d="M70 52 L200 14 L300 100 L264 380 L18 300 Z"
        fill={tag}
        stroke={tag}
        strokeWidth="34"
        strokeLinejoin="round"
      />
      <path
        d="M92 112 Q92 92 112 88 L138 82 Q156 80 156 98 L156 212 L222 150 Q236 138 250 146 L258 152 Q270 162 258 176 L198 236 L262 300 Q276 316 258 330 L248 336 Q226 350 208 334 L156 280 L154 318 Q152 336 134 332 L108 324 Q90 318 90 300 Z"
        fill={k}
      />
    </svg>
  );
}

export function Logo({ className = "", onYellow = false }: { className?: string; onYellow?: boolean }) {
  return (
    <span role="img" aria-label="krip" className={`inline-flex select-none items-center gap-[0.18em] leading-none ${className}`}>
      <LogoMark onYellow={onYellow} className="h-[1.15em] w-auto" />
      <span aria-hidden className="font-bold tracking-[-0.03em] text-ink">krip</span>
    </span>
  );
}
