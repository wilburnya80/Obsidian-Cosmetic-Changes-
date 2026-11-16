# {{THEME}} — instructions for Claude in this vault (SAFE MODE)

This is the owner's own Obsidian vault (their homebrewed D&D campaign). The **{{THEME}}** theme is installed: pixel-art look, colour-coded folders, optional live fireworks. 

## THE RULE: you may only change colours and add internal links

* **Never** create, rename, move, delete or reorganise notes or folders.
* **Never** edit frontmatter/properties, headings, tables, code blocks, Dataview queries, or the owner's wording.
* **Never** add hub notes, index notes, tags, "Connections" sections or any new content.
* The **only** thing allowed to modify a note is `autolink --write`, which wraps existing words in `[[wikilinks]]` and changes nothing else. Always run it as a **dry run first**, show the owner the summary, and wait for a yes.
* Everything else (colours, toggles) is configuration under `.obsidian/` and `.tengen/` — not notes.

## Colour categories (taken from this vault's own folders)

Every top-level folder is a colour category. The colour appears on the folder in the file explorer, on the graph view, and on every `[[link]]` to a note in that folder (Reading view, hover previews, Properties panel; Live Preview uses one link colour).

{{CATEGORY_TABLE}}

To recolour: edit the `"color"` of a folder in `.tengen/categories.json`, then run `node .tengen/tools/vault.js build` and tell the owner to reload Obsidian (Ctrl/Cmd+R). Newly created top-level folders: add them to that file (or re-run the installer with `--reset-categories`).

## Internal linking (the one thing you may do)

```bash
node .tengen/tools/vault.js autolink            # DRY RUN: lists notes + how many links would be added. Show the owner.
node .tengen/tools/vault.js autolink --write    # only after the owner says yes. Add --mode first to link only the first mention per note.
node .tengen/tools/vault.js check               # broken links, orphans, unlinked mentions (read-only)
node .tengen/tools/vault.js colors              # refresh graph + link colours after notes were added/renamed
node .tengen/tools/vault.js restore             # DRY RUN of undo; `restore --write` puts every touched file back to its original
```

How autolink behaves: it links every mention of another note's **title or `aliases`** (the owner wants thorough linking), skips frontmatter, headings, code, inline code, existing links, URLs, HTML, Dataview-style code blocks and any `## Connections / Related / Links / See also` section, never links a note to itself, and never links a title that exists in two folders (ambiguous). Single-word names only match with the same capitalisation; multi-word names match case-insensitively. Originals are saved once in `.tengen/backups/` (hidden, not next to the notes).

If a common word keeps getting linked wrongly, add it (one per line) to `.tengen/autolink-ignore.txt`; set `autolink: false` in a note's frontmatter ONLY if the owner asks you to (that is a note edit — ask first).

## Right-side page panels and the fireworks (switches, no vault changes)

Settings → Appearance → CSS snippets. Each is a plain on/off switch:

| Snippet | ON means |
|---|---|
| `live-fireworks` | 84 fireworks + sparkles + smoke loop continuously. OFF = still scene |
| `hide-local-graph` | hides the local graph ("local map") of the page you are on |
| `hide-backlinks` / `hide-outgoing-links` / `hide-outline` / `hide-file-properties` | hides that panel for the current page |
| `hide-right-sidebar` | hides the whole right sidebar (all page panels) |
| `no-scene`, `bright-scene`, `readable-mode` | scene off / more see-through panes / nearly opaque panes |

To *open* the page panels: Command palette → "Graph view: Open local graph", "Backlinks: Open backlinks for the current note", "Outgoing links: …", "Outline: …", "Toggle right sidebar". Optional hotkeys (only added if the owner asked at install, `--with-hotkeys`): Alt+Shift+G local graph, B backlinks, O outgoing links, L outline, R toggle right sidebar.

Note: the local graph keeps its own settings per pane in Obsidian. If its nodes are not coloured, open the local graph → gear icon → Groups, and add one group per folder using the query `path:"<Folder>"` (same colours as above).

## Character themes

Nine themes (Tengen, Giyu, Shinobu, Rengoku, Muichiro, Mitsuri, Obanai, Gyomei, Sanemi), each from a Hashira's Breathing colours. They are chosen in Settings → Style Settings → Tengen Pixel → Character theme (needs the Style Settings plugin; installed only if the owner used `--with-style-settings`). Palettes live in `.tengen/src/characters.json`; after editing run `node .tengen/tools/vault.js build`.

## Changing the look (theme)

* Generated theme: `.obsidian/themes/{{THEME}}/theme.css` — never hand-edit. Sources: `.tengen/src/*.css` and the scene generator `.tengen/src/pixel-scene.js`; run `node .tengen/tools/vault.js build` after editing and tell the owner to reload.
* Personal tweaks that should survive rebuilds go in a new snippet `.obsidian/snippets/my-tweaks.css` (enable it in Settings → Appearance).
* Pixel-art look only: hard borders, no rounding, block shadows, Pixelify Sans. Keep panes readable (text contrast) and modals/menus opaque.
