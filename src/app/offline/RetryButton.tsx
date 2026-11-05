"use client";

export function RetryButton() {
  return (
    <button type="button" onClick={() => window.location.reload()} className="mt-6 h-12 rounded-xl bg-leaf px-8 font-semibold text-white">
      Try again
    </button>
  );
}
