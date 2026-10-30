"""article-video's tts.py, resubmitting when Doubao returns no word timestamps.

Usage (from the project dir): python <skill>/scripts/tts.py   (same arguments as article-video's tts.py)

Doubao TTS 2.0 sometimes finishes a task with an empty "sentences" list, or with one sentence missing from it
(measured 2026-10-30: 9 of 13 scenes empty in one run, 3 more missing their first or last sentence). Either way
timeline.py cannot line the words up and spreads characters evenly, so every cue lands late or early. A scene whose
timestamps do not cover every spoken character is synthesized again (up to 6 tries, waiting 10 s, 20 s, … between them) before it is accepted.
"""
import pathlib, sys, time

AV = pathlib.Path.home() / ".claude/skills/article-video/scripts"
if not (AV / "tts.py").exists(): raise SystemExit(f"article-video skill not found at {AV} — install it first (see README)")
sys.path.insert(0, str(AV))
import tts   # noqa: E402
from timeline import strip   # noqa: E402

_doubao = tts.doubao


def doubao(text, voice, rate, path, tries=6):
    for k in range(tries):
        words = _doubao(text, voice, rate, path)
        got, want = sum(len(strip(w[0])) for w in words or []), len(strip(text))
        if got == want: return words
        print(f"  word timestamps cover {got}/{want} characters (try {k + 1}/{tries}) — submitting again", flush=True)
        time.sleep(10 * (k + 1))   # failures come in bursts; back-to-back resubmits tend to fail the same way
    print("  WARNING: still incomplete word timestamps; timeline.py will estimate cue times for this scene", flush=True)
    return words


tts.doubao = doubao

if __name__ == "__main__":
    tts.main()
