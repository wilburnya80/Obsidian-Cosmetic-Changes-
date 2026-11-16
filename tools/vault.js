#!/usr/bin/env node
/* ============================================================================
   Tengen vault tools — zero dependencies (Node 16+).

   Works in two places:
     • this repo           →  node tools/vault.js <command>         (vault = ./starter-vault)
     • an installed vault  →  node .tengen/tools/vault.js <command> (vault = the folder above .tengen)

   Commands (anything that edits existing notes is a DRY RUN unless you pass --write):
     build                       rebuild theme.css from src/ + categories.json, regenerate graph colours + link colours
     install <vaultPath>         install theme, snippets, tools, CLAUDE.md, graph colours, folders + hubs into a vault
     scaffold                    create category folders, hub notes, Home and A-Z Index if missing (never touches your notes)
     hubs                        regenerate the auto-lists inside every hub, Home and the A-Z Index
     new <catId> "Title"         create a note from the template, link it into its hub  [--related "A,B"] [--summary "..."]
     normalize [--write]         ensure frontmatter (category/tags/cssclasses/up/summary) and a Connections block on every note
     autolink  [--write]         wrap every mention of another note's title/alias in [[wikilinks]]  [--mode all|first]
     check                       lint: broken links, orphans, missing hub link, under-linked notes, unlinked mentions
     colors                      regenerate graph.json colour groups + per-note link colours only
   Flags: --vault <path>  --write  --mode all|first  --min-links N  --strict
   ========================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INSTALLED = path.basename(ROOT) === '.tengen';
const CFG = JSON.parse(fs.readFileSync(path.join(ROOT, 'categories.json'), 'utf8'));
const CATS = CFG.categories;
const THEME_NAME = CFG.theme || 'Tengen Entertainment District';
const HUB_CAT = CATS.find((c) => c.id === 'hub');
const MARK_START = '<!-- tengen:auto-start -->';
const MARK_END = '<!-- tengen:auto-end -->';
const TODAY = new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ args */
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const nxt = argv[i + 1];
      if (nxt !== undefined && !nxt.startsWith('--')) { out[k] = nxt; i++; } else out[k] = true;
    } else out._.push(a);
  }
  return out;
}
const ARGS = parseArgs(process.argv.slice(2));

function vaultDir() {
  if (ARGS.vault) return path.resolve(ARGS.vault);
  if (INSTALLED) return path.dirname(ROOT);
  return path.join(ROOT, 'starter-vault');
}
const log = (...a) => console.log(...a);
const read = (p) => fs.readFileSync(p, 'utf8');
function write(p, s) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }
function backupOnce(p) { if (fs.existsSync(p) && !fs.existsSync(p + '.tengen-bak')) fs.copyFileSync(p, p + '.tengen-bak'); }

/* ------------------------------------------------------------- colour utils */
const hexToRgb = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hexToInt = (h) => parseInt(h.replace('#', ''), 16);
const cssStr = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
const catById = (id) => CATS.find((c) => c.id === id);
const hubTitle = (c) => `${c.name} Hub`;

/* ======================================================================
   THEME BUILD
   ====================================================================== */
function genCategoryCss() {
  const out = [];
  out.push(':root {');
  for (const c of CATS) out.push(`  --cat-${c.id}: ${c.color}; --cat-${c.id}-rgb: ${hexToRgb(c.color).join(', ')};`);
  out.push('}');
  for (const c of CATS) {
    const [r, g, b] = hexToRgb(c.color);
    const rgb = `${r}, ${g}, ${b}`;
    const f = cssStr(c.folder);
    const v = `var(--cat-${c.id})`;
    out.push(`
/* ---- ${c.icon} ${c.name} · ${c.color} ---- */
.nav-folder-title[data-path="${f}"],
.nav-folder-title[data-path^="${f}/"] { color: ${v}; }
.nav-folder-title[data-path="${f}"] { border-left: 3px solid ${v}; background: linear-gradient(90deg, rgba(${rgb}, 0.18), transparent 85%); text-shadow: 0 0 10px rgba(${rgb}, 0.45); }
.nav-file-title[data-path^="${f}/"] { border-left: 2px solid rgba(${rgb}, 0.55); }
.nav-file-title[data-path^="${f}/"]:hover,
.nav-file-title[data-path^="${f}/"].is-active { color: ${v}; background: rgba(${rgb}, 0.16); }
.cat-${c.id} .inline-title,
.cat-${c.id} .markdown-rendered h1 { color: ${v}; text-shadow: 0 0 22px rgba(${rgb}, 0.5), 3px 3px 0 rgba(0, 0, 0, 0.55); }
.cat-${c.id} .markdown-rendered h1 { border-bottom-color: ${v}; }
.cat-${c.id} .markdown-rendered h2::before { color: ${v}; }
.cat-${c.id} .markdown-rendered { --blockquote-border-color: ${v}; --blockquote-background-color: rgba(${rgb}, 0.08); }
.cat-${c.id} .markdown-source-view.mod-cm6 { --blockquote-border-color: ${v}; }
.cat-${c.id} .metadata-container { border-left: 4px solid ${v}; box-shadow: -6px 0 18px -10px rgba(${rgb}, 0.8); }
.cat-${c.id} .markdown-rendered hr { background: linear-gradient(90deg, transparent, ${v}, transparent); }
a.tag[href="#${cssStr(c.tag)}"], a.tag[href^="#${cssStr(c.tag)}/"],
.cm-tag-${c.tag}, .cm-hashtag.cm-tag-${c.tag} { color: ${v}; background: rgba(${rgb}, 0.14); border-color: rgba(${rgb}, 0.7); }
.callout[data-callout="${c.id}"] { --callout-color: ${rgb}; --callout-icon: lucide-${c.callout}; }
.callout[data-callout="${c.id}"] .callout-title { color: ${v}; }
body.theme-light .nav-file-title[data-path^="${f}/"].is-active { box-shadow: 3px 3px 0 ${v}; }`);
  }
  out.push('\n/* ---- light mode ("Manga Panel"): same hues, inked down for contrast ---- */');
  out.push('.theme-light {');
  for (const c of CATS) out.push(`  --cat-${c.id}: color-mix(in srgb, ${c.color} 52%, #000);`);
  out.push('}');
  out.push('body.theme-light .nav-folder-title, body.theme-light .inline-title, body.theme-light .markdown-rendered h1 { text-shadow: none; }');
  out.push('body.theme-light .inline-title { text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.18); }');
  out.push('body.theme-light .metadata-container { box-shadow: none; }');
  return out.join('\n');
}

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const n1 = (x) => Math.round(x * 10) / 10;
const n2 = (x) => (Math.round(x * 100) / 100).toString();

function burstShadow(palette, R, glowColor) {
  const sh = [`0 0 34px 14px ${glowColor}`];
  const ring = (count, radius, phase, size) => {
    for (let i = 0; i < count; i++) {
      const a = phase + (i / count) * Math.PI * 2;
      const col = palette[i % palette.length];
      sh.push(`${n1(Math.cos(a) * radius)}px ${n1(Math.sin(a) * radius)}px 0 ${size}px ${col}`);
    }
  };
  ring(40, R, 0, 1);
  ring(40, R * 0.93, Math.PI / 40, 0);    // trailing sparks just inside the main ring
  ring(40, R * 0.86, 0, -1);
  ring(24, R * 0.6, Math.PI / 24, 0);
  ring(14, R * 0.3, 0, 0);
  return sh.join(',\n    ');
}

function genFireworks() {
  const seqs = [
    { sel: 'body::after',               kf: 'tg-fw-a', n: 7, dur: 15, delay: -4, seed: 7,  R: 120, pal: ['#ff2d55', '#ff4fd8', '#ffc93c', '#ffffff'], glow: 'rgba(255, 90, 120, 0.55)' },
    { sel: '.app-container::before',    kf: 'tg-fw-b', n: 6, dur: 19, delay: -9, seed: 21, R: 110, pal: ['#8b3dff', '#3ea6ff', '#ff4fd8', '#ffffff'], glow: 'rgba(150, 100, 255, 0.5)' },
    { sel: '.app-container::after',     kf: 'tg-fw-c', n: 5, dur: 12, delay: -2, seed: 99, R: 130, pal: ['#ffc93c', '#ff8a3d', '#ff2d55', '#ffe9a8'], glow: 'rgba(255, 190, 80, 0.55)' },
  ];
  const css = [];
  for (const s of seqs) {
    const rand = rng(s.seed);
    css.push(`${s.sel} {\n  box-shadow:\n    ${burstShadow(s.pal, s.R, s.glow)};\n  animation: ${s.kf} ${s.dur}s linear ${s.delay}s infinite;\n}`);
    const W = 100 / s.n;
    const kf = [`@keyframes ${s.kf} {`, '  0% { opacity: 0; }'];
    for (let i = 0; i < s.n; i++) {
      const st = 1 + i * W + rand() * W * 0.2;
      const life = W * (0.62 + rand() * 0.1);
      const x = n1(9 + rand() * 82), y = n1(7 + rand() * 46);
      const m = n2(1.1 + rand() * 0.9);
      const pos = `translate(${x}vw, ${y}vh)`;
      kf.push(`  ${n2(st - 0.02)}% { transform: ${pos} scale(0.03); opacity: 0; }`);
      kf.push(`  ${n2(st)}% { transform: ${pos} scale(0.03); opacity: 1; animation-timing-function: cubic-bezier(0.08, 0.7, 0.25, 1); }`);
      kf.push(`  ${n2(st + life * 0.42)}% { transform: ${pos} scale(${m}); opacity: 1; animation-timing-function: ease-in; }`);
      kf.push(`  ${n2(st + life)}% { transform: translate(${x}vw, ${n1(y + 9)}vh) scale(${n2(m * 1.12)}); opacity: 0; }`);
    }
    kf.push('  100% { opacity: 0; }', '}');
    css.push(kf.join('\n'));
  }
  return css.join('\n\n');
}

function svgDataUri() {
  const raw = read(path.join(ROOT, 'src', 'tengen.svg')).replace(/<!--[\s\S]*?-->/g, '').replace(/\s*\n\s*/g, ' ').trim();
  return `"data:image/svg+xml;utf8,${encodeURIComponent(raw).replace(/'/g, '%27').replace(/"/g, '%22')}"`;
}

function buildThemeCss() {
  const dir = path.join(ROOT, 'src');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.css')).sort();
  const svg = svgDataUri();
  const fw = genFireworks();
  const cats = genCategoryCss();
  return files.map((f) => read(path.join(dir, f))
    .replace(/\{\{TENGEN_SVG\}\}/g, () => svg)
    .replace('{{FIREWORKS}}', () => fw)
    .replace('{{CATEGORY_CSS}}', () => cats)).join('\n\n') + '\n';
}

function manifest() {
  return JSON.stringify({ name: THEME_NAME, version: '1.0.0', minAppVersion: '1.0.0', author: 'Tengen Theme', authorUrl: 'https://github.com/wilburnya80/Obsidian-Cosmetic-Changes-' }, null, 2) + '\n';
}

function writeTheme(vault) {
  const css = buildThemeCss();
  const dest = path.join(vault, '.obsidian', 'themes', THEME_NAME);
  write(path.join(dest, 'theme.css'), css);
  write(path.join(dest, 'manifest.json'), manifest());
  return { css, dest };
}

function cmdBuild() {
  const vault = vaultDir();
  if (!INSTALLED) {
    const css = buildThemeCss();
    write(path.join(ROOT, 'theme.css'), css);
    write(path.join(ROOT, 'manifest.json'), manifest());
    log(`✔ theme.css (${(css.length / 1024).toFixed(0)} KB) + manifest.json written to repo root`);
  }
  if (fs.existsSync(vault)) {
    const t = writeTheme(vault);
    log(`✔ theme copied to ${path.relative(process.cwd(), t.dest) || t.dest}`);
    cmdColors();
  }
}

/* ======================================================================
   VAULT MODEL
   ====================================================================== */
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else if (e.name.endsWith('.md')) acc.push(p);
  }
  return acc;
}

function parseYaml(raw) {
  const fm = {};
  const lines = raw.split(/\r?\n/);
  let key = null;
  const unq = (s) => s.trim().replace(/^(['"])(.*)\1$/, '$2');
  for (const line of lines) {
    let m;
    if ((m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))) {
      key = m[1];
      const v = m[2].trim();
      if (v === '') fm[key] = [];
      else if (v.startsWith('[') && v.endsWith(']')) {
        const inner = v.slice(1, -1).trim();
        fm[key] = inner ? inner.match(/"[^"]*"|'[^']*'|[^,]+/g).map(unq) : [];
      } else fm[key] = unq(v);
    } else if ((m = line.match(/^\s+-\s+(.*)$/)) && key) {
      if (!Array.isArray(fm[key])) fm[key] = fm[key] ? [fm[key]] : [];
      fm[key].push(unq(m[1]));
    }
  }
  return fm;
}
const asList = (v) => (Array.isArray(v) ? v : v ? [v] : []);

function splitNote(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!m) return { fmRaw: null, fm: {}, body: text };
  return { fmRaw: m[1], fm: parseYaml(m[1]), body: text.slice(m[0].length) };
}

function loadVault(vault) {
  const files = walk(vault).filter((f) => !(path.dirname(f) === vault && /^(CLAUDE|AGENTS|README)\.md$/i.test(path.basename(f))));
  const notes = files.map((abs) => {
    const rel = path.relative(vault, abs).split(path.sep).join('/');
    const text = read(abs);
    const { fmRaw, fm, body } = splitNote(text);
    const title = path.basename(abs, '.md');
    let cat = CATS.find((c) => rel.startsWith(c.folder + '/')) || null;
    if (!cat && fm.category) cat = catById(String(fm.category)) || null;
    return { abs, rel, text, fmRaw, fm, body, title, cat, aliases: asList(fm.aliases).map(String) };
  });
  const byName = new Map();
  const add = (k, n) => { k = k.toLowerCase(); if (!byName.has(k)) byName.set(k, n); };
  for (const n of notes) { add(n.title, n); add(n.rel.replace(/\.md$/, ''), n); }
  for (const n of notes) for (const a of n.aliases) add(a, n);
  return { vault, notes, byName };
}

const WIKI = /(!?)\[\[([^\]|#\n]+?)(#[^\]|\n]*?)?(\|[^\]\n]*?)?\]\]/g;
function linksOf(text) {
  const out = [];
  let m;
  WIKI.lastIndex = 0;
  while ((m = WIKI.exec(text))) out.push({ target: m[2].replace(/\\$/, '').trim(), embed: !!m[1], raw: m[0] });
  return out;
}
function resolve(model, target) {
  const t = target.replace(/\.md$/, '').toLowerCase();
  return model.byName.get(t) || model.byName.get(t.split('/').pop()) || null;
}

/* ======================================================================
   COLOURS: graph.json + per-note link colours
   ====================================================================== */
function colorGroups() {
  return CATS.map((c) => ({ query: `path:"${c.folder}"`, color: { a: 1, rgb: hexToInt(c.color) } }));
}
const GRAPH_DEFAULTS = {
  'collapse-filter': true, search: '', showTags: false, showAttachments: false, hideUnresolved: false, showOrphans: true,
  'collapse-color-groups': false, colorGroups: [], 'collapse-display': false, showArrow: true, textFadeMultiplier: -0.6,
  nodeSizeMultiplier: 1.4, lineSizeMultiplier: 1.2, 'collapse-forces': true, centerStrength: 0.45, repelStrength: 12, linkStrength: 1, linkDistance: 220, scale: 0.5, close: true,
};
function mergeJson(file, patch, defaults = {}) {
  let cur = {};
  if (fs.existsSync(file)) { try { cur = JSON.parse(read(file)); } catch (e) { backupOnce(file); cur = {}; } backupOnce(file); }
  write(file, JSON.stringify({ ...defaults, ...cur, ...patch }, null, 2) + '\n');
}

function cmdColors() {
  const vault = vaultDir();
  mergeJson(path.join(vault, '.obsidian', 'graph.json'), { colorGroups: colorGroups() }, GRAPH_DEFAULTS);
  log('✔ graph.json colour groups written (' + CATS.length + ' categories)');
  const model = loadVault(vault);
  const per = {};
  for (const n of model.notes) {
    if (!n.cat) continue;
    const terms = [n.title, ...n.aliases];
    (per[n.cat.id] = per[n.cat.id] || []).push(...terms);
  }
  const css = ['/* GENERATED by `vault.js colors` — colours every [[wikilink]] by the category of the note it points to. Re-run after adding notes. */'];
  for (const c of CATS) {
    const terms = [...new Set(per[c.id] || [])];
    if (!terms.length) continue;
    const sel = [];
    for (const t of terms) {
      const q = cssStr(t);
      sel.push(`a.internal-link[data-href="${q}" i]`, `a.internal-link[data-href^="${q}#" i]`, `a.internal-link[data-href^="${q}|" i]`);
    }
    css.push(`/* ${c.icon} ${c.name} */\n${sel.join(',\n')} { color: var(--cat-${c.id}); border-bottom-color: rgba(var(--cat-${c.id}-rgb), 0.55); }`);
    css.push(`${sel.map((s) => s + ':hover').join(',\n')} { text-shadow: 0 0 12px var(--cat-${c.id}); }`);
  }
  write(path.join(vault, '.obsidian', 'snippets', 'category-link-colors.css'), css.join('\n') + '\n');
  log(`✔ category-link-colors.css written (${Object.values(per).reduce((a, b) => a + b.length, 0)} link targets)`);
}

/* ======================================================================
   SCAFFOLD + HUBS
   ====================================================================== */
function fmBlock(obj) {
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) lines.push(v.length ? `${k}: [${v.map((x) => (/[\[\]:#,"']/.test(x) ? JSON.stringify(x) : x)).join(', ')}]` : `${k}: []`);
    else lines.push(`${k}: ${/[:#\[\]"']/.test(String(v)) && !String(v).startsWith('"') ? JSON.stringify(String(v)) : v}`);
  }
  lines.push('---');
  return lines.join('\n');
}

function hubFileFor(c) { return path.join(vaultDir(), HUB_CAT.folder, `${hubTitle(c)}.md`); }

function ensureHubNotes() {
  const vault = vaultDir();
  const created = [];
  for (const c of CATS) fs.mkdirSync(path.join(vault, c.folder), { recursive: true });
  const mk = (file, content) => { if (!fs.existsSync(file)) { write(file, content); created.push(path.relative(vault, file)); } };
  for (const c of CATS.filter((x) => x.id !== 'hub')) {
    mk(hubFileFor(c), `${fmBlock({ category: 'hub', tags: ['hub', 'hub-' + c.id], cssclasses: ['cat-hub'], aliases: [c.name], summary: `Every ${c.name.toLowerCase()} note, auto-listed.`, up: '[[Home]]', created: TODAY })}

# ${c.icon} ${c.name} Hub

> [!${c.id}] ${c.name}
> ${c.blurb}

${MARK_START}
${MARK_END}
`);
  }
  mk(path.join(vault, HUB_CAT.folder, 'Home.md'), `${fmBlock({ category: 'hub', tags: ['hub'], cssclasses: ['cat-hub'], aliases: ['Start', 'Dashboard'], summary: 'Front door of the vault: links to every category hub.', created: TODAY })}

# 🏯 Home

> [!hub] Welcome
> Every note in this vault belongs to exactly one colour-coded category and is linked from that category's hub. Start anywhere below.

${MARK_START}
${MARK_END}
`);
  mk(path.join(vault, HUB_CAT.folder, 'A-Z Index.md'), `${fmBlock({ category: 'hub', tags: ['hub'], cssclasses: ['cat-hub'], aliases: ['Index', 'Everything'], summary: 'Alphabetical index of every note, colour-tagged by category.', up: '[[Home]]', created: TODAY })}

# 🔤 A-Z Index

${MARK_START}
${MARK_END}
`);
  return created;
}

function replaceAuto(text, inner) {
  const block = `${MARK_START}\n${inner.trim()}\n${MARK_END}`;
  const re = new RegExp(`${MARK_START}[\\s\\S]*?${MARK_END}`);
  return re.test(text) ? text.replace(re, () => block) : text.replace(/\s*$/, '\n\n') + block + '\n';
}
const sum = (n) => (n.fm.summary ? ' — ' + String(n.fm.summary).slice(0, 150) : '');

function cmdScaffold() {
  const created = ensureHubNotes();
  log(created.length ? '✔ created:\n  ' + created.join('\n  ') : '✔ scaffold already complete');
}

function cmdHubs() {
  ensureHubNotes();
  const vault = vaultDir();
  const model = loadVault(vault);
  const inCat = (c) => model.notes.filter((n) => n.cat && n.cat.id === c.id).sort((a, b) => a.title.localeCompare(b.title));
  const hubs = CATS.filter((c) => c.id !== 'hub');
  const hubLine = (c) => `[[${hubTitle(c)}|${c.icon} ${c.name}]]`;
  const set = (file, inner) => { const old = read(file); const nw = replaceAuto(old, inner); if (nw !== old) write(file, nw); };

  for (const c of hubs) {
    const list = inCat(c);
    const inner = [`## All ${c.name} (${list.length})`, '', ...(list.length ? list.map((n) => `- [[${n.title}]]${sum(n)}`) : ['_Nothing here yet — create one with `node .tengen/tools/vault.js new ' + c.id + ' "Title"`._']),
      '', '## Jump to another hub', '', hubs.filter((x) => x.id !== c.id).map(hubLine).join(' · '), '', '↩ [[Home]] · [[A-Z Index]]'].join('\n');
    set(hubFileFor(c), inner);
  }

  const uncategorised = model.notes.filter((n) => !n.cat);
  const homeInner = [
    '## Categories', '',
    ...hubs.map((c) => `- ${c.icon} ${hubLine(c).replace(`${c.icon} `, '')} — **${inCat(c).length}** notes · ${c.blurb}`),
    '', '## Everything', '', '- 🔤 [[A-Z Index]] — every note, alphabetical',
    `- 📊 ${model.notes.length} notes total across ${hubs.length} categories`,
    ...(uncategorised.length ? ['', '## Not yet categorised', '', ...uncategorised.filter((n) => !/^(Home|A-Z Index)$/.test(n.title)).map((n) => `- [[${n.title}]]${sum(n)}`)] : []),
  ].join('\n');
  set(path.join(vault, HUB_CAT.folder, 'Home.md'), homeInner);

  const sorted = model.notes.slice().sort((a, b) => a.title.localeCompare(b.title));
  const groups = {};
  for (const n of sorted) (groups[n.title[0].toUpperCase()] = groups[n.title[0].toUpperCase()] || []).push(n);
  const idx = Object.keys(groups).sort().flatMap((k) => ['### ' + k, '', ...groups[k].map((n) => `- [[${n.title}]] ${n.cat ? n.cat.icon + ' ' + n.cat.name : '·'}`), '']).join('\n');
  set(path.join(vault, HUB_CAT.folder, 'A-Z Index.md'), idx);
  log(`✔ hubs refreshed (${hubs.length} category hubs, Home, A-Z Index; ${model.notes.length} notes)`);
}

/* ======================================================================
   NEW NOTE
   ====================================================================== */
function cmdNew() {
  const [id, ...rest] = ARGS._.slice(1);
  const title = rest.join(' ').trim();
  const c = catById(id || '');
  if (!c || !title) { console.error('usage: new <catId> "Title"   catIds: ' + CATS.map((x) => x.id).join(', ')); process.exit(2); }
  ensureHubNotes();
  const vault = vaultDir();
  const file = path.join(vault, c.folder, `${title}.md`);
  if (fs.existsSync(file)) { console.error('already exists: ' + file); process.exit(1); }
  const rel = asList(ARGS.related ? String(ARGS.related).split(',').map((s) => s.trim()).filter(Boolean) : []);
  write(file, noteSkeleton(c, title, ARGS.summary || '', rel));
  log('✔ created ' + path.relative(vault, file));
  cmdHubs();
  ARGS.write = true; ARGS.only = title;
  cmdAutolink(true);
}

function connectionsBlock(c, related) {
  const hub = c.id === 'hub' ? '[[Home]]' : `[[${hubTitle(c)}]] · [[Home]] · [[A-Z Index]]`;
  const lines = ['## Connections', '', `- **Hub:** ${hub}`];
  if (related.length) lines.push(`- **Related:** ${related.map((r) => `[[${r}]]`).join(' · ')}`);
  return lines.join('\n');
}
function noteSkeleton(c, title, summary, related) {
  return `${fmBlock({ category: c.id, tags: [c.tag], cssclasses: ['cat-' + c.id], aliases: [], summary: summary || '', up: `[[${hubTitle(c)}]]`, related: related.map((r) => `[[${r}]]`), created: TODAY })}

# ${title}

> [!${c.id}] At a glance
> ${summary || 'One-line description goes here.'}

## Overview

Write here. Mention other notes by name — \`autolink\` will turn them into links.

${connectionsBlock(c, related)}
`;
}

/* ======================================================================
   NORMALIZE
   ====================================================================== */
function ensureKey(fmRaw, key, value) {
  const re = new RegExp(`^${key}:`, 'm');
  if (re.test(fmRaw)) return fmRaw;
  return fmRaw.replace(/\s*$/, '') + `\n${key}: ${value}`;
}
function ensureListItem(fmRaw, key, item) {
  const re = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm');
  const m = fmRaw.match(re);
  if (!m) return fmRaw.replace(/\s*$/, '') + `\n${key}: [${item}]`;
  const v = m[1].trim();
  if (v.startsWith('[')) {
    const items = parseYaml(`${key}: ${v}`)[key];
    if (items.includes(item)) return fmRaw;
    return fmRaw.replace(re, () => `${key}: [${[...items, item].join(', ')}]`);
  }
  if (v === '') { // block list
    const block = parseYaml(fmRaw)[key] || [];
    if (block.includes(item)) return fmRaw;
    const idx = fmRaw.search(re);
    const after = fmRaw.slice(idx);
    const lines = after.split('\n');
    let i = 1;
    while (i < lines.length && /^\s+-\s/.test(lines[i])) i++;
    lines.splice(i, 0, `  - ${item}`);
    return fmRaw.slice(0, idx) + lines.join('\n');
  }
  const cur = v.replace(/^(['"])(.*)\1$/, '$2');
  if (cur === item) return fmRaw;
  return fmRaw.replace(re, () => `${key}: [${cur}, ${item}]`);
}

function cmdNormalize() {
  const model = loadVault(vaultDir());
  const doWrite = !!ARGS.write;
  let changed = 0;
  for (const n of model.notes) {
    if (!n.cat || n.cat.id === 'hub') continue;
    let fmRaw = n.fmRaw === null ? '' : n.fmRaw;
    const before = fmRaw;
    fmRaw = ensureKey(fmRaw, 'category', n.cat.id);
    fmRaw = ensureListItem(fmRaw, 'tags', n.cat.tag);
    fmRaw = ensureListItem(fmRaw, 'cssclasses', 'cat-' + n.cat.id);
    fmRaw = ensureKey(fmRaw, 'up', JSON.stringify(`[[${hubTitle(n.cat)}]]`));
    fmRaw = ensureKey(fmRaw, 'summary', '""');
    fmRaw = ensureKey(fmRaw, 'created', TODAY);
    fmRaw = fmRaw.replace(/^\n+/, '');
    let body = n.body;
    if (!new RegExp(`\\[\\[${hubTitle(n.cat).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\||\\]\\])`).test(body)) {
      if (!/^## Connections\s*$/m.test(body)) body = body.replace(/\s*$/, '\n\n') + connectionsBlock(n.cat, []) + '\n';
      else body = body.replace(/^## Connections\s*$/m, `## Connections\n\n- **Hub:** [[${hubTitle(n.cat)}]] · [[Home]] · [[A-Z Index]]`);
    }
    const next = `---\n${fmRaw}\n---\n${body.replace(/^\n+/, '\n')}`;
    if (next !== n.text) {
      changed++;
      log(`${doWrite ? '✎' : '·'} ${n.rel}${fmRaw !== before ? '  (frontmatter)' : ''}${body !== n.body ? '  (hub link)' : ''}`);
      if (doWrite) { backupOnce(n.abs); write(n.abs, next); }
    }
  }
  log(`${doWrite ? '✔ normalized' : 'dry run — would normalize'} ${changed} notes${doWrite ? '' : '  (re-run with --write)'}`);
  if (doWrite) cmdHubs();
}

/* ======================================================================
   AUTOLINK
   ====================================================================== */
function ignoreTerms() {
  const f = path.join(vaultDir(), '.tengen', 'autolink-ignore.txt');
  const g = path.join(ROOT, 'autolink-ignore.txt');
  const src = fs.existsSync(f) ? f : fs.existsSync(g) ? g : null;
  return new Set(src ? read(src).split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter((s) => s && !s.startsWith('#')) : []);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PROTECT = /`[^`]*`|!?\[\[[^\]]*\]\]|\[[^\]]*\]\([^)]*\)|https?:\/\/\S+|<[^>]+>|%%[^%]*%%|==|\*\*|__/g;

function buildMatcher(model, ignore) {
  const terms = new Map(); // lower -> {note, single}
  for (const n of model.notes) {
    if (n.cat && n.cat.id === 'hub') continue;
    for (const t of [n.title, ...n.aliases]) {
      const k = t.trim();
      if (k.length < 3 || ignore.has(k.toLowerCase()) || /^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
      const lower = k.toLowerCase();
      if (!terms.has(lower)) terms.set(lower, { note: n, text: k, single: !/\s/.test(k) });
    }
  }
  const ci = [...terms.values()].filter((t) => !t.single).map((t) => esc(t.text)).sort((a, b) => b.length - a.length);
  const cs = [...terms.values()].filter((t) => t.single).map((t) => esc(t.text)).sort((a, b) => b.length - a.length);
  const wrap = (arr, flags) => (arr.length ? new RegExp(`(?<![\\p{L}\\p{N}_])(?:${arr.join('|')})(?![\\p{L}\\p{N}_])`, flags) : null);
  return { terms, reCI: wrap(ci, 'giu'), reCS: wrap(cs, 'gu') };
}

function findMatches(seg, matcher) {
  const found = [];
  for (const [re, ci] of [[matcher.reCI, true], [matcher.reCS, false]]) {
    if (!re) continue;
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(seg))) {
      const t = matcher.terms.get(m[0].toLowerCase());
      if (t && (ci || t.text === m[0])) found.push({ start: m.index, end: m.index + m[0].length, text: m[0], note: t.note });
    }
  }
  found.sort((a, b) => a.start - b.start || b.end - a.end);
  const out = [];
  let last = -1;
  for (const f of found) if (f.start >= last) { out.push(f); last = f.end; }
  return out;
}

function autolinkNote(n, matcher, mode, model) {
  const lines = n.body.split('\n');
  let inFence = false, skipLevel = 0, inAuto = false, count = 0;
  const linked = new Set();
  const selfKeys = new Set([n.title, ...n.aliases].map((s) => s.toLowerCase()));
  const examples = [];
  const out = lines.map((line) => {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return line; }
    if (inFence) return line;
    if (line.includes(MARK_START)) { inAuto = true; return line; }
    if (line.includes(MARK_END)) { inAuto = false; return line; }
    if (inAuto) return line;
    const h = line.match(/^(#{1,6})\s/);
    if (h) { skipLevel = /^#{1,6}\s+(Connections|Related|Links|See also)\s*$/i.test(line) ? h[1].length : (skipLevel && h[1].length > skipLevel ? skipLevel : 0); return line; }
    if (skipLevel) return line;
    // split into protected / free segments
    const parts = [];
    let idx = 0, m;
    PROTECT.lastIndex = 0;
    while ((m = PROTECT.exec(line))) { if (m.index > idx) parts.push({ free: true, s: line.slice(idx, m.index) }); parts.push({ free: false, s: m[0] }); idx = m.index + m[0].length; }
    if (idx < line.length) parts.push({ free: true, s: line.slice(idx) });
    const isTable = line.trim().startsWith('|');
    const calloutHead = /^>\s*\[![^\]]+\][+-]?\s/.test(line);
    return parts.map((p) => {
      if (!p.free || calloutHead) return p.s;
      const ms = findMatches(p.s, matcher);
      if (!ms.length) return p.s;
      let res = '', pos = 0;
      for (const f of ms) {
        if (selfKeys.has(f.text.toLowerCase()) || f.note === n) continue;
        if (mode === 'first' && linked.has(f.note)) continue;
        res += p.s.slice(pos, f.start);
        const bar = isTable ? '\\|' : '|';
        res += f.text === f.note.title ? `[[${f.note.title}]]` : `[[${f.note.title}${bar}${f.text}]]`;
        pos = f.end; linked.add(f.note); count++;
        if (examples.length < 3) examples.push(`${f.text}→${f.note.title}`);
      }
      return res + p.s.slice(pos);
    }).join('');
  });
  return { text: out.join('\n'), count, examples };
}

function cmdAutolink(quiet) {
  const model = loadVault(vaultDir());
  const mode = ARGS.mode === 'first' ? 'first' : 'all';
  const matcher = buildMatcher(model, ignoreTerms());
  const doWrite = !!ARGS.write;
  let total = 0, files = 0;
  for (const n of model.notes) {
    if (ARGS.only && n.title.toLowerCase() !== String(ARGS.only).toLowerCase()) continue;
    if (n.cat && n.cat.id === 'hub') continue;
    if (String(n.fm.autolink) === 'false') continue;
    const r = autolinkNote(n, matcher, mode, model);
    if (!r.count) continue;
    total += r.count; files++;
    if (!quiet) log(`${doWrite ? '✎' : '·'} ${n.rel}: +${r.count}  (${r.examples.join(', ')}${r.count > 3 ? ', …' : ''})`);
    if (doWrite) {
      backupOnce(n.abs);
      const head = n.fmRaw === null ? '' : `---\n${n.fmRaw}\n---\n`;
      write(n.abs, head + r.text);
    }
  }
  log(`${doWrite ? '✔ added' : 'dry run — would add'} ${total} links in ${files} notes (mode: ${mode})${doWrite ? '' : '  (re-run with --write)'}`);
}

/* ======================================================================
   CHECK
   ====================================================================== */
function cmdCheck() {
  const model = loadVault(vaultDir());
  const minLinks = parseInt(ARGS['min-links'] || '6', 10);
  const inbound = new Map(model.notes.map((n) => [n, new Set()]));
  const outbound = new Map();
  const broken = [], noHub = [], thin = [], fmProblems = [];
  for (const n of model.notes) {
    const outs = new Set();
    for (const l of linksOf(n.text)) {
      const t = resolve(model, l.target);
      if (!t) { broken.push(`${n.rel} → [[${l.target}]]`); continue; }
      if (t !== n) { outs.add(t); inbound.get(t).add(n); }
    }
    outbound.set(n, outs);
    if (n.cat && n.cat.id !== 'hub') {
      const hub = model.byName.get(hubTitle(n.cat).toLowerCase());
      if (!hub || !outs.has(hub)) noHub.push(n.rel);
      if (outs.size < minLinks) thin.push(`${n.rel} (${outs.size})`);
      const miss = [];
      if (String(n.fm.category) !== n.cat.id) miss.push('category');
      if (!asList(n.fm.tags).includes(n.cat.tag)) miss.push('tags');
      if (!asList(n.fm.cssclasses).includes('cat-' + n.cat.id)) miss.push('cssclasses');
      if (!n.fm.up) miss.push('up');
      if (!n.fm.summary) miss.push('summary');
      if (miss.length) fmProblems.push(`${n.rel} (${miss.join(', ')})`);
    }
  }
  const orphans = model.notes.filter((n) => inbound.get(n).size === 0 && !/^(Home)$/.test(n.title)).map((n) => n.rel);
  const uncategorised = model.notes.filter((n) => !n.cat).map((n) => n.rel);
  const matcher = buildMatcher(model, ignoreTerms());
  let unlinked = 0; const unlinkedFiles = [];
  for (const n of model.notes) {
    if (n.cat && n.cat.id === 'hub') continue;
    if (String(n.fm.autolink) === 'false') continue;
    const r = autolinkNote(n, matcher, 'all', model);
    if (r.count) { unlinked += r.count; unlinkedFiles.push(`${n.rel} (+${r.count})`); }
  }
  const sec = (label, arr, level) => {
    log(`\n${arr.length ? (level === 'err' ? '✖' : '⚠') : '✔'} ${label}: ${arr.length}`);
    arr.slice(0, 25).forEach((x) => log('   ' + x));
    if (arr.length > 25) log(`   … ${arr.length - 25} more`);
  };
  log(`Vault: ${model.vault}\nNotes: ${model.notes.length}   Links: ${[...outbound.values()].reduce((a, s) => a + s.size, 0)} unique note→note edges`);
  sec('Broken links', broken, 'err');
  sec('Missing link to own category hub', noHub);
  sec(`Under-linked notes (<${minLinks} outgoing)`, thin);
  sec('Orphans (nothing links to them)', orphans);
  sec('Frontmatter gaps', fmProblems);
  sec('Notes outside every category folder', uncategorised);
  sec('Unlinked mentions of other notes (run: autolink --write)', unlinkedFiles);
  const bad = broken.length > 0 || (ARGS.strict && (noHub.length || thin.length || orphans.length || fmProblems.length || unlinked));
  log(bad ? '\nRESULT: needs work' : '\nRESULT: ok');
  process.exit(bad ? 1 : 0);
}

/* ======================================================================
   INSTALL
   ====================================================================== */
function copyDir(src, dst, skip = () => false) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (skip(s)) continue;
    if (e.isDirectory()) copyDir(s, d, skip); else fs.copyFileSync(s, d);
  }
}

function renderClaudeMd() {
  const tpl = read(path.join(ROOT, 'templates', 'vault-CLAUDE.md'));
  const table = ['| Colour | Category | Folder | Tag | `cssclasses` | Hub note |', '|---|---|---|---|---|---|']
    .concat(CATS.map((c) => `| ${c.icon} \`${c.color}\` | ${c.name} | \`${c.folder}/\` | \`#${c.tag}\` | \`cat-${c.id}\` | ${c.id === 'hub' ? '[[Home]]' : `[[${hubTitle(c)}]]`} |`)).join('\n');
  return tpl.replace('{{CATEGORY_TABLE}}', table).replace('{{CATEGORY_IDS}}', CATS.map((c) => c.id).join(', ')).replace(/\{\{THEME\}\}/g, THEME_NAME);
}

function cmdInstall() {
  if (INSTALLED) { console.error('Run install from the repo checkout, not from inside an installed vault.'); process.exit(2); }
  const target = ARGS._[1] || ARGS.vault;
  if (!target) { console.error('usage: node tools/vault.js install <path-to-your-obsidian-vault> [--no-scaffold]'); process.exit(2); }
  const vault = path.resolve(target);
  if (!fs.existsSync(vault) || !fs.statSync(vault).isDirectory()) { console.error('Vault folder not found: ' + vault); process.exit(2); }
  log(`Installing into ${vault}`);
  const t = writeTheme(vault);
  log(`✔ theme → ${path.relative(vault, t.dest)}`);
  // snippets
  fs.mkdirSync(path.join(vault, '.obsidian', 'snippets'), { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, 'snippets'))) fs.copyFileSync(path.join(ROOT, 'snippets', f), path.join(vault, '.obsidian', 'snippets', f));
  log('✔ snippets copied (calm-mode, bright-scene, readable-mode, no-tengen — enable any in Settings → Appearance)');
  // toolkit
  const kit = path.join(vault, '.tengen');
  fs.mkdirSync(kit, { recursive: true });
  copyDir(path.join(ROOT, 'tools'), path.join(kit, 'tools'));
  copyDir(path.join(ROOT, 'src'), path.join(kit, 'src'));
  copyDir(path.join(ROOT, 'templates'), path.join(kit, 'templates'));
  copyDir(path.join(ROOT, 'snippets'), path.join(kit, 'snippets'));
  fs.copyFileSync(path.join(ROOT, 'categories.json'), path.join(kit, 'categories.json'));
  if (fs.existsSync(path.join(ROOT, 'autolink-ignore.txt'))) fs.copyFileSync(path.join(ROOT, 'autolink-ignore.txt'), path.join(kit, 'autolink-ignore.txt'));
  log('✔ toolkit → .tengen/  (hidden in Obsidian, visible to Claude)');
  // appearance
  const ap = path.join(vault, '.obsidian', 'appearance.json');
  let cur = {};
  if (fs.existsSync(ap)) { try { cur = JSON.parse(read(ap)); } catch (e) { cur = {}; } backupOnce(ap); }
  const snippets = new Set(cur.enabledCssSnippets || []); snippets.add('category-link-colors');
  write(ap, JSON.stringify({ ...cur, theme: cur.theme || 'obsidian', cssTheme: THEME_NAME, enabledCssSnippets: [...snippets] }, null, 2) + '\n');
  log(`✔ appearance.json → theme "${THEME_NAME}" enabled (dark = Night Parade, light = Manga Panel)`);
  // graph
  mergeJson(path.join(vault, '.obsidian', 'graph.json'), { colorGroups: colorGroups() }, GRAPH_DEFAULTS);
  log('✔ graph.json → one colour group per category (existing graph settings kept)');
  // CLAUDE.md
  const cm = path.join(vault, 'CLAUDE.md');
  const block = `<!-- tengen:start -->\n${renderClaudeMd().trim()}\n<!-- tengen:end -->\n`;
  if (fs.existsSync(cm)) {
    const old = read(cm);
    const re = /<!-- tengen:start -->[\s\S]*?<!-- tengen:end -->\n?/;
    backupOnce(cm);
    write(cm, re.test(old) ? old.replace(re, () => block) : old.replace(/\s*$/, '\n\n') + block);
    log('✔ CLAUDE.md → Tengen section merged into your existing file');
  } else { write(cm, block); log('✔ CLAUDE.md → created'); }
  // scaffold
  if (!ARGS['no-scaffold']) {
    ARGS.vault = vault;
    const created = ensureHubNotes();
    log(created.length ? `✔ created ${created.length} folders/hubs (your own notes were not touched)` : '✔ folders/hubs already present');
    cmdHubs();
    cmdColors();
  }
  log(`
Next:
  1. In Obsidian: Settings → Appearance → Themes → pick "${THEME_NAME}" (already set; reload with Ctrl/Cmd+R if open).
  2. In a terminal:  cd "${vault}"  &&  claude
  3. Ask Claude to run:  node .tengen/tools/vault.js normalize   (dry run first)  then  autolink / check.`);
}

/* ------------------------------------------------------------------ main */
const cmd = ARGS._[0];
const table = { build: cmdBuild, install: cmdInstall, scaffold: cmdScaffold, hubs: cmdHubs, new: cmdNew, normalize: cmdNormalize, autolink: () => cmdAutolink(false), check: cmdCheck, colors: cmdColors };
if (!table[cmd]) { console.log(read(__filename).split('\n').slice(1, 22).join('\n')); process.exit(cmd ? 2 : 0); }
table[cmd]();
