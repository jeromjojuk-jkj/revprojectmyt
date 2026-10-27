import { IconCheck } from "./Icons";

const STEPS = ["Bag", "Address & payment", "Pay", "Confirmed"];

/** Progress across the buying journey. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <ol className="mx-auto flex max-w-xl items-center px-4 pt-3" aria-label="Checkout progress">
      {STEPS.map((s, i) => {
        const done = i < current;
        const on = i === current;
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none" aria-current={on ? "step" : undefined}>
            <span className="flex flex-col items-center gap-1">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ${done ? "bg-leaf text-white" : on ? "bg-sun text-ink ring-2 ring-ink" : "bg-neutral-200 text-ink-soft"}`}>
                {done ? <IconCheck size={14} /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-[10px] ${on ? "font-semibold text-ink" : "text-ink-soft"}`}>{s}</span>
            </span>
            {i < STEPS.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 rounded ${done ? "bg-leaf" : "bg-neutral-200"}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
