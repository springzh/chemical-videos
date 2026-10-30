# 3D components (world3d.js) and how the layers fit

## Layer stack (index.html, bottom to top)

| Layer | What it is | Who writes it |
|---|---|---|
| `#gl` | WebGL canvas: the whole 3D world (one Three.js scene) | `world3d.js` + `scenes3d.js` |
| `#glPrev` | 2D copy of the previous scene's 3D frame, fades out over 0.8 s (cross-dissolve) | index.html (automatic) |
| `#shade` | left-side darkening so the chapter title and TOC stay readable | index.html |
| `#scenes` | SVG overlay per scene: labels, pills, structure card, icons, shockwaves | `scenes.js` |
| `#chrome`, TOC, `#hud` | chapter heading, table of contents (fits 6–8 chapters), live readout (frosted glass card, left column) | index.html, `hud.js` |
| `#card` | optional floating glass info card, top right: title + rows + chips (reaction, conditions, computed values) | `hud.js` (`card` field) |
| `#subs` | burned subtitles on a frosted pill | index.html |

Every frame is a pure function of `t` (`window.render(t)`): no clocks, no `Math.random` (use `rnd(seed)`), no state carried between frames. The renderer jumps around (5 workers, stills at random times), so anything that "remembers when it first appeared" breaks — compute appearance from cue times instead.

## Scene contract

`scenes3d.js` — one entry per scene id (same ids as `script.json` scenes):

```js
W3.defs.<id> = {
  build(g) { /* once: create objects under group g; this.pts = {} */ },
  update(lt, E, beat, W) {
    // lt = seconds since scene start; E('关键词') = cue time (scene-local) from timeline.json
    // pose objects, then set the camera: W.cam(position, lookAt, fov = 35)
    // optional: W.bloom(v) for a flash; this.pts.x = world points for SVG labels; this.hud = {...} for the readout
  },
};
```

`scenes.js` (SVG) — `SCENE_DEFS.<id> = { full?, build(g), update(lt, E, beat) }`. Pin labels to 3D points with `const [x, y] = P(this, W3.defs.<id>.pts.name)`. A scene's SVG is shown only while its own 3D frame is on screen (labels read that scene's points).

`full: true` scenes (intro, outro) use the whole frame; chapter scenes sit in the right column beside the chapter heading, TOC and HUD (landscape).

## Components (`W3.lib`)

All sizes in world units ≈ 1 nm-ish (lipid head radius 0.5, bilayer thickness 3.4). Springs/eases from lib.js: `SP.pop`, `SP.heavy`, `SP.card`, `SP.snap`, `ease`, `easeOut`, `clamp`, `beatPulse(lt, beat)`.

| Component | Create | Pose each frame | Notes |
|---|---|---|---|
| `Lipids` | `new Lipids(parent, n)` | `begin(); add(pos, normal, scale); end()` | instanced head sphere + 2 tails; thousands are cheap |
| `Lipo` (liposome) | `new Lipo(parent, R, { cap, dir, sp, core })` | `pose(lt, at, { sweep })` | outer + inner leaflet on a Fibonacci sphere; `cap` (deg) = only a spherical cap; lipids pop in by latitude from `at`; `lp.top` is the group to hang molecules on |
| `Bilayer` (flat patch) | `new Bilayer(parent, nx, nz, sp)` | `pose(lt, at, push(x,z) → [dx,dz], cut(x,z) → 0..1)` | top heads at y = 0, bottom at y = −3.4; `push` makes room around an inserting molecule; `cut` removes lipids for a cutaway |
| `Mol` (anchor–linker–head) | `new Mol(parent, nBeads, { anchor, head, own })` | `pose({ kt, kp, kr, w, amp, spf, tl, off, open, grey, sat, kc })` then `place(pos, dir, spin, scale)` | anchor (C.a) along −y: `'dspe'` head + 2 tails (default), `'ome'` methoxy cap (mPEG), `'plga'` coil of ester units (lactide/glycolide shades; `pose({ deg })` breaks it into fragments = hydrolysis), `'none'`. Bead chain (C.accent) along +y. Head (C.b) at the tip: `'pep'` linear peptide as a 12-residue helix (`pepN`; `pose({ kpep })` grows it residue by residue, the head rides the growing chain end), `'none'`, `'ring'` five-bead ring + torus (cyclic peptide, NHS ester, generic ring), `'mal'` atomic maleimide (N, C2–C5, two C=O, glowing C=C). `kt/kp/kr` grow anchor/chain/head; `amp` coil wobble; `spf` spacing (0.36 coil → 1 brush); `tl` tail length; `off = {d, p, r}` exploded view. Maleimide: `open` ring-opening hydrolysis, `grey` inactive (needs `own: true`), `sat` C=C → single bond after thiol addition. `kc` grows the end cap (amide C=O after coupling, COOH after hydrolysis — hide the head with `kr` when the cap appears). `m.world(local)`, `m.tip`, `m.atom('C3' / 'cc')`, `m.len()` |
| `Micelle` (block-copolymer micelle / nanoparticle) | `new Micelle(parent, R, n, { nb, np, head, dirs })` | `pose(lt, at, { sweep, fly, kh, cut(dir) → 0..1, deg, amp })` | molecules with `anchor: 'plga'` pointing inward around a translucent core (`MAT.plgaCore`); `fly` (number or `(i, d) => units`) = self-assembly from the water; `kh` scales the heads (0 = plain carrier without ligand); `cut` removes molecules by direction for a cutaway; `deg` breaks the PLGA coils; `mc.R` may change per frame (emulsion droplet shrinking) |
| `Pep` (cysteine peptide) | `new Pep(parent, n)` | `pose(sPos, trailDir, w, k, hPos?)` | lavender bead chain + yellow S + white H; move H to the target atom to show proton transfer |
| `protein(parent, R, seed, mat)` | | position/rotation | lumpy glossy sphere cluster (MAT.prot pink, MAT.prot2 lavender) — a stand-in, not a fold |
| `lysine(parent)` | | position + quaternion on the protein surface | stalk + amine bead `g.N` (MAT.amine blue) |
| `Waters(parent, n)` | | `pose(i => ({ p, s, a }))` | instanced H₂O (red O, white H) for hydration and hydrolysis attacks |
| `bond(parent)` / `setBond(m, A, B, k)` | | each frame | glowing bond growing between two world points (amide, thioether) |
| `seg(mesh, A, B)` | | | stretch any unit cylinder between two points |
| `wpos(obj)`, `amineOf(lys)` | | | world position of a mesh / a lysine's amine N (targets for close-ups and bonds) |
| `aimMol(mol, target, from, k, spin)` | | after `pose()` | places a molecule so its head tip reaches `target` at k = 1, coming in along `target − from` (k < 1 = still approaching, 6 units back at k = 0) |
| `vial(parent, seed)` | | `v.cap.position` / rotation | glass reagent vial, ribbed cap (`v.cap`), dry powder (`v.powder`); add frost (`MAT.frost`) and argon (`MAT.argon`) particles in the scene |
| `receptor(parent, mat)` | | position + quaternion | stalk + half-torus cup opening along local +y |
| `nano(parent, R)` | | position/rotation | small particle with PEG sticks and ligand beads |
| `fib(n, dir, capDeg)` | | | n unit vectors on a sphere / cap |
| `MAT.section` | plane with `hatchTex()` | set `.opacity` | cutaway face: blue head bands + warm hatched hydrophobic core |

Materials (`MAT`): `lhead, ltail, core, dspe, dspeT, peg, rgd, rgdT, cell, rec, nano, shell, water, bok, trail, section, malO, malCC, pep, S, H, prot, prot2, lysC, amine, amide, dead, bond, wO, wH, glass, capV, powder, argon, frost`. The anchor/linker/ligand colours come from the theme (`C.a`, `C.accent`, `C.b`), so a new product with a new theme recolours the molecule automatically. `W3.render` resets the emissive values every frame; scenes raise them for a glow (`MAT.rgd.emissiveIntensity = .5 + beatPulse(...)`).

Default head for every `new Mol()`: set `W3.molHead = 'mal'` (or `'ring'`) at the top of scenes3d.js. Per-molecule greying (`pose({ grey })`) works for both `'ring'` and `'mal'` heads when built with `{ own: true }` (the end cap greys with it).

Look overrides per project (before world3d.js loads): `window.LOOK3D = { sky: ['#1E6DB6', '#0F4A8E', '#05214A'], fog: 0x0E4888, lipidHead: 0x86C6EE, lipidTail: 0x6C9ED6 }`.

Post: RoomEnvironment reflections, AgX tone mapping (exposure 0.95), UnrealBloom (0.35 / 0.45 / threshold 1.05), exponential fog, 90 drifting bokeh spheres.

## Extending to other molecule shapes

- **Different ligand / end group** (NH2, COOH, biotin, folate, FITC, azide/DBCO, cholesterol anchor…): add a head builder next to `'ring'` / `'mal'` in `Mol` (single larger sphere for biotin, flat hexagon pair for FITC, atomic layout like `'mal'` when the chemistry is the point). Atom-level heads read better in reaction close-ups (viewers liked the ball-and-stick maleimide); bead heads are fine in the many-copies shots. Keep anchor–linker–head so every scene still works, and fold new heads back into this template.
- **Linear polymer only** (mPEG-X, PEG-diacid): `{ anchor: 'ome' }` (methoxy cap) or `'none'`.
- **Real atomic structure**: export an xyz/mol2 from Avogadro or RDKit, convert to a JSON list of atoms and bonds, draw atoms as an InstancedMesh of spheres (CPK colours) and bonds as an InstancedMesh of cylinders. Use it for one "structure" close-up; keep the stylised `Mol` for the many-copies scenes (hundreds of real atomic models are too heavy and unreadable).
- **Proteins / receptors**: stalk + cup is a stand-in; a few lobed spheres (merged) read as a protein without pretending to be a real fold.

## Three.js bundle

`vendor/three-bundle.js` = three@0.170 + EffectComposer, RenderPass, UnrealBloomPass, OutputPass, RoomEnvironment, built with esbuild as one IIFE exposing `THREE` and `THREEX` (Chrome refuses ES modules from `file://`, which is how render.py loads the page). If you need another addon (BokehPass, SSAO…), rebuild: an entry file that imports three + the addons and assigns them to `window.THREE` / `window.THREEX`, then `npx esbuild entry.js --bundle --format=iife --minify --outfile=vendor/three-bundle.js`.

## Components added for the 为华生物 batch (2026-10-30)

| Component | Create | Pose | Notes |
|---|---|---|---|
| hydrazone link | `new Mol(g, n, { link: true })` | `pose({ cut, kl, off })` | lime C=N pair between anchor and chain; `cut` hides the double bond, `off.p`/`off.r` carry the PEG crown + head away (acid de-shielding). `window.HYD_COL` recolours |
| DBCO anchor | `{ anchor: 'dbco' }` | `pose({ click })` | cyclooctyne + 2 benzene rings, glowing C≡C (`MAT.alk`); `click` grows the triazole bonds. `m.alkW()`, `m.triW()` (3 N spots), `m.dw(local)` |
| biotin head | `{ head: 'biotin' }` | — | ureido + thiolane (S yellow) bicycle; `m.bioW()` = top of the bicycle (seat a streptavidin pocket on it) |
| `Azide` | `new Azide(g)` | `pose(base, dir, s, triW?, k)` | three blue N; with `triW` + `k` they swing into the triazole spots (SPAAC) |
| `strept(g, mat)` | | position / quaternion | streptavidin tetramer stand-in, `g.pk = [{ p, d }]` four pockets (`MAT.sav` fluorescent green, `MAT.sav2` violet) |
| thiol anchor | `{ anchor: 'sh' }` | `m.shH.visible` | S + H; hide H for S–S / thioether / Au–S. `m.sW()` |
| FITC head | `{ head: 'fitc' }` | `pose({ fl })` | thiourea + pendant ring + xanthene; additive glow sprite per molecule (`fl` 0..1.5). `m.fitcW()` |
| `gold(g, R)` | | | metallic gold nanoparticle (`MAT.gold`) |
| cyclic peptide anchor | `{ anchor: 'cring' }` | — | c(RGDfK): R blue, G grey, D red, f violet, K = C.a; side chains. `m.resW('R'|'G'|'D'|'f'|'K'|'Rs'|'Ds')` |
| `integrin(g)` | | position | αv/β3 stalks + heads, MIDAS ion (`g.ion`), local `g.cleft / g.alpha / g.beta` |

Brand end card: put a white-text logo lockup PNG in `assets/logo.png`, set `cover.logo` (cover, top-left) and draw it in the outro SVG with `<image href="assets/logo.png">` on a dark rounded plate (see the wh-* projects' `logoG`).
