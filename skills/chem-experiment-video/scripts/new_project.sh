#!/usr/bin/env bash
# Usage: new_project.sh <project-dir>
# Copies the template into <project-dir> (never overwrites existing files), makes the standard folders and links
# NotoSansSC into fonts/ from a per-machine cache (~/.cache/chem-video/fonts, also reusing math-video's cache),
# downloading it once in the background when no cache has it.
set -euo pipefail
SK="$(cd "$(dirname "$0")/.." && pwd)"; P="${1:?project dir}"
mkdir -p "$P"/{source,assets,fonts,previews,qa}
for f in index.html lib.js chem.js scenes.js; do cp -n "$SK/assets/template/$f" "$P/$f"; done
CACHE="$HOME/.cache/chem-video/fonts"; mkdir -p "$CACHE"
for c in "$CACHE" "$HOME/.cache/math-video/fonts"; do
  if [ -s "$c/NotoSansSC.ttf" ] && [ "$(wc -c < "$c/NotoSansSC.ttf")" -gt 1000000 ]; then
    ln -sf "$c/NotoSansSC.ttf" "$P/fonts/NotoSansSC.ttf"; echo "font linked from $c"; break; fi
done
if [ ! -e "$P/fonts/NotoSansSC.ttf" ]; then
  (curl -fsSL --retry 2 --speed-limit 20000 --speed-time 30 -o "$CACHE/NotoSansSC.ttf" \
     "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf" \
   && ln -sf "$CACHE/NotoSansSC.ttf" "$P/fonts/NotoSansSC.ttf" || rm -f "$CACHE/NotoSansSC.ttf") &
  echo "font downloading in background (pid $!) — the page falls back to system fonts until it lands"
fi
echo "project ready: $P"
