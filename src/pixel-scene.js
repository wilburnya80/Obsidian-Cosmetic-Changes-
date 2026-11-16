'use strict';
/* Pixel-art scene generator (same technique as dnd-game-brain/_builder/pixelart.ps1):
   480 x 270 units, 1 unit = 1 pixel, shape-rendering=crispEdges, SMIL animation.
   Tengen is built from code-drawn sprite pixels, auto-outlined, standing on a roof peak,
   both chained cleavers raised, pixel fireworks bursting behind him. */

const SW = 480, SH = 270;
const out = [];
const rect = (x, y, w, h, fill, extra = '') => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${fill}' ${extra}/>`;
let seed = 11;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const ri = (a, b) => a + Math.floor(rnd() * (b - a));

/* ---------------- sky: near-black navy -> electric blue -> violet -> magenta (from the fireworks reference) ---------------- */
const sky = ['#02010a', '#04021a', '#060330', '#090546', '#0c0766', '#10088a', '#1a0eb0', '#2414d0', '#2c22e8', '#3a2ae8', '#5230e0', '#6a32dc', '#7e34d8', '#8c36d0', '#7a2fc0', '#5a2a9a'];
const band = 17;
sky.forEach((c, i) => out.push(rect(0, i * band, SW, band + 1, c)));
out.push(rect(0, sky.length * band, SW, 200, '#5a2a9a'));
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
const FW_PALS = [
  ['#fff0b0', '#ffb43c', '#ff5a2a'], ['#ffd0e0', '#ff4f8a', '#d8206a'], ['#ffe9a8', '#ff8a3d', '#e0302a'], ['#ffd6ff', '#ff6fe0', '#a62be0'],
  ['#e8f6ff', '#6fd0ff', '#2f6bff'], ['#f4ffd0', '#9bf06a', '#1fb27c'], ['#fff4c0', '#ffd24a', '#ff8a1f'], ['#ffffff', '#c9b8ff', '#7a4bff'],
];
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
out.push(`<g>${disc(468, 100, 22, '#ff7ad0', 0.3)}${disc(468, 100, 15, '#ffc0ee', 0.55)}${disc(468, 100, 8, '#ffffff', 1)}<animate attributeName='opacity' values='1;.55;1;.8;1' dur='2.4s' repeatCount='indefinite'/></g>`);

/* pink smoke puffs drifting */
function puff(x, y, w, h, col, op, dur, dx) {
  const cells = [];
  for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) { const nx = (i - w / 2) / (w / 2), ny = (j - h / 2) / (h / 2); if (nx * nx + ny * ny < 1 - rnd() * 0.25) cells.push(`M${i} ${j}h2v2h-2z`); }
  return `<g opacity='${op}' transform='translate(${x} ${y})'><path d='${cells.join('')}' fill='${col}'/><animateTransform attributeName='transform' type='translate' values='${x} ${y}; ${x + dx} ${y - 6}; ${x} ${y}' dur='${dur}s' repeatCount='indefinite'/></g>`;
}
out.push(puff(262, 108, 22, 14, '#ff7ad0', 0.7, 14, 10), puff(214, 140, 28, 16, '#e35ad8', 0.6, 18, -8), puff(14, 190, 26, 14, '#ff7ad0', 0.55, 16, 8), puff(350, 175, 20, 10, '#ff7ad0', 0.5, 12, -6), puff(100, 40, 18, 10, '#c040e0', 0.5, 15, 6));

/* blue fairy-light sparkles scattered over the lower sky (twinkling in three phases) */
for (let g = 0; g < 3; g++) {
  const cols = ['#4aa8ff', '#7fe8ff', '#ffffff', '#3a5cff'], by = cols.map(() => []);
  for (let k = 0; k < 110; k++) { const y = 60 + Math.pow(rnd(), 0.8) * 200; by[ri(0, 4)].push(`M${ri(0, SW)} ${Math.round(y)}h${rnd() < 0.3 ? 2 : 1}v${rnd() < 0.3 ? 2 : 1}h-2z`); }
  out.push(`<g>${cols.map((c, i) => `<path d='${by[i].join('')}' fill='${c}'/>`).join('')}<animate attributeName='opacity' values='1;.25;1' dur='${(1.4 + g * 0.9).toFixed(1)}s' begin='${(g * 0.5).toFixed(1)}s' repeatCount='indefinite'/></g>`);
}
/* rising sparks */
out.push('<!--A-->');
for (let k = 0; k < 16; k++) { const x = ri(0, SW), d = (4 + rnd() * 5).toFixed(1), b = (-rnd() * 8).toFixed(1); out.push(`<rect x='0' y='0' width='1' height='2' fill='${['#ffd27a', '#7fe8ff', '#ff8ad8'][k % 3]}'><animateTransform attributeName='transform' type='translate' values='${x} 262; ${x + ri(-14, 14)} 110' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;0' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`); }
out.push('<!--/A-->');

/* ---------------- the roof peak: dark navy with a bright blue edge ---------------- */
const CX = 352, APEX = 206;
for (let y = APEX; y < SH; y++) {
  const hw = Math.round((y - APEX) * 1.7) + 6;
  const row = Math.floor((y - APEX) / 6);
  out.push(rect(CX - hw, y, hw * 2, 1, row % 2 ? '#0a0830' : '#100c42'));
  out.push(rect(CX - hw, y, 3, 1, '#7a8cff') + rect(CX + hw - 3, y, 3, 1, '#7a8cff'));
  if ((y - APEX) % 6 === 0) for (let x = CX - hw + 6; x < CX + hw - 6; x += 8) out.push(rect(x + (row % 2) * 4, y, 2, 1, '#1e1a6a'));
}
out.push(rect(CX - 10, APEX - 2, 20, 4, '#9fb4ff') + rect(CX - 12, APEX - 4, 4, 4, '#9fb4ff') + rect(CX + 8, APEX - 4, 4, 4, '#9fb4ff'));
out.push(rect(CX - 10, APEX + 2, 20, 2, '#4a56d8'));
/* foreground rooftops, left + right edges */
[[0, 238, 130], [350, 252, 130]].forEach(([x, y, w]) => { out.push(rect(x, y, w, 40, '#05041a') + rect(x, y, w, 3, '#3a3ad0')); for (let k = x; k < x + w; k += 6) out.push(rect(k, y + 3, 2, 3, '#14127a')); });

/* ---------------- TENGEN: the user's chibi sprite (src/tengen-sprite.json) dual-wielding small versions of his chained cleavers ---------------- */
{
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
}

/* a few drifting embers */
out.push('<!--A-->');
for (let k = 0; k < 14; k++) { const x = ri(0, SW), d = (5 + rnd() * 5).toFixed(1), b = (-rnd() * 8).toFixed(1); out.push(`<rect x='0' y='0' width='1' height='1' fill='#ffb347'><animateTransform attributeName='transform' type='translate' values='${x} 260; ${x + ri(-14, 14)} 120' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;0' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`); }
out.push('<!--/A-->');

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${SW}' height='${SH}' viewBox='0 0 ${SW} ${SH}' preserveAspectRatio='xMaxYMax slice' shape-rendering='crispEdges'>${out.join('')}</svg>`;
/* animated=false -> a still scene: no fireworks, rising sparks or embers, and every SMIL animation removed (smoke, stars, sparkles, Tengen frozen). */
const stillSvg = svg.replace(/<!--A-->[\s\S]*?<!--\/A-->/g, '').replace(/<animate(Transform)?\b[^>]*?(\/>|>[\s\S]*?<\/animate(Transform)?>)/g, '');
module.exports = { buildSceneSvg: (animated = true) => (animated ? svg : stillSvg), fireworkCount: FW_COUNT };
if (require.main === module) { require('fs').writeFileSync(process.argv[2] || 'scene.svg', svg); console.log('scene.svg', svg.length, 'bytes'); }
