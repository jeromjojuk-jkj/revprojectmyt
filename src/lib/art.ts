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

  // ---------- Home & gadgets ----------
  chopper: (f, l) =>
    P("M95 250 L305 250 L292 420 Q290 436 274 436 L126 436 Q110 436 108 420 Z", "#eef2f3", l, 'fill-opacity=".85"') +
    P("M85 220 Q85 200 105 200 L295 200 Q315 200 315 220 L315 252 L85 252 Z", f, l) +
    P("M188 200 L188 120 Q188 100 200 100 Q212 100 212 120 L212 200 Z", f, l) + P("M160 96 L240 96 Q252 96 252 108 L252 118 L148 118 L148 108 Q148 96 160 96 Z", f, l) +
    L("M130 360 L270 330 M140 400 L262 300", "#9aa3a8", 4) + `<circle cx="200" cy="345" r="16" fill="#cfd6d9" stroke="${l}" stroke-width="2"/>`,
  peeler: (f, l) =>
    P("M178 230 L222 230 L232 440 Q232 452 220 452 L180 452 Q168 452 168 440 Z", f, l) +
    L("M188 260 L188 420", l, 2, 'opacity=".35"') + `<circle cx="200" cy="420" r="9" fill="var(--bg)" stroke="${l}" stroke-width="2.5"/>` +
    P("M120 90 L280 90 L280 110 L222 230 L178 230 L120 110 Z", "#d7dde0", "#7c8a91") + L("M140 100 L260 100", "#7c8a91", 4) + P("M150 104 L250 104 L248 116 L152 116 Z", "#eef2f3", "#7c8a91"),
  bottle: (f, l) =>
    P("M168 92 L232 92 L232 140 L168 140 Z", f, l) +
    P("M162 140 L238 140 Q270 170 270 220 L270 420 Q270 446 244 446 L156 446 Q130 446 130 420 L130 220 Q130 170 162 140 Z", "#e7f3f6", "#8aa6b0", 'fill-opacity=".9"') +
    P("M134 300 L266 300 L266 420 Q266 442 244 442 L156 442 Q134 442 134 420 Z", "#bfe3ee", "none", 'opacity=".8"') +
    P("M136 236 L264 236 L264 290 L136 290 Z", f, l) + L("M150 180 L150 410", "#ffffff", 6, 'opacity=".7"'),
  cloth: (f, l, h) =>
    [2, 1, 0].map((i) => P(`M${88 + i * 18} ${150 + i * 50} L${312 - i * 6} ${130 + i * 50} L${318 - i * 6} ${230 + i * 50} L${92 + i * 18} ${250 + i * 50} Z`, i === 0 ? f : mix(h, i === 1 ? "ffffff" : "000000", 0.25), l)).join("") +
    Array.from({ length: 10 }, (_, i) => L(`M${100 + i * 21} 160 L${104 + i * 21} 248`, l, 1, 'opacity=".25"')).join(""),
  brush: (f, l) =>
    P("M120 300 L330 160 Q346 150 354 164 L360 174 Q366 188 350 196 L142 334 Z", f, l) +
    P("M70 320 L140 290 L160 340 L92 372 Z", "#3a3a3a", "#222") +
    Array.from({ length: 9 }, (_, i) => L(`M${82 + i * 8} ${352 - i * 3} L${66 + i * 8} ${400 - i * 2}`, "#2b2b2b", 3)).join(""),
  organizer: (f, l, h) =>
    P("M70 210 L330 210 L330 420 Q330 436 314 436 L86 436 Q70 436 70 420 Z", f, l) +
    P("M70 210 L110 170 L370 170 L330 210 Z", mix(h, "ffffff", 0.3), l) + P("M330 210 L370 170 L370 380 L330 420 Z", mix(h, "000000", 0.15), l) +
    L("M156 214 L156 432 M244 214 L244 432 M74 320 L326 320", l, 3),
  hook: (f, l) =>
    [0, 1].map((i) => {
      const x = 120 + i * 170;
      return P(`M${x - 46} 110 L${x + 46} 110 Q${x + 58} 110 ${x + 58} 122 L${x + 58} 210 Q${x + 58} 222 ${x + 46} 222 L${x - 46} 222 Q${x - 58} 222 ${x - 58} 210 L${x - 58} 122 Q${x - 58} 110 ${x - 46} 110 Z`, "#f4f4f2", l) +
        L(`M${x} 200 L${x} 330 Q${x} 380 ${x + 40} 380 Q${x + 70} 380 ${x + 70} 340`, l, 18) + L(`M${x} 200 L${x} 330 Q${x} 380 ${x + 40} 380 Q${x + 70} 380 ${x + 70} 340`, f, 11);
    }).join(""),
  lock: (f, l) =>
    P("M80 150 L190 150 L190 230 L80 230 Z", f, l) + P("M210 150 L320 150 L320 230 L210 230 Z", f, l) +
    L("M135 230 L135 300 Q135 380 200 380 Q265 380 265 300 L265 230", l, 22) + L("M135 230 L135 300 Q135 380 200 380 Q265 380 265 300 L265 230", f, 14) +
    `<circle cx="200" cy="380" r="22" fill="${f}" stroke="${l}" stroke-width="3"/>`,
  corner: (f, l, h) =>
    [0, 1, 2, 3].map((i) => {
      const x = 110 + (i % 2) * 180, y = 150 + Math.floor(i / 2) * 170;
      return P(`M${x - 60} ${y - 50} L${x + 50} ${y - 50} Q${x + 60} ${y - 50} ${x + 60} ${y - 40} L${x + 60} ${y - 10} L${x - 30} ${y - 10} L${x - 30} ${y + 70} L${x - 50} ${y + 70} Q${x - 60} ${y + 70} ${x - 60} ${y + 60} Z`, i % 2 ? mix(h, "ffffff", 0.2) : f, l);
    }).join(""),
  holder: (f, l) =>
    P("M70 130 L330 130 Q342 130 342 142 L342 250 Q342 262 330 262 L70 262 Q58 262 58 250 L58 142 Q58 130 70 130 Z", f, l) +
    [0, 1, 2, 3].map((i) => `<circle cx="${110 + i * 60}" cy="180" r="15" fill="var(--bg)" stroke="${l}" stroke-width="2.5"/>`).join("") +
    [0, 1].map((i) => L(`M${110 + i * 60} 180 L${110 + i * 60} 90`, ["#38bdf8", "#f472b6"][i], 12)).join("") +
    P("M80 262 L320 262 L304 300 L96 300 Z", "#e7e5e4", l),
  nightlight: (f, l) =>
    P("M130 150 Q130 120 160 120 L240 120 Q270 120 270 150 L270 370 Q270 400 240 400 L160 400 Q130 400 130 370 Z", "#fafaf7", l) +
    `<circle cx="200" cy="240" r="72" fill="#fff4c2" stroke="${l}" stroke-width="2"/><circle cx="200" cy="240" r="110" fill="#ffd703" opacity=".18"/>` +
    `<circle cx="200" cy="350" r="16" fill="${f}" stroke="${l}" stroke-width="2"/>`,
  clip: (f, l) =>
    [0, 1, 2].map((i) => {
      const x = 100 + i * 100;
      return P(`M${x - 34} 300 L${x + 34} 300 L${x + 34} 360 L${x - 34} 360 Z`, f, l) + L(`M${x - 22} 300 Q${x - 22} 250 ${x} 250 Q${x + 22} 250 ${x + 22} 300`, l, 14) + L(`M${x - 22} 300 Q${x - 22} 250 ${x} 250 Q${x + 22} 250 ${x + 22} 300`, f, 8);
    }).join("") + L("M40 270 Q120 240 200 270 T360 270", "#3a3a3a", 7) + L("M40 286 Q120 256 200 286 T360 286", "#6b7280", 6),
  stand: (f, l) =>
    P("M110 420 L290 420 L300 440 L100 440 Z", f, l) + L("M200 420 L250 250", l, 16) + L("M200 420 L250 250", f, 10) +
    P("M170 110 Q170 92 188 94 L300 110 Q318 112 314 130 L282 330 Q279 348 262 345 L150 330 Q132 327 136 310 Z", "#1f2937", "#111") +
    P("M178 122 L298 138 L270 326 L152 312 Z", "#7dd3fc", "none", 'opacity=".75"'),
  timer: (f, l) =>
    P("M100 140 Q100 110 130 110 L270 110 Q300 110 300 140 L300 380 Q300 410 270 410 L130 410 Q100 410 100 380 Z", f, l) +
    P("M128 140 L272 140 L272 230 L128 230 Z", "#1f2a1f", "#111") +
    `<text x="200" y="202" text-anchor="middle" font-family="monospace" font-size="52" fill="#a3e635">05:00</text>` +
    [0, 1, 2].map((i) => `<rect x="${130 + i * 50}" y="270" width="40" height="40" rx="10" fill="#fafafa" stroke="${l}" stroke-width="2"/>`).join("") +
    `<rect x="130" y="330" width="140" height="42" rx="12" fill="#fafafa" stroke="${l}" stroke-width="2"/>`,
};

export const ART_KINDS = Object.keys(SHAPES) as ArtKind[];

const FABRIC: ArtKind[] = ["tee", "shirt", "hoodie", "jeans", "cargo", "dress", "kurti", "top", "skirt", "coord", "cap", "tote", "scrunchie"];

export function renderArt(kind: ArtKind, hex: string, view: 1 | 2): string {
  const h = /^[0-9a-f]{6}$/i.test(hex) ? hex.toLowerCase() : "999999";
  const bg = view === 1 ? mix(h, "f7f8f5", 0.9) : mix("ffd703", "ffffff", 0.72);
  const line = lum(h) < 0.08 ? mix(h, "ffffff", 0.45) : mix(h, "000000", 0.35);
  // Studio lighting: key light from top-left gives each piece volume.
  const hi = lum(h) < 0.05 ? mix(h, "ffffff", 0.32) : mix(h, "ffffff", 0.3);
  const lo = mix(h, "000000", 0.3);
  const body = SHAPES[kind]("url(#tone)", line, h).replace(/var\(--bg\)/g, bg);
  const texture = FABRIC.includes(kind)
    ? SHAPES[kind]("url(#weave)", "none", h).replace(/var\(--bg\)/g, "none").replace(/fill="#(?:fbfbf8|fffdf6|c9a24a|1f1f1f|2a2a2a)"/g, 'fill="none"')
    : "";
  const zoom = view === 2 ? `transform="translate(200 260) scale(1.45) translate(-200 -260)"` : "";
  const star = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#b89548"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="800" height="1000" role="img" aria-label="Illustration">
<defs>
<radialGradient id="studio" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".6" stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".06"/></radialGradient>
<linearGradient id="tone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".45" stop-color="#${h}"/><stop offset="1" stop-color="${lo}"/></linearGradient>
<pattern id="weave" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="none"/><path d="M0 0 L0 6" stroke="#ffffff" stroke-opacity=".05" stroke-width="1"/></pattern>
<radialGradient id="floor" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".18"/></filter>
</defs>
<rect width="400" height="500" fill="${bg}"/>
<rect width="400" height="500" fill="url(#studio)"/>
<circle cx="200" cy="255" r="170" fill="none" stroke="#b89548" stroke-opacity=".35" stroke-width="1.4"/>
<g stroke="#b89548" stroke-opacity=".45" stroke-width="1">
<path d="M34 64 L74 40 L108 72 L72 98" fill="none"/><path d="M300 446 L334 424 L366 452" fill="none"/></g>
${star(34, 64)}${star(74, 40)}${star(108, 72)}${star(72, 98)}${star(300, 446)}${star(334, 424)}${star(366, 452)}
<ellipse cx="200" cy="452" rx="130" ry="16" fill="url(#floor)"/>
<g ${zoom}><g filter="url(#lift)">${body}</g>${texture}</g>
<text x="16" y="488" font-family="Poppins, Arial, sans-serif" font-size="12" fill="#171717" fill-opacity=".45">krip · sample illustration</text>
</svg>`;
}

/** For generated art only: show the selected colour's illustration. */
export function imageForColor(src: string, hex: string) {
  return src.replace(/^(\/art\/[a-z]+-)[0-9a-f]{6}(-\d\.svg)$/i, `$1${hex.replace("#", "").toLowerCase()}$2`);
}
