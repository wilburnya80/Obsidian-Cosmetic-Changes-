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

/* ---------------- sky ---------------- */
const sky = ['#0d0720', '#150b30', '#1f0f45', '#2d1259', '#44145f', '#5f1763', '#7f1b64', '#8f1d5a', '#a52358', '#b92c52', '#cc3a4c'];
const band = 14;
sky.forEach((c, i) => out.push(rect(0, i * band, SW, band + 1, c)));
out.push(rect(0, sky.length * band, SW, 200, '#cc3a4c'));
for (let i = 1; i < sky.length; i++) for (let x = 0; x < SW; x += 4) if (rnd() < 0.5) out.push(rect(x + (i % 2) * 2, i * band - 2, 2, 2, sky[i]));
for (let s = 0; s < 50; s++) {
  const d = (1.5 + rnd() * 3).toFixed(1), b = (rnd() * 3).toFixed(1);
  out.push(`<rect x='${ri(0, SW)}' y='${ri(0, 70)}' width='1' height='1' fill='#fff6d5'><animate attributeName='opacity' values='1;.2;1' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`);
}

/* crimson pixel moon */
const moon = ['..XXXXXX..', '.XXXXXXXX.', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXXXXXXXXX', '.XXXXXXXX.', '..XXXXXX..'];
moon.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'X') out.push(rect(40 + c * 2, 22 + r * 2, 2, 2, (r + c) % 5 === 0 ? '#ffb3c1' : '#ffd0d8')); }));

/* ---------------- fireworks (pixel bursts, stepped expansion) ---------------- */
function burst(cx, cy, cols, begin, dur, R) {
  const spark = [];
  const add = (x, y, col, sz) => spark.push(rect(Math.round(x / 2) * 2 - sz / 2, Math.round(y / 2) * 2 - sz / 2, sz, sz, col));
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; add(Math.cos(a) * R, Math.sin(a) * R, cols[k % cols.length], 2); }
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 + Math.PI / 16; add(Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, cols[(k + 1) % cols.length], 2); }
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; add(Math.cos(a) * R * 1.18, Math.sin(a) * R * 1.18, '#ffffff', 2); add(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3, cols[0], 2); }
  const f = 3.4 / dur;
  const kt = (arr) => arr.map((v) => +(v * f).toFixed(4)).join(';');
  return `<g transform='translate(${cx} ${cy})'><g opacity='0'>` +
    `<animateTransform attributeName='transform' type='scale' calcMode='discrete' values='.1;.35;.6;.85;1;1.08;1.08' keyTimes='0;${(0.1 * f).toFixed(4)};${(0.22 * f).toFixed(4)};${(0.36 * f).toFixed(4)};${(0.5 * f).toFixed(4)};${(0.7 * f).toFixed(4)};${f.toFixed(4)}' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/>` +
    `<animate attributeName='opacity' calcMode='discrete' values='1;1;.75;.5;.25;0;0' keyTimes='0;${(0.5 * f).toFixed(4)};${(0.62 * f).toFixed(4)};${(0.74 * f).toFixed(4)};${(0.86 * f).toFixed(4)};${(0.96 * f).toFixed(4)};1' dur='${dur}s' begin='${begin}s' repeatCount='indefinite'/>` +
    spark.join('') + rect(-3, -3, 6, 6, '#fff6d5') + `</g></g>`;
}
const PAL1 = ['#ff2d55', '#ffc93c', '#ff4fd8', '#ffffff'], PAL2 = ['#8b3dff', '#3ea6ff', '#ff4fd8', '#ffffff'], PAL3 = ['#ffc93c', '#ff8a3d', '#ff2d55', '#fff1c1'];
[
  [96, 70, PAL1, -1.2, 7.0, 34], [210, 46, PAL2, -3.8, 8.5, 28], [300, 82, PAL3, -0.4, 6.5, 38], [420, 52, PAL1, -5.2, 9.0, 32],
  [150, 110, PAL3, -2.4, 7.5, 24], [380, 112, PAL2, -6.1, 8.0, 26], [250, 24, PAL1, -4.4, 10, 22], [60, 130, PAL2, -1.9, 9.5, 22],
].forEach((b) => out.push(burst(b[0], b[1], b[2], b[3], b[4], Math.round(b[5] * 1.5))));

/* ---------------- far skyline: stepped pagodas + glowing lanterns ---------------- */
const DARK = '#24103f', DARKER = '#190b2e';
function pagoda(x, base, w, tiers, col) {
  const s = [];
  let y = base, tw = w;
  for (let t = 0; t < tiers; t++) {
    s.push(rect(x + (w - tw) / 2 + 2, y - 8, tw - 4, 8, col));                 // body
    s.push(rect(x + (w - tw) / 2 - 3, y - 10, tw + 6, 2, col));                // eave
    s.push(rect(x + (w - tw) / 2 - 5, y - 12, 4, 2, col) + rect(x + (w - tw) / 2 + tw + 1, y - 12, 4, 2, col)); // upturned tips
    y -= 12; tw = Math.max(8, tw - 8);
  }
  s.push(rect(x + w / 2 - 1, y - 8, 2, 8, col));
  return s.join('');
}
[[10, 170, 40, 3], [70, 172, 32, 2], [128, 168, 44, 4], [196, 174, 30, 2], [250, 170, 38, 3], [420, 168, 42, 3], [452, 174, 28, 2]].forEach(([x, b, w, t]) => out.push(pagoda(x, b + 18, w, t, DARKER)));
out.push(rect(0, 186, SW, 90, DARKER));
for (let x = 0; x < SW; x += 6) if (rnd() < 0.18) out.push(rect(x, ri(176, 194), 2, 3, '#ffc27a', `><animate attributeName='opacity' values='1;.4;1' dur='${(1 + rnd() * 2).toFixed(1)}s' repeatCount='indefinite'/></rect><rect hidden='1'`));
/* lantern strings */
for (let row = 0; row < 2; row++) {
  const y0 = 150 + row * 22;
  for (let x = 6 + row * 12; x < SW; x += 24) {
    const sag = Math.round(Math.abs(Math.sin(x / 40)) * 4);
    out.push(rect(x, y0 + sag, 24, 1, '#3a1f4d'));
    out.push(rect(x + 9, y0 + sag + 1, 6, 8, '#ff2d55') + rect(x + 10, y0 + sag + 2, 4, 2, '#ffc93c') + rect(x + 10, y0 + sag + 9, 4, 1, '#5a1a2a'));
    out.push(`<rect x='${x + 7}' y='${y0 + sag - 1}' width='10' height='12' fill='#ffb347' opacity='.12'><animate attributeName='opacity' values='.08;.2;.1' dur='${(0.8 + rnd()).toFixed(1)}s' repeatCount='indefinite'/></rect>`);
  }
}
/* rising paper lanterns */
for (let k = 0; k < 7; k++) {
  const x = ri(10, 470), d = (14 + rnd() * 10).toFixed(0), b = (-rnd() * 20).toFixed(1);
  out.push(`<g><rect x='0' y='0' width='4' height='5' fill='#ffd27a'/><rect x='1' y='1' width='2' height='2' fill='#fff6d5'/><animateTransform attributeName='transform' type='translate' values='${x} 190; ${x + ri(-12, 12)} 10' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;1;0' keyTimes='0;.1;.8;1' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></g>`);
}

/* ---------------- the roof peak ---------------- */
const CX = 352, APEX = 206;                 // roof apex (Tengen's feet touch it)
for (let y = APEX; y < SH; y++) {
  const hw = Math.round((y - APEX) * 1.7) + 6;
  const row = Math.floor((y - APEX) / 6);
  out.push(rect(CX - hw, y, hw * 2, 1, row % 2 ? '#2b1a52' : '#35206a'));
  out.push(rect(CX - hw, y, 3, 1, '#ff2d55') + rect(CX + hw - 3, y, 3, 1, '#ff2d55'));
  if ((y - APEX) % 6 === 0) for (let x = CX - hw + 6; x < CX + hw - 6; x += 8) out.push(rect(x + (row % 2) * 4, y, 2, 1, '#4a2f8a'));
}
out.push(rect(CX - 10, APEX - 2, 20, 4, '#ffc93c') + rect(CX - 12, APEX - 4, 4, 4, '#ffc93c') + rect(CX + 8, APEX - 4, 4, 4, '#ffc93c')); // ridge cap + end ornaments
out.push(rect(CX - 10, APEX + 2, 20, 2, '#b8860b'));

/* foreground rooftops, left + right edges */
[[0, 238, 130], [350, 252, 130]].forEach(([x, y, w]) => { out.push(rect(x, y, w, 40, '#150826') + rect(x, y, w, 3, '#2d1259')); for (let k = x; k < x + w; k += 6) out.push(rect(k, y + 3, 2, 3, '#3b1d6a')); });

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
