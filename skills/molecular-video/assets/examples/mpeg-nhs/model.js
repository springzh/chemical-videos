// The numbers on screen (HUD) for mPEG-NHS 5000 come from this small model. All lengths nm, times s. Estimates for illustration.
// PEG5000: N = 5000/44 ≈ 114 EO units, a = 0.35 nm, Flory radius R_F = a N^(3/5).
// Amine reactivity: only the unprotonated amine attacks the ester, f = 1 / (1 + 10^(pKa − pH)); Lys ε-NH2 pKa ≈ 10.5, N-terminus ≈ 8.
// NHS ester hydrolysis half-life: vendor figures ≈ 4–5 h at pH 7, ≈ 1 h at pH 8, ≈ 10 min at pH 8.6 (0–4 °C); model t½ ≈ 4 h × 10^(7 − pH).
// Temperature (solution only): k(T)/k(T0) = exp(−Ea/R (1/T − 1/T0)), Ea ≈ 70 kJ/mol. Dry powder: no water, no hydrolysis.
(function () {
  const MW = 5000, N_EO = Math.round(MW / 44), A_EO = .35, RF = A_EO * Math.pow(N_EO, .6);
  const fAmine = (pH, pKa = 10.5) => 1 / (1 + Math.pow(10, pKa - pH));
  const nhsHalf = pH => 4 * 3600 * Math.pow(10, 7 - pH);
  const slow = (Tc, T0c = 25, Ea = 70000) => Math.exp(-Ea / 8.314 * (1 / (T0c + 273.15) - 1 / (Tc + 273.15)));   // k(T0)/k(T)
  const left = (tSec, pH) => Math.pow(.5, tSec / nhsHalf(pH));   // active ester fraction left after tSec in water
  window.MODEL = { MW, N_EO, A_EO, RF, fAmine, nhsHalf, slow, left };
})();
