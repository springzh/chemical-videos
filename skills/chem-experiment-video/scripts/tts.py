"""article-video's tts.py, making sure incomplete Doubao word timestamps are resubmitted.

Usage (from the project dir): python <skill>/scripts/tts.py   (same arguments as article-video's tts.py)

Doubao TTS 2.0 sometimes finishes a task with an empty "sentences" list, or with one sentence missing from it
(measured 2026-10-30: 12 of 13 scenes in one run). timeline.py then cannot line the words up and every cue lands
early or late. article-video's tts.py resubmits such scenes itself from the branch article-video-tts-timestamps on
(it has TRIES); with an older article-video this wrapper adds the same retry (6 tries, 10 s, 20 s, … apart).
"""
import pathlib, sys, time

AV = pathlib.Path.home() / ".claude/skills/article-video/scripts"
if not (AV / "tts.py").exists(): raise SystemExit(f"article-video skill not found at {AV} — install it first (see README)")
sys.path.insert(0, str(AV))
import tts   # noqa: E402
from timeline import strip   # noqa: E402

if not hasattr(tts, "TRIES"):   # older article-video: no retry of its own
    _doubao = tts.doubao

    def doubao(text, voice, rate, path, tries=6):
        want = len(strip(text))
        for k in range(tries):
            words = _doubao(text, voice, rate, path)
            got = sum(len(strip(w[0])) for w in words or [])
            if got == want: return words
            print(f"  word timestamps cover {got}/{want} characters (try {k + 1}/{tries}) — submitting again", flush=True)
            if k < tries - 1: time.sleep(10 * (k + 1))
        print("  WARNING: still incomplete word timestamps; timeline.py will estimate cue times for this scene", flush=True)
        return words

    tts.doubao = doubao

if __name__ == "__main__":
    tts.main()
