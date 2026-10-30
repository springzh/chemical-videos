#!/usr/bin/env bash
# Usage: new_project.sh <project-dir> [fonts-source-dir]
# Copies the 3D template into <project-dir> (never overwrites existing files) and makes the standard folders.
# Fonts: copies NotoSansSC/NotoSerifSC from fonts-source-dir if given, otherwise downloads them in the background.
set -euo pipefail
SK="$(cd "$(dirname "$0")/.." && pwd)"; P="${1:?project dir}"
mkdir -p "$P"/{source/figures,assets,fonts,previews,qa,vendor}
for f in index.html lib.js world3d.js scenes3d.js scenes.js model.js hud.js script.example.json reading.example.md; do
  cp -n "$SK/assets/template/$f" "$P/$f"; done
cp -n "$SK/assets/template/vendor/three-bundle.js" "$P/vendor/"
cp -n "$SK/assets/template/assets/structure.png" "$P/assets/structure.example.png"
if [ -n "${2:-}" ] && [ -f "$2/NotoSansSC.ttf" ]; then cp -n "$2"/Noto*.ttf "$P/fonts/";
elif [ ! -s "$P/fonts/NotoSansSC.ttf" ]; then
  (cd "$P/fonts" && { curl -fsSL --retry 2 --speed-limit 20000 --speed-time 30 -o NotoSerifSC.ttf "https://github.com/google/fonts/raw/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf" || rm -f NotoSerifSC.ttf;
    curl -fsSL --retry 2 --speed-limit 20000 --speed-time 30 -o NotoSansSC.ttf "https://github.com/google/fonts/raw/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf" || rm -f NotoSansSC.ttf; }) &
  echo "fonts downloading in background (pid $!)"; fi
echo "project ready: $P"
