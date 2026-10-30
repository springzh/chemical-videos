"""Render one raw 3D frame (no SVG / chrome / subtitles) for the cover → assets/cover3d.png.
Run in the project directory:  $PY cover3d.py [t=9.0] [ax=1500] [out=assets/cover3d.png]
t  = film time to capture (pick a full scene with the carrier fully dressed, e.g. late intro)
ax = x pixel where the scene anchor goes (push the subject right so the cover title has room on the left)."""
import pathlib, sys
from playwright.sync_api import sync_playwright
t = float(sys.argv[1]) if len(sys.argv) > 1 else 9.0
ax = sys.argv[2] if len(sys.argv) > 2 else "1500"
out = sys.argv[3] if len(sys.argv) > 3 else "assets/cover3d.png"
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=metal", "--force-color-profile=srgb"])
    pg = b.new_page(viewport={"width": 1920, "height": 1080})
    pg.goto(pathlib.Path("index.html").resolve().as_uri() + f"?o=land&raw=1&ax={ax}")
    pg.wait_for_function("window.ready === true || window.BUILD_ERROR !== undefined", timeout=180000)
    err = pg.evaluate("window.BUILD_ERROR")
    if err: sys.exit(err)
    pg.evaluate("t => window.render(t)", t); pg.screenshot(path=out); b.close()
print("→", out)
