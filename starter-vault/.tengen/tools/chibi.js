#!/usr/bin/env node
'use strict';
/* Chibi pixel sprites for the nine Hashira (31 x 47 px, same proportions/outline style as src/tengen-sprite.json).
   Tengen = the user's own traced sprite; the other eight are generated here with shared chibi anatomy and per-character
   hair / eyes / haori / accessories.   Usage: node tools/chibi.js <outDir>   -> <id>.svg for each Hashira + sheet.svg */
const fs = require('fs');
const path = require('path');

const W = 31, H = 47;
const K = '#120a24';                 // outline
const SKIN = '#ffecb3', SKIN_S = '#f0c98a', BLUSH = '#ff9aa8', WHITE = '#ffffff';
const UNI = '#263238', UNI_H = '#37474f', LEG = '#e8e8ee', SHOE = '#880e4f';

function newGrid() { return Array.from({ length: H }, () => Array(W).fill(null)); }
function mk(g) {
  const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
  const ell = (cx, cy, rx, ry, fn) => { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const dx = (x - cx) / rx, dy = (y - cy) / ry; if (dx * dx + dy * dy <= 1) set(x, y, typeof fn === 'function' ? fn(x, y) : fn); } };
  const line = (x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) set(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c); };
  return { set, rect, ell, line };
}

/* ---------------- shared anatomy ---------------- */
const SPRITE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'tengen-sprite.json'), 'utf8'));
/* Shared body = rows 31-46 of the user's traced Tengen sprite, recoloured per character (same proportions/outline/shading for all nine). */
function body(p, c) {
  const { set, rect } = p;
  // haori panels hang behind the arms (per-character pattern)
  if (c.haori) for (let y = 32; y < 44; y++) for (let x = 4; x <= 26; x++) {
    if (!((x >= 5 && x <= 10) || (x >= 21 && x <= 26))) continue;
    const col = c.haori(x, y, x < 15 ? 'L' : 'R'); if (col) set(x, y, col);
  }
  const map = {
    E: c.vest || '#607d8b', I: c.seam || '#263238', R: c.sleeve || '#ffe082', O: c.cuff2 || '#ffeb3b', P: c.cuff1 || '#303f9f',
    C: c.skin || SKIN, S: c.shoe || '#ad1457', N: c.shoeD || '#880e4f', Q: '#bdbdbd', A: '#ffffff', B: '#000000', W: '#ffffff', L: '#e1bee7', M: c.vest || '#607d8b',
  };
  for (let y = 31; y < 47; y++) [...SPRITE.rows[y]].forEach((ch, x) => {
    if (ch === '.' || ch === 'H' || ch === 'K') return;            // drop Tengen's cyan jewel chains
    const col = map[ch] || (SPRITE.pal[ch]); if (col) set(x, y, col);
  });
}
function head(p, c) {
  const { set, rect, ell } = p;
  ell(15, 17, 13.2, 13.5, (x, y) => (y > 27 && (Math.abs(x - 15) > 8 || y > 29) ? (c.skinS || '#f4d79a') : (c.skin || SKIN)));
}
function face(p, c) {
  const { set, rect } = p;
  const eye = (x0, col, white) => {            // 4x5 big chibi eye: lash line, iris, highlight, pupil
    rect(x0, 19, 4, 1, K);
    rect(x0, 20, 4, 4, white ? '#e8e8f0' : col);
    if (!white) { rect(x0 + 1, 22, 2, 2, mix(col, '#000000', 0.55)); set(x0 + 3, 23, mix(col, '#ffffff', 0.35)); }
    set(x0, 20, WHITE); if (!white) set(x0 + 1, 20, WHITE);
    rect(x0, 24, 4, 1, K);
  };
  if (c.blind) { eye(7, null, true); eye(20, null, true); }
  else { eye(7, c.eyeL || c.eye, false); eye(20, c.eyeR || c.eye, false); }
  rect(14, 27, 3, 1, c.mouth || '#b5654f');               // mouth
  if (c.blush !== false) { set(5, 26, BLUSH); set(6, 26, BLUSH); set(7, 26, BLUSH); set(23, 26, BLUSH); set(24, 26, BLUSH); set(25, 26, BLUSH); }
}
function outline(g) {
  const o = g.map((r) => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] === null && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => a >= 0 && b >= 0 && a < W && b < H && g[b][a] !== null)) o[y][x] = K;
  return o;
}
function toSvg(g, scale = 8, bg = null) {
  const R = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = g[y][x]; if (!c) continue; let run = 1; while (x + run < W && g[y][x + run] === c) run++; R.push(`<rect x='${x * scale}' y='${y * scale}' width='${run * scale}' height='${scale}' fill='${c}'/>`); x += run - 1; }
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${W * scale}' height='${H * scale}' viewBox='0 0 ${W * scale} ${H * scale}' shape-rendering='crispEdges'>${bg ? `<rect width='100%' height='100%' fill='${bg}'/>` : ''}${R.join('')}</svg>`;
}

/* ---------------- hair styles ---------------- */
const mix = (a, b, t) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
function hairCap(p, c, opts = {}) {            // hair over the top of the head with a fringe
  const { set, rect, ell } = p;
  const fringe = opts.fringe ?? 6;
  for (let y = 2; y <= 16 + (opts.sideDrop ?? 3); y++) for (let x = 1; x <= 29; x++) {
    const dx = (x - 15) / 13.4, dy = (y - 15) / 13.8;
    if (dx * dx + dy * dy > 1) continue;
    const isSide = Math.abs(x - 15) >= 10;
    const lim = isSide ? 16 + (opts.sideDrop ?? 3) : fringe + 5 + (opts.fringeJag ? ((x * 7) % 3) - 1 : 0) + (opts.fringeFn ? opts.fringeFn(x) : 0);
    if (y <= lim) set(x, y, opts.color ? opts.color(x, y) : c.hair);
  }
}
function spikes(p, color, list) { list.forEach(([x, y, h, w]) => { for (let j = 0; j < h; j++) for (let i = -Math.floor((w - Math.floor(j * w / h)) / 2); i <= Math.floor((w - Math.floor(j * w / h)) / 2); i++) p.set(x + i, y - j, typeof color === 'function' ? color(x + i, y - j) : color); }); }

/* ---------------- characters ---------------- */
const CHAR = {};
const hexPat = (a, b) => (x, y) => ((x + (y >> 1)) % 4 === 0 && y % 2 === 0 ? b : a);

CHAR.giyu = {
  name: 'Giyu Tomioka', title: 'Water Hashira',
  build(p) {
    const c = { vest: '#2c3a5a', seam: '#141c33', sleeve: '#3f5fa8', cuff1: '#8c1d2b', cuff2: '#2f9e6a', shoe: '#2a4a8a', shoeD: '#1a2f5a', eye: '#2f6fe0', hair: '#14141f', haori: (x, y, s) => (s === 'L' ? (y % 5 === 0 ? '#a52a3a' : '#8c1d2b') : ((x + y) % 4 < 2 ? '#2f9e6a' : '#d9e8a8')), sword: '#2a6fdb' };
    body(p, c); head(p, c);
    hairCap(p, c, { fringe: 5, fringeJag: true, sideDrop: 4, color: (x, y) => (y < 7 && (x + y) % 5 === 0 ? '#2b2b45' : '#14141f') });
    spikes(p, '#14141f', [[10, 4, 3, 3], [15, 3, 3, 3], [21, 4, 3, 3]]);
    face(p, c); return c;
  },
};
CHAR.shinobu = {
  name: 'Shinobu Kocho', title: 'Insect Hashira',
  build(p) {
    const c = { vest: '#3a2a4f', seam: '#1c1228', sleeve: '#f4f0ff', cuff1: '#8e44ad', cuff2: '#c77dff', shoe: '#8e44ad', shoeD: '#5a2a7a', eye: '#b266ff', hair: '#14141f', haori: (x, y, s) => (y < 36 ? '#f4f0ff' : (y > 39 && (x + y) % 3 === 0 ? '#c77dff' : '#7a3fb0')), cuff: '#d9c2ff', sword: '#c77dff' };
    body(p, c); head(p, c);
    hairCap(p, c, { fringe: 5, sideDrop: 7, color: (x, y) => (y > 17 ? '#8e44ad' : y > 13 ? '#4a2670' : '#14141f') });
    p.set(6, 9, '#c77dff'); p.set(7, 8, '#e1bee7'); p.set(5, 8, '#e1bee7'); p.set(6, 7, '#ffffff'); p.set(8, 9, '#e1bee7');   // butterfly hair clip
    face(p, c); return c;
  },
};
CHAR.rengoku = {
  name: 'Kyojuro Rengoku', title: 'Flame Hashira',
  build(p) {
    const c = { vest: '#3a2a22', seam: '#1c120e', sleeve: '#f5f0e6', cuff1: '#e8431c', cuff2: '#ffb000', shoe: '#c8431c', shoeD: '#8a2a10', eye: '#ffb000', hair: '#f4c542', haori: (x, y, s) => (y > 38 ? ((x * 3 + y) % 4 < 2 ? '#ff5a1f' : '#ffb000') : '#f5f0e6'), cuff: '#ffd180', sword: '#ff7a1a' };
    body(p, c); head(p, c);
    hairCap(p, c, { fringe: 6, fringeJag: true, sideDrop: 3, color: (x, y) => (y > 9 ? '#e8431c' : y > 6 ? '#f08a2c' : '#f4c542') });
    spikes(p, (x, y) => (y < 3 ? '#f4c542' : '#e8431c'), [[8, 6, 6, 4], [13, 4, 8, 4], [18, 4, 8, 4], [23, 6, 6, 4], [5, 11, 5, 3], [26, 11, 5, 3]]);
    face(p, c);
    p.rect(7, 17, 5, 1, '#c62828'); p.rect(19, 17, 5, 1, '#c62828'); p.set(6, 16, '#c62828'); p.set(24, 16, '#c62828'); p.set(8, 16, '#c62828'); p.set(22, 16, '#c62828');   // forked brows
    return c;
  },
};
CHAR.muichiro = {
  name: 'Muichiro Tokito', title: 'Mist Hashira',
  build(p) {
    const c = { vest: '#3a4a58', seam: '#1c2630', sleeve: '#e8f0ff', cuff1: '#7fcfc8', cuff2: '#c8f0ee', shoe: '#5fa8a0', shoeD: '#3f7a74', eye: '#9fe3e0', hair: '#14141f', haori: (x, y, s) => ((x + (y >> 1)) % 4 === 0 && y % 2 === 0 ? '#7fcfc8' : '#e8f0ff'), cuff: '#c8f0ee', sword: '#9fe3d6' };
    body(p, c); head(p, c);
    hairCap(p, c, { fringe: 7, sideDrop: 14, fringeFn: (x) => (x < 9 || x > 21 ? 0 : -1), color: (x, y) => (y > 24 ? '#7fd8cf' : y > 20 ? '#3f6f6a' : '#14141f') });
    // long hair falls past the shoulders
    p.rect(1, 26, 4, 8, '#14141f'); p.rect(26, 26, 4, 8, '#14141f'); p.rect(1, 32, 4, 4, '#7fd8cf'); p.rect(26, 32, 4, 4, '#7fd8cf');
    face(p, c); return c;
  },
};
CHAR.mitsuri = {
  name: 'Mitsuri Kanroji', title: 'Love Hashira',
  build(p) {
    const c = { vest: '#4a2a3a', seam: '#24121c', sleeve: '#f6f0f0', cuff1: '#ff7fb0', cuff2: '#5ed07a', shoe: '#e0508a', shoeD: '#a02a60', eye: '#4cd17a', hair: '#ff7fb0', haori: (x, y, s) => (y > 40 ? '#222' : '#f6f0f0'), cuff: '#ffc1d9', sword: '#ff8fb8' };
    body(p, c); head(p, c);
    hairCap(p, c, { fringe: 6, fringeJag: true, sideDrop: 5, color: (x, y) => (y < 8 ? '#ff9ec7' : '#ff7fb0') });
    // twin braids with green tips
    p.rect(1, 19, 3, 12, '#ff7fb0'); p.rect(27, 19, 3, 12, '#ff7fb0'); p.rect(1, 28, 3, 6, '#5ed07a'); p.rect(27, 28, 3, 6, '#5ed07a');
    face(p, c); return c;
  },
};
CHAR.obanai = {
  name: 'Obanai Iguro', title: 'Serpent Hashira',
  build(p) {
    const c = { vest: '#26362e', seam: '#101a14', sleeve: '#f2f2f2', cuff1: '#2f6a46', cuff2: '#f2c200', shoe: '#2f6a46', shoeD: '#1a4028', eyeL: '#f2c200', eyeR: '#2f6fe0', hair: '#14141f', haori: (x, y, s) => (y % 3 === 0 ? '#14141f' : '#f2f2f2'), cuff: '#ffffff', sword: '#6bcf8a', mouth: '#e8e8e8' };
    body(p, c); head(p, c);
    hairCap(p, c, { fringe: 6, sideDrop: 4, color: (x, y) => ((x * 3 + y) % 8 === 0 ? '#2b2b45' : '#14141f') });
    face(p, c);
    p.rect(9, 26, 13, 4, '#f5f5f5'); p.rect(9, 27, 13, 1, '#cfcfcf'); p.rect(9, 29, 13, 1, '#cfcfcf');          // bandage over the mouth
    // Kaburamaru the snake around the shoulders
    for (let i = 0; i < 12; i++) p.set(6 + i, 31 + ((i % 4 < 2) ? 0 : 1), i % 4 < 2 ? '#d8f0d8' : '#6bcf8a');
    p.set(18, 31, '#ffeb3b'); p.set(18, 32, '#6bcf8a'); p.set(19, 31, '#d8f0d8');
    return c;
  },
};
CHAR.gyomei = {
  name: 'Gyomei Himejima', title: 'Stone Hashira',
  build(p) {
    const c = { vest: '#3a2a22', seam: '#1c120e', sleeve: '#2b1b17', cuff1: '#8e1b1b', cuff2: '#d9a066', shoe: '#6a4a2a', shoeD: '#3a2412', blind: true, hair: '#c79a74', skin: '#e8b98a', haori: (x, y, s) => (y < 40 ? '#2b1b17' : '#8e1b1b'), cuff: '#8e1b1b', uniform: '#263238', sword: '#7a5a3a', blush: false, button: '#ffd166' };
    body(p, c);
    // broad shoulders
    p.rect(5, 31, 2, 9, '#2b1b17'); p.rect(24, 31, 2, 9, '#2b1b17');
    p.ell(15, 17, 11, 13, '#e8b98a');
    for (let y = 4; y < 9; y++) for (let x = 7; x < 24; x++) if (((x - 15) ** 2) / 100 + ((y - 15) ** 2) / 156 <= 1 && y < 8) p.set(x, y, '#f4d0a8');   // bald head highlight
    face(p, c);
    for (let y = 24; y < 31; y++) { p.set(8, y, '#6cc4ff'); p.set(23, y, '#6cc4ff'); }                // tears
    for (let i = 0; i < 12; i++) { const t = i / 11; const x = 8 + Math.round(15 * t), y = 31 + Math.round(8 * Math.sin(Math.PI * t)); p.rect(x, y, 2, 2, '#1a1a1a'); }   // prayer beads
    return c;
  },
};
CHAR.sanemi = {
  name: 'Sanemi Shinazugawa', title: 'Wind Hashira',
  build(p) {
    const c = { vest: '#2f4a3a', seam: '#16241c', sleeve: '#f2f2f2', cuff1: '#2f7a48', cuff2: '#5ad66b', shoe: '#2f7a48', shoeD: '#1a4a2c', eye: '#9b59ff', hair: '#f4f4f4', haori: (x, y, s) => '#f2f2f2', cuff: '#e0e0e0', uniform: '#263238', sword: '#5ad66b' };
    body(p, c);
    // open chest with scars
    p.rect(12, 31, 7, 7, '#f0c98a'); [[13, 32], [14, 33], [15, 34], [16, 35], [17, 33], [16, 32], [14, 36]].forEach(([x, y]) => p.set(x, y, '#c0504d'));
    head(p, c);
    hairCap(p, c, { fringe: 6, fringeJag: true, sideDrop: 4, color: (x, y) => ((x + y) % 6 === 0 ? '#d8d8e8' : '#f4f4f4') });
    spikes(p, '#f4f4f4', [[6, 8, 7, 4], [10, 5, 8, 4], [15, 3, 9, 4], [20, 5, 8, 4], [24, 8, 7, 4], [4, 13, 5, 3], [27, 13, 5, 3]]);
    face(p, c);
    for (let i = 0; i < 7; i++) { p.set(8 + i, 27 - (i >> 1), '#c0504d'); p.set(16 + i, 24 + (i >> 1), '#c0504d'); }       // face scars
    p.rect(14, 20, 3, 6, '#c0504d');
    return c;
  },
};

function renderChar(id) {
  const g = newGrid(); const p = mk(g);
  CHAR[id].build(p);
  // nichirin sword hilt + short blade at the left hip
  const c = CHAR[id];
  return outline(g);
}
function renderTengen(root) {
  const SPR = JSON.parse(fs.readFileSync(path.join(root, 'src', 'tengen-sprite.json'), 'utf8'));
  const g = newGrid();
  SPR.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.' && y < H && x < W) g[y][x] = SPR.pal[ch] || '#000'; }));
  return g;
}
const ORDER = ['giyu', 'shinobu', 'rengoku', 'tengen', 'muichiro', 'mitsuri', 'obanai', 'gyomei', 'sanemi'];
const META = { tengen: { name: 'Tengen Uzui', title: 'Sound Hashira' }, ...Object.fromEntries(Object.entries(CHAR).map(([k, v]) => [k, { name: v.name, title: v.title }])) };

function buildAll(outDir, root) {
  fs.mkdirSync(outDir, { recursive: true });
  const grids = {};
  for (const id of ORDER) grids[id] = id === 'tengen' ? renderTengen(root) : renderChar(id);
  for (const id of ORDER) fs.writeFileSync(path.join(outDir, `chibi-${id}.svg`), toSvg(grids[id], 8));
  // sheet (lineup)
  const sc = 5, gap = 8, w = ORDER.length * (W * sc + gap) + gap, h = H * sc + 2 * gap;
  const parts = ORDER.map((id, i) => `<g transform='translate(${gap + i * (W * sc + gap)} ${gap})'>${toSvg(grids[id], sc).replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</g>`);
  fs.writeFileSync(path.join(outDir, 'chibi-lineup.svg'), `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'><rect width='100%' height='100%' fill='#0a0630'/>${parts.join('')}</svg>`);
  return { grids, order: ORDER, meta: META };
}
function gridFor(id) { return id === 'tengen' ? renderTengen(path.resolve(__dirname, '..')) : renderChar(id); }
module.exports = { buildAll, ORDER, META, gridFor };
if (require.main === module) { buildAll(process.argv[2] || 'chibi-out', path.resolve(__dirname, '..')); console.log('wrote', ORDER.length, 'chibis + lineup'); }
