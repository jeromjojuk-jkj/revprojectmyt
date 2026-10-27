"use client";

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="h-10 rounded-lg bg-ink px-4 text-sm font-semibold text-white">Print</button>;
}
