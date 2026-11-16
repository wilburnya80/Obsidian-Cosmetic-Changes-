# {{THEME}} — vault instructions for Claude

This Obsidian vault uses the **{{THEME}}** theme: a pixel-art Tengen Uzui on a Yoshiwara rooftop, both cleavers raised, animated pixel fireworks behind the panes.

You (Claude) are expected to **organise, link and restyle this vault** using the rules and tools below. The owner's notes are theirs: never delete or rewrite their prose, never move a file without saying so first, and run anything that edits existing notes as a **dry run before `--write`**.

## 1. The colour-sorted category system

Every note belongs to exactly **one** category. The category decides its folder, tag, CSS class, callout, graph colour and hub. Colours are the sorting system: the same colour appears in the file explorer, graph view, tags, callouts, note titles and (in reading view) every `[[link]]` pointing at that category.

{{CATEGORY_TABLE}}

Source of truth: `.tengen/categories.json`. To add, rename or recolour a category, edit that file, then run `node .tengen/tools/vault.js build` (see §5).

## 2. Mandatory frontmatter for every note

```yaml
---
category: <one of: {{CATEGORY_IDS}}>
tags: [<category tag>, ...extra tags]
cssclasses: [cat-<category id>]     # this is what colours the note page
aliases: [short names, nicknames]    # these also get auto-linked
summary: One sentence. Shown in the hub lists.
up: "[[<Category> Hub]]"
related: ["[[Note A]]", "[[Note B]]"]
created: YYYY-MM-DD
---
```

`node .tengen/tools/vault.js normalize` adds any missing keys (dry run by default).

## 3. Linking policy — EXTREME, on purpose

The owner wants the vault to be as densely cross-linked as possible. For every note you create or edit:

1. **Every proper noun, concept, place, person, item, technique or event that has its own note must be a `[[wikilink]]` — every mention, not just the first.** Use the alias form when the text differs: `[[Tengen Uzui|Tengen]]`.
2. **Hub links:** link the note's own category hub (`[[<Category> Hub]]`), `[[Home]]` and `[[A-Z Index]]` in a `## Connections` section at the bottom.
3. **At least 6 distinct outgoing links per note.** If a note can't reach 6, it is probably missing context — add a "Context" paragraph or `related:` entries.
4. **Fill `related:`** in frontmatter with 3–8 of the most closely connected notes, and mirror each one: if A lists B, B's `related:` should list A.
5. **Never leave an unresolved link.** If you write `[[Something]]` that does not exist, either create the note (use `new`, below) or remove the link.
6. **When you create a note, immediately link it from its hub and from at least 3 existing notes** (run `hubs` and `autolink --write`).
7. Use callouts of the matching category colour for key facts: `> [!<category id>] Title`.
8. Prefer many small, single-topic notes over long mixed ones — each new noun is a new link target.

## 4. Daily workflow (copy this)

```bash
# new note (creates file with frontmatter, adds it to its hub, auto-links it)
node .tengen/tools/vault.js new characters "Some Name" --summary "One line" --related "Other Note,Another"

# after editing / importing notes
node .tengen/tools/vault.js normalize            # dry run: shows frontmatter / hub-link gaps
node .tengen/tools/vault.js normalize --write
node .tengen/tools/vault.js autolink             # dry run: shows how many links would be added
node .tengen/tools/vault.js autolink --write     # (default --mode all = link every mention)
node .tengen/tools/vault.js hubs                 # refresh hub lists, Home, A-Z Index
node .tengen/tools/vault.js colors               # refresh graph colours + per-note link colours
node .tengen/tools/vault.js check                # must end with RESULT: ok  (use --strict for a full audit)
```

Always finish a session with `hubs`, `colors` and `check`. Fix everything `check` reports under **Broken links**, **Missing link to own category hub** and **Frontmatter gaps** before you stop. Report orphans and under-linked notes to the owner with a suggestion for each.

Files `autolink --write` and `normalize --write` change get a one-time backup next to them (`*.tengen-bak`). Hub notes contain a region between `<!-- tengen:auto-start -->` and `<!-- tengen:auto-end -->` — **never edit inside it**, it is regenerated.

If a word is being linked wrongly (a common word that is also a note title), add it to `.tengen/autolink-ignore.txt`, or set `autolink: false` in a note's frontmatter to exclude that note from editing.

## 5. Making cosmetic changes (the theme)

* Theme file: `.obsidian/themes/{{THEME}}/theme.css` (generated — do not hand-edit it).
* Sources: `.tengen/src/*.css` (`10` variables, `20` panes/sidebars, `30` typography, `35` categories (generated), `40` scene note; the scene itself is `src/pixel-scene.js`). Edit these, then run `node .tengen/tools/vault.js build`, then tell the owner to reload Obsidian (Ctrl/Cmd+R).
* **Quick personal tweaks** that should survive a rebuild belong in a CSS snippet instead: create `.obsidian/snippets/my-tweaks.css` and add `my-tweaks` to `enabledCssSnippets` in `.obsidian/appearance.json`.
* Ready-made snippets (enable in Settings → Appearance → CSS snippets): `live-fireworks` (**the on/off switch for all scene animation**: ON = fireworks live and looping, OFF = still scene; generated by `build`, never hand-edit), `no-scene` (hide the scene entirely), `bright-scene` (more see-through panes), `readable-mode` (opaque panes).
* Main knobs (variables at the top of `.tengen/src/10-variables.css`): `--tg-pane` and `--tg-side` (how much of the scene shows through).
* Fireworks are animated SVG bursts listed near the top of `pixel-scene.js` (position, palette, timing, size). The scene (pixel Tengen, roof, skyline, fireworks) is generated by `.tengen/src/pixel-scene.js`; edit its sprite grid and firework list, then rebuild.
* When the owner supplies reference images ("make it look like this"), translate them into: palette variables in `10-variables.css`, scene layers in `40-scene.css`, and component styling in `20/30`. Keep dark and light modes both working, keep modals/menus opaque, and keep body text contrast ≥ 4.5:1.

Limitations to remember: Obsidian themes are CSS-only (no JavaScript), so animation is CSS keyframes. In *Live Preview/editing* view, links use one link colour; the per-category link colours apply in Reading view, hover previews and the Properties panel. Folder/tag/graph/title colours apply everywhere.

## 6. Importing the owner's existing notes

1. Run `check` and `normalize` (dry run) first and show the owner the summary.
2. Propose a mapping from their existing folders to the categories above (or new categories added to `categories.json`). **Ask before moving files.**
3. After approval: move notes (Obsidian updates links if you use its UI; from the terminal use `git mv`/`mv` and then run `check` to catch breakage), `normalize --write`, `autolink --write`, `hubs`, `colors`, `check`.
