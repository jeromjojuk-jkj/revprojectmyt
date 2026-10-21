import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (size = 22, p: P) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false, ...p,
});

export const IconSearch = ({ size, ...p }: P) => <svg {...base(size, p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const IconBag = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
export const IconHeart = ({ size, filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size, p)} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
);
export const IconHome = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z" /></svg>;
export const IconGrid = ({ size, ...p }: P) => <svg {...base(size, p)}><rect x="4" y="4" width="7" height="7" rx="2" /><rect x="13" y="4" width="7" height="7" rx="2" /><rect x="4" y="13" width="7" height="7" rx="2" /><rect x="13" y="13" width="7" height="7" rx="2" /></svg>;
export const IconSpark = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>;
export const IconUser = ({ size, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
export const IconPin = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
export const IconX = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M6 6l12 12M18 6 6 18" /></svg>;
export const IconChevron = ({ size, dir = "right", ...p }: P & { dir?: "right" | "left" | "down" | "up" }) => (
  <svg {...base(size, p)} style={{ transform: `rotate(${{ right: 0, down: 90, left: 180, up: 270 }[dir]}deg)` }}><path d="m9 6 6 6-6 6" /></svg>
);
export const IconFilter = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M4 6h16M7 12h10M10 18h4" /></svg>;
export const IconSort = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M7 4v16M4 7l3-3 3 3M17 20V4M14 17l3 3 3-3" /></svg>;
export const IconShare = ({ size, ...p }: P) => <svg {...base(size, p)}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" /></svg>;
export const IconMinus = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M5 12h14" /></svg>;
export const IconPlus = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M12 5v14M5 12h14" /></svg>;
export const IconTrash = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>;
export const IconCheck = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="m5 12 5 5L20 7" /></svg>;
export const IconInfo = ({ size, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>;
export const IconTruck = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
export const IconReturn = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>;
export const IconEye = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
export const IconBack = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
export const IconExternal = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></svg>;
export const IconZoom = ({ size, ...p }: P) => <svg {...base(size, p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5M11 8v6M8 11h6" /></svg>;
export const IconRuler = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M3 17 17 3l4 4L7 21l-4-4Z" /><path d="m7 13 2 2M10 10l2 2M13 7l2 2" /></svg>;
export const IconClock = ({ size, ...p }: P) => <svg {...base(size, p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
export const IconMenu = ({ size, ...p }: P) => <svg {...base(size, p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const IconMic = ({ size, ...p }: P) => <svg {...base(size, p)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;
