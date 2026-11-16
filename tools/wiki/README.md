# Wiki importer (Kimetsu no Yaiba Wiki -> Obsidian notes)

Pulls the pages of https://kimetsu-no-yaiba.fandom.com through its public MediaWiki API and converts them to linked, colour-categorised Obsidian notes.
Needs network access to `kimetsu-no-yaiba.fandom.com`. Text is CC BY-SA 3.0 (every note carries a Source line; keep it if you share the vault).

```bash
cd tools/wiki
# 1. list pages: see fetch.py (writes titles.json + raw.json; run a polite one-off, ~25 requests)
python3 fetch.py
# 2. convert into a vault folder
python3 wiki_build.py "/path/to/vault"
```
After building, install the theme into the vault and link: `node tools/vault.js install <vault> --structured --with-style-settings`, then `autolink --write --mode first`, `hubs`, `colors`, `check`.
