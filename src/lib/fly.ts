"use client";

/** Animates a small thumbnail from `from` into the header bag icon. Purely decorative. */
export function flyToBag(src: string, from: Element | null) {
  if (typeof window === "undefined" || !from || !src) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.getElementById("bag-target");
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = 56;
  const el = document.createElement("img");
  el.src = src;
  el.alt = "";
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed", left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`, height: `${size}px`, borderRadius: "50%", objectFit: "cover", zIndex: "80",
    boxShadow: "0 8px 24px rgba(0,0,0,.25)", border: "3px solid #FFD703", pointerEvents: "none", background: "#fff",
  });
  document.body.appendChild(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  el.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.8)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: 0.4 },
    ],
    { duration: 650, easing: "cubic-bezier(.3,.7,.3,1)" },
  ).finished.finally(() => {
    el.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.25)" }, { transform: "scale(1)" }], { duration: 260 });
  });
}
