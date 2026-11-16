#!/usr/bin/env node
'use strict';
/* Chibi pixel sprites for the nine Hashira.
   Tengen          = the user's own traced sprite (src/tengen-sprite.json), untouched.
   The other eight = traced from the user's reference sheet (src/hashira-sprites.json), with a dark outline added so they read on every theme.
   Usage: node tools/chibi.js <outDir>   -> chibi-<id>.svg for each Hashira + chibi-lineup.svg */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const K = '#120a24';
const ORDER = ['giyu', 'shinobu', 'rengoku', 'tengen', 'muichiro', 'mitsuri', 'obanai', 'gyomei', 'sanemi'];
const META = {
  giyu: { name: 'Giyu Tomioka', title: 'Water Hashira' }, shinobu: { name: 'Shinobu Kocho', title: 'Insect Hashira' }, rengoku: { name: 'Kyojuro Rengoku', title: 'Flame Hashira' },
  tengen: { name: 'Tengen Uzui', title: 'Sound Hashira' }, muichiro: { name: 'Muichiro Tokito', title: 'Mist Hashira' }, mitsuri: { name: 'Mitsuri Kanroji', title: 'Love Hashira' },
  obanai: { name: 'Obanai Iguro', title: 'Serpent Hashira' }, gyomei: { name: 'Gyomei Himejima', title: 'Stone Hashira' }, sanemi: { name: 'Sanemi Shinazugawa', title: 'Wind Hashira' },
};

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'src', f), 'utf8'));
function gridFromSprite(sp) { return sp.rows.map((row) => (Array.isArray(row) ? row : [...row]).map((ch) => (ch === '.' ? null : sp.pal[ch] || null))); }
function outline(g) {                                         // pad by one cell, then draw a dark outline around the silhouette
  const H = g.length + 2, W = g[0].length + 2;
  const p = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (y >= 1 && y <= g.length && x >= 1 && x <= g[0].length ? g[y - 1][x - 1] : null)));
  const o = p.map((r) => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (p[y][x] === null && [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]].some(([a, b]) => a >= 0 && b >= 0 && a < W && b < H && p[b][a] !== null)) o[y][x] = K;
  return o;
}
function gridFor(id) {
  if (id === 'tengen') return gridFromSprite(readJson('tengen-sprite.json'));     // exactly the user's traced sprite
  return outline(gridFromSprite(readJson('hashira-sprites.json')[id]));
}
function toSvgBody(g, scale) {
  const R = [];
  for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) { const c = g[y][x]; if (!c) continue; let run = 1; while (x + run < g[0].length && g[y][x + run] === c) run++; R.push(`<rect x='${x * scale}' y='${y * scale}' width='${run * scale}' height='${scale}' fill='${c}'/>`); x += run - 1; }
  return R.join('');
}
function toSvg(g, scale = 8) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${g[0].length * scale}' height='${g.length * scale}' viewBox='0 0 ${g[0].length * scale} ${g.length * scale}' shape-rendering='crispEdges'>${toSvgBody(g, scale)}</svg>`;
}
function buildAll(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const grids = Object.fromEntries(ORDER.map((id) => [id, gridFor(id)]));
  for (const id of ORDER) fs.writeFileSync(path.join(outDir, `chibi-${id}.svg`), toSvg(grids[id], 8));
  const sc = 5, gap = 8, maxH = Math.max(...ORDER.map((id) => grids[id].length)), w = ORDER.reduce((a, id) => a + grids[id][0].length * sc + gap, gap), h = maxH * sc + 2 * gap;
  let x = gap;
  const parts = ORDER.map((id) => { const g = grids[id]; const t = `<g transform='translate(${x} ${gap + (maxH - g.length) * sc})'>${toSvgBody(g, sc)}</g>`; x += g[0].length * sc + gap; return t; });
  fs.writeFileSync(path.join(outDir, 'chibi-lineup.svg'), `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' shape-rendering='crispEdges'><rect width='100%' height='100%' fill='#0a0630'/>${parts.join('')}</svg>`);
  return { grids, order: ORDER, meta: META };
}
module.exports = { buildAll, ORDER, META, gridFor };
if (require.main === module) { buildAll(process.argv[2] || 'chibi-out'); console.log('wrote', ORDER.length, 'chibis + lineup'); }
