# Scene plans and camera moves

The film reads like a guided tour through one world: the carrier, the molecule, the membrane, the target. Each chapter gets one clear 3D action that *is* the sentence being spoken, one close-up where the narration names a detail, and one readout number.

## Standard chapter plan (three-part amphiphile products)

The example (DSPE-PEG-cRGD, 91 s, 8 scenes) follows this plan. For a new product of the same family, keep the structure and change the words, colours, ligand and numbers.

| Scene | 3D action (what the viewer sees happen) | Close-up / special view | HUD readout |
|---|---|---|---|
| cover | still 3D render of the carrier with molecules (render with `?raw=1&ax=…` → `assets/cover3d.png`) | — | — |
| intro (full) | liposome assembles lipid by lipid; molecules sprout on its surface; camera pulls out to a cell with receptors; a glowing trail links carrier and receptor | **opening orbit**: start close and low on the assembling liposome, swing ~60° while pulling back | — |
| struct (01) | the structure card (real 2D formula image) wipes in; the 3D molecule builds segment by segment under it, each segment lit on its cue word | slow push-in | linker repeat units counting up (n = M / M_unit) |
| anchor (02) | flat bilayer; molecule descends, tails push neighbours aside and sink; two more molecules follow | **cutaway**: the front of the bilayer sweeps away (Bilayer `cut`), section face shows head bands + hydrophobic core; camera dives low to the section, then pulls back for all three | insertion depth (Tanford tail length), "anchored n/3" |
| linker (03) | spherical-cap patch of the carrier; chains pop in as the grafting density slider rises; they straighten from coils into a brush; a hydration shell and water beads appear; a foreign particle approaches and bounces off | start **close on a few coils**, pull back as the brush forms | layer thickness from the mushroom/brush model, with the mol % slider driving both number and picture |
| ligand (04) | carrier drifts toward a cell wall with receptors; arrives on the "recognise" cue | **binding close-up**: push to the ligand seated in the receptor cup, flash; pull back on the next cue | ligands per carrier; state "exposed → recognising → bound" |
| apply (05) | the three parts float apart (Mol `off`), snap together on "cooperate"; application cards (SVG) pop in | slow orbit | (optional) |
| store (06) | SVG condition panel with icons and ✓/✗; a carrier rotates in a corner | — | ester hydrolysis half-life: mild condition (green) → harsh condition (red) |
| outro (full) | main molecule above the end card; camera drifts back and more carriers appear around the title | slow pull back; keep the title area clear | — |

## Reactive-group lipid-PEG (DSPE-PEG-Mal / -NHS / -N3 …)

Keep intro, struct, anchor (cutaway), linker (brush) from the standard plan, then replace the ligand chapter:

| Scene | 3D action | Close-up | HUD / card |
|---|---|---|---|
| coupling | a partner (Cys peptide `Pep`, protein `lysine`) approaches; reactive atoms glow; bond grows (`setBond`), C=C saturates (`sat`) or leaving group flies off | push to `m.atom('cc')` / the head at the moment of reaction, flash | sites per liposome; card with the reaction equation |
| conditions (pH window) | pH needle sweeps; inside the window only the right partner reacts; outside, heads open / grey (`open`, `grey`) and side reactions appear | slow orbit | t½ vs pH or reactive fraction f(pH), pH slider; turns red outside the window |
| assemble-then-couple | liposome surface fills with coupled partners (pre-insertion vs post-insertion) | pull back | coupled fraction |
| store | vial or SVG panel; cold, dry, dark, inert gas; "no DTT / no amine buffer" | — | rate slow-down (Arrhenius, solution) / active fraction left after hours in water |

## Linear PEG reagents (mPEG-NHS, mPEG-Mal, PEG-diacid …)

| Scene | 3D action | HUD |
|---|---|---|
| intro (full) | protein with lysines; a PEG chain drifts in, question mark | — |
| struct | `Mol(…, { anchor: 'ome' })`: inert methoxy end vs reactive head, formula card `CH₃O-(CH₂CH₂O)ₙ-…` | n = M / 44 |
| coupling | head meets a lysine amine, amide bond grows, NHS leaves, `kc` cap appears | reactive amine fraction f(pH) with pH slider |
| hydrolysis race | `Waters` attack esters; some chains grey out (`MAT.dead`), others reach amines | ester t½ vs pH (turns red at high pH) |
| PEGylation | many chains on one protein, hydration shell | R_F of the chain |
| store / buffers | `vial()` frosts at −20 °C, cap seals, argon fills; warm before opening; buffer chips ✓/✗ | rate slow-down, t½ at the working pH |

## Block-copolymer carriers (PLGA-PEG-peptide, PLGA-PEG-ligand …)

Example `assets/examples/plga-peg-sp94/` (96 s): intro = micelle self-assembles (`Micelle` `fly`) → cell; struct = SVG schematic card (polymer formulas + peptide residues lighting up) + `Mol({ anchor: 'plga' })` with `kpep` growth, HUD residue count; core = unimers fly together → cutaway (`cut`, radial section disc) → water attacks, `deg` breaks coils (card: LA/GA, ester, products, no invented rate); PEG = brush on a big PLGA surface, PEG molar-mass slider → R_F; ligand = template binding close-up with a `Micelle`; make = emulsion droplet (`MAT.oil`) shrinks to a micelle, larger microsphere slides in; apply = plain carrier (`kh: 0`) drifts past, grafted one docks, application cards.

Other product families: keep "one world, one action per chapter". A PEG-functional reagent (mPEG-NHS, PEG-Mal) → anchor scene becomes a conjugation scene (the reactive end meets an amine/thiol on a protein, bond forms, flash); a nanoparticle coating → swap the liposome for `nano()`; a small-molecule dye → struct close-up with a real ball-and-stick model, then a fluorescence glow scene.

## Camera grammar

- **Never static.** Every scene drifts (sin sway 1–3 units, slow push of 0.3 units/s). `check.py` flags stills ≥ 1 s.
- **Moves land on cue words.** Build moves with `ease((lt - E('cue') + lead) / dur)` and blend positions with `Vector3.lerp`; chain several blends (`a.lerp(b, k1).lerp(c, k2)`) for dive-then-pull-back.
- **Opening orbit** (intro): `ko = ease(lt / 4.6)`, angle `1.1 * (1 - ko)`, radius 17 → 33, height 8 → 3, then hand over to the wide shot.
- **Close-up then context**: push in on the detail while it is named, pull back on the next cue so the result is shown in context.
- **Cutaway dive**: start the cut sweep ~0.9 s before the cue, dive camera to just above the section (≈ 17 units away, slightly to the side), keep it ~2 s, pull back for the outcome.
- **Binding close-up**: target = the ligand tip in world space (`mol.world(mol.tip)`), camera offset (−4.5, 3, 12) from it. Make sure the receptor cup really sits at the tip (check positions numerically; a 3-unit z offset already reads as a miss).
- **Chapter scenes** sit right of the TOC column: keep the subject inside the right ~60 % of the frame and above the subtitle line; the camera uses `setViewOffset` so world origin lands on the scene anchor.
- **Transitions**: the 3D cross-dissolve is automatic (0.8 s); the SVG layer adds iris/slash/push by scene index. Don't add hard flashes on every cut.

## Timing rules

- Chapter scenes are 4–5 bars (100 bpm → 9.6–12 s). One main action per scene; a second beat at most.
- Everything that appears is tied to a cue in the narration (`E('词')`), quantised to the beat by `timeline.py`.
- Labels pop on their cue and leave before the next scene; never more than ~3 labels at once.
