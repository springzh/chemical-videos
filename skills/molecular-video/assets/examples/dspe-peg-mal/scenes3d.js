// 3D content per scene (keyed like SCENE_DEFS). build(g, W) once; update(lt, E, beat, W) every frame.
// Each def may expose world points in this.pts for the SVG layer to pin labels to (W3.stage(lay, p)).
// DSPE-PEG2000-Maleimide: every Mol carries the atomic maleimide head ('mal').
(function () {
  W3.molHead = 'mal';
  const L = () => W3.lib;
  const pop = SP.pop, heavy = SP.heavy;
  const sm = (a, b, k) => a + (b - a) * clamp(k), M3 = window.MODEL;
  // where a partner's sulfur sits when it has added to the maleimide C3 (local "above" the ring along the molecule axis)
  const sulfurAt = (m, d) => m.atom('C3').addScaledVector(d, .95);

  W3.defs.intro = {
    build(g) {
      const { Lipo, Mol, Pep, protein, bond, fib, V, T } = L();
      this.lp = new Lipo(g, 5.5);
      this.dirs = fib(20); this.mols = this.dirs.map(() => new Mol(this.lp.top, 5));
      // partners go to the four heads that face the camera when they arrive (liposome yaw at lt ≈ 4.5 is 0.81 rad)
      const a = .81, zf = d => -d.x * Math.sin(a) + d.z * Math.cos(a);
      this.pick = this.dirs.map((d, i) => [zf(d) - Math.abs(d.y) * .3, i]).sort((p, q) => q[0] - p[0]).slice(0, 4).map(p => p[1]);
      this.peps = [0, 1, 2].map(() => new Pep(this.lp.top, 5));
      this.ab = protein(this.lp.top, 1.15, 7, L().MAT.prot2);
      this.bonds = [0, 1, 2, 3].map(() => bond(this.lp.top));
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V } = L(), tA = E('答案'), tP = E('多肽'), tN = E('牢牢'), tL = E('脂质体'), drift = ease((lt - tA) / 3) * 1.5;
      const c = V(-8 + drift, 0, 0);
      this.lp.g.position.copy(c); this.lp.g.rotation.set(.2, lt * .18, 0);
      this.lp.pose(lt, 0);
      const sat = j => ease((lt - tN - .9 - j * .35) / .5);
      this.mols.forEach((m, i) => { const at = .9 + i * .04, d = this.dirs[i], j = this.pick.indexOf(i);
        m.pose({ kt: pop(lt - at), kp: ease((lt - at - .1) / .6), kr: pop(lt - at - .6), w: lt + i, amp: .25, sat: j < 0 ? 0 : sat(j) }).place(d.clone().multiplyScalar(5.8), d, i); });
      // partners fly in from far out along each head's direction and add across the C=C (local frame of lp.top)
      const top = this.lp.top, loc = p => top.worldToLocal(p);
      this.pick.forEach((i, j) => {
        const m = this.mols[i], d = this.dirs[i], C3 = loc(m.atom('C3')), S = C3.clone().addScaledVector(d, .95);
        const kIn = ease((lt - tN + .4 - j * .35) / 1.3), far = S.clone().addScaledVector(d, 15).add(V(0, 3 - j * 2, 0));
        const p = far.lerp(S, kIn), kv = pop(lt - tP - j * .25), kb = ease((lt - tN - .85 - j * .35) / .45);
        if (j < 3) this.peps[j].pose(p, d, lt * 2 + j, kv);
        else { this.ab.position.copy(p.clone().addScaledVector(d, 1.1)); this.ab.scale.setScalar(Math.max(.001, kv)); this.ab.rotation.set(lt * .5, lt * .3, 0); }
        L().setBond(this.bonds[j], C3, C3.clone().lerp(p, kb), kb * .8);
      });
      L().MAT.malCC.emissiveIntensity = .9 + beatPulse(lt, beat) * .8;
      const kz = ease((lt - tA + .6) / 1.6);
      const ko = ease(lt / 4.6), a0 = 1.1 * (1 - ko), r0 = sm(17, 33, ko);   // opening: orbit in close while the liposome assembles
      const p0 = V(c.x + 2 + Math.sin(a0) * r0, 3 + 5 * (1 - ko), Math.cos(a0) * r0);
      W.cam(p0.lerp(V(-2, 2, 52), kz), c.clone().lerp(V(-4, -5.5, 0), kz));
      W.bloom(.5 + .6 * Math.exp(-Math.max(0, lt - tA) * 3) * (lt > tA) + .4 * Math.exp(-Math.max(0, lt - tN - 1) * 3) * (lt > tN + 1));
      const w = p => top.localToWorld(p.clone());
      this.pts.lab = c.clone().add(V(0, -8.5, 0)); this.pts.c = c.clone();
      this.pts.pep = this.peps[0].S.getWorldPosition(V()); this.pts.ab = this.ab.getWorldPosition(V());
    },
  };

  W3.defs.struct = {
    build(g) { const { Mol } = L(); this.m = new Mol(g, 12); this.pts = {}; },
    update(lt, E, beat, W) {
      const { V } = L(), cue = [E('疏水'), E('亲水'), E('末端')], tR = E('反应基团');
      const m = this.m.pose({ kt: pop(lt - cue[0]), kp: ease((lt - cue[1]) / (cue[2] - cue[1])), kr: pop(lt - cue[2] - .3), w: lt * .6, amp: .4 });
      m.place(V(-4.4, -4.6, 0), V(1, 0, 0), lt * .3);
      L().MAT.malCC.emissiveIntensity = lt > tR ? 1 + beatPulse(lt, beat) * 1.6 : .9;
      L().MAT.rgd.emissiveIntensity = lt > cue[2] ? .5 + beatPulse(lt, beat) * .5 : .5;
      const tip = m.world(m.tip), kz = ease((lt - tR + .4) / 1.5) * .5;
      W.cam(V(Math.sin(lt * .2) * 2.5, 1.5 + Math.sin(lt * .13) * 1.2, 41 - lt * .35).lerp(tip.clone().add(V(-3, 2.5, 14)), kz), V(0, 0, 0).lerp(tip.clone().add(V(0, 2.2, 0)), kz));
      W.bloom(.5 + .5 * Math.exp(-Math.max(0, lt - tR) * 3) * (lt > tR));
      this.pts.seg = [m.world(V(0, -1.6, 0)), m.world(V(0, .95 + m.n * .4, 0)), tip]; this.pts.cc = m.atom('cc');
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
      this.sec.position.z = zc; this.sec.visible = kc > .01; L().MAT.section.opacity = .85 * clamp(kc * 1.4);
      this.hud = { depth: M3.tail() * clamp(kIn), anchored: 1 * (kIn > .9) + (heavy(lt - tF - .2) > .9) + (heavy(lt - tF - .35) > .9), cut: kc };
      const k1 = pop(lt - .25), tg = lt > E('两条') && lt < tIn + .5;
      this.m.pose({ kt: k1, kp: k1, kr: k1, w: lt, amp: .3, tl: .72 }).place(V(0, sm(13, .3, kIn) + (1 - k1) * 3, 2.1), V(0, 1, 0), lt * .4);
      L().MAT.dspe.emissiveIntensity = tg ? .3 + beatPulse(lt, beat) * 1.2 : .25;
      this.side.forEach((m, j) => { const at = tF + .2 + j * .15, k = heavy(lt - at), kv = pop(lt - at + .35);
        m.pose({ kt: kv, kp: kv, kr: kv, w: lt + j * 2, amp: .3, tl: .72 }).place(V([-8, 8][j], sm(13, .3, k), 2.1), V(0, 1, 0), lt * .4 + j); });
      const z1 = ease((lt - tB + .7) / 1.5), z2 = ease((lt - tF + .3) / 1.6);   // dive into the section, then pull back for all three
      const cp = V(Math.sin(lt * .15) * 3, 13, 44 - lt * .3).lerp(V(4.5, .2, 17), z1).lerp(V(-2, 4.5, 31), z2);
      W.cam(cp, V(0, 2.5, 0).lerp(V(.8, -1.4, 2), z1).lerp(V(0, -.2, 2), z2));
      W.bloom(.5 + .6 * Math.exp(-Math.max(0, lt - tF) * 3) * (lt > tF));
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
      const { V, T } = L(), tH = E('水合层'), kH = SP.card(lt - tH), tS = E('伸展'), t0 = tS - 1.2;
      // mol % sweeps 1 → 8 from just before 伸展 to 水合层; the model decides mushroom vs brush and the layer thickness
      const x = sm(1, 8, ease((lt - t0) / (tH - t0))), PG = M3.peg(x), kS = clamp((M3.RF / PG.D - .43) / .77);
      const nVis = Math.max(5, Math.round(this.mols.length * x / 8));
      this.lp.pose(lt, 0, { sweep: .3 });
      this.mols.forEach((m, i) => { const at = i < 5 ? .2 + i * .02 : t0 + (i - 5) / (this.mols.length - 5) * (tH - t0), d = this.dirs[i];
        m.pose({ kt: pop(lt - at), kp: pop(lt - at - .1), kr: pop(lt - at - .3), w: lt * .9 + i * .7, amp: sm(1.2, .3, kS), spf: sm(.36, 1, kS), tl: .7 })
          .place(d.clone().multiplyScalar(24.3), d, i); });
      this.hud = { ...PG, x, n: nVis };
      this.shell.scale.setScalar(24 + 12 * kH); this.shell.visible = kH > .01; L().MAT.shell.opacity = .1 * clamp(kH) + .03 * beatPulse(lt, beat) * (kH > .5);
      const mm = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3();
      this.wseed.forEach(([a, th, r, ph], i) => { const k = pop(lt - tH - .2 - i * .008), t2 = th + Math.sin(lt * .5 + ph) * .02, aa = a + lt * .05;
        const p = V(Math.sin(t2) * Math.cos(aa), Math.cos(t2), Math.sin(t2) * Math.sin(aa)).multiplyScalar(r + Math.sin(lt * 1.3 + ph) * .3);
        s.setScalar(Math.max(.001, k)); mm.compose(p, q, s); this.water.setMatrixAt(i, mm); });
      this.water.instanceMatrix.needsUpdate = true;
      const tA = E('团聚'), app = ease((lt - tA + 1.2) / 1.2), back = SP.card(lt - tA);
      const P = V(sm(15, 7, app) + back * 4, sm(12, 8, app) + back * 2.5, 3);
      this.np.position.copy(P); this.np.rotation.set(lt * .4, lt * .6, 0); this.np.visible = lt > tA - 1.2;
      const kz = ease((lt - tS + .4) / (tH - tS + .8));   // close on a few coils, pull back as the brush forms
      W.cam(V(5, 6, 21).lerp(V(Math.sin(lt * .2) * 2, 15, 50 - lt * .3), kz), V(1, 2.5, 0).lerp(V(0, 5, 0), kz));
      this.pts.np = P.clone().add(V(-2.5, -2.5, 0)); this.pts.top = V(0, 15, 0);
    },
  };

  // 04 coupling: a Cys peptide adds across the maleimide C=C (Michael addition) → thioether; then the assembled surface is decorated
  W3.defs.couple = {
    build(g) {
      const { Lipo, Mol, Pep, V, fib, protein, bond, MAT } = L();
      this.lp = new Lipo(g, 24, { cap: 30, core: false }); this.lp.g.position.set(0, -24, 0);
      this.dirs = [V(0, 1, 0), ...fib(12, V(0, 1, 0), 21).filter(d => d.y < .993)];
      this.mols = this.dirs.map(() => new Mol(this.lp.top, 8));
      this.pep = new Pep(g, 6); this.b0 = bond(g);
      // later partners: 5 peptides, 2 antibody-fragment stand-ins, on heads spread over the patch (front ones first)
      const order = this.dirs.map((d, i) => [d.z + d.x * .2, i]).filter(p => p[1] > 0).sort((a, b) => b[0] - a[0]).map(p => p[1]);
      this.later = order.slice(0, 7).map((i, j) => ({ i, kind: j < 5 ? 'pep' : 'ab', obj: j < 5 ? new Pep(g, 5) : protein(g, 1.25, 11 + j, MAT.prot2), b: bond(g) }));
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V, MAT, setBond } = L();
      const tQ = E('巯基'), tC = E('半胱氨酸'), tM = E('迈克尔加成'), tS = E('硫醚键'), tG = E('先组装'), tAb = E('抗体片段');
      this.lp.pose(lt + 5, 0);
      const satC = ease((lt - tM - .25) / .6);
      const sats = this.later.map((o, j) => ease((lt - (o.kind === 'pep' ? tG + .3 + j * .32 + .8 : tAb - .5 + (j - 5) * .4 + .8)) / .4));
      this.mols.forEach((m, i) => { const d = this.dirs[i], j = this.later.findIndex(o => o.i === i);
        m.pose({ w: i ? lt * .8 + i : lt * .25, amp: i ? .25 : .12, spf: 1, sat: i ? (j < 0 ? 0 : sats[j]) : satC }).place(d.clone().multiplyScalar(24.3), d, i ? i * 1.3 : 0); });
      // the hero reaction on the centre molecule
      const m0 = this.mols[0], C3 = m0.atom('C3'), C4 = m0.atom('C4'), S = C3.clone().add(V(.3, .9, .25));
      const kA = ease((lt - tQ) / (tM - .5 - tQ)), kS = heavy(lt - tM + .45);
      const pS = V(10, 17, 3).lerp(S.clone().add(V(1.6, 2.4, .8)), kA).lerp(S, kS);
      const hp = pS.clone().add(V(-.5, .25, .25)).lerp(C4.clone().add(V(-.2, .42, .1)), ease((lt - tM) / .5));
      this.pep.pose(pS, V(.5, 1, .3), lt * 1.5, pop(lt - tQ + .1), hp);
      const kb = ease((lt - tM - .1) / .5); setBond(this.b0, C3, C3.clone().lerp(pS, kb), kb);
      MAT.malCC.emissiveIntensity = lt > tQ && lt < tM + .5 ? 1.2 + beatPulse(lt, beat) * 1.5 : .9;
      MAT.S.emissiveIntensity = lt > tC ? .8 + beatPulse(lt, beat) * .8 : .6;
      // assemble first, couple later: the rest of the surface gets peptides and antibody fragments
      this.later.forEach((o, j) => {
        const m = this.mols[o.i], d = this.dirs[o.i], C3j = m.atom('C3'), at = o.kind === 'pep' ? tG + .3 + j * .32 : tAb - .5 + (j - 5) * .4;
        const end = C3j.clone().addScaledVector(d, o.kind === 'pep' ? .95 : 2.1), k = heavy(lt - at - .2), p = end.clone().addScaledVector(d, 11 * (1 - k)).add(V(3 * (1 - k), 0, 0));
        if (o.kind === 'pep') o.obj.pose(p, d, lt * 2 + j, pop(lt - at));
        else { o.obj.position.copy(p); o.obj.scale.setScalar(Math.max(.001, pop(lt - at))); o.obj.rotation.set(lt * .4 + j, lt * .3, 0); }
        const kb2 = ease((lt - at - .8) / .4), bEnd = o.kind === 'pep' ? p : p.clone().addScaledVector(d, -1.15);
        setBond(o.b, C3j, C3j.clone().lerp(bEnd, kb2), kb2 * .8);
      });
      // camera: wide → close on the C=C while the thiol arrives and adds → pull back for the assembled surface
      const cc = m0.atom('cc'), kin = ease((lt - tC + .5) / 1.4), kout = ease((lt - tG + .3) / 1.6);
      const wide = V(Math.sin(lt * .2) * 2, 12, 40 - lt * .2), close = cc.clone().add(V(-3.4, 1.8, 10.5)), wide2 = V(Math.sin(lt * .2) * 3, 15, 47);
      W.cam(wide.lerp(close, kin).lerp(wide2, kout), V(0, 5, 0).lerp(cc.clone().add(V(.4, .5, 0)), kin).lerp(V(0, 6, 0), kout));
      W.bloom(.5 + .8 * Math.exp(-Math.max(0, lt - tM - .3) * 3) * (lt > tM + .3) + .5 * Math.exp(-Math.max(0, lt - tS) * 3) * (lt > tS));
      this.hud = { coupled: (satC > .5) + sats.filter(s => s > .5).length, total: this.mols.length };
      this.pts.cc = cc; this.pts.S = pS.clone(); this.pts.bond = C3.clone().lerp(pS, .5);
      this.pts.pep2 = this.later[1].obj.S ? this.later[1].obj.S.getWorldPosition(V()) : cc; this.pts.ab = this.later[5].obj.getWorldPosition(V());
    },
  };

  // 05 pH window: inside 6.5–7.5 only the thiol adds; above 7.5 water opens the rings and a lysine amine adds (side reaction)
  W3.defs.ph = {
    build(g) {
      const { Bilayer, Mol, Pep, Waters, protein, lysine, bond, V, T } = L();
      this.B = new Bilayer(g, 26, 10); this.xs = [-8, -4, 0, 4, 8];
      this.mols = this.xs.map(() => new Mol(g, 6, { own: true }));
      this.pep = new Pep(g, 5); this.b0 = bond(g);
      this.W = new Waters(g, 40); const r = rnd(23); this.ws = [...Array(40)].map(() => [r() * 30 - 15, r() * 9 + 1, r() * 10 - 6, r() * 6]);
      this.protMat = new T.MeshPhysicalMaterial({ color: 0x7FD1A8, roughness: .35, clearcoat: .6, emissive: 0x0f3a28, emissiveIntensity: .3 });
      this.prot = protein(g, 2.2, 5, this.protMat); this.lys = lysine(this.prot);
      this.lys.position.set(-2.1, -.2, 0); this.lys.quaternion.setFromUnitVectors(V(0, 1, 0), V(-1, -.15, 0).normalize());
      this.bad = new T.MeshBasicMaterial({ color: 0xFF8A8A }); this.b1 = new T.Mesh(L().GEO.bondFat, this.bad); this.b1.scale.setScalar(.001); g.add(this.b1);
      this.pts = {};
    },
    pH(lt, E) { const tW = E('窗口'), tH = E('高于'), tO = E('开环水解');
      return lt < tH - .3 ? sm(6.5, 7.0, ease(lt / tW)) : sm(7.0, 8.5, ease((lt - tH + .3) / (tO - tH + .6))); },
    update(lt, E, beat, W) {
      const { V, MAT, setBond } = L(), tW = E('窗口'), tK = E('只认'), tO = E('开环水解'), tA = E('氨基'), tD = E('下降');
      const pH = this.pH(lt, E);
      this.B.pose(lt + 5, 0);
      const open = [0, ease((lt - tO - .2) / .7), ease((lt - tO - .5) / .7), ease((lt - tO - .8) / .7), 0];
      const grey = [0, open[1], open[2], open[3], ease((lt - tA - .4) / .6) * .6];
      const satP = ease((lt - tK - .5) / .5), satA = ease((lt - tA - .3) / .5);
      this.mols.forEach((m, i) => m.pose({ w: lt * .7 + i * 1.3, amp: .18, tl: .72, open: open[i], grey: grey[i], sat: i === 0 ? satP : i === 4 ? satA : 0 })
        .place(V(this.xs[i], .3, 0), V(0, 1, 0), 0));
      // thiol peptide couples to molecule 0 inside the window
      const m0 = this.mols[0], C3 = m0.atom('C3'), S = C3.clone().add(V(.25, .9, .2)), kp = heavy(lt - tW + .3);
      const pS = S.clone().add(V(-6 * (1 - kp), 7 * (1 - kp), 2 * (1 - kp)));
      this.pep.pose(pS, V(-.4, 1, .2), lt * 1.6, pop(lt - tW + .9));
      const kb = ease((lt - tK - .3) / .45); setBond(this.b0, C3, C3.clone().lerp(pS, kb), kb);
      // hydrolysis: three waters dive at the C2=O of molecules 1–3
      this.W.pose(i => { const [x, y, z, ph] = this.ws[i]; let p = V(x + Math.sin(lt * .6 + ph) * .8, y + Math.sin(lt * .9 + ph) * .5, z);
        if (i < 3) { const m = this.mols[i + 1], tg = m.atom('C2').add(V(.5, .2, .5)), k = ease((lt - tO + .6 + i * .3) / .8); p = p.lerp(tg, k); }
        return { p, s: pop(lt - .2 - i * .02), a: lt * .7 + ph }; });
      // side reaction: a protein's lysine amine adds to molecule 4 once the pH has climbed
      const m4 = this.mols[4], C34 = m4.atom('C3'), kP = heavy(lt - E('高于') - .4);
      this.prot.position.set(sm(24, 12.6, kP), 7.9 + Math.sin(lt * .8) * .2 * (1 - kP), .8); this.prot.rotation.set(0, 0, 0);
      const N = this.lys.N.getWorldPosition(V()), kb1 = ease((lt - tA - .2) / .45);
      if (kb1 > .002) setBond(this.b1, C34, C34.clone().lerp(N, kb1), kb1 * .9); else this.b1.scale.setScalar(.001);
      MAT.amine.emissiveIntensity = lt > tA ? .5 + beatPulse(lt, beat) * 1.2 : .3;
      MAT.malCC.emissiveIntensity = .9;
      // camera: slow orbit, lean in on the opened rings, back out for the side reaction
      const ko = ease((lt - tO + .5) / 1.2) * (1 - ease((lt - tA + .4) / 1.2));
      const base = V(Math.sin(lt * .15) * 4 - 1, 10, 36 - lt * .3), near = this.mols[2].atom('cc').add(V(-2, 3, 15));
      W.cam(base.lerp(near, ko * .7), V(1, 4.5, 0).lerp(this.mols[2].atom('cc'), ko * .7));
      W.bloom(.45 + .5 * Math.exp(-Math.max(0, lt - tO - .4) * 3) * (lt > tO + .4));
      this.hud = { pH };
      this.pts.m0 = m0.atom('cc').add(V(0, 2.2, 0)); this.pts.m2 = this.mols[2].atom('cc'); this.pts.side = C34.clone().lerp(N, .5); this.pts.prot = this.prot.position.clone();
    },
  };

  // 06 storage: −20 °C frost, the cap screws down, the glass turns amber (dark), argon fills the headspace
  W3.defs.store = {
    build(g) {
      const { vial, T, MAT } = L();
      this.v = vial(g, 51); this.glass0 = MAT.glass.color.clone();
      const r = rnd(31);
      this.fs = [...Array(220)].map(() => [r() * Math.PI * 2, r() * 6.6 - 3.3, .03 + r() * .06, r()]);
      this.frost = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), MAT.frost, 220); this.frost.frustumCulled = false; this.v.add(this.frost);
      this.as = [...Array(70)].map(() => [r() * Math.PI * 2, Math.sqrt(r()) * 2.1, r() * 2.6 - .5, r() * 6]);
      this.ar = new T.InstancedMesh(new T.SphereGeometry(.16, 10, 8), MAT.argon, 70); this.ar.frustumCulled = false; this.v.add(this.ar);
      this.pts = {};
    },
    update(lt, E, beat, W) {
      const { V, T, MAT } = L(), tF = E('零下二十度'), tS = E('密封'), tL = E('避光'), tI = E('惰性气体');
      this.v.position.set(-6.5, -.6 + Math.sin(lt * 1.1) * .15, 0); this.v.rotation.set(.12, lt * .25, .04);
      const kS = heavy(lt - tS + .5); this.v.cap.position.y = 4.9 + 2.6 * (1 - kS); this.v.cap.rotation.y = -(1 - kS) * 7;
      const kL = ease((lt - tL + .2) / .8);
      MAT.glass.color.copy(this.glass0).lerp(new T.Color(0xC9781F), kL); MAT.glass.opacity = .22 + .3 * kL;
      const mm = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3();
      this.fs.forEach(([a, y, sz, ph], i) => { const k = pop(lt - tF - .1 - ph * .9);
        s.setScalar(Math.max(.001, k * sz)); q.setFromAxisAngle(V(0, 1, 0), ph * 6); mm.compose(V(Math.cos(a) * 2.66, y, Math.sin(a) * 2.66), q, s); this.frost.setMatrixAt(i, mm); });
      this.frost.instanceMatrix.needsUpdate = true;
      this.as.forEach(([a, r, y, ph], i) => { const k = pop(lt - tI - i * .012), aa = a + lt * .4 + Math.sin(lt + ph) * .2;
        s.setScalar(Math.max(.001, k)); mm.compose(V(Math.cos(aa) * r * 1, y + Math.sin(lt * 1.3 + ph) * .25, Math.sin(aa) * r), q.identity(), s); this.ar.setMatrixAt(i, mm); });
      this.ar.instanceMatrix.needsUpdate = true;
      W.cam(V(Math.sin(lt * .2) * 2 - 3, 3 + Math.sin(lt * .15), 30 - lt * .25), V(-1, .2, 0));
      W.bloom(.45 + .5 * Math.exp(-Math.max(0, lt - tS) * 3) * (lt > tS));
      this.pts.vial = this.v.position.clone(); this.pts.cap = this.v.position.clone().add(V(0, 5.2, 0));
      const T0 = sm(25, -20, ease((lt - tF + .4) / 1.1)); this.hud = { T: T0 };
    },
  };

  W3.defs.outro = {
    build(g) { const { Mol, Lipo, Pep, bond, fib } = L(); this.m = new Mol(g, 12); this.pep = new Pep(g, 6); this.b = bond(g);
      this.lp = new Lipo(g, 6); this.dirs = fib(16); this.ms = this.dirs.map(() => new Mol(this.lp.top, 5));
      this.far = [[-44, 19, -62, 5], [46, 21, -72, 5], [-50, -22, -80, 5], [48, -21, -70, 5]].map(([x, y, z, r]) => { const lp = new Lipo(g, r), ms = fib(12).map(() => new Mol(lp.top, 4)); lp.g.position.set(x, y, z); return { lp, ms }; }); },
    update(lt, E, beat, W) {
      const { V, setBond } = L(), k = heavy(lt);
      const m = this.m.pose({ kt: k, kp: ease(lt / .9), kr: pop(lt - .6), w: lt * .5, amp: .4, sat: ease((lt - 1.4) / .5) }).place(V(-4.1, 5.9, 0), V(1, 0, 0), 0);
      const C3 = m.atom('C3'), S = C3.clone().add(V(.95, 0, 0)), kP = heavy(lt - .9), pS = S.clone().add(V(6 * (1 - kP), 3 * (1 - kP), 0));
      this.pep.pose(pS, V(1, .35, .2), lt * 1.5, pop(lt - .7)); const kb = ease((lt - 1.3) / .4); setBond(this.b, C3, C3.clone().lerp(pS, kb), kb);
      L().MAT.malCC.emissiveIntensity = .9 + beatPulse(lt, beat) * .6;
      this.lp.g.position.set(-24, -8, -45); this.lp.g.rotation.y = lt * .1; this.lp.pose(lt + 5, 0);
      this.ms.forEach((mm, i) => { const d = this.dirs[i]; mm.pose({ w: lt + i, amp: .25 }).place(d.clone().multiplyScalar(6.3), d, i); });
      this.far.forEach(({ lp, ms }, j) => { lp.g.rotation.y = lt * .15 + j; lp.pose(lt + 5, 0); const ds = L().fib(12);
        ms.forEach((mm, i) => mm.pose({ w: lt + i, amp: .25 }).place(ds[i].clone().multiplyScalar(5.2), ds[i], i)); });
      const kb2 = ease((lt - 1.5) / 7);   // ending: drift back, more carriers come into view around the title
      W.cam(V(Math.sin(lt * .2) * 1.5, 0, 38 + kb2 * 14), V(0, 0, 0));
      W.bloom(.5 + .5 * Math.exp(-Math.max(0, lt - 1.4) * 3) * (lt > 1.4));
    },
  };
})();
