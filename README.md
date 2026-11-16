# Tengen Pixel — pixel-art Obsidian theme + Claude-ready vault kit

**Chibi pixel-art Tengen Uzui (traced from your reference sprite) on a Yoshiwara rooftop, dual-wielding two small chained black-and-orange cleavers, with 84 distinct pixel fireworks looping continuously in a navy-to-electric-blue-and-violet night sky.**
Built with the same technique as the pixel theme in `dnd-game-brain` (pixel SVG scene behind translucent panes, Pixelify Sans headings, hard 3px borders, block shadows).
Every note belongs to a **colour-coded category**, and a built-in toolkit lets **Claude Code in the terminal** keep the vault ultra-densely cross-linked.


## What's in the box

| Path | What it is |
|---|---|
| `theme.css`, `manifest.json` | The installable Obsidian theme (generated — don't hand-edit) |
| `categories.json` | **Single source of truth** for the colour-sorted categories (folder, tag, colour, icon, callout) |
| `src/*.css`, `src/pixel-scene.js` | Theme sources. `pixel-scene.js` draws the pixel scene (sprite Tengen, roof, skyline, fireworks) as animated SVG |
| `plugins/dataview/` | Dataview, copied from your DND vault; the installer enables it |
| `tools/vault.js` | Zero-dependency Node tool: build theme, install, scaffold, hubs, new note, normalize, **autolink**, **check** |
| `snippets/` | `live-fireworks` + `hide-*` panel switches (generated), plus `no-scene`, `bright-scene`, `readable-mode` |
| `FRIEND-SETUP.md`, `install.sh`, `install.bat` | the friend-facing guide and one-step installers |
| `templates/vault-CLAUDE.md` | The instructions installed into a vault so its Claude knows the rules |
| `starter-vault/` | A ready-to-open sample vault: 62 Demon Slayer notes, 10 hubs, ~960 internal links, zero broken links |

## Getting it to a friend

**Easiest: send the zip.** `Tengen-Pixel-Kit.zip` contains everything; the friend follows `FRIEND-SETUP.md` (back up, install Node, double-click `install.bat` / run `./install.sh`, reload Obsidian). The repo is private, so a `git clone` only works if you add them under GitHub → Settings → Collaborators; otherwise use the zip.

### What the installer changes (SAFE mode, the default)
`node tools/vault.js install "/path/to/vault"` **never creates, moves, renames or edits a note or folder.** It adds the theme, CSS snippets, an `appearance.json`/`graph.json` update (existing graph groups and settings are kept), a hidden `.tengen/` toolkit with backups, and a `CLAUDE.md` for Claude (appended if one exists). Your own top-level folders become the colour categories. No plugins unless `--with-dataview`; hotkeys only with `--with-hotkeys`. Verified on a copy of a 2,500-note D&D vault: every file byte-identical after install.

The only thing that can modify notes is `autolink --write` (dry run by default): it adds `[[ ]]` around existing words, nothing else (verified: zero text or frontmatter differences on 2,492 edited notes), and `restore --write` puts every touched file back to its original.

### Character themes (switcher)
Nine themes, one per Hashira, built from their Breathing/blade colours (`src/characters.json`): Tengen, Giyu, Shinobu, Rengoku, Muichiro, Mitsuri, Obanai, Gyomei, Sanemi. Each recolours the UI, the sky, the 84 fireworks and a signature effect, and shows that Hashira's chibi on the roof. Switch from **Settings → Style Settings → Tengen Pixel → Character theme** (the theme declares an `@settings` block for the free Style Settings plugin; install it with `--with-style-settings`, which bundles it). Themes are `body.tg-char-<id>` classes, so they work without any code. `tools/chibi.js` draws the eight generated chibis on Tengen's body so all nine share one style.

### Switches (Settings → Appearance → CSS snippets)
`live-fireworks`, `hide-local-graph`, `hide-backlinks`, `hide-outgoing-links`, `hide-outline`, `hide-file-properties`, `hide-right-sidebar` (all page panels), plus `bright-scene`, `readable-mode`, `no-scene`. Each is a plain on/off toggle; the panel ones hide the matching right-sidebar panel for the page you are on.

### Structured starter vault (optional)
`starter-vault/` is a ready-to-open sample (62 Demon Slayer notes, hubs, ~960 links). It is built with `install starter-vault --structured`, which *does* create category folders and hub notes. Use that mode only on a fresh vault.

## The colour system

Colour is how the vault is sorted — the same colour shows up in the file explorer, graph nodes, tags, callouts, note titles and (in Reading view) every link to a note of that category.

| | Category | Folder | Colour |
|---|---|---|---|
| 🏯 | Hubs | `00 Hub` | `#ffe9a8` |
| 🗡️ | Characters | `01 Characters` | `#ff2d55` |
| 👹 | Demons | `02 Demons` | `#a855f7` |
| 🌀 | Techniques | `03 Techniques` | `#ffc93c` |
| ⚔️ | Weapons and Gear | `04 Weapons and Gear` | `#ff4fd8` |
| 🏮 | Locations | `05 Locations` | `#3ea6ff` |
| 🎆 | Arcs and Events | `06 Arcs and Events` | `#ff8a3d` |
| 🏛️ | Factions | `07 Factions` | `#4ade80` |
| 💡 | Concepts | `08 Concepts` | `#2ee6d6` |
| 📓 | Journal | `09 Journal` | `#c9d4e8` |
| 📚 | Sources | `10 Sources` | `#d9a066` |

Rename, recolour or add categories by editing `categories.json` and running `node tools/vault.js build` (in an installed vault: `node .tengen/tools/vault.js build`).

## Extreme internal linking

* Every note has `category`, `tags`, `cssclasses: [cat-…]`, `aliases`, `summary`, `up`, `related`.
* Every note ends with a **Connections** block linking its category hub, `Home` and `A-Z Index`.
* `autolink` turns *every* mention of any other note's title or alias into a `[[wikilink]]` (aliases keep your wording: `[[Tengen Uzui|Tengen]]`). Skips code, headings, existing links, URLs and the Connections/auto regions.
* Hubs, `Home` and `A-Z Index` are auto-generated lists, so a new note is reachable the moment you run `hubs`.
* `check` reports broken links, missing hub links, notes with fewer than 6 outgoing links, orphans, frontmatter gaps and unlinked mentions, and exits non-zero on broken links.

```bash
node .tengen/tools/vault.js new characters "Some Name" --summary "One line" --related "Other Note"
node .tengen/tools/vault.js normalize [--write]     # frontmatter + hub links on existing notes
node .tengen/tools/vault.js autolink  [--write] [--mode first]
node .tengen/tools/vault.js hubs
node .tengen/tools/vault.js colors
node .tengen/tools/vault.js check [--strict]
```

Anything that edits existing notes is a **dry run unless you pass `--write`**.

## Tweaking the look

* Scene: `src/pixel-scene.js` (sky palette, smoke, sparkles, roof; fireworks = `FW_COUNT` bursts built from 12 shapes × 8 palettes, each with its own position, size, rotation, duration and phase — raise `FW_COUNT` for more, or edit `FW_PALS`/`shapePoints()` for new looks) — it also draws the cleavers (`makeSword()`: `BLADE`/`GRIP` set their size, `SANG` the angle) and places them on the chibi in `src/tengen-sprite.json` (your traced image — swap its rows to change him; `SCALE` sets his size). Panes/typography: `src/20-chrome.css`, `src/30-typography.css`, palette in `src/10-variables.css` (`--tg-pane`, `--tg-side` control how much scene shows through).
* **Live fireworks switch:** Settings → Appearance → CSS snippets → **`live-fireworks`**. ON = the 84 fireworks, sparkles, smoke and sparks run continuously. OFF = a still scene, nothing moves. The installer turns it ON by default. (`live-fireworks.css` is generated by `build`; don't hand-edit it.)
* Other snippets: `no-scene` hides the scene entirely, `bright-scene` makes panes see-through, `readable-mode` makes them nearly opaque.
* After editing run `node tools/vault.js build`, then `node tools/vault.js install starter-vault` to sync the sample vault.

## Honest limitations

* Headings use the Pixelify Sans web font (loaded from Google Fonts, as in your DND theme); offline it falls back to a system font.
* In **Live Preview / editing** mode every link uses one colour; **per-category link colours** apply in Reading view, hover previews and the Properties panel. Folder, tag, graph, title and callout colours work everywhere.
* Not tested inside Obsidian itself (none in the cloud container): screenshot-tested in Chromium against a mock of Obsidian's DOM, reusing the container/pane rules from your working DND snippet.
* Sample lore in `starter-vault/` is illustrative; replace with your own notes.
