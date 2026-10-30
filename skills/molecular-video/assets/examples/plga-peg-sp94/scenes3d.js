// 3D content per scene (keyed like SCENE_DEFS). build(g, W) once; update(lt, E, beat, W) every frame.
// PLGA-PEG-SP94: Micelle = PLGA coils inward (core), PEG chains outward, 12-residue SP94 helix at the tips.
(function () {
  const L = () => W3.lib;
  const pop = SP.pop, heavy = SP.heavy;
  const sm = (a, b, k) => a + (b - a) * clamp(k), M3 = window.MODEL;
  W3.molHead = 'pep';
  // bloom flash on a cue: ramps in over 0.25 s (a one-frame step reads as a stutter), then decays
  const flash = (lt, t) => clamp((lt - t + .25) / .25) * Math.exp(-Math.max(0, lt - t) * 2.5);

  // cell wall with receptor cups facing −x, centre at (cx, 0, 0); target receptor exactly at direction (−1, 0, 0)
  function cellWall(g, cx, ys) {
    const { V, T, MAT, receptor } = L();
    const body = new T.Mesh(new T.SphereGeometry(60, 96, 64), MAT.cell); body.position.set(cx, 0, 0); g.add(body);
    return ys.map((yy, i) => { const d = V(-1, yy, yy === 0 ? 0 : i % 2 ? .06 : -.06).normalize(), r = receptor(g, MAT.rec);
      r.position.copy(d.clone().multiplyScalar(60).add(V(cx, 0, 0))); r.quaternion.setFromUnitVectors(V(0, 1, 0), d); r.cupW = r.position.clone().add(d.clone().multiplyScalar(2.1)); return r; });
  }

  W3.defs.intro = {
    build(g) {
      const { Micelle, V, receptor, MAT, T } = L();
      this.mc = new Micelle(g, 4.5, 40, { nb: 6 });
      this.cell = new T.Group(); g.add(this.cell);
      const body = new T.Mesh(new T.SphereGeometry(60, 96, 64), MAT.cell); body.position.set(73, 0, 0); this.cell.add(body);
      this.recs = [-.2, -.1, 0, .1, .2].map((yy, i) => { const d = V(-1, yy, (i % 2 ? .08 : -.08)).normalize(), r = receptor(this.cell, MAT.rec);
        r.position.copy(d.clone().multiplyScalar(60).add(V(73, 0, 0))); r.quaternion.setFromUnitVectors(V(0, 1, 0), d); return r; });
      this.trail = [...Array(16)].map(() => { const m = new T.Mesh(W3.lib.GEO.rbead, MAT.trail); g.add(m); return m; });
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), tR = E('肝癌细胞'), tT = E('今天'), drift = ease((lt - tT) / 3) * 1.5;
      const c = V(-8 + drift, 0, 0);
      this.mc.g.position.copy(c); this.mc.g.rotation.set(.2, lt * .18, 0);
      // self-assembly: chains fly in from the water and settle into the micelle
      this.mc.pose(lt, .2, { sweep: 1.6, fly: (i, d) => 12 * (1 - heavy(lt - .2 - (1 - d.y) / 2 * 1.6)) });
      const kc = SP.card(lt - tR + .2);
      this.cell.position.x = (1 - kc) * 40; this.cell.visible = kc > .001;
      W3.lib.MAT.rec.emissiveIntensity = lt > tR ? .25 + beatPulse(lt, beat) * .5 : 0;
      const A = c.clone().add(V(13, 0, 0)), B = V(10.5, 0, 0), M = V((A.x + B.x) / 2, 5, 2), on = clamp((lt - tR) / .4);
      this.trail.forEach((b, i) => { const u = ((i / 16 + lt * .35) % 1), p = A.clone().multiplyScalar((1 - u) ** 2).add(M.clone().multiplyScalar(2 * u * (1 - u))).add(B.clone().multiplyScalar(u * u));
        b.position.copy(p); b.scale.setScalar(Math.max(.001, on * .45 * Math.sin(u * Math.PI))); });
      const kz = ease((lt - tR + .6) / 1.6);
      const ko = ease(lt / 4.6), a0 = 1.1 * (1 - ko), r0 = sm(27, 38, ko);
      const p0 = V(c.x + 2 + Math.sin(a0) * r0, 3 + 5 * (1 - ko), Math.cos(a0) * r0);
      W.cam(p0.lerp(V(1, 4, 58), kz), c.clone().lerp(V(0, -1, 0), kz));
      W.bloom(.5 + .5 * flash(lt, tR));
      this.pts.lab = c.clone().add(V(0, -13, 0)); this.pts.target = B; this.pts.q = M.clone().add(V(0, 3, 0)); this.pts.cell = V(14, 9, 0);
    },
  };

  W3.defs.struct = {
    build(g) { const { Mol } = L(); this.m = new Mol(g, 11, { anchor: 'plga', np: 10 }); this.pts = {}; },
    update(lt, E, beat, W) {
      const { V } = L(), cue = [E('疏水'), E('亲水'), E('接枝')];
      const kpep = clamp((lt - cue[2]) / 1.4);
      const m = this.m.pose({ kt: pop(lt - cue[0]), kp: ease((lt - cue[1]) / (E('链段') - cue[1] + .6)), kr: pop(lt - cue[2]), kpep, w: lt, amp: .4 });
      m.place(V(-6, -4.6, 0), V(1, 0, 0), lt * .5, 1.2);
      W3.lib.MAT.rgd.emissiveIntensity = lt > cue[2] ? .5 + beatPulse(lt, beat) * .9 : .5;
      W.cam(V(Math.sin(lt * .2) * 2.5, 1.5 + Math.sin(lt * .13) * 1.2, 41 - lt * .35), V(0, 0, 0));
      this.hud = { kpep };
      this.pts.seg = [m.world(V(0, -2.2, 0)), m.world(V(0, .95 + m.n * .4, 0)), m.world(m.tip.clone().add(V(0, .9, 0)))];
    },
  };

  W3.defs.core = {
    build(g) {
      const { Micelle, Waters, T, MAT, V } = L();
      this.mc = new Micelle(g, 4.6, 44, { nb: 6, np: 10 });
      const r = rnd(23); this.scat = this.mc.dirs.map(() => [V(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).multiplyScalar(14), r() * 6]);
      // section face: warm hatched disc at z = 0 (seen once the front half is swept away)
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), rg = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      rg.addColorStop(0, 'rgba(245,163,59,.75)'); rg.addColorStop(.8, 'rgba(245,163,59,.6)'); rg.addColorStop(.86, 'rgba(79,200,242,.9)'); rg.addColorStop(1, 'rgba(79,200,242,.0)');
      x.fillStyle = rg; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.save(); x.beginPath(); x.arc(128, 128, 104, 0, 7); x.clip();
      x.strokeStyle = 'rgba(255,230,190,.5)'; x.lineWidth = 2; for (let i = -256; i < 256; i += 12) { x.beginPath(); x.moveTo(i, 256); x.lineTo(i + 256, 0); x.stroke(); } x.restore();
      const tx = new T.CanvasTexture(cv); tx.colorSpace = T.SRGBColorSpace;
      this.secM = new T.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
      this.sec = new T.Mesh(new T.CircleGeometry(5.4, 64), this.secM); g.add(this.sec);
      this.W = new Waters(g, 30); this.wseed = [...Array(30)].map(() => [r() * Math.PI * 2, r() * 2 - 1, r() * 4]);
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), tA = E('聚拢'), tK = E('内核'), tH = E('水解'), tD = E('降解');
      const ka = i => heavy(lt - tA + .4 - i * .012);
      const mc = this.mc; mc.g.rotation.set(0, lt * .08, 0);
      // cutaway: front half (dir.z > zc, in the micelle's turning frame) removed from 内核 on
      const kc = ease((lt - tK + .5) / 1.1), zc = sm(1.2, .02, kc), ry = lt * .08;
      const cut = d => { const z = d.z * Math.cos(ry) - d.x * Math.sin(ry); return clamp((zc - z) / .25); };
      const deg = sm(0, 1, ease((lt - tH) / (tD - tH + 1.6)));
      mc.pose(lt, -2, { cut: kc > .001 ? cut : null, deg, amp: .3, fly: (i, d) => 0 });
      // before 聚拢 the chains float free (unimers); they fly in to the shell radius
      mc.mols.forEach((m, i) => { const k = ka(i), [p, ph] = this.scat[i], d = mc.dirs[i];
        if (k < 1) { const free = p.clone().add(V(Math.sin(lt * .6 + ph), Math.cos(lt * .5 + ph), 0)), home = d.clone().multiplyScalar(mc.R);
          m.g.position.copy(free.lerp(home, k)); } });
      mc.core.scale.setScalar(Math.max(.001, ka(20)) * (1 - .25 * deg)); W3.lib.MAT.plgaCore.opacity = .32 * (1 - .6 * kc);
      this.sec.visible = kc > .01; this.sec.position.z = 0; this.sec.rotation.y = 0; this.secM.opacity = .6 * clamp(kc * 1.4) * (1 - .5 * deg);
      // water attacks the ester bonds
      const kw = clamp((lt - tH + .4) / .8);
      this.W.pose(i => { const [a, y, ph] = this.wseed[i], rr = sm(13, 4.2, ease((lt - tH + .4 - i * .03) / 2.2)) + Math.sin(lt + ph) * .4;
        return { p: V(Math.cos(a + lt * .1) * rr * Math.sqrt(1 - y * y), y * rr, Math.sin(a + lt * .1) * rr * Math.sqrt(1 - y * y)), s: kw * 1.3, a: lt + ph }; });
      W3.lib.MAT.plga.emissiveIntensity = .25 + (lt > tH && lt < tD + 1 ? beatPulse(lt, beat) * .8 : 0);
      const z1 = ease((lt - tK + .4) / 1.6), z2 = ease((lt - tD + .2) / 1.8);
      const cp = V(Math.sin(lt * .15) * 3, 6, 46 - lt * .3).lerp(V(5, 3, 19), z1).lerp(V(-3, 5, 34), z2);
      W.cam(cp, V(0, 0, 0));
      W.bloom(.5 + .3 * flash(lt, tD));
      // label points on the remaining back half: one lactide (orange) and one glycolide (pale) bead of a back molecule
      const back = mc.mols.reduce((b, m, i) => (mc.dirs[i].z < mc.dirs[b].z ? i : b), 0), mb = mc.mols[back];
      this.pts.core = V(0, -1.2, 0); this.pts.LA = mb.g.localToWorld(mb.plgaP[3].clone()); this.pts.GA = mb.g.localToWorld(mb.plgaP[5].clone());
      this.pts.frag = V(5.5, 4.5, 2);
    },
  };

  W3.defs.peg = {
    build(g) {
      const { Mol, V, fib, MAT, T, nano } = L();
      this.base = new T.Group(); g.add(this.base); this.base.position.set(0, -24, 0);
      this.surf = new T.Mesh(new T.SphereGeometry(23.4, 96, 48, 0, Math.PI * 2, 0, .7), W3.lib.MAT.plgaCore.clone()); this.surf.material.opacity = .85; this.base.add(this.surf);
      this.beads = new T.InstancedMesh(W3.lib.GEO.plga, MAT.plga, 900); this.beads.frustumCulled = false; this.base.add(this.beads);
      { const ds = fib(900, V(0, 1, 0), 38), mm = new T.Matrix4(), cA = new T.Color(C.a), cG = cA.clone().lerp(new T.Color(0xffffff), .45);
        ds.slice(0, 900).forEach((d, i) => { mm.compose(d.clone().multiplyScalar(23.5), new T.Quaternion(), new T.Vector3(1.3, 1.3, 1.3)); this.beads.setMatrixAt(i, mm); this.beads.setColorAt(i, i % 3 === 2 ? cG : cA); });
        this.beads.count = Math.min(900, ds.length); }
      this.dirs = fib(20, V(0, 1, 0), 22); this.mols = this.dirs.map(() => new Mol(this.base, 12, { anchor: 'none' }));
      this.shell = new T.Mesh(new T.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, .58), MAT.shell); this.base.add(this.shell);
      const r = rnd(17); this.wseed = [...Array(110)].map(() => [r() * Math.PI * 2, r() * .5, 26 + r() * 9, r() * 6]);
      this.water = new T.InstancedMesh(new T.SphereGeometry(.2, 10, 8), MAT.water, 110); this.water.frustumCulled = false; this.base.add(this.water);
      this.np = nano(g, 2); this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V, T } = L(), tS = E('伸展'), tP = E('保护层'), kH = SP.card(lt - tP);
      // PEG molar mass sweeps 1000 → 5000 between 伸展 and 保护层: chains grow, coils open into a brush
      const kM = ease((lt - tS + .3) / (tP - tS + .3)), Mw = Math.round(sm(1000, 5000, kM) / 100) * 100, kS = kM;
      this.mols.forEach((m, i) => { const at = E('伸展') - 1.6 + i * .03, d = this.dirs[i];
        m.pose({ kt: 0, kp: pop(lt - at) * (Mw / 5000), kr: pop(lt - at - .3), w: lt * .9 + i * .7, amp: sm(1.1, .3, kS), spf: sm(.45, 1, kS) })
          .place(d.clone().multiplyScalar(23.6), d, i); });
      this.hud = { Mw, RF: M3.RF(Mw), N: M3.N(Mw) };
      this.shell.scale.setScalar(24 + 12 * kH); this.shell.visible = kH > .01; W3.lib.MAT.shell.opacity = .1 * clamp(kH) + .03 * beatPulse(lt, beat) * (kH > .5);
      const mm = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3();
      this.wseed.forEach(([a, th, r, ph], i) => { const k = pop(lt - tP - .2 - i * .008), t2 = th + Math.sin(lt * .5 + ph) * .02, aa = a + lt * .05;
        const p = V(Math.sin(t2) * Math.cos(aa), Math.cos(t2), Math.sin(t2) * Math.sin(aa)).multiplyScalar(r + Math.sin(lt * 1.3 + ph) * .3);
        s.setScalar(Math.max(.001, k)); mm.compose(p, q, s); this.water.setMatrixAt(i, mm); });
      this.water.instanceMatrix.needsUpdate = true;
      const tA = E('团聚'), app = ease((lt - tA + 1.2) / 1.2), back = SP.card(lt - tA);
      const P = V(sm(15, 7, app) + back * 4, sm(13, 9, app) + back * 2.5, 3);
      this.np.position.copy(P); this.np.rotation.set(lt * .4, lt * .6, 0); this.np.visible = lt > tA - 1.2;
      const kz = ease((lt - tS + .4) / (tP - tS + .6));
      W.cam(V(5, 6, 22).lerp(V(Math.sin(lt * .2) * 2, 15, 50 - lt * .3), kz), V(1, 2.5, 0).lerp(V(0, 5, 0), kz));
      this.pts.np = P.clone().add(V(-2.5, -2.5, 0)); this.pts.top = V(0, 15, 0);
    },
  };

  W3.defs.sp94 = {
    build(g) {
      const { Micelle, V, fib } = L();
      this.mc = new Micelle(g, 4.8, 0, { nb: 5, dirs: [V(1, 0, 0), ...fib(22).filter(d => d.x < .8)] });
      this.recs = cellWall(g, 70, [-.21, -.14, -.07, 0, .07, .14, .21]);
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), tN = E('导航'), kN = heavy(lt - E('识别') + .5), tR = E('最外层');
      const c = V(sm(-12, -3.6, kN), Math.sin(lt * 1.1) * .4 * (1 - kN), 0);
      this.mc.g.position.copy(c); this.mc.g.rotation.set(0, lt * .35 * (1 - kN), 0);
      this.mc.pose(lt + 3, 0);
      const M = W3.lib.MAT, m0 = this.mc.mols[0];
      M.rgd.emissiveIntensity = lt > tR ? .4 + (lt < tR + .8 ? (1 - (lt - tR) / .8) * 1.2 : 0) + beatPulse(lt, beat) * .3 : .4;
      M.rec.emissiveIntensity = lt > E('肝癌细胞') ? .3 + beatPulse(lt, beat) * .6 : 0;
      const kz = ease((lt - tN + .2) / 1.5), kc = ease((lt - E('识别') - .2) / 1.1) * (1 - ease((lt - tN + .1) / 1.3));
      const tipW = m0.world(m0.tip);
      W.cam(V(sm(-1, 2, kz), sm(2.5, 1.5, kz), sm(46, 41, kz)).lerp(tipW.clone().add(V(-6, 4, 17)), kc), V(sm(-2, 1, kz), 0, 0).lerp(tipW, kc));
      const dist = tipW.distanceTo(this.recs[3].cupW);
      this.hud = { bound: dist < 1.2, dist, k: clamp((lt - tR + .3) / 1.2) };
      W.bloom(.5 + .7 * flash(lt, tN));
      this.pts.tip = tipW; this.pts.recs = this.recs.map(r => r.cupW); this.pts.c = c;
    },
  };

  W3.defs.make = {
    build(g) {
      const { Micelle, T, MAT, V, fib } = L();
      this.mc = new Micelle(g, 4.6, 70, { nb: 5 });
      this.oil = new T.Mesh(new T.SphereGeometry(1, 64, 48), MAT.oil); g.add(this.oil);
      this.ms = new Micelle(g, 11, 240, { nb: 4 }); this.ms.core.material = MAT.plgaCore.clone(); this.ms.core.material.opacity = .92;
      const r = rnd(41); this.vap = [...Array(40)].map(() => [V(r() - .5, r() - .5, r() - .5).normalize(), r() * 3]);
      this.vapM = new T.InstancedMesh(new T.SphereGeometry(.25, 10, 8), MAT.oil, 40); this.vapM.frustumCulled = false; g.add(this.vapM);
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V, T } = L(), tE = E('乳化'), tN = E('纳米胶束'), tM = E('微球');
      // emulsion droplet: polymer at the oil/water interface; solvent leaves, droplet shrinks to the micelle
      const ks = ease((lt - tE - .3) / (tN - tE + .2)), R = sm(10, 4.6, ks), wob = (1 - ks) * Math.sin(lt * 6) * .25 * clamp(lt - tE + .5);
      const mx = sm(0, -10, ease((lt - tM + .6) / 1.2));
      this.mc.R = R; this.mc.g.position.set(mx, 1, 0); this.mc.g.rotation.y = lt * .2;
      this.mc.pose(lt, 0, { sweep: 1, amp: .25 });
      this.mc.core.scale.setScalar((R * .92) / (4.6 * .92));
      this.oil.position.copy(this.mc.g.position); this.oil.scale.set(R * .98 + wob, R * .98 - wob, R * .98 + wob); W3.lib.MAT.oil.opacity = .3 * (1 - ks);
      this.oil.visible = ks < .99;
      const mm = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3();
      this.vap.forEach(([d, ph], i) => { const u = ((lt * .5 + ph) % 3) / 3, on = clamp((lt - tE) * 2) * (1 - ks);
        mm.compose(d.clone().multiplyScalar(R + 1 + u * 9).add(this.mc.g.position), q, s.setScalar(Math.max(.001, on * (1 - u)))); this.vapM.setMatrixAt(i, mm); });
      this.vapM.instanceMatrix.needsUpdate = true;
      // microsphere: larger solid PLGA sphere with a PEG/peptide shell slides in beside it
      const km = heavy(lt - tM + .2); this.ms.g.visible = km > .002;
      this.ms.g.position.set(sm(40, 12, km), sm(-3, 0, km), -12); this.ms.g.rotation.y = -lt * .12; this.ms.pose(lt, tM - .3, { sweep: .6 });
      W.cam(V(Math.sin(lt * .18) * 2, 2, sm(62, 80, ease((lt - tM + .6) / 1.4))), V(0, 0, 0));
      W.bloom(.5);
      this.pts.drop = this.mc.g.position.clone().add(V(0, -R - 3, 0)); this.pts.mc = this.mc.g.position.clone().add(V(0, -11, 0));
      this.pts.ms = this.ms.g.position.clone().add(V(0, -19, 0));
    },
  };

  W3.defs.apply = {
    build(g) {
      const { Micelle, V, fib } = L();
      this.mc = new Micelle(g, 4.8, 0, { nb: 5, dirs: [V(1, 0, 0), ...fib(22).filter(d => d.x < .8)] });
      this.recs = cellWall(g, 70, [-.21, -.14, -.07, 0, .07, .14, .21]);
      this.pts = {};
    },
    update(lt, E, beat, W) {
      // one carrier, one continuous action: drifts in bare (no recognition) → peptides grow on at 接上 → glides to the cell and docks
      const { V } = L(), t1 = E('单一'), tJ = E('接上'), tB = E('仿生材料');
      const kh = ease((lt - tJ + .1) / .9), kD = ease((lt - tJ - .5) / 1.8);
      const c = V(sm(-10, -3.6, kD), sm(9, 0, ease(lt / (t1 + .6))) + Math.sin(lt * .9) * .4 * (1 - kD), 0);
      this.mc.g.position.copy(c); this.mc.g.rotation.set(0, (.7 + Math.sin(lt * .5) * .25) * (1 - kD), 0);
      this.mc.pose(lt + 3, 0, { kh });
      const M = W3.lib.MAT; M.rgd.emissiveIntensity = .45 + kh * beatPulse(lt, beat) * .5;
      M.rec.emissiveIntensity = .3 * ease((lt - tJ - 1.6) / .6) * (1 + beatPulse(lt, beat));
      const kc = ease((lt - tB + .6) / 1.8);
      W.cam(V(Math.sin(lt * .2) * 2, sm(1, -7, kc), 50), V(1, sm(0, -6, kc), 0));
      W.bloom(.5 + .4 * flash(lt, tJ));
      this.pts.plain = c.clone().add(V(0, 8.5, 0)); this.pts.mc = c.clone().add(V(0, 8.5, 0));
    },
  };

  W3.defs.outro = {
    build(g) {
      const { Mol, Micelle } = L(); this.m = new Mol(g, 11, { anchor: 'plga', np: 10 }); this.mc = new Micelle(g, 4.5, 40, { nb: 5 });
      this.far = [[-44, 19, -62], [46, 21, -72], [-50, -22, -80], [48, -21, -70]].map(([x, y, z]) => { const mc = new Micelle(g, 3.8, 26, { nb: 4 }); mc.g.position.set(x, y, z); return mc; });
    },
    update(lt, E, beat, W) {
      const { V } = L(), k = heavy(lt);
      this.m.pose({ kt: k, kp: ease(lt / .9), kr: pop(lt - .6), kpep: clamp((lt - .6) / 1), w: lt, amp: .4 }).place(V(-4.1, 5.9, 0), V(1, 0, 0), lt * .5);
      W3.lib.MAT.rgd.emissiveIntensity = .5 + beatPulse(lt, beat) * .6;
      this.mc.g.position.set(-24, -8, -45); this.mc.g.rotation.y = lt * .1; this.mc.pose(lt + 5, 0);
      this.far.forEach((mc, j) => { mc.g.rotation.y = lt * .15 + j; mc.pose(lt + 5, 0); });
      const kb = ease((lt - 1.5) / 7);
      W.cam(V(Math.sin(lt * .2) * 1.5, 0, 38 + kb * 14), V(0, 0, 0));
    },
  };
})();
