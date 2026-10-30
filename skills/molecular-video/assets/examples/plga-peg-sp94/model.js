// The numbers on screen (HUD) come from this small model. All units nm.
// PEG of molar mass M: N = M / 44 EO units, a = 0.35 nm, Flory radius R_F = a N^(3/5) (good solvent, free coil).
// SP94 peptide: SFSIIHTPILPL, 12 residues (Lo et al., Mol Cancer Ther 2008) — literature, not the product copy.
(function () {
  const A_EO = .35, SP94 = 'SFSIIHTPILPL';
  const N = M => M / 44, RF = M => A_EO * Math.pow(N(M), .6);
  window.MODEL = { A_EO, SP94, N, RF };
})();
