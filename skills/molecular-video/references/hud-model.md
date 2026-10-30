# Readout (HUD) and the model behind it

One big number per chapter, under the TOC in the left column (landscape): a label with a short state word, a large serif number with an italic unit, a thin bar, one line with the formula, and optionally a slider. It is what makes the film feel engineered rather than decorated: the number and the picture come from the same calculation.

## Files

- `model.js` → `window.MODEL`: small pure functions with real constants. No DOM, no time.
- `scenes3d.js` → each scene writes the state it already uses for the picture into `this.hud` (e.g. the mol % that drives how many chains stand up).
- `hud.js` → `D.<sceneId>(lt, E, hud)` returns `{ at, lab, st, v, u, bar, sub, sl, bad }` or `null`:
  - `at` — scene-local time the panel fades in (**required**, from a cue: `E('伸展') - .6`). Never derive it from "the first frame I was called" — the renderer jumps.
  - `lab` label, `st` state word (accent colour), `v` formatted number, `u` unit, `bar` 0..1, `sub` the formula line, `bad: true` turns it red.
  - `sl = { lab, k: 0..1, v }` draws a slider row (k = knob position).
  - `card = { title, rows: [[label, value, colour?]], chips: [[text, colour]], at?, out?, pos? }` shows the floating glass card top right (reaction equation, conditions, the intermediate values behind the big number). Return `v: null` to show only the card.
  - Keep the card to 3–5 rows; it sits over the right column, so check it doesn't cover the subject in stills (move with `pos`).

Keep the panel off for `full` scenes and for chapters with no honest number.

## Formula library (lipid–PEG–ligand family)

| Quantity | Formula | Typical value |
|---|---|---|
| PEG repeat units | n = M_PEG / 44 g·mol⁻¹ | PEG2000 → 45 |
| Flory radius (mushroom height) | R_F = a·N^(3/5), a = 0.35 nm | PEG2000 → 3.4 nm |
| Grafting density, spacing | σ = x / A_L (A_L ≈ 0.65 nm²), D = σ^(−1/2) | 5 mol % → D ≈ 3.6 nm |
| Regime | mushroom if D > R_F, else brush | |
| Brush height (Alexander–de Gennes) | L = N·a^(5/3)·σ^(1/3); show max(R_F, L) | 8 mol % → ≈ 3.9 nm |
| Ligands per liposome | x · 4πR² / A_L (outer leaflet, R = 50 nm for 100 nm) | 5 mol % → ≈ 2,400 |
| Acyl chain length (Tanford) | l = 0.154 + 0.1265·n_C (C18 → n = 17) | 2.30 nm |
| Ester hydrolysis half-life | k = k0·e^(−Ea/R (1/T − 1/T0))·10^(pH − 6.5), k0 = ln2 / 1 yr, Ea ≈ 80 kJ/mol; t½ = ln2 / k | 4 °C pH 7.4 ≈ 1.5 yr; 70 °C pH 10 ≈ 2.4 min |

### Reactive end groups

| Quantity | Formula / value | Note |
|---|---|---|
| Reactive fraction of an ionisable group | f = 1 / (1 + 10^(pKa − pH)) (amine: unprotonated share; thiol: thiolate share) | Lys ε-NH₂ pKa ≈ 10.5, N-terminus ≈ 8, Cys SH ≈ 8.3 |
| NHS ester hydrolysis half-life | t½ ≈ 4–5 h at pH 7.0 (0 °C), ≈ 1 h at pH 8.0, ≈ 10 min at pH 8.6 (4 °C); model t½ ≈ 4 h × 10^(7 − pH) | widely quoted vendor figures; say "估算" |
| Maleimide ring-opening hydrolysis | slow at pH ≤ 7.5, faster above; model t½ = t½(7) × 10^(7 − pH) with t½(7) an **assumed** reference (tens of hours) | no reliable single value — label it as an assumption |
| Maleimide selectivity | thiol reacts ~1000× faster than amine at pH 7 | textbook statement, use as a card row, not a computed number |
| Temperature effect on a reaction in solution | k(T)/k(T₀) = exp(−Ea/R · (1/T − 1/T₀)), Ea ≈ 60–80 kJ/mol | applies to solutions, **not** dry powder (dry storage stops hydrolysis by removing water) |

Don't reuse the phospholipid-ester half-life (the template's storage chapter, years at 4 °C) for activated esters — NHS esters hydrolyse in minutes to hours. Each chemistry gets its own constants.

Other families: fluorophore Stokes shift (λem − λex); molecular weight from the formula; zeta potential / particle size only if the source states them.

## Honesty rules

- The source copy usually gives no numbers. Numbers from these textbook models are **estimates for illustration**: say so in the `sub` line or the end note ("示意 / 估算"), and list them in the final report for the user to check.
- Never type a number that the model didn't compute; never put a number that contradicts the source.
- Show the formula with the number, short: `D = σ^-1/2 = 3.6 nm < R_F 3.4 nm`.
- Watch name clashes when spreading model output into scene state (`{ ...PG, x }` — put your own fields last).
