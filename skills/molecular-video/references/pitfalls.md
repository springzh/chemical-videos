# Pitfalls found while making v1–v6 (and their fixes)

| Symptom | Cause | Fix |
|---|---|---|
| Page blank / `Cannot read properties of undefined (reading 'pts')` | a syntax error in scenes3d.js stops the file, so `W3.defs.<id>` never exists | `node --check *.js` before every render |
| Next scene's SVG throws for 0.3 s at a cut | SVG ran before its 3D scene was posed | SVG overlay visible only while its own 3D frame is on screen (template does this) |
| HUD or an effect missing in stills, fine in the film | state remembered from "first frame I saw" | derive everything from `t` and cue times (`at` field) |
| Lipid heads blown out to white | exposure + bloom too high on pale spheres | exposure 0.95, bloom 0.35 / threshold 1.05, heads #86C6EE (not white) |
| Subject fills the frame / labels pushed out | camera too close for a chapter scene (right column only) | pull back; fewer molecules (20 is plenty for a brush) |
| Particle path leaves the frame | path in world space ignores the view offset | check stills at the start, middle and end of each move |
| Label on a removed object (cutaway) | label pinned to a point in the swept-away part | pin to a point on what remains (`pts.mem`) |
| Ligand misses the receptor cup in the close-up | receptor directions alternate ±z; the middle one was offset | give the target receptor an exact direction and assert the distance numerically |
| Background carrier sits under the title / an icon panel | placed by eye in one still | place in screen corners; check the first and last frame of the camera move |
| Slider shows 0.1 % | model output field `x` (fraction) overwrote scene field `x` (percent) | spread model output first, own fields last |
| Every ligand sits at the core / binding close-up misses although the HUD says bound | a code line was pasted after a `//` comment on the same line (ring position never set) | probe world positions with a small playwright script (`render(t)` then `evaluate`), not just stills |
| `render.py --still` with many times silently produces nothing | one long batch hung | render stills in batches of ~25 in the background, check the output file |
| User reports "卡顿" at a cue | bloom flash written as `exp(...) * (lt > t)` jumps in one frame; or an object toggled with `visible = lt < t` | ramp flashes in (`flash(lt, t)` helper in the template), shrink/fade objects out instead of hiding; find jumps with `ffmpeg … tblend=difference,signalstats` (one-frame YAVG spikes away from scene cuts) |
| `file://` page can't import three | ES modules blocked on file:// | use the bundled IIFE `vendor/three-bundle.js` |
| Rendering slow / software GL | Chrome without GPU flags | render.py passes `--use-angle=metal` on macOS; 0.07 s/frame is normal |
| ffmpeg has no `subtitles` filter | Homebrew build without libass | subtitles are drawn in the page; don't burn with ffmpeg |
| `timeline.py` "cue not found" for a product name like `mPEG-NHS` | hyphen/letters don't match the TTS character timestamps | pick cue words without hyphens (Chinese words or one token: `NHS`), or voice it as "mPEG NHS" and keep the hyphen in the subtitle |
| Page throws `no cue "固定"` after rewriting script.json | cue names are referenced in **three** files: scenes.js, scenes3d.js, hud.js | rename cues in all three (grep for `E('`) |
| TOC covers the readout with 7+ chapters | fixed row height | template now fits the TOC into 300 px (rows shrink for 7–8 chapters); more than 8 chapters is too many for one film |
| Film runs 15–25 % over the target length | scene count chosen before the duration | 90 s → 7 scenes / ≈ 270 chars; 2 min → 8–9 scenes / ≈ 380 chars; run `timeline.py check` and cut before TTS |
| Render far slower than "0.07 s/frame" | other GPU jobs on the machine | 0.07 s/frame is 5 workers on an idle M-series Mac; with other renders running expect 0.15–0.2 |
| Cover 3D frame can't be rendered with render.py | render.py doesn't pass `raw`/`ax` | `$PY $MV/scripts/cover3d.py <t> <ax>` |
| Text overlap at the end card | 3D molecule moved behind the title | keep the end molecule above the title block, background objects in corners |

Skills compared on this product (2026-10-26): article-video 2D only (too simple), lemo-opuscar glass product style (not enough detail), anatomy (isometric instrument metaphor) and machine (photoreal machinery lab) — both suit machines, not molecular structure. The Three.js-in-article-video approach (this skill) was judged best by the user.
| Probe / partner sits above the frame in membrane scenes (azide glycans, integrins) | camera aimed at the membrane, but molecule + streptavidin stand 12–17 units tall | aim the camera at y ≈ 8–10 and pull back to z ≈ 50–58 |
| Close-up on pale protein lobes blows out | bloom flash + emissive on light materials at short range | keep lobe emissive ≤ 0.15, flash ≤ 0.4, camera ≥ 14 units away |
| 3D molecule runs the opposite way to the 2D structure card | `place(..., V(1,0,0))` puts the anchor on the left | match the card: `V(-1,0,0)` when the anchor is drawn on the right |
| `render.py` "Broken pipe" mid-render | transient ffmpeg exit | just rerun; check the mp4 exists before reporting |
