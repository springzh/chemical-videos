// The numbers on screen (HUD) come from this small model, the same one v5 (machine skill) used. All units nm.
// PEG2000: N = 2000/44 ≈ 45 EO units, a = 0.35 nm, Flory radius R_F = a N^(3/5).  Grafting σ = x / A_L, spacing D = σ^-1/2,
// mushroom if D > R_F (L = R_F), brush (Alexander–de Gennes) L = N a^(5/3) σ^(1/3).  Ligands per 100 nm liposome = x 4πR² / A_L.
// DSPE tail: Tanford l = 0.154 + 0.1265 n (C18 → n = 17).  Ester hydrolysis: k = k0 e^(-Ea/R (1/T - 1/T0)) 10^(pH - 6.5).
(function () {
  const N_EO = Math.round(2000 / 44), A_EO = .35, RF = A_EO * Math.pow(N_EO, .6), A_L = .65, R_LIPO = 50;
  function peg(molPct) {
    const x = molPct / 100, sigma = x / A_L, D = 1 / Math.sqrt(sigma), Lb = N_EO * Math.pow(A_EO, 5 / 3) * Math.pow(sigma, 1 / 3);
    return { x, sigma, D, L: Math.max(RF, Lb), regime: D > RF ? '蘑菇区' : '刷状区', ligands: x * 4 * Math.PI * R_LIPO * R_LIPO / A_L };
  }
  const tail = (n = 17) => .154 + .1265 * n;
  function halfLife(Tc, pH) {   // seconds
    const T = Tc + 273.15, k0 = Math.LN2 / (365 * 86400), Ea = 80000;
    return Math.LN2 / (k0 * Math.exp(-Ea / 8.314 * (1 / T - 1 / 298.15)) * Math.pow(10, pH - 6.5));
  }
  window.MODEL = { N_EO, A_EO, RF, A_L, R_LIPO, peg, tail, halfLife };
})();
