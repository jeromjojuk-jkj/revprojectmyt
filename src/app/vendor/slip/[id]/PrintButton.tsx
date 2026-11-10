"use client";

export function PrintButton() {
  return <button onClick={() => window.print()} className="h-10 rounded-xl bg-leaf px-4 font-semibold text-white">Print</button>;
}
