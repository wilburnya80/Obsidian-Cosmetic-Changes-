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

/* ---------------- fireworks: big radial-streak peonies (inner gold-white -> orange -> red/pink tips) ---------------- */
function burst(cx, cy, pal, begin, dur, R, rays) {
  const by = [[], [], []];
  const addPx = (k, x, y) => by[k].push(`M${Math.round(x / 2) * 2} ${Math.round(y / 2) * 2}h2v2h-2z`);
  for (let r = 0; r < rays; r++) {
    const a = (r / rays) * Math.PI * 2 + (r % 2) * 0.03;
    const len = R * (r % 3 === 0 ? 1 : r % 3 === 1 ? 0.82 : 0.66);
    for (let t = R * 0.2; t <= len; t += 3) { const k = t < R * 0.42 ? 0 : t < R * 0.74 ? 1 : 2; addPx(k, Math.cos(a) * t, Math.sin(a) * t); }
  }
  const f = 3.6 / dur;
  const T = (v) => (v * f).toFixed(4);
  return `<g transform='translate(${cx} ${cy})'><g opacity='0'>` +
    `<animateTransform attributeName='transform' type='scale' calcMode='discrete' values='.12;.3;.5;.7;.88;1;1.06;1.06' keyTimes='0;${T(0.06)};${T(0.14)};${T(0.24)};${T(0.36)};${T(0.5)};${T(0.7)};${T(1)}' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/>` +
    `<animate attributeName='opacity' calcMode='discrete' values='1;1;1;.8;.55;.3;.12;0;0' keyTimes='0;${T(0.3)};${T(0.5)};${T(0.62)};${T(0.74)};${T(0.84)};${T(0.92)};${T(0.98)};1' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/>` +
    pal.map((c, k) => `<path d='${by[k].join('')}' fill='${c}'/>`).join('') + rect(-4, -4, 8, 8, '#fff8dc') + rect(-8, -2, 16, 4, '#ffe9a8', "opacity='.6'") + rect(-2, -8, 4, 16, '#ffe9a8', "opacity='.6'") + `</g></g>`;
}
const GOLD = ['#fff0b0', '#ffb43c', '#ff5a2a'], PINK = ['#ffd0e0', '#ff4f8a', '#d8206a'], ORANGE = ['#ffe9a8', '#ff8a3d', '#e0302a'], MAG = ['#ffd6ff', '#ff6fe0', '#a62be0'];
[
  [352, 62, PINK, -1.0, 8.0, 74, 40],     // big burst right above Tengen (reference 1)
  [112, 118, GOLD, -3.2, 9.0, 70, 40],           // big orange-gold peony on the left (reference 2)
  [236, 40, MAG, -5.0, 8.5, 44, 28],
  [424, 130, ORANGE, -2.4, 7.5, 40, 28],
  [40, 56, PINK, -6.1, 9.5, 38, 26],
  [196, 160, PINK, -4.2, 10, 30, 22],
].forEach((b) => out.push(burst(b[0], b[1], b[2], b[3], b[4], b[5], b[6])));

/* white-pink flash at the right edge (reference 1) */
const disc = (cx, cy, r, col, op) => { let o = ''; for (let dy = -r; dy <= r; dy += 2) { const hw = Math.round(Math.sqrt(r * r - dy * dy) / 2) * 2; o += rect(cx - hw, cy + dy, hw * 2, 2, col, `opacity='${op}'`); } return o; };
out.push(`<g>${disc(468, 100, 22, '#ff7ad0', 0.3)}${disc(468, 100, 15, '#ffc0ee', 0.55)}${disc(468, 100, 8, '#ffffff', 1)}<animate attributeName='opacity' values='1;.55;1;.8;1' dur='2.4s' repeatCount='indefinite'/></g>`);

/* pink smoke puffs drifting */
function puff(x, y, w, h, col, op, dur, dx) {
  const cells = [];
  for (let j = 0; j < h; j += 2) for (let i = 0; i < w; i += 2) { const nx = (i - w / 2) / (w / 2), ny = (j - h / 2) / (h / 2); if (nx * nx + ny * ny < 1 - rnd() * 0.25) cells.push(`M${i} ${j}h2v2h-2z`); }
  return `<g opacity='${op}'><path d='${cells.join('')}' fill='${col}'/><animateTransform attributeName='transform' type='translate' values='${x} ${y}; ${x + dx} ${y - 6}; ${x} ${y}' dur='${dur}s' repeatCount='indefinite'/></g>`;
}
out.push(puff(262, 108, 22, 14, '#ff7ad0', 0.7, 14, 10), puff(214, 140, 28, 16, '#e35ad8', 0.6, 18, -8), puff(14, 190, 26, 14, '#ff7ad0', 0.55, 16, 8), puff(350, 175, 20, 10, '#ff7ad0', 0.5, 12, -6), puff(100, 40, 18, 10, '#c040e0', 0.5, 15, 6));

/* blue fairy-light sparkles scattered over the lower sky (twinkling in three phases) */
for (let g = 0; g < 3; g++) {
  const cols = ['#4aa8ff', '#7fe8ff', '#ffffff', '#3a5cff'], by = cols.map(() => []);
  for (let k = 0; k < 110; k++) { const y = 60 + Math.pow(rnd(), 0.8) * 200; by[ri(0, 4)].push(`M${ri(0, SW)} ${Math.round(y)}h${rnd() < 0.3 ? 2 : 1}v${rnd() < 0.3 ? 2 : 1}h-2z`); }
  out.push(`<g>${cols.map((c, i) => `<path d='${by[i].join('')}' fill='${c}'/>`).join('')}<animate attributeName='opacity' values='1;.25;1' dur='${(1.4 + g * 0.9).toFixed(1)}s' begin='${(g * 0.5).toFixed(1)}s' repeatCount='indefinite'/></g>`);
}
/* rising sparks */
for (let k = 0; k < 16; k++) { const x = ri(0, SW), d = (4 + rnd() * 5).toFixed(1), b = (-rnd() * 8).toFixed(1); out.push(`<rect x='0' y='0' width='1' height='2' fill='${['#ffd27a', '#7fe8ff', '#ff8ad8'][k % 3]}'><animateTransform attributeName='transform' type='translate' values='${x} 262; ${x + ri(-14, 14)} 110' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;0' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`); }

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

/* ---------------- TENGEN: chibi sprite traced from the user's reference (src/tengen-sprite.json) + cleavers ---------------- */
const SPR = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, 'tengen-sprite.json'), 'utf8'));
const MX = 16, MY = 8;                                   // margins for the raised cleavers
const GW = SPR.rows[0].length + MX * 2, GH = SPR.rows.length + MY;
const grid = Array.from({ length: GH }, () => Array(GW).fill('.'));
const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < GW && y >= 0 && y < GH) grid[y][x] = c; };
function line(x0, y0, x1, y1, th, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) put(x - (th >> 1) + a, y - (th >> 1) + b, c); }
}
const HAND_L = [MX + 8, MY + 38], HAND_R = [MX + 24, MY + 38];
const TIP_L = [1, MY + 12], TIP_R = [GW - 2, MY + 12];
function cleaver(h, t, outer) {
  line(h[0], h[1], t[0], t[1], 3, 'x');          // blade body
  line(h[0], h[1], t[0], t[1], 1, 'y');          // light core
  line(h[0] + outer * 2, h[1] - 1, t[0] + outer * 2, t[1] - 1, 1, 'z');   // bright cutting edge
  const gx = h[0] - (outer * 0), gy = h[1];
  for (let i = -3; i <= 3; i++) put(gx + i, gy, 'w');            // guard
  for (let i = -2; i <= 2; i++) put(gx + i, gy + 1, 'w');
  put(gx, gy + 2, 'w'); put(gx - 1, gy + 3, 'w'); put(gx + 1, gy + 3, 'w');   // pommel ring
}
cleaver(HAND_L, TIP_L, -1); cleaver(HAND_R, TIP_R, 1);
/* chain dangling between the pommels (behind the legs) */
for (let x = HAND_L[0]; x <= HAND_R[0]; x++) { const t = (x - (HAND_L[0] + HAND_R[0]) / 2) / ((HAND_R[0] - HAND_L[0]) / 2); if (x % 2 === 0) put(x, HAND_L[1] + 4 + 3 * (1 - t * t), 'v'); }
/* the traced sprite goes on top */
SPR.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') grid[y + MY][x + MX] = ch; }));
/* outline cleavers only (sprite already has its own black outline) */
const isBlade = (c) => 'xyzwv'.includes(c);
const snap = grid.map((r) => r.slice());
for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (grid[y][x] === '.') {
  const nb = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => a >= 0 && b >= 0 && a < GW && b < GH && isBlade(snap[b][a]));
  if (nb) grid[y][x] = 'B';
}
const SPAL = Object.assign({ x: '#8c78d6', y: '#f1e8ff', z: '#ffffff', w: '#ffc83d', v: '#c9b8ff' }, SPR.pal);
const SCALE = 3, TX = CX - Math.round((GW * SCALE) / 2), TY = APEX + 2 - GH * SCALE;
const sp = [];
for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
  const ch = grid[y][x]; if (ch === '.') continue;
  let run = 1; while (x + run < GW && grid[y][x + run] === ch) run++;
  sp.push(rect(TX + x * SCALE, TY + y * SCALE, run * SCALE, SCALE, SPAL[ch])); x += run - 1;
}
const glint = (gx, gy, b) => `<g opacity='0'>${rect(gx - 1, gy - 4, 2, 8, '#ffffff')}${rect(gx - 4, gy - 1, 8, 2, '#ffffff')}<animate attributeName='opacity' values='0;1;0;0' keyTimes='0;.08;.16;1' dur='3.2s' begin='${b}s' repeatCount='indefinite'/></g>`;
out.push(`<g>${sp.join('')}<animateTransform attributeName='transform' type='translate' values='0 0;0 -1;0 0' dur='1.6s' repeatCount='indefinite'/></g>`);
out.push(glint(TX + TIP_L[0] * SCALE, TY + TIP_L[1] * SCALE, 0.4) + glint(TX + TIP_R[0] * SCALE, TY + TIP_R[1] * SCALE, 1.6));

/* a few drifting embers */
for (let k = 0; k < 14; k++) { const x = ri(0, SW), d = (5 + rnd() * 5).toFixed(1), b = (-rnd() * 8).toFixed(1); out.push(`<rect x='0' y='0' width='1' height='1' fill='#ffb347'><animateTransform attributeName='transform' type='translate' values='${x} 260; ${x + ri(-14, 14)} 120' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;0' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`); }

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${SW}' height='${SH}' viewBox='0 0 ${SW} ${SH}' preserveAspectRatio='xMaxYMax slice' shape-rendering='crispEdges'>${out.join('')}</svg>`;
module.exports = { buildSceneSvg: () => svg };
if (require.main === module) { require('fs').writeFileSync(process.argv[2] || 'scene.svg', svg); console.log('scene.svg', svg.length, 'bytes'); }
