"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-4 pt-12 text-center" role="alert">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-ink-soft">Please try again. If you were placing an order, check Your orders before retrying.</p>
      <button type="button" onClick={reset} className="mt-5 h-12 rounded-xl bg-leaf px-6 font-semibold text-white">Try again</button>
    </div>
  );
}
