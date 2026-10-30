"""article-video's check.py with this skill's stage box.

Usage (from the project dir, after render.py): python <skill>/scripts/check.py [--format 9:16]

The motion metric crops each scene to its stage box; this skill's index.html places the stage differently from
article-video's (LAY there), so STAGE is overridden here. Keep it in sync with LAY.stage in assets/template/index.html.
Everything else (tech specs, loudness, still runs, subtitles, contact sheets build/check_<fmt>_<n>.jpg) is unchanged.
"""
import pathlib, sys

AV = pathlib.Path.home() / ".claude/skills/article-video/scripts"
if not (AV / "check.py").exists(): raise SystemExit(f"article-video skill not found at {AV} — install it first (see README)")
sys.path.insert(0, str(AV))
import check   # noqa: E402

box = {"9:16": (40, 330, 1000, 1000), "16:9": (600, 60, 900, 900)}
check.STAGE = {f: {"full": b, "chap": b} for f, b in box.items()}

if __name__ == "__main__":
    check.main()
