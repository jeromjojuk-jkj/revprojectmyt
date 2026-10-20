/** Krip wordmark: lowercase Poppins with a small halo-star in place of the “i” dot. */
export function Logo({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <span
      role="img"
      aria-label="krip"
      className={`inline-flex select-none items-baseline font-bold leading-none tracking-[-0.04em] ${tone === "white" ? "text-white" : "text-ink"} ${className}`}
    >
      <span aria-hidden>kr</span>
      <span aria-hidden className="relative inline-block">
        {"ı"}
        <span className="absolute left-1/2 top-[-0.2em] h-[0.26em] w-[0.26em] -translate-x-1/2 rounded-full bg-leaf shadow-[0_0_0_0.05em_transparent,0_0_0_0.09em_#b89548]" />
      </span>
      <span aria-hidden>p</span>
    </span>
  );
}
