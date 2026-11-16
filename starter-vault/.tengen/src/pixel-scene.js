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

/* ---------------- TENGEN: dark back-view silhouette on the roof peak, dual-wielding his chained cleavers ---------------- */
{
  const GW = 74, GH = 78;
  const SPAL = { N: '#0a0730', R: '#7f9bff', W: '#f4f0ff', G: '#ffc83d', k: '#0b0b12', o: '#ff9a1f', O: '#ffc15a', w: '#ffe9c4', g: '#ffd24a', e: '#1fb27c', E: '#7af0c8', r: '#d81e3a', q: '#8e1226', c: '#a9afba', C: '#4a4f5a', p: '#d9a520', P: '#8a5a10' };
  const grid = Array.from({ length: GH }, () => Array(GW).fill('.'));
  const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < GW && y >= 0 && y < GH) grid[y][x] = c; };
  const line = (x0, y0, x1, y1, c, th = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; for (let a = 0; a < th; a++) for (let b = 0; b < th; b++) put(x + a, y + b, c); } };
  const box = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };

  /* ---- one cleaver in local coordinates: tip at row 0, pommel at the last row (reference photo) ---- */
  const SW_W = 15, SW_H = 51, BLADE = 36;
  function makeSword(mirror) {
    const L = Array.from({ length: SW_H }, () => Array(SW_W).fill('.'));
    for (let y = 0; y < BLADE; y++) {
      const width = Math.min(11, Math.round(1.5 + y * 0.6)) - (y > 30 ? Math.round((y - 30) * 0.45) : 0);
      const xl = 1 + Math.round(4.5 * Math.pow(1 - y / BLADE, 2));
      const wave = Math.round(1.6 * Math.sin(y * 0.6 + 0.4));
      for (let d = 0; d < width; d++) {
        let c = 'k';
        if (d === 0) c = 'w';
        else if (d < 3 + wave) c = d === 1 ? 'O' : 'o';
        L[y][xl + d] = c;
      }
      if (y >= 25 && y <= 31) for (let d = 0; d < width; d++) { const hx = 3, hy = 28; if ((d - hx) * (d - hx) + (y - hy) * (y - hy) <= 5) L[y][xl + d] = '.'; }   // round hole in the blade
      if (y >= 27 && y <= 33 && width > 6) { L[y][xl + 5 + (y % 2)] = 'g'; if (y % 2 === 0) L[y][xl + 7] = 'g'; }   // gold kanji
    }
    const cx = 6;
    for (let i = -5; i <= 5; i++) L[BLADE][cx + i] = Math.abs(i) > 3 ? 'e' : 'E';                       // green guard
    for (let i = -4; i <= 4; i++) L[BLADE + 1][cx + i] = i % 2 === 0 ? 'e' : 'p';
    for (let y = BLADE + 2; y < BLADE + 12; y++) for (let i = -2; i <= 1; i++) L[y][cx + i] = ((y + i) & 1) ? 'r' : 'e';  // red grip, green diamonds
    for (let y = BLADE + 2; y < BLADE + 12; y++) { L[y][cx - 3] = 'q'; L[y][cx + 2] = 'q'; }
    for (let i = -3; i <= 2; i++) { L[BLADE + 12][cx + i] = 'p'; L[BLADE + 13][cx + i] = 'P'; }           // gold pommel
    L[BLADE + 14][cx - 1] = 'p'; L[BLADE + 14][cx] = 'p';
    return mirror ? L.map((r) => r.slice().reverse()) : L;
  }
  const SWORD = { L: makeSword(false), R: makeSword(true) };
  function stamp(L, ox, oy, deg) {                       // draw a local sprite rotated about its pommel (ox, oy), nearest-neighbour
    const t = (deg * Math.PI) / 180, cs = Math.cos(t), sn = Math.sin(t);
    for (let Y = 0; Y < GH; Y++) for (let X = 0; X < GW; X++) {
      const a = X - ox, b = Y - oy;
      const lx = Math.round(a * cs + b * sn + 6), ly = Math.round(-a * sn + b * cs + SW_H - 1);
      if (lx >= 0 && lx < SW_W && ly >= 0 && ly < SW_H && L[ly][lx] !== '.') grid[Y][X] = L[ly][lx];
    }
  }
  const tipOf = (ox, oy, deg) => { const t = (deg * Math.PI) / 180; return [ox + (SW_H - 1) * Math.sin(t), oy - (SW_H - 1) * Math.cos(t)]; };

  const CXF = 37, B0 = 38;                                // figure centre column / top row of the body block
  const HAND_L = [20, 49], HAND_R = [54, 49];
  const SANG = 20;
  const ORG_L = [HAND_L[0] - 1, HAND_L[1] + 6], ORG_R = [HAND_R[0] + 1, HAND_R[1] + 6];

  /* chain between the two pommels, hanging in loose links */
  const linkCols = ['c', 'C'];
  for (let i = 0; i <= 60; i++) { const t = i / 60; const x = ORG_L[0] + (ORG_R[0] - ORG_L[0]) * t; const y = ORG_L[1] + 2 + 18 * Math.sin(Math.PI * t) ; if (i % 2 === 0) { put(x, y, linkCols[(i / 2) % 2]); put(x + 1, y, linkCols[(i / 2) % 2]); put(x, y + 1, linkCols[((i / 2) + 1) % 2]); } }

  /* body (silhouette) */
  const by = (v) => B0 + v;
  for (let y = 13; y < 26; y++) { const hw = 7 - Math.floor((y - 13) / 3.2); box(CXF - hw, by(y - 4), hw * 2, 1, 'N'); }                         // torso
  for (let y = 6; y <= 12; y++) { const t = (y - 9) / 3.6; const hw = Math.round(3.4 * Math.sqrt(Math.max(0, 1 - t * t))); box(CXF - hw, by(y - 4), hw * 2 + 1, 1, 'N'); } // head
  box(CXF - 3, by(2), 7, 1, 'G');                                                                                                            // headband
  [[-3, -1], [0, -3], [3, -1], [-6, 0], [6, 0]].forEach(([dx, top]) => line(CXF + dx, by(1), CXF + dx, by(top + 2), 'W'));                  // white hair spikes
  box(CXF - 4, by(22), 4, 12, 'N'); box(CXF + 1, by(22), 4, 12, 'N'); box(CXF - 6, by(20), 13, 3, 'N'); box(CXF - 5, by(34), 5, 2, 'N'); box(CXF + 1, by(34), 5, 2, 'N');
  line(CXF - 6, by(10), HAND_L[0] + 1, HAND_L[1], 'N', 3); line(CXF + 6, by(10), HAND_R[0] - 1, HAND_R[1], 'N', 3);                       // raised arms
  /* rim light on the left/top edges of the dark body */
  const snap = grid.map((r) => r.slice());
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) if (snap[y][x] === 'N' && (x === 0 || snap[y][x - 1] === '.' || y === 0 || snap[y - 1][x] === '.')) grid[y][x] = 'R';

  /* the two cleavers, then fists over the grips */
  stamp(SWORD.L, ORG_L[0], ORG_L[1], -SANG); stamp(SWORD.R, ORG_R[0], ORG_R[1], SANG);
  box(HAND_L[0] - 2, HAND_L[1] - 2, 5, 5, 'N'); box(HAND_R[0] - 2, HAND_R[1] - 2, 5, 5, 'N');
  box(HAND_L[0] - 2, HAND_L[1] - 2, 5, 1, 'R'); box(HAND_R[0] - 2, HAND_R[1] - 2, 5, 1, 'R');

  const SCALE = 1, TX = CX - Math.round((GW * SCALE) / 2), TY = APEX + 2 - (B0 + 36) * SCALE;
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
for (let k = 0; k < 14; k++) { const x = ri(0, SW), d = (5 + rnd() * 5).toFixed(1), b = (-rnd() * 8).toFixed(1); out.push(`<rect x='0' y='0' width='1' height='1' fill='#ffb347'><animateTransform attributeName='transform' type='translate' values='${x} 260; ${x + ri(-14, 14)} 120' dur='${d}s' begin='${b}s' repeatCount='indefinite'/><animate attributeName='opacity' values='0;1;0' dur='${d}s' begin='${b}s' repeatCount='indefinite'/></rect>`); }

const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${SW}' height='${SH}' viewBox='0 0 ${SW} ${SH}' preserveAspectRatio='xMaxYMax slice' shape-rendering='crispEdges'>${out.join('')}</svg>`;
module.exports = { buildSceneSvg: () => svg };
if (require.main === module) { require('fs').writeFileSync(process.argv[2] || 'scene.svg', svg); console.log('scene.svg', svg.length, 'bytes'); }
