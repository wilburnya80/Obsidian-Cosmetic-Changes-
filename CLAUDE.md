# CLAUDE.md — developing this repo

This repo is an **Obsidian theme + Claude-ready vault kit** (Demon Slayer / Tengen Uzui Entertainment District). It is *not* a user's vault. For the instructions that get installed into a vault, see `templates/vault-CLAUDE.md`.

## Layout
* `categories.json` — source of truth for categories/colours. Edit here, never hard-code category colours in CSS.
* `src/*.css` + `src/tengen.svg` — theme sources. `35-categories.css` and the `{{FIREWORKS}}`/`{{TENGEN_SVG}}` tokens are filled by the build.
* `tools/vault.js` — the whole toolkit (Node, no dependencies). Mode is auto-detected: repo checkout vs. installed `.tengen/`.
* `theme.css`, `manifest.json` — GENERATED. Never hand-edit.
* `starter-vault/` — sample vault with the toolkit installed into `starter-vault/.tengen/`. Treat its `.obsidian/themes/…`, `.tengen/`, `CLAUDE.md` and `00 Hub/` auto-lists as generated.
* `snippets/` — optional CSS toggles, copied into vaults on install.
* `docs/` — preview screenshots referenced by README.

## After ANY change to `src/`, `categories.json`, `tools/` or `templates/`
```bash
node tools/vault.js build                 # regenerates theme.css + manifest.json (+ starter-vault theme, graph colours, link colours)
node tools/vault.js install starter-vault # re-syncs the toolkit, CLAUDE.md, snippets into the sample vault
cd starter-vault && node .tengen/tools/vault.js hubs && node .tengen/tools/vault.js check   # must end RESULT: ok
```

## Rules
* Both dark (`.theme-dark`) and light (`.theme-light`) must keep working; modals/menus/popovers stay opaque; body text contrast ≥ 4.5:1.
* Obsidian themes are CSS-only — no JavaScript in the theme.
* Fireworks are 3 CSS pseudo-element layers (`body::after`, `.app-container::before/::after`); Tengen lives in `body::before`. Keep `pointer-events: none` and the `prefers-reduced-motion` fallback.
* `vault.js` commands that edit existing notes must stay **dry-run by default** and back up once (`*.tengen-bak`); the installer must never move/delete user notes.
* Visual check: render `theme.css` in headless Chromium (Playwright is installed) against a mock DOM using Obsidian class names; there is no Obsidian binary in the cloud container.
