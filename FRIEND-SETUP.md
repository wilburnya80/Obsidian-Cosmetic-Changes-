# Setup for your Obsidian D&D vault (5 minutes)

**What this does to your vault: only colours and (optional) internal links. It never creates, moves, renames or rewrites your notes.**

## 0. Back up first (30 seconds)
Close Obsidian, then copy your whole vault folder somewhere else (e.g. `MyVault-backup`). Nothing below should hurt it, but a backup is free.

## 1. Install Node.js (once)
Download the LTS version from https://nodejs.org and install it. (If you already use Claude Code from the terminal you may already have it: check with `node -v`.)

## 2. Run the installer
Unzip this kit anywhere, then:

* **Windows:** double-click `install.bat`, drag your vault folder into the window, press Enter.
* **Mac/Linux:** open Terminal in the kit folder, run `./install.sh`, drag your vault folder in, press Enter.
* Or by hand: `node tools/vault.js install "/path/to/your/vault"`

It adds only these things:

| Where | What |
|---|---|
| `.obsidian/themes/Tengen Pixel/` | the theme |
| `.obsidian/snippets/` | on/off switches (below) + link colours |
| `.obsidian/appearance.json`, `graph.json` | selects the theme, adds one graph colour per folder (your existing graph groups/settings are kept) |
| `.tengen/` (hidden) | the helper tools + backups of anything it ever edits |
| `CLAUDE.md` | instructions so Claude follows these safety rules (appended if you already have one) |

Your own top-level folders become the colour categories automatically (e.g. `01 Heroes`, `06 Spells`…). No plugins are installed unless you add `--with-dataview`; hotkeys only with `--with-hotkeys`.

## 3. Open Obsidian
Press Ctrl/Cmd+R to reload. Settings → Appearance should show the theme **Tengen Pixel** selected. If you have another pixel/visual snippet turned on there, switch it off.

## 4. The switches (Settings → Appearance → CSS snippets)
Each one is a plain on/off toggle and changes nothing in your notes.

| Switch | When ON |
|---|---|
| `live-fireworks` | 84 fireworks loop continuously. OFF = still picture |
| `hide-local-graph` | hides the local graph ("local map") of the page you are on |
| `hide-backlinks`, `hide-outgoing-links`, `hide-outline`, `hide-file-properties` | hides that right-side panel |
| `hide-right-sidebar` | hides the whole right sidebar |
| `bright-scene` / `readable-mode` / `no-scene` | more see-through panes / nearly solid panes / scene off |

To open the right-side panels for the page you are on: Command palette (Ctrl/Cmd+P) → "Open local graph", "Open backlinks", "Open outgoing links", "Open outline". With `--with-hotkeys`: Alt+Shift+G / B / O / L, and R to toggle the right sidebar.

## 5. Internal linking (optional, you decide)
In a terminal inside your vault folder:
```bash
node .tengen/tools/vault.js autolink            # PREVIEW only: how many links it would add, where
node .tengen/tools/vault.js autolink --write    # apply (only adds [[ ]] around words that match another note's title/alias)
node .tengen/tools/vault.js check               # read-only health report (broken links, orphans)
node .tengen/tools/vault.js restore --write     # UNDO everything it changed, back to your originals
```
Or run `claude` in the vault folder and say: *"Follow CLAUDE.md. Preview the autolinking and show me the summary."* — it will wait for your yes.

It never touches frontmatter, headings, code, tables' structure, Dataview blocks, existing links, or names that exist in two folders. Originals are saved in `.tengen/backups/`.

## Changing a folder's colour
Edit the `"color"` in `.tengen/categories.json`, run `node .tengen/tools/vault.js build`, reload Obsidian.
