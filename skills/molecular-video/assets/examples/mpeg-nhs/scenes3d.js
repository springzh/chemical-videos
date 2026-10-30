// 3D content per scene for mPEG-NHS 5000 (keyed like SCENE_DEFS). build(g) once; update(lt, E, beat, W) every frame.
// Linear PEG family: Mol({ anchor: 'ome' }) = methoxy cap (C.a) + PEG beads (C.accent) + NHS ester ring (C.b).
// Each def exposes world points in this.pts for the SVG layer and its state in this.hud for the readout.
(function () {
  const L = () => W3.lib;
  const pop = SP.pop, heavy = SP.heavy;
  const sm = (a, b, k) => a + (b - a) * clamp(k), M3 = window.MODEL;
  // place a molecule so that its tip (NHS ring centre) sits `gap` units before point A, chain pointing along dir
  function aim(m, A, dir, gap, spin = 0, s = 1) {
    const { V } = L(); m.place(V(0, 0, 0), dir, spin, s); const tw = m.world(m.tip);
    return m.place(A.clone().sub(tw).addScaledVector(dir, -gap), dir, spin, s);
  }
  // lysines on a protein surface facing the given directions; returns [{ g, d, A (amine world) }]
  function lysines(parent, c, R, dirs) {
    const { V, lysine } = L();
    return dirs.map(d0 => { const d = d0.clone().normalize(), g = lysine(parent);
      g.position.copy(c).addScaledVector(d, R * .9); g.quaternion.setFromUnitVectors(V(0, 1, 0), d);
      return { g, d, A: c.clone().addScaledVector(d, R * .9 + 1.45) }; });
  }
  const capW = m => { m.g.updateWorldMatrix(true, true); return m.cap.getWorldPosition(new THREE.Vector3()); };

  // ---------- intro: protein with lysines, a PEG chain drifts in, "?" ----------
  W3.defs.intro = {
    build(g) {
      const { Mol, V, protein } = L();
      this.c = V(5, -.5, 0); this.prot = protein(g, 5, 3);
      this.prot.position.copy(this.c);
      this.lys = lysines(g, this.c, 5, [V(-1, .15, .25), V(-.6, .8, .3), V(-.5, -.8, .4), V(.1, .9, .6), V(.2, -.6, .9), V(-.7, .1, -.8)]);
      this.m = new Mol(g, 11, { anchor: 'ome' });
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), M = W3.lib.MAT, tJ = E('接到'), tT = E('今天');
      this.prot.rotation.y = Math.sin(lt * .3) * .05;
      const L0 = this.lys[0], dir = L0.d.clone().negate();
      const gap = sm(11, 2.2, ease((lt - .2) / (tT - .2))), k1 = pop(lt - .2);
      this.m.pose({ kt: k1, kp: ease((lt - .1) / 1.6), kr: pop(lt - 1.2), w: lt * 1.2, amp: .55 });
      aim(this.m, L0.A, dir, gap, lt * .3);
      M.amine.emissiveIntensity = lt > tJ ? .4 + beatPulse(lt, beat) * 1.2 : .3;
      M.rgd.emissiveIntensity = lt > E('蛋白质') ? .6 + beatPulse(lt, beat) * .8 : .5;
      // opening orbit close on the chain, then a wide two-shot; at 今天 the camera rises to leave room for the title
      const mid = this.m.world(this.m.tip).lerp(this.c, .35);
      const ko = ease(lt / 4.6), a0 = .9 * (1 - ko), r0 = sm(22, 34, ko);
      const p0 = V(mid.x + Math.sin(a0) * r0, 2 + 5 * (1 - ko), mid.z + Math.cos(a0) * r0);
      const kt = ease((lt - tT + .3) / 1.6);
      W.cam(p0.lerp(V(1.5 + Math.sin(lt * .2), -1, 40 + lt * .3), kt), mid.clone().lerp(V(1, -4.2, 0), kt));
      W.bloom(.5 + .5 * Math.exp(-Math.max(0, lt - E('蛋白质')) * 3) * (lt > E('蛋白质')));
      this.pts.q = this.m.world(this.m.tip).lerp(L0.A, .5).add(V(0, 3.2, 0)); this.pts.prot = this.c.clone().add(V(0, -6, 0));
      this.pts.chain = this.m.world(V(0, 4, 0));
    },
  };

  // ---------- 01 struct: methoxy (inert) – PEG114 – NHS ester (reactive) ----------
  W3.defs.struct = {
    build(g) { const { Mol, MAT, T } = L(); this.m = new Mol(g, 14, { anchor: 'ome' });
      this.ghost = new T.Mesh(W3.lib.GEO.amine, MAT.amine); g.add(this.ghost); this.pts = {}; },
    update(lt, E, beat, W) {
      const { V } = L(), M = W3.lib.MAT, tL = E('线性'), tM = E('甲氧基'), tA = E('活性酯'), tF = E('柔顺');
      const flex = Math.exp(-Math.max(0, lt - tF) * .6) * (lt > tF);
      const m = this.m.pose({ kt: pop(lt - tM), kp: ease((lt - tL + .3) / 1.8), kr: pop(lt - tA), w: lt * (1 + flex), amp: .35 + .55 * flex });
      m.place(V(-6.6, -3.2, 0), V(1, 0, 0), lt * .4);
      this.hud = { k: ease((lt - tL + .3) / 1.8) };
      M.dspe.emissiveIntensity = lt > tM && lt < tA ? .3 + beatPulse(lt, beat) * 1.1 : .25;
      M.rgd.emissiveIntensity = lt > tA ? .6 + beatPulse(lt, beat) * 1.3 : .5;
      // a free amine floats in when "专找氨基" is said; the ester head turns to it
      const tip = m.world(m.tip), kg = pop(lt - E('氨基'));
      this.ghost.position.copy(tip).add(V(2.6 + Math.sin(lt * 1.5) * .2, 1.6 + Math.cos(lt * 1.2) * .2, 0)); this.ghost.scale.setScalar(Math.max(.001, kg * (1 - ease((lt - tF) / .6))));
      M.amine.emissiveIntensity = .4 + beatPulse(lt, beat) * .8;
      // slow push; lean toward the methoxy end, then toward the ester head, back to the whole chain on 柔顺
      const k1 = ease((lt - tM + .5) / 1.2) * (1 - ease((lt - tA + 1) / 1.2)), k2 = ease((lt - tA + .4) / 1.2) * (1 - ease((lt - tF + .3) / 1.4));
      const base = V(Math.sin(lt * .2) * 2, 1.5 + Math.sin(lt * .13), 40 - lt * .3);
      const cp = base.clone().lerp(V(-5, 0, 25), k1).lerp(V(5.5, .5, 24), k2), look = V(0, -1.5, 0).lerp(V(-5, -3, 0), k1).lerp(V(5.5, -3, 0), k2);
      W.cam(cp, look);
      W.bloom(.5 + .6 * Math.exp(-Math.max(0, lt - tA) * 3) * (lt > tA));
      this.pts.seg = [m.world(V(0, -.2, 0)), m.world(V(0, .95 + m.n * .4, 0)), tip]; this.pts.ghost = this.ghost.position.clone();
    },
  };

  // ---------- 02 couple: NHS ester meets a lysine amine, amide bond grows, NHS leaves ----------
  W3.defs.couple = {
    build(g) {
      const { Mol, V, protein, bond } = L();
      this.c = V(8.5, -1.5, -2); this.prot = protein(g, 6, 7); this.prot.position.copy(this.c);
      this.lys = lysines(g, this.c, 6, [V(-1, .3, .35), V(-.6, .9, .2), V(-.7, -.8, .4), V(-.2, .5, 1), V(-.4, -.3, 1)]);
      this.m = new Mol(g, 9, { anchor: 'ome' }); this.b = bond(g); this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), M = W3.lib.MAT, tP = E('七到九'), tB = E('成键'), tR = E('释放'), tN = E('伯胺');
      const pH = sm(7, 8.5, ease((lt - tP + .2) / (E('赖氨酸') - tP + .8)));
      const L0 = this.lys[0], dir = L0.d.clone().negate(), kB = heavy(lt - tB);
      const gap = sm(11, 1.1, ease((lt - .3) / (tN - .1))) - .75 * kB;
      const kOff = heavy(lt - tB - .15), kFly = ease((lt - tR) / 1.6);
      const off = { r: V(1.2, .4, .8).multiplyScalar(kOff).add(V(3.5, 2.5, 3.5).multiplyScalar(kFly)) };
      this.m.pose({ kt: pop(lt), kp: pop(lt - .1), kr: 1 - ease((lt - tR - 2.4) / .8), w: lt * .9, amp: .4, kc: pop(lt - tB - .1), off });
      aim(this.m, L0.A, dir, gap, lt * .25 * (1 - kB));
      const cw = capW(this.m); W3.lib.setBond(this.b, cw, L0.A, kB * .9);
      M.amine.emissiveIntensity = .3 + 1.4 * clamp((pH - 7) / 1.5) * (lt > tP) * (lt < tB + .5 ? 1 : .4) + (lt > tN && lt < tB ? beatPulse(lt, beat) : 0);
      M.rgd.emissiveIntensity = lt > tR ? .5 + (1 - kFly) * 1.2 : .6 + beatPulse(lt, beat) * .5;
      this.hud = { pH, f: M3.fAmine(pH) };
      // medium → close on the reaction point (伯胺..释放) → pull back to watch NHS leave and the chain stay bound
      const A = L0.A, kc = ease((lt - tN + .6) / 1.2) * (1 - ease((lt - tR - .2) / 1.4)), kw = ease((lt - E('接上') + .3) / 1.6);
      const cp = V(-1 + Math.sin(lt * .2) * 1.5, 3, 36 - lt * .3).lerp(A.clone().add(V(-2.5, 2.5, 19)), kc).lerp(V(2, 4, 40), kw);
      W.cam(cp, V(1, 0, 0).lerp(A.clone().add(V(2.6, -1.2, 0)), kc).lerp(V(4, 0, 0), kw));
      W.bloom(.5 + .8 * Math.exp(-Math.max(0, lt - tB) * 3) * (lt > tB));
      this.pts.A = A.clone(); this.pts.nhs = this.m.world(this.m.tip.clone().add(off.r)); this.pts.bond = cw.clone().lerp(A, .5);
      this.pts.prot = this.c.clone().add(V(0, -7.4, 0)); this.pts.lys = L0.g.position.clone();
    },
  };

  // ---------- 03 race: water attacks some esters (→ grey COOH), others reach amines first ----------
  W3.defs.race = {
    build(g) {
      const { Mol, V, protein, bond, Waters } = L();
      this.c = V(9, 0, -1); this.prot = protein(g, 5.2, 11); this.prot.position.copy(this.c);
      const ys = [-.8, -.5, -.18, .16, .48, .8];
      this.lys = lysines(g, this.c, 5.2, ys.map((y, i) => V(-1, y, i % 2 ? .35 : -.2)));
      this.ms = ys.map(() => new Mol(g, 7, { anchor: 'ome', own: true }));
      this.bs = ys.map(() => bond(g));
      this.lose = [0, 2, 5]; this.w = new Waters(g, 70);
      const r = rnd(41); this.ws = [...Array(70)].map(() => [r() * 22 - 17, r() * 15 - 7.5, r() * 10 - 6, r() * 6, .5 + r()]);
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), M = W3.lib.MAT, tH = E('水解'), tF = E('越快'), tW = E('谁先到');
      const pH = sm(7.5, 9, ease((lt - tF + .4) / 1.4)), speed = 1 + 1.5 * clamp((pH - 7.5) / 1.5);
      const tA = [tH, tH + .6, tF + .3];   // water reaches loser j at tA[j]
      const tips = [];
      this.ms.forEach((m, i) => {
        const L0 = this.lys[i], dir = L0.d.clone().negate(), j = this.lose.indexOf(i), loser = j >= 0;
        let gap, grey = 0, kc = 0, off = {}, kr = 1;
        const kIn = pop(lt - .1 - i * .08);
        if (!loser) { const kb = heavy(lt - tW - i * .05); gap = sm(9, 1.1, ease((lt - .3) / (tW - .2))) - .75 * kb; kc = pop(lt - tW - .1 - i * .05);
          off.r = V(1.4, .5, .9).multiplyScalar(kb).add(V(3, 3, 3).multiplyScalar(ease((lt - tW - .6) / 1.4))); kr = 1 - ease((lt - tW - 1.6) / .6); }
        else { const at = tA[j], kh = ease((lt - at) / .6); grey = kh; kc = pop(lt - at - .15);
          off.r = V(1.6, 1.2, 1).multiplyScalar(ease((lt - at) / 1.4)); kr = 1 - ease((lt - at - .8) / .8);
          gap = sm(9, 4.2, ease((lt - .3) / (tH - .1))) + 2.2 * ease((lt - at - .2) / 2); }
        m.pose({ kt: kIn, kp: kIn, kr: kIn * kr, w: lt * 1.1 + i, amp: .4, kc, grey, off, glow: (!loser && lt > tW - 1 && lt < tW) ? beatPulse(lt, beat) : 0 });
        aim(m, L0.A, dir, gap, lt * .3 + i, .85);
        if (!loser) W3.lib.setBond(this.bs[i], capW(m), L0.A, heavy(lt - tW - i * .05) * .85); else this.bs[i].scale.setScalar(.001);
        tips[i] = m.world(m.tip);
      });
      // waters: drift (faster as pH rises); three of them dive into the loser esters and are consumed
      this.w.pose(i => { const [x, y, z, ph, s] = this.ws[i], tt = lt * speed;
        let p = V(x + Math.sin(tt * .7 + ph) * 1.2, y + Math.cos(tt * .6 + ph) * 1.0, z + Math.sin(tt * .5 + ph * 2) * .8), sc = s * pop(lt - .2 - i * .01);
        const j = i < 3 ? i : -1;
        if (j >= 0) { const at = tA[j], k = ease((lt - at + .9) / .9); p = p.lerp(tips[this.lose[j]], k); sc *= 1.3 * (1 - clamp((lt - at) / .25)); }
        return { p, s: sc, a: tt + ph }; });
      M.amine.emissiveIntensity = .4 + (lt > tW ? beatPulse(lt, beat) * 1.2 : .3);
      this.hud = { pH, half: M3.nhsHalf(pH), f: M3.fAmine(pH), lost: tA.filter(a => lt > a).length, won: lt > tW + .3 ? 3 : 0 };
      const l0 = tips[0], kz = ease((lt - tH + .8) / 1.2) * (1 - ease((lt - tF + .6) / 1.2)), kw = ease((lt - tW + .6) / 1.4);
      const cp = V(-1 + Math.sin(lt * .2) * 2, 2, 42 - lt * .25).lerp(l0.clone().add(V(-2, 3.5, 15)), kz).lerp(V(5, 3, 40), kw);
      W.cam(cp, V(1, -.5, 0).lerp(l0, kz).lerp(V(7, -1, 0), kw));
      W.bloom(.5 + .8 * Math.exp(-Math.max(0, lt - tW) * 3) * (lt > tW));
      this.pts.lose = this.lose.map(i => tips[i]); this.pts.win = tips[3]; this.pts.prot = this.c.clone().add(V(0, -6.6, 0));
    },
  };

  // ---------- 04 pegyl: chains on a protein, hydration layer, foreign protein bounces off, drifts away (circulation) ----------
  W3.defs.pegyl = {
    build(g) {
      const { Mol, V, protein, fib, MAT, T, Waters } = L();
      this.root = new T.Group(); g.add(this.root);
      this.prot = protein(this.root, 4.2, 5);
      this.dirs = fib(12); this.ms = this.dirs.map(() => new Mol(this.root, 8, { anchor: 'ome' }));
      this.shell = new T.Mesh(new T.SphereGeometry(1, 48, 32), MAT.shell); this.root.add(this.shell);
      this.w = new Waters(this.root, 60); this.wd = fib(60);
      this.other = protein(g, 2, 13, MAT.prot2); this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), M = W3.lib.MAT, tH = E('水合层'), tA = E('吸附'), tC = E('循环');
      const drift = ease((lt - tC + .2) / 2.2);
      this.root.position.set(sm(0, -3, drift), Math.sin(lt * .8) * .3, 0); this.root.rotation.set(.2, lt * .15, 0);
      this.ms.forEach((m, i) => { const d = this.dirs[i], k = pop(lt - .1 - i * .07);
        m.pose({ kt: k, kp: k, kr: 0, kc: k, w: lt * 1.1 + i, amp: .9, spf: .55 });
        // the amide end sits on the protein surface, methoxy end points out
        const len = .95 + 8 * .8 * .55 + .72; m.place(d.clone().multiplyScalar(4.2 + len), d.clone().negate(), i, 1); });
      const kH = SP.card(lt - tH); this.shell.scale.setScalar(Math.max(.001, 9.6 * kH)); this.shell.visible = kH > .01;
      M.shell.opacity = .09 * clamp(kH) + .04 * beatPulse(lt, beat) * (kH > .5);
      this.w.pose(i => { const d = this.wd[i], k = pop(lt - tH - .1 - i * .01), r = 10.2 + Math.sin(lt * 1.3 + i) * .4;
        return { p: d.clone().multiplyScalar(r), s: k * .9, a: lt + i }; });
      // a foreign protein comes in and is pushed back by the PEG layer (non-specific adsorption ↓)
      const app = ease((lt - tA + 1.3) / 1.2), back = SP.card(lt - tA);
      const P = V(sm(19, 11.2, app) + back * 5, sm(10, 6.5, app) + back * 3, 2);
      this.other.position.copy(P); this.other.rotation.set(lt * .5, lt * .7, 0); this.other.visible = lt > tA - 1.3 && lt < tC + 1.5;
      this.other.scale.setScalar(Math.max(.001, 1 - ease((lt - tC) / 1)));
      this.hud = { n: this.ms.filter((_, i) => lt > .1 + i * .07 + .2).length };
      W.cam(V(Math.sin(lt * .2) * 2, 2.5, 60 - lt * .3 + drift * 8), V(1.5, -1, 0));
      W.bloom(.5 + .6 * Math.exp(-Math.max(0, lt - tC) * 3) * (lt > tC));
      this.pts.other = P.clone(); this.pts.shell = this.root.position.clone().add(V(-6.5, 7.2, 0)); this.pts.root = this.root.position.clone();
    },
  };

  // ---------- 05 store: vial frosts at −20 °C, cap seals, argon fills; warm before opening ----------
  W3.defs.store = {
    build(g) {
      const { vial, MAT, T, V } = L();
      this.v = vial(g, 51); this.v.position.set(0, -1, 0);
      const r = rnd(77), n = 140;
      this.frost = new T.InstancedMesh(new T.SphereGeometry(.12, 6, 4), MAT.frost, n); this.frost.frustumCulled = false; this.v.add(this.frost);
      this.fs = [...Array(n)].map(() => [r() * Math.PI * 2, r() * 7.6 - 3.6, .6 + r() * .9, r()]);
      this.ar = new T.InstancedMesh(new T.SphereGeometry(.16, 8, 6), MAT.argon, 60); this.ar.frustumCulled = false; this.v.add(this.ar);
      this.as = [...Array(60)].map(() => [r() * Math.PI * 2, Math.sqrt(r()) * 2.2, r() * 5 - 1.2, r() * 6]);
      this.drops = [...Array(6)].map(() => { const m = new T.Mesh(new T.SphereGeometry(.3, 16, 12), MAT.water); g.add(m); return m; });
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V, T } = L(), tC = E('零下二十度'), tD = E('干燥'), tS = E('密封'), tG = E('惰性气体'), tR = E('室温'), tM = E('吸潮');
      const v = this.v; v.rotation.y = lt * .25;
      // cap: off at the start, screws down on 密封, lifts again after the vial is back at room temperature
      const kS = heavy(lt - tS + .3), kO = ease((lt - tR - 1.2) / 1.2);
      v.cap.position.y = 4.9 + 2.6 * (1 - kS) + 2.2 * kO; v.cap.rotation.y = (1 - kS) * 4 + kO * 2.5; v.cap.position.x = 1.4 * kO;
      // frost grows on 零下二十度, melts on 室温
      const mm = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), melt = ease((lt - tR) / 1.6);
      this.fs.forEach(([a, y, sz, ph], i) => { const k = pop(lt - tC - ph * .8) * (1 - melt);
        s.setScalar(Math.max(.001, k * sz)); mm.compose(V(Math.cos(a) * 2.68, y, Math.sin(a) * 2.68), q, s); this.frost.setMatrixAt(i, mm); });
      this.frost.instanceMatrix.needsUpdate = true;
      this.ar.count = 60; this.as.forEach(([a, r, y, ph], i) => { const k = pop(lt - tG - i * .015) * (1 - kO);
        s.setScalar(Math.max(.001, k)); mm.compose(V(Math.cos(a + lt * .3) * r, y + Math.sin(lt + ph) * .2, Math.sin(a + lt * .3) * r), q, s); this.ar.setMatrixAt(i, mm); });
      this.ar.instanceMatrix.needsUpdate = true;
      // 干燥: droplets fly at the sealed vial and bounce away; 吸潮 (warning): droplets head for the open neck
      this.drops.forEach((d, i) => {
        const a = i / 6 * Math.PI * 2, k = ease((lt - tD + .2 - i * .05) / .8), b = SP.card(lt - tD - .6 - i * .05);
        let p = V(Math.cos(a) * sm(11, 3.4, k), sm(6, 1, k) + Math.sin(a) * 2, Math.sin(a) * sm(11, 3.4, k)).add(V(Math.cos(a), .4, Math.sin(a)).multiplyScalar(b * 7));
        let sc = k * (1 - ease((lt - tD - 1.4) / .5));
        const km = ease((lt - tM + .6) / 1.2);
        if (lt > tM - .6) { p = V(Math.cos(a) * 5 * (1 - km) + Math.cos(a) * .6, sm(9, 4.6, km), Math.sin(a) * 5 * (1 - km)); sc = km * (1 - ease((lt - tM - 2) / .5)); }
        d.position.copy(p); d.scale.setScalar(Math.max(.001, sc)); });
      this.hud = { cold: lt > tC - .3 && lt < tM - .3, wet: lt > tM - .3 };
      W.cam(V(Math.sin(lt * .18) * 6, 4.5 + Math.sin(lt * .2), 37 - lt * .2), V(0, .6, 0));
      W.bloom(.5 + .5 * Math.exp(-Math.max(0, lt - tS) * 3) * (lt > tS));
      v.updateWorldMatrix(true, true);
      this.pts.cap = v.cap.getWorldPosition(V()).add(V(0, 1, 0)); this.pts.body = v.localToWorld(V(2.7, 0, 0)); this.pts.neck = V(0, 4.8, 0);
    },
  };

  // ---------- outro: the molecule above the title, PEGylated proteins in the corners ----------
  W3.defs.outro = {
    build(g) {
      const { Mol, protein, fib } = L();
      this.m = new Mol(g, 13, { anchor: 'ome' });
      this.far = [[-40, 18, -60], [42, 19, -66], [-46, -21, -74], [44, -20, -64]].map(([x, y, z], j) => {
        const pr = protein(g, 3, 20 + j), ds = fib(9), ms = ds.map(() => new Mol(pr, 6, { anchor: 'ome' })); pr.position.set(x, y, z); return { pr, ds, ms }; });
    },
    update(lt, E, beat, W) {
      const { V } = L(), k = heavy(lt);
      this.m.pose({ kt: k, kp: ease(lt / .9), kr: pop(lt - .6), w: lt, amp: .4 }).place(V(-6, 6.4, 0), V(1, 0, 0), lt * .5);
      W3.lib.MAT.rgd.emissiveIntensity = .5 + beatPulse(lt, beat) * .6;
      this.far.forEach(({ pr, ds, ms }, j) => { pr.rotation.y = lt * .15 + j;
        ms.forEach((m, i) => { const d = ds[i]; m.pose({ kr: 0, kc: 1, w: lt + i, amp: .8, spf: .55 }).place(d.clone().multiplyScalar(3 + 4.3), d.clone().negate(), i); }); });
      const kb = ease((lt - 1.5) / 7);
      W.cam(V(Math.sin(lt * .2) * 1.5, 0, 38 + kb * 14), V(0, 0, 0));
    },
  };
})();
