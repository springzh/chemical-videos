// 3D content per scene (keyed like SCENE_DEFS). build(g, W) once; update(lt, E, beat, W) every frame.
// Each def may expose world points in this.pts for the SVG layer to pin labels to (W3.stage(lay, p)).
(function () {
  const L = () => W3.lib;
  const pop = SP.pop, heavy = SP.heavy;
  const sm = (a, b, k) => a + (b - a) * clamp(k), M3 = window.MODEL;
  // bloom flash on a cue: ramps in over 0.25 s (a one-frame step reads as a stutter), then decays
  const flash = (lt, t) => clamp((lt - t + .25) / .25) * Math.exp(-Math.max(0, lt - t) * 2.5);

  W3.defs.intro = {
    build(g) {
      const { Lipo, Mol, V, receptor, MAT, T, fib } = L();
      this.lp = new Lipo(g, 5.5);
      this.dirs = fib(20); this.mols = this.dirs.map(() => new Mol(this.lp.top, 5));
      this.cell = new T.Group(); g.add(this.cell);
      const body = new T.Mesh(new T.SphereGeometry(60, 96, 64), MAT.cell); body.position.set(73, 0, 0); this.cell.add(body);
      this.recs = [-.2, -.1, 0, .1, .2].map((yy, i) => { const d = V(-1, yy, (i % 2 ? .08 : -.08)).normalize(), r = receptor(this.cell, MAT.rec);
        r.position.copy(d.clone().multiplyScalar(60).add(V(73, 0, 0))); r.quaternion.setFromUnitVectors(V(0, 1, 0), d); return r; });
      this.trail = [...Array(16)].map(() => { const m = new T.Mesh(W3.lib.GEO.rbead, MAT.trail); g.add(m); return m; });
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), tR = E('认路'), tT = E('今天'), drift = ease((lt - tT) / 3) * 1.5;
      const c = V(-8 + drift, 0, 0);
      this.lp.g.position.copy(c); this.lp.g.rotation.set(.2, lt * .18, 0);
      this.lp.pose(lt, 0);
      this.mols.forEach((m, i) => { const at = E('分子') + i * .04, d = this.dirs[i];
        m.pose({ kt: pop(lt - at), kp: ease((lt - at - .1) / .6), kr: pop(lt - at - .6), w: lt + i, amp: .25 }).place(d.clone().multiplyScalar(5.8), d, i); });
      const kc = SP.card(lt - tR + .2);
      this.cell.position.x = (1 - kc) * 40; this.cell.visible = kc > .001;
      W3.lib.MAT.rec.emissiveIntensity = lt > tR ? .25 + beatPulse(lt, beat) * .5 : 0;
      // glowing trail from the carrier to the middle receptor
      const A = c.clone().add(V(12.5, 0, 0)), B = V(10.5, 0, 0), M = V((A.x + B.x) / 2, 5, 2), on = clamp((lt - tR) / .4);
      this.trail.forEach((b, i) => { const u = ((i / 16 + lt * .35) % 1), p = A.clone().multiplyScalar((1 - u) ** 2).add(M.clone().multiplyScalar(2 * u * (1 - u))).add(B.clone().multiplyScalar(u * u));
        b.position.copy(p); b.scale.setScalar(Math.max(.001, on * .45 * Math.sin(u * Math.PI))); });
      const kz = ease((lt - tR + .6) / 1.6);
      const ko = ease(lt / 4.6), a0 = 1.1 * (1 - ko), r0 = sm(17, 33, ko);   // opening: orbit in close while the liposome assembles
      const p0 = V(c.x + 2 + Math.sin(a0) * r0, 3 + 5 * (1 - ko), Math.cos(a0) * r0);
      W.cam(p0.lerp(V(1, 4, 56), kz), c.clone().lerp(V(0, -1, 0), kz));
      W.bloom(.5 + .5 * flash(lt, tR));
      this.pts.lab = c.clone().add(V(0, -12.5, 0)); this.pts.target = B; this.pts.q = M.clone().add(V(0, 3, 0));
    },
  };

  W3.defs.struct = {
    build(g) { const { Mol } = L(); this.m = new Mol(g, 12); this.pts = {}; },
    update(lt, E, beat, W) {
      const { V } = L(), cue = [E('疏水'), E('亲水'), E('环肽')];
      const m = this.m.pose({ kt: pop(lt - cue[0]), kp: ease((lt - cue[1]) / (E('长链') - cue[1] + .6)), kr: pop(lt - cue[2]), w: lt, amp: .4 });
      m.place(V(-4.4, -4.6, 0), V(1, 0, 0), lt * .5);
      W3.lib.MAT.rgd.emissiveIntensity = lt > cue[2] ? .5 + beatPulse(lt, beat) * .9 : .5;
      W.cam(V(Math.sin(lt * .2) * 2.5, 1.5 + Math.sin(lt * .13) * 1.2, 41 - lt * .35), V(0, 0, 0));
      this.pts.seg = [m.world(V(0, -1.6, 0)), m.world(V(0, .95 + m.n * .4, 0)), m.world(m.tip)];
    },
  };

  W3.defs.dspe = {
    build(g) {
      const { Bilayer, Mol } = L();
      this.B = new Bilayer(g, 30, 18); this.m = new Mol(g, 9); this.side = [new Mol(g, 9), new Mol(g, 9)]; this.pts = {};
      const { T, MAT } = L(); this.sec = new T.Mesh(new T.PlaneGeometry(31.4, 4.6), MAT.section); this.sec.position.y = -1.7; g.add(this.sec);
    },
    update(lt, E, beat, W) {
      const { V } = L(), tIn = E('嵌进'), kIn = heavy(lt - tIn), tF = E('固定');
      const ins = [[0, 2, kIn], [-8, 2, heavy(lt - tF - .2)], [8, 2, heavy(lt - tF - .35)]];
      // cutaway: the front of the bilayer is swept away so the tails are seen inside the hydrophobic core
      const tB = E('磷脂双层'), kc = ease((lt - tB + .9) / 1.1), zc = sm(9.5, 1.6, kc);
      this.B.pose(lt, 0, (x, z) => { let dx = 0, dz = 0;
        ins.forEach(([cx, cz, k]) => { const ex = x - cx, ez = z - cz, d = Math.hypot(ex, ez) || 1, f = .85 * k * Math.exp(-d / 1.3); dx += ex / d * f; dz += ez / d * f; });
        return [dx, dz]; }, (x, z) => clamp((zc - z) / .9));
      this.sec.position.z = zc; this.sec.visible = kc > .01; W3.lib.MAT.section.opacity = .85 * clamp(kc * 1.4);
      this.hud = { depth: M3.tail() * clamp(kIn), anchored: 1 * (kIn > .9) + (heavy(lt - tF - .2) > .9) + (heavy(lt - tF - .35) > .9), cut: kc };
      const k1 = pop(lt - E('先看')), tg = lt > E('两条') && lt < tIn + .5;
      this.m.pose({ kt: k1, kp: k1, kr: k1, w: lt, amp: .3, tl: .72 }).place(V(0, sm(13, .3, kIn) + (1 - k1) * 3, 2.1), V(0, 1, 0), lt * .4);
      W3.lib.MAT.dspe.emissiveIntensity = tg ? .3 + beatPulse(lt, beat) * 1.2 : .25;
      this.side.forEach((m, j) => { const at = tF + .2 + j * .15, k = heavy(lt - at), kv = pop(lt - at + .35);
        m.pose({ kt: kv, kp: kv, kr: kv, w: lt + j * 2, amp: .3, tl: .72 }).place(V([-8, 8][j], sm(13, .3, k), 2.1), V(0, 1, 0), lt * .4 + j); });
      const z1 = ease((lt - tB + .7) / 1.5), z2 = ease((lt - tF + .3) / 1.6);   // dive into the section, then pull back for all three
      const cp = V(Math.sin(lt * .15) * 3, 13, 44 - lt * .3).lerp(V(4.5, .2, 17), z1).lerp(V(-2, 4.5, 31), z2);
      W.cam(cp, V(0, 2.5, 0).lerp(V(.8, -1.4, 2), z1).lerp(V(0, -.2, 2), z2));
      W.bloom(.5 + .6 * flash(lt, tF));
      this.pts.tails = this.m.world(V(0, -1.8, 0)); this.pts.head = this.m.world(V(0, 0, 0)); this.pts.mem = V(-12, .2, -2); this.pts.core = V(-5.5, -1.7, zc);
    },
  };

  W3.defs.peg = {
    build(g) {
      const { Lipo, Mol, V, fib, MAT, T, nano } = L();
      this.lp = new Lipo(g, 24, { cap: 34, core: false }); this.lp.g.position.set(0, -24, 0);
      this.dirs = fib(20, V(0, 1, 0), 22); this.mols = this.dirs.map(() => new Mol(this.lp.top, 10));
      this.shell = new T.Mesh(new T.SphereGeometry(1, 64, 24, 0, Math.PI * 2, 0, .58), MAT.shell); this.lp.g.add(this.shell);
      const r = rnd(17); this.wseed = [...Array(110)].map(() => [r() * Math.PI * 2, r() * .5, 25.5 + r() * 9, r() * 6]);
      this.water = new T.InstancedMesh(new T.SphereGeometry(.2, 10, 8), MAT.water, 110); this.water.frustumCulled = false; this.lp.g.add(this.water);
      this.np = nano(g, 2); this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V, T } = L(), kH = SP.card(lt - E('保护刷')), tS = E('伸展');
      // mol % sweeps 1 → 8 between 伸展 and 保护刷; the model decides mushroom vs brush and the layer thickness
      const x = sm(1, 8, ease((lt - tS + .3) / (E('保护刷') - tS + .3))), PG = M3.peg(x), kS = clamp((M3.RF / PG.D - .43) / .77);
      const nVis = Math.max(5, Math.round(this.mols.length * x / 8));
      this.lp.pose(lt, 0, { sweep: .3 });
      this.mols.forEach((m, i) => { const at = Math.max(E('再看') + i * .02, i < 5 ? 0 : tS - .3 + (i - 5) / (this.mols.length - 5) * (E('保护刷') - tS)), d = this.dirs[i];
        m.pose({ kt: pop(lt - at), kp: pop(lt - at - .1), kr: pop(lt - at - .3), w: lt * .9 + i * .7, amp: sm(1.2, .3, kS), spf: sm(.36, 1, kS), tl: .7 })
          .place(d.clone().multiplyScalar(24.3), d, i); });
      this.hud = { ...PG, x, n: nVis };
      this.shell.scale.setScalar(24 + 12 * kH); this.shell.visible = kH > .01; W3.lib.MAT.shell.opacity = .1 * clamp(kH) + .03 * beatPulse(lt, beat) * (kH > .5);
      const mm = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3();
      this.wseed.forEach(([a, th, r, ph], i) => { const k = pop(lt - E('保护刷') - .2 - i * .008), t2 = th + Math.sin(lt * .5 + ph) * .02, aa = a + lt * .05;
        const p = V(Math.sin(t2) * Math.cos(aa), Math.cos(t2), Math.sin(t2) * Math.sin(aa)).multiplyScalar(r + Math.sin(lt * 1.3 + ph) * .3);
        s.setScalar(Math.max(.001, k)); mm.compose(p, q, s); this.water.setMatrixAt(i, mm); });
      this.water.instanceMatrix.needsUpdate = true;
      const tA = E('团聚'), app = ease((lt - tA + 1.2) / 1.2), back = SP.card(lt - tA);
      const P = V(sm(15, 7, app) + back * 4, sm(12, 8, app) + back * 2.5, 3);
      this.np.position.copy(P); this.np.rotation.set(lt * .4, lt * .6, 0); this.np.visible = lt > tA - 1.2;
      const kz = ease((lt - tS + .4) / (E('保护刷') - tS + .6));   // close on a few coils, pull back as the brush forms
      W.cam(V(5, 6, 21).lerp(V(Math.sin(lt * .2) * 2, 15, 50 - lt * .3), kz), V(1, 2.5, 0).lerp(V(0, 5, 0), kz));
      this.pts.np = P.clone().add(V(-2.5, -2.5, 0)); this.pts.top = V(0, 15, 0);
    },
  };

  W3.defs.rgd = {
    build(g) {
      const { Lipo, Mol, V, fib, MAT, T, receptor } = L();
      this.lp = new Lipo(g, 4.5);
      this.dirs = [V(1, 0, 0), ...fib(15).filter(d => d.x < .8)]; this.mols = this.dirs.map(() => new Mol(this.lp.top, 5));
      const body = new T.Mesh(new T.SphereGeometry(60, 96, 64), MAT.cell); body.position.set(70, 0, 0); g.add(body);
      this.recs = [-.21, -.14, -.07, 0, .07, .14, .21].map((yy, i) => { const d = V(-1, yy, yy === 0 ? 0 : i % 2 ? .06 : -.06).normalize(), r = receptor(g, MAT.rec);
        r.position.copy(d.clone().multiplyScalar(60).add(V(70, 0, 0))); r.quaternion.setFromUnitVectors(V(0, 1, 0), d); r.cupW = r.position.clone().add(d.clone().multiplyScalar(2.1)); return r; });
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), tN = E('导航'), kN = heavy(lt - E('识别') + .5), tR = E('环肽');
      const c = V(sm(-12, -3, kN), Math.sin(lt * 1.1) * .4 * (1 - kN), 0);
      this.lp.g.position.copy(c); this.lp.g.rotation.set(0, lt * .35 * (1 - kN), 0);
      this.lp.pose(lt, 0);
      this.mols.forEach((m, i) => { const d = this.dirs[i], a = .2 + i * .04;
        m.pose({ kt: pop(lt - a), kp: pop(lt - a - .2), kr: pop(lt - a - .5), w: lt + i, amp: .2 }).place(d.clone().multiplyScalar(4.8), d, i); });
      const M = W3.lib.MAT;
      M.rgd.emissiveIntensity = lt > tR ? .6 + (lt < tR + .8 ? (1 - (lt - tR) / .8) * 2 : 0) + beatPulse(lt, beat) * .8 : .5;
      M.rec.emissiveIntensity = lt > E('位点') ? .3 + beatPulse(lt, beat) * .6 : 0;
      const kz = ease((lt - tN + .2) / 1.5), kc = ease((lt - E('识别') - .2) / 1.1) * (1 - ease((lt - tN + .1) / 1.3));
      const tipW = this.mols[0].world(this.mols[0].tip);
      W.cam(V(sm(-1, 2, kz), sm(2.5, 1.5, kz), sm(46, 41, kz)).lerp(tipW.clone().add(V(-4.5, 3, 12)), kc), V(sm(-2, 1, kz), 0, 0).lerp(tipW, kc));
      const bound = tipW.distanceTo(this.recs[3].cupW) < 1.2;
      this.hud = { bound, k: clamp((lt - E('暴露') + .3) / 1.2) };
      W.bloom(.5 + .7 * flash(lt, tN));
      this.pts.tip = this.mols[0].world(this.mols[0].tip); this.pts.recs = this.recs.map(r => r.cupW); this.pts.c = c;
    },
  };

  W3.defs.apply = {
    build(g) { const { Mol } = L(); this.m = new Mol(g, 11); this.pts = {}; },
    update(lt, E, beat, W) {
      const { V } = L(), tC = E('协同'), kC = heavy(lt - tC), u = 1 - kC, b = i => Math.sin(lt * 1.8 + i) * .35 * u;
      const k0 = [0, .15, .3].map(d => pop(lt - d));
      const off = { d: V(b(0), -3.2 * u, 1.5 * u), p: V(b(1), 0, -1.2 * u), r: V(b(2), 3.2 * u, 1.5 * u) };
      this.m.pose({ kt: k0[0], kp: k0[1], kr: k0[2], w: lt, amp: .35, off }).place(V(-4.6, 4.1, 0), V(1, 0, 0), lt * .45);
      W3.lib.MAT.rgd.emissiveIntensity = .5 + (lt > tC ? beatPulse(lt, beat) * .6 : 0);
      W.cam(V(Math.sin(lt * .25) * 2, 1, 40), V(0, 0, 0));
      W.bloom(.5 + .7 * flash(lt, tC));
      const m = this.m; this.pts.parts = [m.world(V(0, -1.5, 0).add(off.d)), m.world(V(0, .95 + m.n * .4, 0).add(off.p)), m.world(m.tip.clone().add(off.r))];
    },
  };

  W3.defs.store = {
    build(g) { const { Lipo, Mol, fib } = L(); this.lp = new Lipo(g, 6); this.dirs = fib(16); this.mols = this.dirs.map(() => new Mol(this.lp.top, 5)); },
    update(lt, E, beat, W) {
      const { V } = L();
      this.lp.g.position.set(30, -16, -40); this.lp.g.rotation.set(.3, lt * .12, 0); this.lp.pose(lt + 5, 0);
      this.mols.forEach((m, i) => { const d = this.dirs[i]; m.pose({ w: lt + i, amp: .25 }).place(d.clone().multiplyScalar(6.3), d, i); });
      W.cam(V(0, 0, 40), V(0, 0, 0));
    },
  };

  W3.defs.outro = {
    build(g) { const { Mol, Lipo, fib } = L(); this.m = new Mol(g, 12); this.lp = new Lipo(g, 6); this.dirs = fib(16); this.ms = this.dirs.map(() => new Mol(this.lp.top, 5));
      this.far = [[-44, 19, -62, 5], [46, 21, -72, 5], [-50, -22, -80, 5], [48, -21, -70, 5]].map(([x, y, z, r]) => { const lp = new Lipo(g, r), ms = fib(12).map(() => new Mol(lp.top, 4)); lp.g.position.set(x, y, z); return { lp, ms }; }); },
    update(lt, E, beat, W) {
      const { V } = L(), k = heavy(lt);
      this.m.pose({ kt: k, kp: ease(lt / .9), kr: pop(lt - .6), w: lt, amp: .4 }).place(V(-4.1, 5.9, 0), V(1, 0, 0), lt * .5);
      W3.lib.MAT.rgd.emissiveIntensity = .5 + beatPulse(lt, beat) * .6;
      this.lp.g.position.set(-24, -8, -45); this.lp.g.rotation.y = lt * .1; this.lp.pose(lt + 5, 0);
      this.ms.forEach((m, i) => { const d = this.dirs[i]; m.pose({ w: lt + i, amp: .25 }).place(d.clone().multiplyScalar(6.3), d, i); });
      this.far.forEach(({ lp, ms }, j) => { lp.g.rotation.y = lt * .15 + j; lp.pose(lt + 5, 0); const ds = W3.lib.fib(12);
        ms.forEach((m, i) => m.pose({ w: lt + i, amp: .25 }).place(ds[i].clone().multiplyScalar(5.2), ds[i], i)); });
      const kb = ease((lt - 1.5) / 7);   // ending: drift back, more carriers come into view around the title
      W.cam(V(Math.sin(lt * .2) * 1.5, 0, 38 + kb * 14), V(0, 0, 0));
    },
  };
})();
