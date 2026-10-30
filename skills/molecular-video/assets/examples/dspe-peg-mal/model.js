// The numbers on screen (HUD) come from this small model. All units nm. Estimates for illustration, not product specs.
// PEG2000: N = 2000/44 ≈ 45 EO units, a = 0.35 nm, Flory radius R_F = a N^(3/5).  Grafting σ = x / A_L, spacing D = σ^-1/2,
// mushroom if D > R_F (L = R_F), brush (Alexander–de Gennes) L = N a^(5/3) σ^(1/3).  Sites per 100 nm liposome = x 4πR² / A_L.
// DSPE tail: Tanford l = 0.154 + 0.1265 n (C18 → n = 17).
// Maleimide ring-opening hydrolysis: OH⁻-catalysed, relative rate k/k(pH 7) = 10^(pH − 7) (assumption, first order in [OH⁻]).
// Ionisable groups: deprotonated fraction f = 1 / (1 + 10^(pKa − pH)); Cys SH pKa ≈ 8.3, Lys ε-NH2 pKa ≈ 10.5.
// Temperature (solutions only): k(T0)/k(T) = exp(Ea/R (1/T − 1/T0)), Ea ≈ 70 kJ/mol, T0 = 25 °C.
(function () {
  const N_EO = Math.round(2000 / 44), A_EO = .35, RF = A_EO * Math.pow(N_EO, .6), A_L = .65, R_LIPO = 50;
  function peg(molPct) {
    const x = molPct / 100, sigma = x / A_L, D = 1 / Math.sqrt(sigma), Lb = N_EO * Math.pow(A_EO, 5 / 3) * Math.pow(sigma, 1 / 3);
    return { x, sigma, D, L: Math.max(RF, Lb), regime: D > RF ? '蘑菇区' : '刷状区', sites: x * 4 * Math.PI * R_LIPO * R_LIPO / A_L };
  }
  const tail = (n = 17) => .154 + .1265 * n;
  const hydRel = pH => Math.pow(10, pH - 7);
  const frac = (pKa, pH) => 1 / (1 + Math.pow(10, pKa - pH));
  const slow = (Tc, T0c = 25, Ea = 70000) => Math.exp(Ea / 8.314 * (1 / (Tc + 273.15) - 1 / (T0c + 273.15)));
  window.MODEL = { N_EO, A_EO, RF, A_L, R_LIPO, peg, tail, hydRel, frac, slow, PKA_CYS: 8.3, PKA_LYS: 10.5 };
})();
