import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 pt-12 text-center">
      <p className="text-5xl" aria-hidden>✦</p>
      <h1 className="mt-2 text-xl font-semibold">This page wandered off</h1>
      <p className="mt-1 text-sm text-ink-soft">The product or page you’re looking for isn’t here. It may have been removed.</p>
      <div className="mt-5 flex justify-center gap-2">
        <Link href="/" className="inline-flex h-12 items-center rounded-xl bg-leaf px-6 font-semibold text-white">Go home</Link>
        <Link href="/search" className="inline-flex h-12 items-center rounded-xl px-6 font-semibold text-leaf ring-2 ring-leaf">Browse all</Link>
      </div>
    </div>
  );
}
