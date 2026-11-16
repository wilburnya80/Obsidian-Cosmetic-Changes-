'use strict';
/* Pixel-art scene generator:
   480 x 270 units, 1 unit = 1 pixel, shape-rendering=crispEdges, SMIL animation.
   Tengen is built from code-drawn sprite pixels, auto-outlined, standing on a roof peak,
   both chained cleavers raised, pixel fireworks bursting behind him. */

const fs = require('fs'), path = require('path');
const CHARS = JSON.parse(fs.readFileSync(path.join(__dirname, 'characters.json'), 'utf8'));
const SW = 480, SH = 270;
const mixc = (a, b, t) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

function buildOne(CH) {
const out = [];
const rect = (x, y, w, h, fill, extra = '') => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${fill}' ${extra}/>`;
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const ri = (a, b) => a + Math.floor(rnd() * (b - a));

/* ---------------- sky: near-black navy -> electric blue -> violet -> magenta (from the fireworks reference) ---------------- */
const sky = CH.sky;
const band = 17;
sky.forEach((c, i) => out.push(rect(0, i * band, SW, band + 1, c)));
out.push(rect(0, sky.length * band, SW, 200, sky[sky.length - 1]));
for (let i = 1; i < sky.length; i++) for (let x = 0; x < SW; x += 4) if (rnd() < 0.5) out.push(rect(x + (i % 2) * 2, i * band - 2, 2, 2, sky[i]));
for (let s = 0; s < 40; s++) {
  const d = (1.5 + rnd() * 3).toFixed(1), b = (rnd() * 3).toFixed(1);
  out.push(`<rect x='${ri(0, SW)}' y='${ri(0, 90)}' width='1' height='1' fill='#e8e4ff'><animate attributeName='opacity' values='1;.2;1' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`);
}

/* ---------------- fireworks: 84 distinct looping animations ----------------
   12 pixel shapes (defined once in <defs>) x 8 palettes, each of the 84 bursts with its own position, size, rotation,
   duration and phase, so something is always exploding and no two bursts repeat in step. Colours come from CSS vars (--c1 inner, --c2 mid, --c3 outer). */
out.push('<!--A-->');
const FW_COUNT = 84;
const snap2 = (v) => Math.round(v / 2) * 2;
function shapePoints(type) {
  const pts = new Map();
  const add = (x, y, slot) => { const k = snap2(x) + ',' + snap2(y); if (!pts.has(k)) pts.set(k, [snap2(x), snap2(y), slot]); };
  const R = 40, TAU = Math.PI * 2;
  const rr = (() => { let sd = 1000 + type * 77; return () => ((sd = (sd * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  const slotOf = (t) => (t < 0.42 ? 0 : t < 0.74 ? 1 : 2);
  switch (type) {
    case 0: for (let r = 0; r < 40; r++) { const a = (r / 40) * TAU, len = R * (r % 3 === 0 ? 1 : r % 3 === 1 ? 0.82 : 0.66); for (let t = R * 0.2; t <= len; t += 3) add(Math.cos(a) * t, Math.sin(a) * t, slotOf(t / R)); } break;           // peony rays
    case 1: for (let r = 0; r < 72; r++) { const a = (r / 72) * TAU; for (let t = R * 0.5; t <= R; t += 3) add(Math.cos(a) * t, Math.sin(a) * t, slotOf(t / R)); } break;                                     // chrysanthemum
    case 2: for (let r = 0; r < 28; r++) { const a = (r / 28) * TAU; for (let t = R * 0.15; t <= R; t += 2.6) add(Math.cos(a) * t, Math.sin(a) * t + 0.02 * t * t, slotOf(t / R)); } break;                 // willow (drooping)
    case 3: for (let r = 0; r < 8; r++) { const a = (r / 8) * TAU; for (let t = 4; t <= R; t += 2) { const bend = 0.012 * t * t; add(Math.cos(a) * t - Math.sin(a) * bend, Math.sin(a) * t + Math.cos(a) * bend, slotOf(t / R)); } for (let k = -3; k <= 3; k += 3) add(Math.cos(a) * R + k, Math.sin(a) * R, 2); } break; // palm
    case 4: for (const [rad, n, sl] of [[R, 40, 2], [R * 0.72, 30, 1], [R * 0.44, 20, 0]]) for (let k = 0; k < n; k++) add(Math.cos((k / n) * TAU) * rad, Math.sin((k / n) * TAU) * rad, sl); break;                    // triple ring
    case 5: for (let arm = 0; arm < 3; arm++) for (let t = 0.04; t <= 1; t += 0.018) { const a = (arm / 3) * TAU + t * 3.4 * Math.PI; add(Math.cos(a) * t * R, Math.sin(a) * t * R, slotOf(t)); } break;           // spiral
    case 6: { const tips = Array.from({ length: 5 }, (_, i) => [Math.cos(-Math.PI / 2 + (i / 5) * TAU) * R, Math.sin(-Math.PI / 2 + (i / 5) * TAU) * R]); for (let i = 0; i < 5; i++) { const [x0, y0] = tips[i], [x1, y1] = tips[(i + 2) % 5]; for (let t = 0; t <= 1; t += 0.03) add(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, slotOf(Math.abs(t - 0.5) * 2)); } } break;   // pentagram star
    case 7: for (let r = 0; r < 8; r++) { const a = (r / 8) * TAU; for (let t = R * 0.15; t <= R * 0.72; t += 2.6) add(Math.cos(a) * t, Math.sin(a) * t, slotOf(t / R)); const ex = Math.cos(a) * R * 0.78, ey = Math.sin(a) * R * 0.78; for (let k = -6; k <= 6; k += 2) { add(ex + k, ey, 2); add(ex, ey + k, 2); } } break;   // crossette
    case 8: for (let k = 0; k < 190; k++) { const a = rr() * TAU, d = Math.sqrt(rr()) * R; add(Math.cos(a) * d, Math.sin(a) * d, Math.floor(rr() * 3)); } break;                                                   // sparkle disc
    case 9: for (let k = 0; k < 900; k++) { const a = (k / 900) * TAU, d = R * Math.abs(Math.cos(3 * a)); add(Math.cos(a) * d, Math.sin(a) * d, slotOf(d / R)); } for (let k = 0; k < 20; k++) add(Math.cos((k / 20) * TAU) * R * 0.2, Math.sin((k / 20) * TAU) * R * 0.2, 0); break;   // flower
    case 10: for (let r = 0; r < 48; r++) { const a = (r / 48) * TAU, long = r % 2 === 0, len = long ? R : R * 0.55; for (let t = R * 0.18; t <= len; t += 3) add(Math.cos(a) * t, Math.sin(a) * t, long ? 2 : 1); } for (let k = 0; k < 24; k++) add(Math.cos((k / 24) * TAU) * R * 0.16, Math.sin((k / 24) * TAU) * R * 0.16, 0); break;  // two-tone
    case 11: for (let k = 0; k < 400; k++) { const t = (k / 400) * TAU; const x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); add((x / 16) * R, (y / 16) * R, 2); add((x / 16) * R * 0.62, (y / 16) * R * 0.62, 1); add((x / 16) * R * 0.28, (y / 16) * R * 0.28, 0); } break;  // heart
  }
  return [...pts.values()];
}
const FW_NAMES = ['peony', 'chrysanthemum', 'willow', 'palm', 'triple-ring', 'spiral', 'star', 'crossette', 'sparkle-disc', 'flower', 'two-tone', 'heart'];
const FW_PALS = CH.fw;
const FW_NEEDS_DROP = new Set([2, 8]);
out.push(`<defs>${FW_NAMES.map((n, t) => {
  const by = [[], [], []];
  shapePoints(t).forEach(([x, y, sl]) => by[sl].push(`M${x} ${y}h2v2h-2z`));
  return `<g id='fw${t}'>${by.map((d, i) => `<path d='${d.join('')}' style='fill:var(--c${i + 1})'/>`).join('')}</g>`;
}).join('')}</defs>`);
const fwLog = [];
for (let i = 0; i < FW_COUNT; i++) {
  const type = i % 12, pal = FW_PALS[(i * 5 + Math.floor(i / 12)) % FW_PALS.length];
  const OUTLINE = new Set([5, 6, 7, 9, 11]);                                                   // outline shapes stay small so pixels stay crisp
  const size = OUTLINE.has(type) ? 14 + rnd() * 16 : i < 8 ? 46 + rnd() * 12 : 16 + rnd() * 26;   // a few hero streak bursts, many smaller ones (scale stays <= ~1.5)
  const sc = size / 40;
  const x = Math.round(((i * 0.6180339887) % 1) * 440 + 20), y = Math.round(14 + rnd() * (type === 2 ? 70 : 140));
  const dur = +(22 + rnd() * 20).toFixed(1);                                                // 22-42s cycle per burst
  const life = +(3.4 + rnd() * 1.2).toFixed(2);                                            // 3.4-4.6s of animation per cycle
  const f = life / dur, T = (v) => (v * f).toFixed(4);
  const begin = +(-rnd() * dur).toFixed(2);                                                 // phase offsets: always something exploding
  const rot = FW_NEEDS_DROP.has(type) ? 0 : Math.round(rnd() * 44);
  const steps = [0.1 + rnd() * 0.06, 0.28, 0.5, 0.72, 0.88, 1, 1.05 + rnd() * 0.05].map((v) => +(v * sc).toFixed(3));
  const kts = [0, 0.05, 0.12, 0.22, 0.34, 0.5, 0.7, 1];
  const vals = [steps[0], steps[1], steps[2], steps[3], steps[4], steps[5], steps[6], steps[6]].join(';');
  const drop = FW_NEEDS_DROP.has(type) ? `<animateTransform attributeName='transform' type='translate' calcMode='discrete' values='0 0;0 2;0 5;0 9;0 14;0 20;0 20' keyTimes='0;${T(0.2)};${T(0.35)};${T(0.5)};${T(0.65)};${T(0.82)};${T(1)}' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/>` : '';
  out.push(`<g transform='translate(${x} ${y}) rotate(${rot})'><g style='--c1:${pal[0]};--c2:${pal[1]};--c3:${pal[2]}' opacity='0'>` +
    `<animateTransform attributeName='transform' type='scale' calcMode='discrete' values='${vals}' keyTimes='${kts.map(T).join(';')}' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/>` +
    `<animate attributeName='opacity' calcMode='discrete' values='1;1;1;.8;.55;.3;.12;0;0' keyTimes='0;${T(0.3)};${T(0.5)};${T(0.62)};${T(0.74)};${T(0.84)};${T(0.92)};${T(0.98)};1' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/>` +
    `<g>${drop}<use href='#fw${type}'/></g>` + rect(-3, -3, 6, 6, pal[0]) + `</g></g>`);
  fwLog.push(`${FW_NAMES[type]}@${x},${y} R${Math.round(size)} ${dur}s`);
}
out.push('<!--/A-->');

/* white-pink flash at the right edge (reference 1) */
const disc = (cx, cy, r, col, op) => { let o = ''; for (let dy = -r; dy <= r; dy += 2) { const hw = Math.round(Math.sqrt(r * r - dy * dy) / 2) * 2; o += rect(cx - hw, cy + dy, hw * 2, 2, col, `opacity='${op}'`); } return o; };
out.push(`<g>${disc(468, 100, 22, CH.flash[0], 0.3)}${disc(468, 100, 15, CH.flash[1], 0.55)}${disc(468, 100, 8, CH.flash[2], 1)}<animate attributeName='opacity' values='1;.55;1;.8;1' dur='2.4s' repeatCount='indefinite'/></g>`);

/* pink smoke puffs drifting */
function puff(x, y, w, h, col, op, dur, dx) {
  const cells = [];
  for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) { const nx = (i - w / 2) / (w / 2), ny = (j - h / 2) / (h / 2); if (nx * nx + ny * ny < 1 - rnd() * 0.25) cells.push(`M${i} ${j}h2v2h-2z`); }
  return `<g opacity='${op}' transform='translate(${x} ${y})'><path d='${cells.join('')}' fill='${col}'/><animateTransform attributeName='transform' type='translate' values='${x} ${y}; ${x + dx} ${y - 6}; ${x} ${y}' dur='${dur}s' repeatCount='indefinite'/></g>`;
}
out.push(puff(262, 108, 22, 14, CH.smoke[0], 0.7, 14, 10), puff(214, 140, 28, 16, CH.smoke[1], 0.6, 18, -8), puff(14, 190, 26, 14, CH.smoke[0], 0.55, 16, 8), puff(350, 175, 20, 10, CH.smoke[0], 0.5, 12, -6), puff(100, 40, 18, 10, CH.smoke[2], 0.5, 15, 6));

/* blue fairy-light sparkles scattered over the lower sky (twinkling in three phases) */
for (let g = 0; g < 3; g++) {
  const cols = CH.sparkle, by = cols.map(() => []);
  for (let k = 0; k < 110; k++) { const y = 60 + Math.pow(rnd(), 0.8) * 200; by[ri(0, 4)].push(`M${ri(0, SW)} ${Math.round(y)}h${rnd() < 0.3 ? 2 : 1}v${rnd() < 0.3 ? 2 : 1}h-2z`); }
  out.push(`<g>${cols.map((c, i) => `<path d='${by[i].join('')}' fill='${c}'/>`).join('')}<animate attributeName='opacity' values='1;.25;1' dur='${(1.4 + g * 0.9).toFixed(1)}s' begin='${(g * 0.5).toFixed(1)}s' repeatCount='indefinite'/></g>`);
}
/* rising sparks */
out.push('<!--A-->');
for (let k = 0; k < 16; k++) { const x = ri(0, SW), d = (4 + rnd() * 5).toFixed(1), b = (-rnd() * 8).toFixed(1); out.push(`<rect x='0' y='0' width='1' height='2' fill='${[CH.sparkle[0], CH.a1, CH.a2][k % 3]}'><animateTransform attributeName='transform' type='translate' values='${x} 262; ${x + ri(-14, 14)} 110' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;0' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`); }
out.push('<!--/A-->');

/* ---------------- the roof peak: dark navy with a bright blue edge ---------------- */
const CX = 352, APEX = 206;
for (let y = APEX; y < SH; y++) {
  const hw = Math.round((y - APEX) * 1.7) + 6;
  const row = Math.floor((y - APEX) / 6);
  out.push(rect(CX - hw, y, hw * 2, 1, row % 2 ? CH.roof[0] : CH.roof[1]));
  out.push(rect(CX - hw, y, 3, 1, CH.roof[2]) + rect(CX + hw - 3, y, 3, 1, CH.roof[2]));
  if ((y - APEX) % 6 === 0) for (let x = CX - hw + 6; x < CX + hw - 6; x += 8) out.push(rect(x + (row % 2) * 4, y, 2, 1, mixc(CH.roof[1], CH.roof[2], 0.25)));
}
out.push(rect(CX - 10, APEX - 2, 20, 4, CH.roof[3]) + rect(CX - 12, APEX - 4, 4, 4, CH.roof[3]) + rect(CX + 8, APEX - 4, 4, 4, CH.roof[3]));
out.push(rect(CX - 10, APEX + 2, 20, 2, mixc(CH.roof[2], '#000000', 0.35)));
/* foreground rooftops, left + right edges */
[[0, 238, 130], [350, 252, 130]].forEach(([x, y, w]) => { out.push(rect(x, y, w, 40, CH.ink) + rect(x, y, w, 3, mixc(CH.roof[2], '#000000', 0.2))); for (let k = x; k < x + w; k += 6) out.push(rect(k, y + 3, 2, 3, mixc(CH.ink, CH.roof[2], 0.3))); });

/* ---------------- FIGURE: Tengen = the user's traced chibi + small chained cleavers; the other Hashira = shared chibi family + their own blade ---------------- */
if (CH.id === 'tengen') {
  const SPR = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'tengen-sprite.json'), 'utf8'));
  const MX = 14, MY = 4;
  const GW = SPR.rows[0].length + MX * 2, GH = SPR.rows.length + MY;
  const SPAL = Object.assign({ k: '#0b0b12', o: '#ff9a1f', O: '#ffc15a', w: '#ffe9c4', g: '#ffd24a', e: '#1fb27c', E: '#7af0c8', r: '#d81e3a', q: '#8e1226', c: '#a9afba', C: '#4a4f5a', p: '#d9a520', P2: '#8a5a10', x: '#8a5a10' }, SPR.pal);
  const grid = Array.from({ length: GH }, () => Array(GW).fill('.'));
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < GW && y >= 0 && y < GH) grid[y][x] = c; };

  /* ---- small cleaver in local coordinates (tip row 0, pommel last row): black blade, wavy orange edge, hole, kanji, green guard, red/green grip, gold pommel ---- */
  const BLADE = 18, GRIP = 6, SW_W = 11, SW_H = BLADE + GRIP + 5, CXL = 5;
  function makeSword(mirror) {
    const L = Array.from({ length: SW_H }, () => Array(SW_W).fill('.'));
    for (let y = 0; y < BLADE; y++) {
      const width = Math.min(6, Math.round(1 + y * 0.42)) - (y > 14 ? Math.round((y - 14) * 0.4) : 0);
      const xl = 1 + Math.round(2.5 * Math.pow(1 - y / BLADE, 2));
      const wave = Math.round(0.9 * Math.sin(y * 0.8 + 0.4));
      for (let d = 0; d < width; d++) L[y][xl + d] = d === 0 ? 'w' : d < 2 + wave ? 'o' : 'k';
      if (y >= 12 && y <= 15) for (let d = 0; d < width; d++) if ((d - 2) * (d - 2) + (y - 13.5) * (y - 13.5) <= 2.4) L[y][xl + d] = '.';   // hole
      if (y === 14 || y === 16) if (width > 3) L[y][xl + 4] = 'g';                                                                          // kanji
    }
    for (let i = -3; i <= 3; i++) L[BLADE][CXL + i] = Math.abs(i) > 2 ? 'e' : 'E';                       // guard
    for (let y = BLADE + 1; y < BLADE + 1 + GRIP; y++) for (let i = -1; i <= 0; i++) L[y][CXL + i] = ((y + i) & 1) ? 'r' : 'e';  // grip
    for (let y = BLADE + 1; y < BLADE + 1 + GRIP; y++) { L[y][CXL - 2] = 'q'; L[y][CXL + 1] = 'q'; }
    for (let i = -2; i <= 1; i++) { L[BLADE + 1 + GRIP][CXL + i] = 'p'; L[BLADE + 2 + GRIP][CXL + i] = 'x'; }                              // pommel
    return mirror ? L.map((r) => r.slice().reverse()) : L;
  }
  const SWORD = { L: makeSword(false), R: makeSword(true) };
  function stamp(L, ox, oy, deg) {
    const t = (deg * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
    for (let Y = 0; Y < GH; Y++) for (let X = 0; X < GW; X++) {
      const a = X - ox, b = Y - oy;
      const lx = Math.round(a * cs + b * sn + CXL), ly = Math.round(-a * sn + b * cs + SW_H - 1);
      if (lx >= 0 && lx < SW_W && ly >= 0 && ly < SW_H && L[ly][lx] !== '.') grid[Y][X] = L[ly][lx];
    }
  }
  const tipOf = (ox, oy, deg) => { const t = (deg * Math.PI) / 180; return [ox + (SW_H - 1) * Math.sin(t), oy - (SW_H - 1) * Math.cos(t)]; };

  /* hands = the blue wrist cuffs of the chibi (sprite cols ~8 and ~24, row ~38) */
  const HAND_L = [MX + 8, MY + 38], HAND_R = [MX + 24, MY + 38], SANG = 38;
  const ORG_L = [HAND_L[0] - 1, HAND_L[1] + 4], ORG_R = [HAND_R[0] + 1, HAND_R[1] + 4];

  /* chain between the pommels, behind the sprite */
  for (let i = 0; i <= 24; i++) { const t = i / 24; const x = ORG_L[0] + (ORG_R[0] - ORG_L[0]) * t, y = ORG_L[1] + 1 + 7 * Math.sin(Math.PI * t); if (i % 2 === 0) { put(x, y, i % 4 === 0 ? 'c' : 'C'); put(x + 1, y, i % 4 === 0 ? 'c' : 'C'); } }
  /* the sprite */
  SPR.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') grid[y + MY][x + MX] = ch; }));
  /* the two small cleavers, held at the cuffs */
  stamp(SWORD.L, ORG_L[0], ORG_L[1], -SANG); stamp(SWORD.R, ORG_R[0], ORG_R[1], SANG);

  const SCALE = 1, TX = CX - Math.round((GW * SCALE) / 2), TY = APEX + 2 - GH * SCALE;
  const sp = [];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const ch = grid[y][x]; if (ch === '.' || !SPAL[ch]) continue;
    let run = 1; while (x + run < GW && grid[y][x + run] === ch) run++;
    sp.push(rect(TX + x * SCALE, TY + y * SCALE, run * SCALE, SCALE, SPAL[ch])); x += run - 1;
  }
  const glint = (gx, gy, b) => `<g opacity='0'>${rect(gx - 1, gy - 3, 2, 6, '#ffffff')}${rect(gx - 3, gy - 1, 6, 2, '#ffffff')}<animate attributeName='opacity' values='0;1;0;0' keyTimes='0;.08;.16;1' dur='3.2s' begin='${b}s' repeatCount='indefinite'/></g>`;
  out.push(`<g>${sp.join('')}<animateTransform attributeName='transform' type='translate' values='0 0;0 -1;0 0' dur='1.6s' repeatCount='indefinite'/></g>`);
  [tipOf(ORG_L[0], ORG_L[1], -SANG), tipOf(ORG_R[0], ORG_R[1], SANG)].forEach(([tx, ty], i) => out.push(glint(TX + tx * SCALE, TY + ty * SCALE, 0.4 + i * 1.2)));
} else {
  const chibi = require('../tools/chibi.js');
  const g = chibi.gridFor(CH.id);                                   // 31 x 47 colour grid (same body as Tengen's sprite)
  const SWc = g[0].length, SHc = g.length;                        // traced sprites vary in size
  const MX = 12, MY = 16, GW = SWc + MX * 2, GH = SHc + MY;
  const grid = Array.from({ length: GH }, () => Array(GW).fill(null));
  g.forEach((row, y) => row.forEach((c, x) => { if (c) grid[y + MY][x + MX] = c; }));
  const S = CH.sword, KW = 7, KH = 36, KC = 3;
  const L = Array.from({ length: KH }, () => Array(KW).fill(null));
  for (let y = 0; y < 26; y++) {                                      // straight katana: tapered tip, bright edge, body, dark spine
    if (y < 3) { L[y][KC] = S.edge; if (y > 0) L[y][KC + 1] = S.blade; continue; }
    L[y][KC - 1] = S.edge; L[y][KC] = S.blade; L[y][KC + 1] = mixc(S.blade, '#000000', 0.45);
  }
  for (let i = -2; i <= 2; i++) L[26][KC + i] = i === 0 ? '#ffd24a' : S.guard;       // guard
  for (let y = 27; y < 33; y++) { L[y][KC - 1] = y % 2 ? '#1a1426' : '#f2f2f2'; L[y][KC] = y % 2 ? '#f2f2f2' : '#1a1426'; }   // wrapped grip
  L[33][KC - 1] = '#ffd24a'; L[33][KC] = '#ffd24a'; L[34][KC - 1] = '#a8841a'; L[34][KC] = '#a8841a';
  const mask = Array.from({ length: GH }, () => Array(GW).fill(false));
  const ORG = [Math.round(SWc * 0.8) + MX + 1, Math.round(SHc * 0.66) + MY + 5], DEG = 36, t = (DEG * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
  for (let Y = 0; Y < GH; Y++) for (let X = 0; X < GW; X++) {
    const a = X - ORG[0], b = Y - ORG[1];
    const lx = Math.round(a * cs + b * sn + KC), ly = Math.round(-a * sn + b * cs + KH - 1);
    if (lx >= 0 && lx < KW && ly >= 0 && ly < KH && L[ly][lx]) { grid[Y][X] = L[ly][lx]; mask[Y][X] = true; }
  }
  const snapG = grid.map((r) => r.slice());
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (!snapG[y][x] && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => a >= 0 && b >= 0 && a < GW && b < GH && mask[b][a])) grid[y][x] = '#120a24';
  const SC = 1.3;                                                  // same on-screen pixel density as Tengen's source art -> same visual height
  const TX = CX - (GW * SC) / 2, TY = APEX + 2 - GH * SC, sp = [];
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    const c = grid[y][x]; if (!c) continue;
    let run = 1; while (x + run < GW && grid[y][x + run] === c) run++;
    sp.push(rect(+(TX + x * SC).toFixed(2), +(TY + y * SC).toFixed(2), +(run * SC + 0.04).toFixed(2), +(SC + 0.04).toFixed(2), c)); x += run - 1;
  }
  out.push(`<g>${sp.join('')}<animateTransform attributeName='transform' type='translate' values='0 0;0 -1;0 0' dur='1.6s' repeatCount='indefinite'/></g>`);
  const tx = ORG[0] + (KH - 1) * Math.sin(t), ty = ORG[1] - (KH - 1) * Math.cos(t);
  out.push(`<g opacity='0'>${rect(TX + tx * SC - 1, TY + ty * SC - 3, 2, 6, '#ffffff')}${rect(TX + tx * SC - 3, TY + ty * SC - 1, 6, 2, '#ffffff')}<animate attributeName='opacity' values='0;1;0;0' keyTimes='0;.08;.16;1' dur='3.2s' begin='0.6s' repeatCount='indefinite'/></g>`);
}

/* a few drifting embers */
out.push('<!--A-->');
for (let k = 0; k < 14; k++) { const x = ri(0, SW), d = (5 + rnd() * 5).toFixed(1), b = (-rnd() * 8).toFixed(1); out.push(`<rect x='0' y='0' width='1' height='1' fill='${CH.a1}'><animateTransform attributeName='transform' type='translate' values='${x} 260; ${x + ri(-14, 14)} 120' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;0' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`); }
out.push('<!--/A-->');

/* ---------------- character effect ---------------- */
out.push('<!--A-->');
{
  const mv = (x0, y0, x1, y1, dur, begin, inner) => `<g>${inner}<animateTransform attributeName='transform' type='translate' values='${x0} ${y0}; ${x1} ${y1}' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/></g>`;
  const mvp = (pts, dur, begin, inner) => `<g>${inner}<animateTransform attributeName='transform' type='translate' values='${pts.map((p) => p.join(' ')).join('; ')}' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/></g>`;
  const P = [CH.a1, CH.a2, CH.sparkle[0], CH.sparkle[2]];
  const EX = CH.extra;
  if (EX === 'droplets') for (let k = 0; k < 34; k++) out.push(mv(ri(0, SW), -8, ri(0, SW), 262, (4 + rnd() * 5).toFixed(1), (-rnd() * 9).toFixed(1), rect(0, 0, 1, 2, P[k % 4]) + rect(0, 2, 1, 1, '#ffffff', "opacity='.6'")));
  if (EX === 'butterflies') for (let k = 0; k < 10; k++) { const y = ri(30, 190), c = P[k % 2]; out.push(mvp([[-12, y], [110, y - 16], [230, y + 10], [350, y - 14], [492, y + 4]], (22 + rnd() * 18).toFixed(0), (-rnd() * 30).toFixed(1), rect(-3, -1, 3, 3, c) + rect(1, -1, 3, 3, c) + rect(0, 0, 1, 3, '#ffffff') + `<animate attributeName='opacity' values='1;.55;1' dur='0.6s' repeatCount='indefinite'/>`)); }
  if (EX === 'embers') for (let k = 0; k < 46; k++) out.push(mvp([[ri(0, SW), 262], [ri(0, SW), 170], [ri(0, SW), 60]], (4 + rnd() * 5).toFixed(1), (-rnd() * 9).toFixed(1), rect(0, 0, rnd() < 0.3 ? 2 : 1, rnd() < 0.3 ? 2 : 1, P[k % 3]) + `<animate attributeName='opacity' values='0;1;.8;0' dur='${(4 + rnd() * 3).toFixed(1)}s' repeatCount='indefinite'/>`));
  if (EX === 'fog') for (let k = 0; k < 7; k++) { const y = ri(110, 235), w = ri(60, 120); let cells = ''; for (let j = 0; j < 14; j += 2) for (let i = 0; i < w; i += 4) { const nx = (i - w / 2) / (w / 2), ny = (j - 7) / 7; if (nx * nx + ny * ny < 1 - rnd() * 0.25) cells += `M${i} ${j}h4v2h-4z`; } out.push(mv(-w - 10, y, SW + 10, y + ri(-6, 6), (55 + rnd() * 40).toFixed(0), (-rnd() * 80).toFixed(0), `<path d='${cells}' fill='${CH.smoke[0]}' opacity='${(0.14 + rnd() * 0.1).toFixed(2)}'/>`)); }
  if (EX === 'hearts') { const H = ['.x.x.', 'xxxxx', '.xxx.', '..x..']; for (let k = 0; k < 16; k++) { const x = ri(10, 470), c = k % 3 === 0 ? '#ffffff' : P[k % 2]; let cells = ''; H.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === 'x') cells += `M${i} ${j}h1v1h-1z`; })); out.push(mvp([[x, 266], [x + 10, 190], [x - 8, 110], [x + 6, 20]], (11 + rnd() * 9).toFixed(0), (-rnd() * 18).toFixed(1), `<path d='${cells}' fill='${c}'/>`)); } }
  if (EX === 'snake') for (let k = 0; k < 2; k++) { let cells = ''; for (let i = 0; i < 44; i++) cells += `<rect x='${i * 3}' y='${Math.round(4 * Math.sin(i * 0.65))}' width='3' height='3' fill='${i % 6 < 3 ? CH.a1 : CH.a2}'/>`; cells += rect(44 * 3, Math.round(4 * Math.sin(44 * 0.65)) - 1, 4, 4, CH.a2) + rect(44 * 3 + 2, Math.round(4 * Math.sin(44 * 0.65)), 1, 1, '#ff2d2d'); out.push(mv(-150, 120 + k * 70, SW + 40, 100 + k * 70, 34 + k * 8, -k * 14, cells)); }
  if (EX === 'pebbles') for (let k = 0; k < 24; k++) out.push(mvp([[ri(0, SW), 262], [ri(0, SW), 190], [ri(0, SW), 90]], (13 + rnd() * 11).toFixed(0), (-rnd() * 24).toFixed(1), rect(0, 0, 2, 2, P[k % 3]) + `<animate attributeName='opacity' values='0;.9;.9;0' dur='${(13 + rnd() * 6).toFixed(0)}s' repeatCount='indefinite'/>`));
  if (EX === 'wind') for (let k = 0; k < 20; k++) { const y = ri(14, 230), L = ri(8, 22); out.push(mv(-30, y, SW + 30, y + ri(-14, 14), (2.5 + rnd() * 3.5).toFixed(1), (-rnd() * 6).toFixed(1), rect(0, 0, L, 1, P[k % 4]) + rect(L - 3, 1, 3, 1, P[(k + 1) % 4], "opacity='.7'"))); }
}
out.push('<!--/A-->');

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${SW}' height='${SH}' viewBox='0 0 ${SW} ${SH}' preserveAspectRatio='xMaxYMax slice' shape-rendering='crispEdges'>${out.join('')}</svg>`;
/* animated=false -> a still scene: no fireworks, rising sparks or embers, and every SMIL animation removed (smoke, stars, sparkles, Tengen frozen). */
const stillSvg = svg.replace(/<!--A-->[\s\S]*?<!--\/A-->/g, '').replace(/<animate(Transform)?\b[^>]*?(\/>|>[\s\S]*?<\/animate(Transform)?>)/g, '');
return { svg, stillSvg, count: FW_COUNT };
}

const CACHE = {};
function get(id) {
  id = id || CHARS.default;
  if (!CACHE[id]) CACHE[id] = buildOne(CHARS.characters.find((c) => c.id === id) || CHARS.characters[0]);
  return CACHE[id];
}
module.exports = { buildSceneSvg: (animated = true, id) => (animated ? get(id).svg : get(id).stillSvg), fireworkCount: 84, characters: CHARS.characters, defaultCharacter: CHARS.default };
if (require.main === module) { const id = process.argv[3] || 'tengen'; fs.writeFileSync(process.argv[2] || 'scene.svg', get(id).svg); console.log('scene', id, get(id).svg.length, 'bytes'); }
