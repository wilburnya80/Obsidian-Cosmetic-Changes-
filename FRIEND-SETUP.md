# Tengen Pixel for your Obsidian D&D vault: setup and every option

**By default this only changes colours and looks. It never creates, moves, renames or rewrites your notes.** The one thing that *can* touch notes is the optional internal-linking command, which previews first and can be fully undone.

Everything below is optional unless marked **Required**.

---

## 1. Before you start (**Required**)
1. **Back up your vault.** Close Obsidian and copy the whole vault folder somewhere else.
2. **Install Node.js** (free, LTS version) from https://nodejs.org. Check with `node -v`.

## 2. Install (**Required**)
Unzip this kit anywhere.

| How | Command |
|---|---|
| Windows | double-click `install.bat`, drag your vault folder into the window, press Enter |
| Mac / Linux | run `./install.sh` in Terminal, drag your vault folder in, press Enter |
| By hand | `node tools/vault.js install "/path/to/your/vault"` |

### Install options (add to the end of the command)
| Option | What it does |
|---|---|
| `--with-dataview` | also installs the Dataview plugin and turns it on (Obsidian asks once to enable community plugins). Skipped if you already have it. Default: not installed |
| `--with-style-settings` | also installs the Style Settings plugin, which gives you the **Character theme dropdown** (section 3b). Default: not installed |
| `--with-hotkeys` | adds hotkeys for the right-side panels (see section 4). Never overwrites a hotkey you already use. Default: none added |
| `--no-claude-md` | do not create or edit `CLAUDE.md` in your vault (see section 6). Default: it is created, or appended to your existing one |
| `--reset-categories` | re-scan your folders and redo the folder colours (use after adding folders; this discards colours you edited by hand) |

Example: `./install.sh "/path/to/vault" --with-dataview --with-hotkeys`
You can re-run the installer any time (it updates itself and keeps your settings).

### Exactly what the installer adds to your vault
| Where | What |
|---|---|
| `.obsidian/themes/Tengen Pixel/` | the theme |
| `.obsidian/snippets/` | the on/off switches (section 3) and the link-colour file |
| `.obsidian/appearance.json` | selects the theme and turns on two snippets (`live-fireworks`, `category-link-colors`); your other settings and snippets are left as they were |
| `.obsidian/graph.json` | adds one colour group per folder; your existing groups and graph settings are kept |
| `.tengen/` (hidden) | the helper tools, the folder colours (`categories.json`) and backups of anything it changes |
| `CLAUDE.md` | instructions for Claude (only if you did not pass `--no-claude-md`) |
| plugins / hotkeys | only if you passed `--with-dataview` / `--with-hotkeys` |

Your own top-level folders become the colour categories automatically (e.g. `01 Heroes`, `06 Spells`). Folders starting with `.` or `_` are skipped.

## 3. Open Obsidian, then use the switches
Press **Ctrl/Cmd+R** to reload. Settings → Appearance → Themes → **Tengen Pixel** should be selected. If you had another visual theme or pixel snippet turned on, switch it off, or the two will fight.

**Settings → Appearance → CSS snippets**: every one of these is a plain on/off toggle that changes nothing in your notes.

| Switch | When ON |
|---|---|
| `live-fireworks` | the 84 fireworks, sparkles, smoke and sparks loop continuously. **OFF = a still picture** (on by default) |
| `category-link-colors` | links are coloured by the folder of the note they point to (Reading view, hover previews, Properties panel; Live Preview uses one link colour). Installed on |
| `hide-local-graph` | hides the **local graph ("local map")** of the page you are on |
| `hide-backlinks` | hides the Backlinks panel of the page |
| `hide-outgoing-links` | hides the Outgoing links panel |
| `hide-outline` | hides the Outline panel |
| `hide-file-properties` | hides the file Properties panel |
| `hide-right-sidebar` | hides the whole right sidebar (all of the above) |
| `bright-scene` | panes become very see-through so the scene dominates |
| `readable-mode` | panes become nearly solid for long writing sessions |
| `no-scene` | removes the picture entirely (plain pixel UI), good for slow computers |

## 3b. Character themes (the switcher)
Nine colour themes, one per Hashira, built from their Breathing / blade colours: Tengen (Sound, violet-blue and orange), Giyu (Water, ocean blue), Shinobu (Insect, purple), Rengoku (Flame, orange-red), Muichiro (Mist, pale teal), Mitsuri (Love, pink and green), Obanai (Serpent, dark green and yellow), Gyomei (Stone, earth brown), Sanemi (Wind, green and white). Each recolours the whole interface, the sky, the fireworks, adds its own effect (droplets, butterflies, embers, fog, hearts, a snake, pebbles, wind streaks) and puts that Hashira's chibi on the roof.

**To switch:** install with `--with-style-settings` (or install the free "Style Settings" community plugin yourself), turn on community plugins when Obsidian asks, then Settings → Style Settings → **Tengen Pixel** → **Character theme** → pick a Hashira. Without the plugin you get the default Tengen theme. Your folder colours, links and graph groups do not change between themes.

## 4. Right-side panels for the page you're on
**Open them:** Command palette (Ctrl/Cmd+P) → "Graph view: Open local graph", "Backlinks: Open backlinks for the current note", "Outgoing links: Open outgoing links…", "Outline: Open outline", "Toggle right sidebar". **Hide them** with the `hide-…` switches above.

**Hotkeys** (only if you installed with `--with-hotkeys`; change them in Settings → Hotkeys):
`Alt+Shift+G` local graph · `Alt+Shift+B` backlinks · `Alt+Shift+O` outgoing links · `Alt+Shift+L` outline · `Alt+Shift+R` toggle right sidebar.

**Colour the local graph:** Obsidian keeps the local graph's colour groups separately. If its dots are not coloured: open the local graph → gear icon → Groups → add one group per folder with the query `path:"Folder Name"` and pick the same colour as in `.tengen/categories.json`.

## 5. Internal linking (optional; you decide)
Run these in a terminal inside your vault folder.

| Command | What it does |
|---|---|
| `node .tengen/tools/vault.js autolink` | **Preview only.** Lists which notes would get links and how many. Changes nothing |
| `node .tengen/tools/vault.js autolink --write` | **Applies it.** Wraps every mention of another note's title or alias in `[[ ]]` |
| `… autolink --mode first` | (with or without `--write`) link only the **first** mention per note instead of every mention |
| `node .tengen/tools/vault.js check` | read-only health report: broken links, notes nothing links to, unlinked mentions |
| `… check --strict` | same, but exits with an error if anything is found |
| `node .tengen/tools/vault.js colors` | refresh the graph and link colours after you add or rename notes/folders |
| `node .tengen/tools/vault.js restore` | **Preview** of the undo (lists files that would go back to their original) |
| `node .tengen/tools/vault.js restore --write` | **Undo:** puts every file the tools changed back to its original. Warning: this also undoes any edits you made to those files since the first backup |

What autolink changes: only the insertion of `[[ ]]` around words (and an alias like `[[Tengen Uzui|Tengen]]` when your wording differs). It never touches frontmatter, headings, code blocks, Dataview queries, tables' structure, existing links, URLs, or a `## Connections / Related / Links / See also` section; never links a note to itself; and never links a title that exists in two folders. Names with one word only match with the same capital letters; multi-word names match any capitalisation. The first time a file is changed, its original is saved in `.tengen/backups/` (hidden, not next to your notes).

**Stop a word being linked:** add it (one per line, any capitalisation) to `.tengen/autolink-ignore.txt`.
**Skip one note:** put `autolink: false` in that note's frontmatter (this edits the note, so do it yourself).
**Rename a note or add aliases** the normal Obsidian way; autolink picks them up on the next run.

## 6. Using Claude (optional)
Open a terminal in your vault folder and run `claude`. `CLAUDE.md` tells it the safety rules (only colours and `[[links]]`; preview before changing anything). Try:
- *"Follow CLAUDE.md. Preview the autolinking and show me the summary."* (it waits for your yes)
- *"Run check and tell me what is broken or orphaned."*
- *"Make the Spells folder gold and the Bestiary dark red, then rebuild."*
- *"Add a snippet that makes the editor panes more see-through."*

## 7. Changing colours and the look
- **A folder's colour:** edit its `"color"` (hex, like `#ff4fa0`) in `.tengen/categories.json`, run `node .tengen/tools/vault.js build`, reload Obsidian. Also: `"name"` is just a label.
- **A new folder:** add an entry to `.tengen/categories.json` (copy an existing one and change `id`, `name`, `folder`, `tag`, `color`), or re-run the installer with `--reset-categories`; then `build`.
- **How see-through the panes are:** use `bright-scene` / `readable-mode`, or make your own snippet `.obsidian/snippets/my-tweaks.css`, enable it, and put e.g. `body.theme-dark, body.theme-light { --tg-pane: rgba(8,5,38,0.5); --tg-side: rgba(6,3,28,0.7); }` (the last number is opacity, 0 to 1).
- **The scene** (fireworks count/colours/shapes, Tengen, sky): edit `.tengen/src/pixel-scene.js` (`FW_COUNT` = number of fireworks, `FW_PALS` = colour schemes), then run `build`.
- **Fonts/borders/colours of the interface:** `.tengen/src/10-variables.css`, `20-chrome.css`, `30-typography.css`, then `build`.
- Any time you edit `.tengen/` files, run `node .tengen/tools/vault.js build` and reload Obsidian (Ctrl/Cmd+R).

## 8. Uninstall / go back
1. `node .tengen/tools/vault.js restore --write` puts `appearance.json`, `graph.json` (and `hotkeys.json`, `community-plugins.json`, `CLAUDE.md` if you had them) and any linked notes back to their originals.
2. Delete: `.obsidian/themes/Tengen Pixel/`, the snippets listed in section 3 from `.obsidian/snippets/`, the hidden `.tengen/` folder, and `CLAUDE.md` if you do not want it.
3. Reload Obsidian and pick your old theme in Settings → Appearance.

## Quick reference
```
install:   ./install.sh "VAULT" [--with-dataview] [--with-style-settings] [--with-hotkeys] [--no-claude-md] [--reset-categories]
tools:     node .tengen/tools/vault.js  autolink [--write] [--mode first]
                                        check [--strict]
                                        colors | build | restore [--write]
switches:  Settings → Appearance → CSS snippets
```
