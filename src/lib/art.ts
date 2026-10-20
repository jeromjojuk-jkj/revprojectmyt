// Generates the illustrated product images used by the SAMPLE catalogue.
// These stand in for authorised product photography in the prototype.

import type { ArtKind } from "./types.ts";

const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
const toRgb = (hex: string) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
const toHex = (r: number[]) => "#" + r.map((x) => clamp(x).toString(16).padStart(2, "0")).join("");
export const mix = (a: string, b: string, t: number) => {
  const A = toRgb(a), B = toRgb(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};
const lum = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

type Draw = (fill: string, line: string, hex: string) => string;

const P = (d: string, fill: string, line: string, extra = "") =>
  `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="3" stroke-linejoin="round" ${extra}/>`;
const L = (d: string, line: string, w = 3, extra = "") =>
  `<path d="${d}" fill="none" stroke="${line}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

const SHAPES: Record<ArtKind, Draw> = {
  tee: (f, l) =>
    P("M150 100 Q200 130 250 100 L320 130 L350 200 L300 220 L290 190 L290 420 L110 420 L110 190 L100 220 L50 200 L80 130 Z", f, l) +
    L("M150 100 Q200 142 250 100", l) + L("M110 190 L110 420", l, 2, 'opacity=".25"'),
  shirt: (f, l) =>
    P("M150 100 L250 100 L320 125 L355 330 L315 338 L290 200 L290 430 L110 430 L110 200 L85 338 L45 330 L80 125 Z", f, l) +
    P("M150 100 L200 150 L250 100 L238 88 L200 124 L162 88 Z", f, l) + L("M200 150 L200 430", l, 2) +
    [180, 230, 280, 330, 380].map((y) => `<circle cx="208" cy="${y}" r="4" fill="${l}"/>`).join(""),
  hoodie: (f, l) =>
    P("M150 105 Q140 48 200 44 Q260 48 250 105 Z", f, l) +
    P("M150 100 L250 100 L320 125 L355 340 L315 348 L290 210 L290 430 L110 430 L110 210 L85 348 L45 340 L80 125 Z", f, l) +
    L("M150 104 Q200 140 250 104", l) + L("M200 125 L200 430", l, 2) +
    L("M130 320 L270 320 L285 400 L115 400 Z", l, 2.5) + L("M185 140 L182 200 M215 140 L218 200", l, 2),
  jeans: (f, l) =>
    P("M125 80 L275 80 L292 440 L215 440 L200 170 L185 440 L108 440 Z", f, l) +
    L("M125 100 L275 100", l, 2) + L("M140 102 Q150 140 182 142 M260 102 Q250 140 218 142 M200 102 L200 165", l, 2),
  cargo: (f, l) =>
    P("M125 80 L275 80 L292 440 L215 440 L200 170 L185 440 L108 440 Z", f, l) +
    L("M125 100 L275 100", l, 2) + P("M116 240 L160 240 L162 305 L117 305 Z", f, l) + P("M240 240 L284 240 L285 305 L238 305 Z", f, l) +
    L("M112 420 L186 420 M214 420 L290 420", l, 2.5),
  dress: (f, l) =>
    P("M168 72 L232 72 L240 160 Q234 188 226 200 L322 450 L78 450 L174 200 Q166 188 160 160 Z", f, l) +
    L("M172 72 L178 38 M228 72 L222 38", l, 3) + L("M174 200 Q200 214 226 200", l, 2) + L("M168 72 Q200 100 232 72", l, 2),
  kurti: (f, l, h) =>
    P("M150 90 Q200 125 250 90 L300 110 L330 240 L298 248 L280 170 L285 455 L115 455 L120 170 L102 248 L70 240 L100 110 Z", f, l) +
    L("M200 112 L200 168 M120 385 L118 455 M280 385 L282 455", l, 2) +
    [0, 1, 2, 3, 4, 5, 6].map((i) => `<circle cx="${158 + i * 14}" cy="${150 + Math.abs(3 - i) * -4}" r="3.2" fill="${mix(h, "ffffff", 0.7)}"/>`).join(""),
  top: (f, l) =>
    P("M150 140 Q200 158 250 140 L310 160 L330 215 L290 225 L285 205 L285 330 L115 330 L115 205 L110 225 L70 215 L90 160 Z", f, l) +
    L("M165 142 L165 176 L235 176 L235 142", l, 2.5) + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => L(`M${130 + i * 20} 200 L${130 + i * 20} 325`, l, 1, 'opacity=".25"')).join(""),
  skirt: (f, l) =>
    P("M140 130 L260 130 L322 400 L78 400 Z", f, l) + L("M140 152 L260 152", l, 2) +
    [0, 1, 2, 3, 4].map((i) => L(`M${160 + i * 20} 152 L${110 + i * 45} 400`, l, 2, 'opacity=".5"')).join(""),
  coord: (f, l) =>
    P("M140 60 L260 60 L300 82 L312 168 L282 172 L276 148 L276 228 L124 228 L124 148 L118 172 L88 168 L100 82 Z", f, l) +
    L("M175 60 L200 92 L225 60", l, 2) +
    P("M135 245 L265 245 L285 455 L215 455 L200 300 L185 455 L115 455 Z", f, l) + L("M135 262 L265 262", l, 2),
  sneaker: (f, l) =>
    P("M60 340 Q58 282 110 270 L180 255 Q215 225 255 240 L292 276 Q346 286 350 330 L350 345 L60 345 Z", f, l) +
    P("M48 345 L362 345 Q366 376 340 382 L70 382 Q46 378 48 345 Z", "#fbfbf8", l) +
    L("M190 262 L214 286 M206 254 L232 279 M223 248 L248 272", l, 3) + L("M70 362 L340 362", l, 1.5, 'opacity=".35"'),
  slide: (f, l) =>
    P("M66 360 Q60 328 112 324 L300 318 Q352 318 348 350 Q342 376 300 376 L112 380 Q70 382 66 360 Z", "#e7e2d6", l) +
    P("M150 334 Q160 252 240 252 Q302 258 302 330 Z", f, l) + L("M175 300 Q230 270 290 300", l, 2, 'opacity=".4"'),
  heel: (f, l) =>
    P("M80 280 L130 284 L240 364 L346 378 L342 394 L234 384 L124 302 L80 298 Z", mix("171717", "ffffff", 0.15), l) +
    P("M86 297 L124 300 L120 402 L94 402 Z", mix("171717", "ffffff", 0.15), l) +
    P("M195 302 Q262 266 336 344 L344 380 L238 366 Z", f, l),
  boot: (f, l, h) =>
    P("M140 100 L250 100 L256 300 Q330 310 346 352 L346 392 L120 392 L120 300 Z", f, l) +
    P("M244 140 Q222 200 250 268 L258 268 Q236 200 256 140 Z", mix(h, "000000", 0.35), l) +
    P("M114 392 L352 392 L352 414 L114 414 Z", "#2a2a2a", l) + L("M150 100 L150 70 L178 70 L178 100", l, 4),
  tote: (f, l) =>
    L("M140 210 Q138 100 200 100 Q262 100 260 210", f, 16) + L("M140 210 Q138 100 200 100 Q262 100 260 210", l, 2, 'opacity=".4"') +
    P("M100 200 L300 200 L320 432 L80 432 Z", f, l) + L("M150 270 L250 270 L250 340 L150 340 Z", l, 2, 'opacity=".5"'),
  sling: (f, l) =>
    L("M124 214 Q200 10 276 214", l, 8) +
    P("M110 230 Q110 200 140 200 L260 200 Q290 200 290 230 L290 372 Q290 402 260 402 L140 402 Q110 402 110 372 Z", f, l) +
    P("M110 232 Q110 200 140 200 L260 200 Q290 200 290 232 L290 290 Q200 320 110 290 Z", f, l) +
    `<circle cx="200" cy="300" r="9" fill="#c9a24a" stroke="${l}" stroke-width="2"/>`,
  backpack: (f, l) =>
    L("M178 92 Q200 58 222 92", l, 8) +
    P("M110 140 Q110 90 200 90 Q290 90 290 140 L300 420 Q300 442 278 442 L122 442 Q100 442 100 420 Z", f, l) +
    P("M135 290 L265 290 L270 412 L130 412 Z", f, l) + L("M140 310 L260 310", l, 2) + L("M125 150 Q200 175 275 150", l, 2),
  earrings: (f, l) =>
    `<circle cx="132" cy="285" r="62" fill="none" stroke="${f}" stroke-width="13"/><circle cx="132" cy="285" r="62" fill="none" stroke="${l}" stroke-width="1.5" opacity=".5"/>` +
    `<circle cx="268" cy="285" r="62" fill="none" stroke="${f}" stroke-width="13"/><circle cx="268" cy="285" r="62" fill="none" stroke="${l}" stroke-width="1.5" opacity=".5"/>` +
    `<circle cx="132" cy="210" r="10" fill="${f}" stroke="${l}" stroke-width="2"/><circle cx="268" cy="210" r="10" fill="${f}" stroke="${l}" stroke-width="2"/>`,
  necklace: (f, l) =>
    L("M100 110 Q200 370 300 110", f, 5) +
    `<path d="M200 232 L208 252 L230 254 L213 268 L218 290 L200 278 L182 290 L187 268 L170 254 L192 252 Z" fill="${f}" stroke="${l}" stroke-width="2"/>`,
  bracelet: (f, l, h) =>
    Array.from({ length: 18 }, (_, i) => {
      const a = (i / 18) * Math.PI * 2;
      const c = i % 3 === 0 ? f : i % 3 === 1 ? mix(h, "ffffff", 0.45) : mix(h, "000000", 0.15);
      return `<circle cx="${(200 + Math.cos(a) * 115).toFixed(1)}" cy="${(270 + Math.sin(a) * 72).toFixed(1)}" r="17" fill="${c}" stroke="${l}" stroke-width="1.5"/>`;
    }).join("") + `<path d="M196 350 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 Z" fill="#c9a24a"/>`,
  lipstick: (f, l) =>
    P("M175 202 L175 132 Q200 92 225 100 L225 202 Z", f, l) +
    P("M166 200 L234 200 L234 262 L166 262 Z", "#c9a24a", l) + P("M158 262 L242 262 L242 432 L158 432 Z", "#1f1f1f", l),
  serum: (f, l, h) =>
    P("M186 124 Q186 66 200 66 Q214 66 214 124 Z", "#2a2a2a", l) + P("M176 122 L224 122 L224 182 L176 182 Z", "#1f1f1f", l) +
    P("M140 202 Q140 182 160 182 L240 182 Q260 182 260 202 L260 420 Q260 442 240 442 L160 442 Q140 442 140 420 Z", mix(h, "ffffff", 0.25), l, 'fill-opacity=".9"') +
    `<rect x="158" y="270" width="84" height="90" rx="6" fill="#fffdf6" stroke="${l}" stroke-width="1.5"/>` + L("M172 300 L228 300 M172 318 L216 318", l, 3, 'opacity=".5"'),
  palette: (f, l, h) =>
    `<rect x="64" y="140" width="272" height="270" rx="22" fill="#1f1f1f" stroke="${l}" stroke-width="3"/>` +
    Array.from({ length: 9 }, (_, i) => {
      const t = [0.55, 0.35, 0.15, 0, -0.15, 0.25, 0.45, -0.3, 0.1][i];
      const c = t >= 0 ? mix(h, "ffffff", t) : mix(h, "000000", -t);
      return `<circle cx="${120 + (i % 3) * 80}" cy="${200 + Math.floor(i / 3) * 75}" r="30" fill="${c}"/>`;
    }).join(""),
  kajal: (f, l) =>
    `<g transform="rotate(-35 200 260)">` + P("M90 238 L280 238 L280 282 L90 282 Z", f, l) +
    P("M280 238 L322 238 L322 282 L280 282 Z", "#c9a24a", l) + P("M90 238 L58 252 L58 268 L90 282 Z", mix("171717", "ffffff", 0.1), l) + `</g>`,
  cream: (f, l, h) =>
    `<ellipse cx="300" cy="380" rx="60" ry="26" fill="${f}" opacity=".9"/>` +
    P("M140 80 L260 80 L260 102 L140 102 Z", mix(h, "ffffff", 0.6), l) +
    P("M146 102 L254 102 L240 352 L160 352 Z", "#fffdf6", l) + P("M160 352 L240 352 L240 420 L160 420 Z", f, l) +
    `<rect x="172" y="190" width="56" height="70" rx="5" fill="${f}" opacity=".85"/>`,
  cap: (f, l) =>
    P("M86 300 Q86 150 214 148 Q330 152 330 300 Z", f, l) + P("M300 296 Q384 296 384 326 Q300 344 214 318 Z", f, l) +
    L("M214 150 L206 300 M150 170 Q140 240 150 300", l, 2, 'opacity=".5"') + `<circle cx="214" cy="150" r="9" fill="${f}" stroke="${l}" stroke-width="2"/>`,
  sunglasses: (f, l) =>
    `<ellipse cx="128" cy="262" rx="66" ry="52" fill="${f}" stroke="#111" stroke-width="7"/><ellipse cx="272" cy="262" rx="66" ry="52" fill="${f}" stroke="#111" stroke-width="7"/>` +
    L("M190 250 Q200 232 210 250", "#111", 7) + L("M62 250 L28 238 M338 250 L372 238", "#111", 6) +
    `<path d="M95 238 Q110 228 128 230" stroke="#fff" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>`,
  watch: (f, l, h) =>
    P("M168 70 L232 70 L232 446 L168 446 Z", f, l) +
    `<circle cx="200" cy="258" r="86" fill="#d4d4d8" stroke="${l}" stroke-width="3"/><circle cx="200" cy="258" r="72" fill="${lum(h) > 0.2 ? "#fafafa" : "#111827"}"/>` +
    L("M200 258 L200 206 M200 258 L236 276", lum(h) > 0.2 ? "#111" : "#f5f5f4", 4) + `<rect x="284" y="250" width="12" height="16" rx="3" fill="#a1a1aa"/>`,
  belt: (f, l) =>
    `<rect x="30" y="226" width="300" height="60" rx="10" fill="${f}" stroke="${l}" stroke-width="3"/>` +
    [0, 1, 2, 3].map((i) => `<circle cx="${80 + i * 34}" cy="256" r="6" fill="${l}" opacity=".6"/>`).join("") +
    `<rect x="300" y="210" width="76" height="92" rx="12" fill="none" stroke="#a1a1aa" stroke-width="11"/>` + L("M300 256 L360 256", "#a1a1aa", 7),
  scrunchie: (f, l, h) =>
    Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      return `<ellipse cx="${(200 + Math.cos(a) * 92).toFixed(1)}" cy="${(260 + Math.sin(a) * 92).toFixed(1)}" rx="44" ry="34" transform="rotate(${((a * 180) / Math.PI + 90).toFixed(0)} ${(200 + Math.cos(a) * 92).toFixed(1)} ${(260 + Math.sin(a) * 92).toFixed(1)})" fill="${i % 2 ? f : mix(h, "ffffff", 0.25)}" stroke="${l}" stroke-width="1.5"/>`;
    }).join("") + `<circle cx="200" cy="260" r="44" fill="var(--bg)"/>`,
};

export const ART_KINDS = Object.keys(SHAPES) as ArtKind[];

export function renderArt(kind: ArtKind, hex: string, view: 1 | 2): string {
  const h = /^[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : "999999";
  const bg = view === 1 ? mix(h, "f7f8f5", 0.9) : mix("f8cb46", "ffffff", 0.72);
  const line = lum(h) < 0.08 ? mix(h, "ffffff", 0.45) : mix(h, "000000", 0.35);
  const fill = "#" + h;
  const body = SHAPES[kind](fill, line, h).replace(/var\(--bg\)/g, bg);
  const zoom = view === 2 ? `transform="translate(200 260) scale(1.45) translate(-200 -260)"` : "";
  const star = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#b89548"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="800" height="1000" role="img" aria-label="Illustration">
<rect width="400" height="500" fill="${bg}"/>
<circle cx="200" cy="255" r="170" fill="none" stroke="#b89548" stroke-opacity=".35" stroke-width="1.4"/>
<circle cx="200" cy="255" r="150" fill="#ffffff" fill-opacity="${view === 1 ? 0.35 : 0.2}"/>
<g stroke="#b89548" stroke-opacity=".45" stroke-width="1">
<path d="M34 64 L74 40 L108 72 L72 98" fill="none"/><path d="M300 446 L334 424 L366 452" fill="none"/></g>
${star(34, 64)}${star(74, 40)}${star(108, 72)}${star(72, 98)}${star(300, 446)}${star(334, 424)}${star(366, 452)}
<g ${zoom}>${body}</g>
<text x="16" y="488" font-family="Poppins, Arial, sans-serif" font-size="12" fill="#171717" fill-opacity=".45">krip · sample illustration</text>
</svg>`;
}

/** For generated art only: show the selected colour's illustration. */
export function imageForColor(src: string, hex: string) {
  return src.replace(/^(\/art\/[a-z]+-)[0-9a-f]{6}(-\d\.svg)$/i, `$1${hex.replace("#", "").toLowerCase()}$2`);
}
