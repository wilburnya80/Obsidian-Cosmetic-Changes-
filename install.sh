#!/usr/bin/env bash
# Mac/Linux one-step installer. Usage: ./install.sh "/path/to/your/vault" [--with-dataview] [--with-hotkeys]
set -e
cd "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo "Node.js is required (free): https://nodejs.org  — install it, then run this again."; exit 1; }
VAULT="${1:-}"
if [ -z "$VAULT" ]; then read -r -p "Drag your Obsidian vault folder into this window, then press Enter: " VAULT; fi
VAULT="${VAULT%\"}"; VAULT="${VAULT#\"}"; VAULT="${VAULT%\'}"; VAULT="${VAULT#\'}"; VAULT="${VAULT% }"
node tools/vault.js install "$VAULT" "${@:2}"
