// 3D layer for the DSPE-PEG-cRGD film: one Three.js world under the SVG scenes.
// Everything is a pure function of time (no clocks, no Math.random): W3.render(id, lt, E, beat, anchor) poses the
// objects of scene `id`, sets the camera and draws one frame. Scenes' SVG labels use W3.stage(lay, x, y, z) to pin
// themselves to 3D points. Look: glossy clearcoat materials + studio environment, bloom, AgX tone mapping, fog.
(function () {
  const T = THREE, X = THREEX, V = (x, y, z) => new T.Vector3(x, y, z), UP = V(0, 1, 0);
  const W3 = window.W3 = { defs: {} };
  let R, scene, cam, comp, bloom, Wd, Ht, bok;
  const GEO = {}, MAT = {};
  // Look: the three segment colours come from the theme (C.a anchor, C.accent linker, C.b ligand); the water / lipid look
  // can be overridden per project with window.LOOK3D = { sky: [top, mid, bottom], fog, lipidHead, lipidTail }.
  const LOOK = Object.assign({ sky: ['#1E6DB6', '#0F4A8E', '#05214A'], fog: 0x0E4888, lipidHead: 0x86C6EE, lipidTail: 0x6C9ED6 }, window.LOOK3D || {});
  const hex = c => typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16);
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _q2 = new T.Quaternion(), _s = new T.Vector3(), _p = new T.Vector3();

  const phys = (col, o = {}) => new T.MeshPhysicalMaterial({ color: col, roughness: .2, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, ...o });
  function gradTex() {
    const c = document.createElement('canvas'); c.width = 4; c.height = 512; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, LOOK.sky[0]); g.addColorStop(.45, LOOK.sky[1]); g.addColorStop(1, LOOK.sky[2]);
    x.fillStyle = g; x.fillRect(0, 0, 4, 512); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }

  // cutaway section face: head bands (blue) at both leaflets, warm hatched hydrophobic core between them
  function hatchTex() {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, 'rgba(134,198,238,.95)'); g.addColorStop(.16, 'rgba(134,198,238,.9)');
    g.addColorStop(.2, 'rgba(245,163,59,.55)'); g.addColorStop(.8, 'rgba(245,163,59,.55)'); g.addColorStop(.84, 'rgba(134,198,238,.9)'); g.addColorStop(1, 'rgba(134,198,238,.95)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 128); x.strokeStyle = 'rgba(255,230,190,.55)'; x.lineWidth = 2;
    for (let i = -128; i < 512; i += 14) { x.beginPath(); x.moveTo(i, 104); x.lineTo(i + 80, 24); x.stroke(); }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  // ---------- lipids (instanced): head sphere + two tails hanging along -normal ----------
  class Lipids {
    constructor(parent, n) {
      this.heads = new T.InstancedMesh(GEO.lhead, MAT.lhead, n); this.tails = new T.InstancedMesh(GEO.ltail, MAT.ltail, n * 2);
      this.heads.frustumCulled = this.tails.frustumCulled = false; parent.add(this.heads, this.tails); this.k = 0;
    }
    begin() { this.k = 0; }
    add(p, nrm, s) {
      if (s <= 0.001) return;
      _q.setFromUnitVectors(UP, nrm); _s.set(s, s, s);
      _m.compose(p, _q, _s); this.heads.setMatrixAt(this.k, _m);
      const tx = V(1, 0, 0).applyQuaternion(_q);
      for (let j = 0; j < 2; j++) {
        _p.copy(p).addScaledVector(nrm, -1.45 * s).addScaledVector(tx, (j ? .2 : -.2) * s);
        _m.compose(_p, _q, _s); this.tails.setMatrixAt(this.k * 2 + j, _m);
      }
      this.k++;
    }
    end() { this.heads.count = this.k; this.tails.count = this.k * 2; this.heads.instanceMatrix.needsUpdate = this.tails.instanceMatrix.needsUpdate = true; }
  }
  // points on a sphere (Fibonacci), optionally only inside a cap around `dir` of half-angle capDeg
  function fib(n, dir = UP, capDeg = 180) {
    const out = [], c = Math.cos(capDeg * Math.PI / 180), ga = Math.PI * (3 - Math.sqrt(5)), q = new T.Quaternion().setFromUnitVectors(UP, dir);
    const N = Math.round(n * 2 / (1 - c));   // generate over the whole sphere, keep the cap
    for (let i = 0; i < N; i++) { const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), a = i * ga;
      if (y < c) continue; out.push(V(Math.cos(a) * r, y, Math.sin(a) * r).applyQuaternion(q)); }
    return out;
  }
  // liposome: outer + inner leaflets; lipids appear sweeping by latitude from `at`
  class Lipo {
    constructor(parent, R, o = {}) {
      this.g = new T.Group(); parent.add(this.g); this.R = R; const sp = o.sp || 1.08, cap = o.cap || 180, dir = o.dir || UP;
      const area = (r) => 4 * Math.PI * r * r * (1 - Math.cos(cap * Math.PI / 180)) / 2;
      this.out = fib(Math.round(area(R) / (sp * sp)), dir, cap);
      this.inn = R > 5 ? fib(Math.round(area(R - 3.4) / (sp * sp)), dir, cap) : [];
      this.L = new Lipids(this.g, this.out.length + this.inn.length);
      if (o.core !== false) { this.core = new T.Mesh(new T.SphereGeometry(Math.max(.5, R - 4.2), 48, 32), MAT.core); this.g.add(this.core); }
      this.top = new T.Group(); this.g.add(this.top);
    }
    pose(lt, at, o = {}) {
      const L = this.L, R = this.R, sw = o.sweep ?? .9; L.begin();
      this.out.forEach((n, i) => { const k = SP.pop(lt - at - (1 - n.y) / 2 * sw), w = Math.sin(lt * 2 + i * 1.7) * .05;
        L.add(_p.copy(n).multiplyScalar(R + w).clone(), n, k); });
      this.inn.forEach((n, i) => { const k = SP.pop(lt - at - .15 - (1 - n.y) / 2 * sw);
        L.add(n.clone().multiplyScalar(R - 3.4), n.clone().negate(), k); });
      L.end(); if (this.core) { const k = SP.card(lt - at - .3); this.core.scale.setScalar(Math.max(.001, k)); }
    }
  }
  // flat bilayer patch: top leaflet heads at y = 0, bottom at y = -3.4
  class Bilayer {
    constructor(parent, nx, nz, sp = 1.05) {
      this.g = new T.Group(); parent.add(this.g); this.pts = [];
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) this.pts.push([(i - (nx - 1) / 2) * sp + (j % 2) * sp / 2, (j - (nz - 1) / 2) * sp * .9]);
      this.L = new Lipids(this.g, this.pts.length * 2);
    }
    // cut(x, z) → 0..1 keeps a lipid (1) or removes it for a cutaway (0)
    pose(lt, at, push = () => [0, 0], cut = () => 1) {
      const L = this.L; L.begin();
      this.pts.forEach(([x, z], i) => { const k = SP.pop(lt - at - (x + 16) / 32 * .7) * cut(x, z), [dx, dz] = push(x, z), w = Math.sin(lt * 2.2 + i) * .06;
        L.add(V(x + dx, w, z + dz), UP, k); });
      this.pts.forEach(([x, z], i) => { const k = SP.pop(lt - at - .2 - (x + 16) / 32 * .7) * cut(x + .5, z + .45);
        L.add(V(x + .5, -3.4 + Math.sin(lt * 2 + i) * .05, z + .45), V(0, -1, 0), k); });
      L.end();
    }
  }
  // ---------- the molecule: DSPE head + 2 tails (−y), PEG bead chain (+y), cRGD ring at the tip ----------
  class Mol {
    // o.anchor: 'dspe' (head + 2 tails, default) | 'ome' (methoxy cap CH3–O, for mPEG reagents) | 'none'
    // o.head: 'ring' (five-bead ring + torus: cyclic peptide, NHS ester, any ring-shaped end group) | 'mal' (atomic maleimide:
    //   N, C2–C5, two C=O, the reactive C=C; pose({ open, grey, sat })) — add new heads here, keyed the same way
    // o.own: clone the head materials so one molecule can be greyed out / opened without touching the others
    constructor(parent, n = 12, o = {}) {
      this.n = n; this.g = new T.Group(); parent.add(this.g); this.head = o.head || W3.molHead || 'ring';
      this.dspe = new T.Group(); this.g.add(this.dspe);
      if (o.anchor === 'ome') {
        const ox = new T.Mesh(GEO.ome, MAT.dspe); ox.position.y = .35; this.dspe.add(ox);
        const me = new T.Mesh(GEO.ome2, MAT.dspeT); me.position.y = -.35; this.dspe.add(me); this.tails = [];
      } else if (o.anchor === 'plga') {
        // PLGA block: a compact coil of ester units, lactide (C.a) and glycolide (lighter) alternating; pose({ deg }) breaks it into fragments
        const NP = o.np || 10, r = rnd(7 + NP), cA = new T.Color(C.a), cG = cA.clone().lerp(new T.Color(0xffffff), .45);
        this.plga = new T.InstancedMesh(GEO.plga, o.own ? MAT.plga.clone() : MAT.plga, NP); this.plga.frustumCulled = false; this.dspe.add(this.plga);
        this.plgaP = [...Array(NP)].map((_, i) => V(Math.sin(i * 1.3) * .55, -.45 - i * .42, Math.cos(i * 1.1) * .5));
        this.plgaD = this.plgaP.map(() => V(r() - .5, -r() * .8, r() - .5).normalize()); this.plgaTh = this.plgaP.map(() => r() * .65);
        this.plgaP.forEach((_, i) => this.plga.setColorAt(i, i % 3 === 2 ? cG : cA)); this.plga.instanceColor.needsUpdate = true; this.tails = [];
      } else if (o.anchor === 'dbco') {
        // DBCO: eight-membered ring (C.a carbons) with the strained, glowing C≡C at the bottom, two fused benzene rings
        // (torus = aromatic), amide stalk up to the chain. pose({ click }) grows the triazole bonds once an azide has added.
        this.tails = []; const D = this.dspe, c0 = V(0, -1.75, 0), R8 = .8, at8 = a => c0.clone().add(V(Math.cos(a * Math.PI / 180) * R8, Math.sin(a * Math.PI / 180) * R8, 0));
        const A8 = [90, 45, 0, -45, -67.5, -112.5, -135, 180, 135].map(at8);   // 4 & 5 = alkyne carbons (−67.5 / −112.5)
        A8.forEach((q, i) => { if (i === 2 || i === 7) return; const m = new T.Mesh(GEO.cAt, MAT.dbcoC); m.position.copy(q); D.add(m); });
        const ring8 = [0, 1, 3, 4, 5, 6, 8, 0], bz = [[1, 3, 0], [6, 8, 180]];
        for (let i = 0; i < ring8.length - 1; i++) { const a = ring8[i], b = ring8[i + 1]; if ((a === 4 && b === 5)) continue; const m = new T.Mesh(GEO.bond, MAT.dbcoB); seg(m, A8[a], A8[b]); m.scale.x = m.scale.z = .8; D.add(m); }
        bz.forEach(([i, j, ang]) => { const mid = A8[i].clone().lerp(A8[j], .5), out = mid.clone().sub(c0).normalize(), cen = mid.clone().addScaledVector(out, .5);
          const tor = new T.Mesh(GEO.arom, MAT.dbcoC); tor.position.copy(cen); D.add(tor);
          for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, m = new T.Mesh(GEO.hAt, MAT.dbcoC); m.position.copy(cen).add(V(Math.cos(a) * .58, Math.sin(a) * .58, 0)); D.add(m); } });
        this.alkA = A8[4]; this.alkB = A8[5];
        this.alk = [-1, 0, 1].map(j => { const m = new T.Mesh(GEO.bondCC, MAT.alk); D.add(m); m.j = j; return m; });
        const st = new T.Mesh(GEO.bond, MAT.dbcoB); seg(st, A8[0], V(0, .7, 0)); D.add(st);
        const nh = new T.Mesh(GEO.cAt, MAT.amine); nh.position.set(0, .2, 0); D.add(nh);
        // triazole spots (dspe-local): N1 under C4, N3 under C5, N2 between, below
        const mid = this.alkA.clone().lerp(this.alkB, .5);
        this.triL = [this.alkA.clone().add(V(.12, -.72, 0)), mid.clone().add(V(0, -1.12, 0)), this.alkB.clone().add(V(-.12, -.72, 0))];
        this.triB = [[this.alkA, this.triL[0]], [this.triL[0], this.triL[1]], [this.triL[1], this.triL[2]], [this.triL[2], this.alkB]].map(([a, b]) => { const m = new T.Mesh(GEO.bond, MAT.bond); seg(m, a, b); D.add(m); m.full = m.scale.clone(); return m; });
      } else if (o.anchor === 'cring') {
        // cyclic pentapeptide c(RGDfK) as the anchor: ring plane = xy, K on top (its side chain is the linker to biotin),
        // R lower-left, G bottom, D lower-right, f upper-left. Residue colours: R blue, G grey, D red, f violet, K = C.a.
        this.tails = []; const D = this.dspe, c0 = V(0, -1.55, 0), Rr = 1.05;
        const ang = { K: 90, f: 162, R: -150, G: -90, D: -30 }, col = { K: MAT.dspe, f: MAT.resF, R: MAT.resR, G: MAT.resG, D: MAT.resD };
        this.res = {}; this.resM = {};
        for (const k in ang) { const a = ang[k] * Math.PI / 180, q = c0.clone().add(V(Math.cos(a) * Rr, Math.sin(a) * Rr, 0));
          const m = new T.Mesh(GEO.resB, col[k]); m.position.copy(q); D.add(m); this.res[k] = q; this.resM[k] = m; }
        const tor = new T.Mesh(GEO.ringB, MAT.dspeT); tor.position.copy(c0); D.add(tor);
        // side chains: Arg long stalk + guanidinium (blue), Asp short + carboxylate (red), D-Phe phenyl
        const side = (k, len, tipG, tipM) => { const q = this.res[k], dir = q.clone().sub(c0).normalize(), e = q.clone().addScaledVector(dir, len);
          const st = new T.Mesh(GEO.bond, MAT.dbcoB); seg(st, q, e); D.add(st); const t = new T.Mesh(tipG, tipM); t.position.copy(e); D.add(t); return e; };
        this.side = { R: side('R', 1.1, GEO.nAt, MAT.amine), D: side('D', .7, GEO.oAt, MAT.wO), f: side('f', .8, GEO.arom, MAT.resF) };
        const st = new T.Mesh(GEO.bond, MAT.dbcoB); seg(st, this.res.K, V(0, .7, 0)); D.add(st);
      } else if (o.anchor === 'sh') {
        // free thiol: yellow S (+ white H; this.shH, hide it for a disulfide / Au–S / thioether) on a short CH2 stalk
        this.tails = []; const st = new T.Mesh(GEO.bond, MAT.dbcoB); seg(st, V(0, -.1, 0), V(0, .8, 0)); this.dspe.add(st);
        this.shS = new T.Mesh(GEO.sS, MAT.S); this.shS.position.set(0, -.35, 0); this.dspe.add(this.shS);
        this.shH = new T.Mesh(GEO.sH, MAT.H); this.shH.position.set(.38, -.7, 0); this.dspe.add(this.shH);
      } else if (o.anchor === 'none') this.tails = [];
      else {
        this.dspe.add(new T.Mesh(GEO.dhead, MAT.dspe));
        this.tails = [GEO.tailL, GEO.tailR].map(gm => { const m = new T.Mesh(gm, MAT.dspeT); this.dspe.add(m); return m; });
      }
      // cap = what is left at the chain end after the head leaves (amide C=O after coupling, COOH after hydrolysis); pose({ kc })
      this.cap = new T.Mesh(GEO.cap, o.own ? MAT.amide.clone() : MAT.amide); this.cap.scale.setScalar(.001); this.g.add(this.cap);
      this.capBase = this.cap.material.color.clone();
      // o.link: acid-cleavable hydrazone (C=N–NH) between anchor and chain; lower half stays with the anchor (off.d), upper half
      // leaves with the chain (off.p); pose({ cut }) hides the double bond between them
      this.ly = o.link ? .75 : 0;
      if (o.link) { this.lk = [0, 1].map(() => { const m = new T.Mesh(GEO.lk, MAT.hyd); this.g.add(m); return m; });
        this.lkb = [-1, 1].map(() => { const m = new T.Mesh(GEO.bondCC, MAT.hyd); this.g.add(m); return m; }); }
      this.beads = new T.InstancedMesh(GEO.bead, MAT.peg, n); this.beads.frustumCulled = false; this.g.add(this.beads);
      this.ring = new T.Group(); this.g.add(this.ring);
      if (this.head === 'mal') {
        const mt = o.own ? { c: MAT.rgd.clone(), o: MAT.malO.clone(), b: MAT.rgdT.clone(), cc: MAT.malCC.clone() } : { c: MAT.rgd, o: MAT.malO, b: MAT.rgdT, cc: MAT.malCC };
        this.mt = mt; this.base = { c: mt.c.color.clone(), o: mt.o.color.clone(), cc: mt.cc.color.clone() };
        const R = .62, at = d => V(Math.cos(d * Math.PI / 180) * R, Math.sin(d * Math.PI / 180) * R, 0);
        this.A0 = { N: at(-90), C2: at(-18), C3: at(54), C4: at(126), C5: at(198) };
        this.A0.O2 = this.A0.C2.clone().multiplyScalar(1.75); this.A0.O5 = this.A0.C5.clone().multiplyScalar(1.75);
        this.at = {}; for (const k in this.A0) { const m = new T.Mesh(k[0] === 'O' ? GEO.malO : k === 'N' ? GEO.malN : GEO.malC, k[0] === 'O' ? mt.o : mt.c); this.ring.add(m); this.at[k] = m; }
        this.bonds = [['N', 'C2'], ['C2', 'C3'], ['C4', 'C5'], ['C5', 'N'], ['C2', 'O2'], ['C5', 'O5']].map(pr => { const m = new T.Mesh(GEO.bond, mt.b); this.ring.add(m); return [m, ...pr]; });
        this.cc = [-1, 1].map(() => { const m = new T.Mesh(GEO.bondCC, mt.cc); this.ring.add(m); return m; });
      } else if (this.head === 'fitc') { this.rmt = null;
        // fluorescein via thiourea: N–C(=S)–N stalk, pendant benzene ring (perpendicular), flat xanthene (3 fused rings, ring O)
        // and an additive glow sprite whose brightness = pose({ fl }) (per molecule)
        const R = this.ring, at = (g, m, q) => { const x = new T.Mesh(g, m); x.position.copy(q); R.add(x); return x; };
        at(GEO.nAt, MAT.amine, V(0, -.35, 0)); at(GEO.cAt, MAT.dbcoB, V(0, .15, 0)); at(GEO.sAt, MAT.S, V(.55, .15, 0)); at(GEO.nAt, MAT.amine, V(0, .65, 0));
        [[V(0, -.35, 0), V(0, .65, 0)], [V(0, .15, 0), V(.55, .15, 0)], [V(0, .65, 0), V(0, .95, 0)]].forEach(([a, b]) => { const m = new T.Mesh(GEO.bond, MAT.dbcoB); seg(m, a, b); R.add(m); });
        const ring = (c, rot, r = .5) => { const tor = new T.Mesh(GEO.arom, MAT.rgd); tor.position.copy(c); tor.rotation.copy(rot); tor.scale.setScalar(r / .4); R.add(tor);
          for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2, q = V(Math.cos(a) * r * 1.05, Math.sin(a) * r * 1.05, 0).applyEuler(rot).add(c); at(GEO.hAt, MAT.rgd, q); } };
        ring(V(0, 1.45, 0), new T.Euler(0, Math.PI / 2, Math.PI / 2));
        [-1.08, 0, 1.08].forEach(x => ring(V(x, 2.55, 0), new T.Euler(0, 0, Math.PI / 6), .6));
        at(GEO.oAt, MAT.malO, V(0, 3.05, 0)); at(GEO.oAt, MAT.malO, V(-2.05, 2.55, 0)); at(GEO.oAt, MAT.malO, V(2.05, 2.55, 0));
        const sm = new T.SpriteMaterial({ map: glowTex(), color: 0x7dff8f, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: 1 });
        this.glow = new T.Sprite(sm); this.glow.position.set(0, 2.5, 0); R.add(this.glow); this.fitcTop = V(0, 2.55, 0);
      } else if (this.head === 'biotin') { this.rmt = null;
        // biotin: ureido ring (N–C(=O)–N) fused to the tetrahydrothiophene (S, yellow) + valeric tail down to the chain
        const B = { a: V(0, 1.55, 0), b: V(0, .85, 0), N1: V(-.62, 1.85, 0), C2: V(-1.0, 1.2, 0), N3: V(-.62, .55, 0), O: V(-1.62, 1.2, 0),
          c4: V(.62, 1.85, 0), S: V(1.0, 1.2, 0), c5: V(.62, .55, 0), t1: V(.45, .05, 0), t2: V(.1, -.35, 0) };
        const mat = k => k[0] === 'N' ? MAT.amine : k === 'O' ? MAT.malO : k === 'S' ? MAT.S : MAT.rgd;
        this.bat = {}; for (const k in B) { const m = new T.Mesh(k === 'S' ? GEO.sAt : k[0] === 't' ? GEO.hAt : GEO.cAt, mat(k)); m.position.copy(B[k]); this.ring.add(m); this.bat[k] = m; }
        [['a', 'b'], ['a', 'N1'], ['N1', 'C2'], ['C2', 'N3'], ['N3', 'b'], ['a', 'c4'], ['c4', 'S'], ['S', 'c5'], ['c5', 'b'], ['c5', 't1'], ['t1', 't2']].forEach(([a, b]) => {
          const m = new T.Mesh(GEO.bond, MAT.rgdT); seg(m, B[a], B[b]); this.ring.add(m); });
        [-1, 1].forEach(j => { const m = new T.Mesh(GEO.bondCC, MAT.malO); seg(m, B.C2.clone().add(V(0, j * .08, 0)), B.O.clone().add(V(0, j * .08, 0))); this.ring.add(m); });
        this.bioTop = V(0, 2.2, 0);
      } else if (this.head === 'none') { this.rmt = null;
      } else {
        // o.own: per-molecule materials so pose({ grey }) can fade this head (and its cap) to inactive grey (e.g. hydrolysed NHS ester)
        const rm = o.own ? MAT.rgd.clone() : MAT.rgd, rt = o.own ? MAT.rgdT.clone() : MAT.rgdT; this.rmt = o.own ? { r: rm, t: rt, base: rm.color.clone() } : null;
        if (this.head === 'pep') {   // linear peptide (SP94: 12 residues) as a short helix of residue beads; pose({ kpep }) grows it residue by residue
          this.pepN = o.pepN || 12; this.pepM = new T.InstancedMesh(GEO.pres, rm, this.pepN); this.pepM.frustumCulled = false; this.ring.add(this.pepM);
          this.pepP = [...Array(this.pepN)].map((_, i) => V(Math.cos(i * 1.75) * .5, (i - (this.pepN - 1) / 2) * .19, Math.sin(i * 1.75) * .5));
        } else {
        for (let i = 0; i < 5; i++) { const b = new T.Mesh(GEO.rbead, rm), a = i / 5 * Math.PI * 2; b.position.set(Math.cos(a) * .62, 0, Math.sin(a) * .62); this.ring.add(b); }
        const tor = new T.Mesh(GEO.torus, rt); tor.rotation.x = Math.PI / 2; this.ring.add(tor); }
      }
    }
    // maleimide: open 0..1 breaks N–C2 and swings C2=O out (ring-opening hydrolysis); grey 0..1 fades to inactive grey (needs o.own);
    // sat 0..1 turns the C=C into a single bond (after a thiol has added)
    malPose(open = 0, grey = 0, sat = 0) {
      const A = this.A0, P = {}, sw = V(.55, -.45, .35).multiplyScalar(open);
      for (const k in A) P[k] = A[k].clone(); P.C2.add(sw); P.O2.add(sw.clone().multiplyScalar(1.5));
      for (const k in P) this.at[k].position.copy(P[k]);
      this.bonds.forEach(([m, a, b]) => { seg(m, P[a], P[b]); m.visible = !(open > .25 && a === 'N' && b === 'C2'); });
      const d = P.C4.clone().sub(P.C3), nrm = V(-d.y, d.x, 0).normalize().multiplyScalar(.1 * (1 - sat));
      this.cc.forEach((m, j) => seg(m, P.C3.clone().addScaledVector(nrm, j ? 1 : -1), P.C4.clone().addScaledVector(nrm, j ? 1 : -1)));
      if (this.mt.c !== MAT.rgd) { const gr = new T.Color(0x8592A6);
        this.mt.c.color.copy(this.base.c).lerp(gr, grey); this.mt.o.color.copy(this.base.o).lerp(gr, grey); this.mt.cc.color.copy(this.base.cc).lerp(gr, grey);
        this.mt.c.emissiveIntensity = .5 * (1 - grey); this.mt.cc.emissiveIntensity = .9 * (1 - grey); }
    }
    // world position of a head atom ('C3', 'N', …; 'cc' = middle of the maleimide C=C) — aim reactions and close-ups at it
    atom(k) { this.g.updateWorldMatrix(true, true); if (k === 'cc') return this.at.C3.getWorldPosition(V()).lerp(this.at.C4.getWorldPosition(V()), .5); return this.at[k].getWorldPosition(V()); }
    // P: kt, kp, kr (0..1 springs), w wave phase, amp, spf bead spacing, tl tail length, off: {d,p,r} part offsets (local Vector3)
    pose(P = {}) {
      const { kt = 1, kp = 1, kr = 1, w = 0, amp = .35, spf = 1, tl = 1, off = {}, open = 0, grey = 0, sat = 0, kc = 0, deg = 0, kpep = 1, cut = 0, click = 0 } = P, n = this.n, ly = this.ly;
      if (this.alk) { const dd = this.alkB.clone().sub(this.alkA), nr = V(-dd.y, dd.x, 0).normalize().multiplyScalar(.11 * (1 - click));
        this.alk.forEach(m => { seg(m, this.alkA.clone().addScaledVector(nr, m.j), this.alkB.clone().addScaledVector(nr, m.j)); m.visible = m.j === 0 || click < .5; });
        this.triB.forEach((m, i) => { const k = clamp(click * 4 - i); m.scale.set(Math.max(.001, k), m.full.y, Math.max(.001, k)); m.visible = k > .01; }); }
      if (this.plga) { this.plgaP.forEach((b, i) => { const f = ease((deg - this.plgaTh[i]) / .35);
          _p.copy(b).addScaledVector(this.plgaD[i], f * 2.6); _s.setScalar(1 - .4 * f); _m.compose(_p, _q.identity(), _s); this.plga.setMatrixAt(i, _m); });
        this.plga.instanceMatrix.needsUpdate = true; }
      if (this.pepM) { this.pepP.forEach((b, i) => { _s.setScalar(Math.max(.001, clamp(kpep * this.pepN - i))); _m.compose(b, _q.identity(), _s); this.pepM.setMatrixAt(i, _m); });
        this.pepM.instanceMatrix.needsUpdate = true; }
      const sT = Math.max(.001, kt); this.dspe.scale.set(sT, sT * tl, sT); this.dspe.position.copy(off.d || V(0, 0, 0));
      const pos = i => { const f = Math.min(1, (i + 1) / 3); return V(Math.sin(i * .62 - w * 2) * amp * f, .95 + ly + (i + .5) * .8 * spf, Math.cos(i * .55 - w * 1.7) * amp * .7 * f); };
      if (this.lk) { const a = V(0, .95, 0).add(off.d || V(0, 0, 0)), b = V(0, 1.5, 0).add(off.p || V(0, 0, 0)), sk = Math.max(.001, P.kl ?? Math.min(kt, kp * 3));
        this.lk[0].position.copy(a); this.lk[1].position.copy(b); this.lk.forEach(m => m.scale.setScalar(sk));
        this.lkb.forEach((m, j) => { seg(m, a.clone().add(V(j * .1 - .05, 0, 0)), b.clone().add(V(j * .1 - .05, 0, 0))); m.visible = cut < .3 && sk > .01; }); }
      for (let i = 0; i < n; i++) { const kb = clamp(kp * n - i), p = pos(i).add(off.p || V(0, 0, 0));
        _s.setScalar(Math.max(.001, kb)); _m.compose(p, _q.identity(), _s); this.beads.setMatrixAt(i, _m); }
      this.beads.instanceMatrix.needsUpdate = true;
      const tip = pos(this.pepM ? Math.max(0, Math.min(n, kp * n) - 1) : n - 1).add(V(0, 1.05 * spf + .15, 0));   // peptide head rides the growing chain end
      this.ring.position.copy(tip).add(off.r || V(0, 0, 0));
      this.ring.scale.setScalar(Math.max(.001, kr));
      if (this.pepM) { this.ring.position.y += .9; tip.y += .9; }
      if (this.glow) { const fl = P.fl ?? 1; this.glow.material.opacity = clamp(fl) * .85; this.glow.scale.setScalar(Math.max(.001, 2 + 4.5 * fl)); }
      if (this.head === 'fitc') { this.ring.position.y -= .3; this.ring.rotation.set(0, Math.sin(w * .4) * .5, Math.sin(w) * .08); }
      else if (this.head === 'biotin') { this.ring.position.y -= .2; this.ring.rotation.set(0, Math.sin(w * .5) * .6, Math.sin(w) * .1); }
      else if (this.head === 'mal') { this.ring.position.y += .25; this.ring.rotation.set(0, Math.sin(w * .5) * .5, Math.sin(w) * .12); this.malPose(open, grey, sat); }
      else { this.ring.rotation.y = w * .8; this.ring.rotation.z = Math.sin(w) * .25;
        if (this.rmt) { const gr = new T.Color(0x8592A6); this.rmt.r.color.copy(this.rmt.base).lerp(gr, grey); this.rmt.t.color.copy(this.rmt.base).lerp(gr, grey);
          this.rmt.r.emissiveIntensity = this.rmt.t.emissiveIntensity = .5 * (1 - grey) + (P.glow || 0); } }
      if (this.cap.material !== MAT.amide) { this.cap.material.color.copy(this.capBase).lerp(new T.Color(0x8592A6), grey); this.cap.material.emissiveIntensity = .6 * (1 - grey); }
      this.cap.position.copy(pos(n - 1).add(V(0, .72, 0)).add(off.p || V(0, 0, 0))); this.cap.scale.setScalar(Math.max(.001, kc));
      this.tip = tip; return this;
    }
    place(p, dir = UP, spin = 0, s = 1) {
      _q.setFromUnitVectors(UP, dir.clone().normalize()); _q2.setFromAxisAngle(UP, spin);
      this.g.quaternion.copy(_q).multiply(_q2); this.g.position.copy(p); this.g.scale.setScalar(s); return this;
    }
    world(local) { this.g.updateWorldMatrix(true, false); return this.g.localToWorld(local.clone()); }
    // DBCO: world positions of the alkyne carbons / triazole N spots; biotin: world point at the top of the bicycle
    dw(local) { this.dspe.updateWorldMatrix(true, false); return this.dspe.localToWorld(local.clone()); }
    alkW() { return this.dw(this.alkA.clone().lerp(this.alkB, .5)); }
    triW() { return this.triL.map(q => this.dw(q)); }
    resW(k) { return this.dw(k === 'Rs' ? this.side.R : k === 'Ds' ? this.side.D : this.res[k]); }
    fitcW() { this.ring.updateWorldMatrix(true, false); return this.ring.localToWorld(this.fitcTop.clone()); }
    sW() { return this.dw(this.shS.position); }
    bioW() { this.ring.updateWorldMatrix(true, false); return this.ring.localToWorld(this.bioTop.clone()); }
    len() { return .95 + this.n * .8 + 1.2; }
  }
  // cylinder mesh (unit height along y) stretched between two points (bonds, sticks)
  function seg(m, a, b) { const d = b.clone().sub(a), L = d.length() || 1e-3; m.position.copy(a).lerp(b, .5); m.quaternion.setFromUnitVectors(UP, d.normalize()); m.scale.set(1, L, 1); }
  // glowing bond that grows between two points: const b = bond(g); setBond(b, A, B, k)
  function bond(parent) { const m = new T.Mesh(GEO.bondFat, MAT.bond); parent.add(m); m.scale.setScalar(.001); return m; }
  function setBond(m, a, b, k = 1) { const d = b.clone().sub(a), L = d.length(); m.position.copy(a).addScaledVector(d, .5);
    m.quaternion.setFromUnitVectors(UP, d.normalize()); m.scale.set(Math.max(.001, k), Math.max(.001, L), Math.max(.001, k)); }
  // peptide with a terminal cysteine: bead chain + yellow S (+ white H); pose(sPos, trailDir, w, k, hPos?)
  class Pep {
    constructor(parent, n = 6) {
      this.g = new T.Group(); parent.add(this.g); this.n = n;
      this.beads = [...Array(n)].map(() => { const m = new T.Mesh(GEO.pbead, MAT.pep); this.g.add(m); return m; });
      this.S = new T.Mesh(GEO.sS, MAT.S); this.H = new T.Mesh(GEO.sH, MAT.H); this.g.add(this.S, this.H);
      this.bond = new T.Mesh(GEO.bond, MAT.S); this.g.add(this.bond);
    }
    pose(s, dir, w = 0, k = 1, hp = null) {
      const d = dir.clone().normalize(), side = Math.abs(d.y) > .9 ? V(1, 0, 0) : V(0, 1, 0), u = side.clone().cross(d).normalize(), v = d.clone().cross(u);
      this.g.visible = k > .002; const ks = Math.max(.001, k);
      this.S.position.copy(s); this.S.scale.setScalar(ks);
      let prev = s.clone().addScaledVector(d, .55);
      this.beads.forEach((b, i) => { const p = s.clone().addScaledVector(d, .75 + i * .78).addScaledVector(u, Math.sin(i * 1.9 + w) * .38).addScaledVector(v, Math.cos(i * 1.3 + w * .8) * .3);
        b.position.copy(p); b.scale.setScalar(Math.max(.001, clamp(k * this.n - i))); if (i === 0) prev = p; });
      seg(this.bond, s, prev); this.bond.scale.x = this.bond.scale.z = ks;
      this.H.position.copy(hp || s.clone().addScaledVector(d, -.15).addScaledVector(u, .5)); this.H.scale.setScalar(ks);
      return this;
    }
  }
  // protein stand-in: a lumpy cluster of glossy spheres (reads as a protein without pretending to be a real fold)
  function protein(parent, R = 4, seed = 3, mat = MAT.prot) {
    const g = new T.Group(); parent.add(g); const r = rnd(seed);
    g.add(new T.Mesh(new T.SphereGeometry(R * .78, 40, 28), mat));
    fib(16).forEach(d => { const m = new T.Mesh(new T.SphereGeometry(R * (.36 + r() * .2), 28, 20), mat); m.position.copy(d.clone().multiplyScalar(R * (.62 + r() * .12))); g.add(m); });
    return g;
  }
  // lysine side chain on a protein surface: stalk + amine bead (g.N) at local y = 1.45
  function lysine(parent) {
    const g = new T.Group(); parent.add(g);
    const st = new T.Mesh(GEO.lys, MAT.lysC); st.position.y = .6; g.add(st);
    g.N = new T.Mesh(GEO.amine, MAT.amine); g.N.position.y = 1.45; g.add(g.N); return g;
  }
  // water molecules, instanced O + 2 H: w.pose(i => ({ p, s, a }))
  class Waters {
    constructor(parent, n) { this.n = n; this.O = new T.InstancedMesh(GEO.wO, MAT.wO, n); this.H = new T.InstancedMesh(GEO.wH, MAT.wH, n * 2);
      this.O.frustumCulled = this.H.frustumCulled = false; parent.add(this.O, this.H); }
    pose(fn) {
      const e = new T.Euler();
      for (let i = 0; i < this.n; i++) { const { p, s = 1, a = 0 } = fn(i); e.set(a, a * 1.3, a * .7); _q.setFromEuler(e); _s.setScalar(Math.max(.001, s));
        _m.compose(p, _q, _s); this.O.setMatrixAt(i, _m);
        for (let j = 0; j < 2; j++) { _p.set((j ? .32 : -.32), .24, 0).multiplyScalar(s).applyQuaternion(_q).add(p); _m.compose(_p, _q, _s); this.H.setMatrixAt(i * 2 + j, _m); } }
      this.O.instanceMatrix.needsUpdate = this.H.instanceMatrix.needsUpdate = true;
    }
  }
  // reagent vial: glass body + neck, ribbed cap (v.cap), dry powder (v.powder, instanced); frost/argon are scene effects
  function vial(parent, seed = 51) {
    const v = new T.Group(); parent.add(v); const r = rnd(seed);
    v.add(new T.Mesh(new T.CylinderGeometry(2.6, 2.6, 7, 48, 1, true), MAT.glass));
    const bot = new T.Mesh(new T.CircleGeometry(2.6, 48), MAT.glass); bot.rotation.x = -Math.PI / 2; bot.position.y = -3.5; v.add(bot);
    const neck = new T.Mesh(new T.CylinderGeometry(1.7, 2.6, 1, 48, 1, true), MAT.glass); neck.position.y = 4; v.add(neck);
    v.cap = new T.Group(); v.cap.position.y = 4.9; v.add(v.cap); v.cap.add(new T.Mesh(new T.CylinderGeometry(1.95, 1.95, 1.3, 40), MAT.capV));
    for (let i = 0; i < 24; i++) { const rib = new T.Mesh(new T.BoxGeometry(.12, 1.2, .15), MAT.capV), a = i / 24 * Math.PI * 2; rib.position.set(Math.cos(a) * 1.98, 0, Math.sin(a) * 1.98); rib.rotation.y = -a; v.cap.add(rib); }
    v.powder = new T.InstancedMesh(new T.SphereGeometry(.36, 12, 8), MAT.powder, 150); v.powder.frustumCulled = false; v.add(v.powder);
    const mm = new T.Matrix4(); [...Array(150)].forEach((_, i) => { const a = r() * Math.PI * 2, rr = Math.sqrt(r()) * 2.2; mm.makeTranslation(Math.cos(a) * rr, -3.2 + r() * (1.6 - rr * .25), Math.sin(a) * rr); v.powder.setMatrixAt(i, mm); });
    return v;
  }
  // polymeric micelle / nanoparticle of amphiphilic block copolymers (PLGA-PEG-ligand): PLGA coils point inward and fill a
  // translucent core, PEG + ligand outward. pose(lt, at, { sweep, fly, kh, cut(dir) → 0..1, deg, amp, spf, w })
  class Micelle {
    constructor(parent, R = 4.5, n = 36, o = {}) {
      this.g = new T.Group(); parent.add(this.g); this.R = R; this.dirs = o.dirs || fib(n);
      this.mols = this.dirs.map(() => new Mol(this.g, o.nb || 5, { anchor: 'plga', head: o.head || 'pep', np: o.np || 9 }));
      this.core = new T.Mesh(new T.SphereGeometry(R * .92, 48, 32), MAT.plgaCore); this.g.add(this.core);
    }
    pose(lt, at = 0, o = {}) {
      const { sweep = .9, fly = 0, kh = 1, cut = null, deg = 0, amp = .25, spf = 1, w = 0 } = o, R = this.R;
      this.mols.forEach((m, i) => { const d = this.dirs[i], k = SP.pop(lt - at - (1 - d.y) / 2 * sweep), c = cut ? cut(d) : 1, kk = k * c;
        const fl = typeof fly === 'function' ? fly(i, d) : fly;
        m.pose({ kt: kk, kp: kk, kr: kk * kh, w: lt + i + w, amp, spf, deg }).place(d.clone().multiplyScalar(R + fl), d, i); });
      this.core.scale.setScalar(Math.max(.001, SP.card(lt - at - .3)));
    }
  }
  // soft round sprite texture for fluorescence glows
  let _glow = null;
  function glowTex() { if (_glow) return _glow; const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    _glow = new T.CanvasTexture(c); return _glow; }
  // integrin αvβ3 stand-in: two subunits (αv left, β3 right) on stalks; head lobes form a cleft at local (0, 4.2, 0);
  // β3 carries the MIDAS metal ion (g.ion). g.cleft / g.alpha / g.beta = local points for docking and close-ups
  function integrin(parent) {
    const g = new T.Group(); parent.add(g);
    const sa = new T.Mesh(GEO.stalkI, MAT.intA); sa.position.set(-.9, 1.6, 0); g.add(sa);
    const sb = new T.Mesh(GEO.stalkI, MAT.intB); sb.position.set(.9, 1.6, 0); g.add(sb);
    const pa = new T.Mesh(GEO.prop, MAT.intA); pa.position.set(-1.25, 3.7, 0); pa.rotation.x = Math.PI / 2; g.add(pa);
    const ha = new T.Mesh(GEO.lobe, MAT.intA); ha.position.set(-1.25, 3.7, 0); g.add(ha);
    const hb = new T.Mesh(GEO.lobe, MAT.intB); hb.position.set(1.25, 3.55, 0); g.add(hb);
    g.ion = new T.Mesh(GEO.ion, MAT.ion); g.ion.position.set(.62, 4.2, .3); g.add(g.ion);
    g.cleft = V(0, 4.6, .2); g.alpha = V(-.85, 4.3, .2); g.beta = V(.62, 4.45, .3); return g;
  }
  // gold nanoparticle: polished sphere
  function gold(parent, R = 4) { const m = new T.Mesh(new T.SphereGeometry(R, 64, 48), MAT.gold); parent.add(m); return m; }
  // organic azide R–N=N=N: three blue N atoms; pose(lin) puts them on a line, pose(lin, tri, k) moves them into the triazole spots
  class Azide {
    constructor(parent) { this.g = new T.Group(); parent.add(this.g); this.N = [0, 1, 2].map(() => { const m = new T.Mesh(GEO.nAt, MAT.N3); this.g.add(m); return m; });
      this.b = [0, 1].map(() => { const m = new T.Mesh(GEO.bond, MAT.N3b); this.g.add(m); return m; }); }
    pose(base, dir, s = 1, tri = null, k = 0) {
      const lin = [0, 1, 2].map(i => base.clone().addScaledVector(dir, .55 + i * .5));
      const P = tri ? lin.map((q, i) => q.lerp(this.g.parent.worldToLocal(tri[i].clone()), k)) : lin;
      this.N.forEach((m, i) => { m.position.copy(P[i]); m.scale.setScalar(Math.max(.001, s)); });
      this.b.forEach((m, i) => { seg(m, P[i], P[i + 1]); m.scale.x = m.scale.z = Math.max(.001, s); m.visible = k < .6; });
      return lin;
    }
  }
  // streptavidin tetramer stand-in: four lobed subunits, each with one biotin pocket facing outward (g.pk = [{ p, d }] local)
  function strept(parent, mat = MAT.sav) {
    const g = new T.Group(); parent.add(g);
    const dirs = [V(1, 1, 1), V(-1, -1, 1), V(-1, 1, -1), V(1, -1, -1)].map(d => d.normalize());
    g.pk = dirs.map((d, i) => { const lobe = protein(g, 1.35, 21 + i, mat); lobe.position.copy(d.clone().multiplyScalar(1.45));
      const rim = new T.Mesh(GEO.pocket, MAT.pocket); rim.position.copy(d.clone().multiplyScalar(2.75)); rim.quaternion.setFromUnitVectors(V(0, 0, 1), d); g.add(rim);
      return { p: d.clone().multiplyScalar(2.55), d, rim }; });
    return g;
  }
  // receptor on a cell: stalk + cup (opening along +y local)
  function receptor(parent, mat) {
    const g = new T.Group(); parent.add(g);
    const st = new T.Mesh(GEO.stalk, mat); st.position.y = .8; g.add(st);
    const cup = new T.Mesh(GEO.cup, mat); cup.position.y = 2.1; cup.rotation.z = Math.PI; g.add(cup);
    return g;
  }
  function nano(parent, R = 2) {   // small particle with surface PEG sticks
    const g = new T.Group(); parent.add(g); g.add(new T.Mesh(new T.SphereGeometry(R, 40, 28), MAT.nano));
    fib(16).forEach(n => { const st = new T.Mesh(GEO.stick, MAT.peg); st.position.copy(n.clone().multiplyScalar(R + .6));
      st.quaternion.setFromUnitVectors(UP, n); g.add(st); const b = new T.Mesh(GEO.rbead, MAT.rgd); b.position.copy(n.clone().multiplyScalar(R + 1.35)); g.add(b); });
    return g;
  }

  W3.init = function (canvas, w, h) {
    Wd = w; Ht = h;
    R = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    R.setPixelRatio(1); R.setSize(w, h, false); R.toneMapping = T.AgXToneMapping; R.toneMappingExposure = .95; R.outputColorSpace = T.SRGBColorSpace;
    scene = new T.Scene(); scene.background = gradTex(); scene.fog = new T.FogExp2(hex(LOOK.fog), .011);
    const pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(new X.RoomEnvironment(), .04).texture;
    cam = new T.PerspectiveCamera(35, w / h, .1, 600);
    const key = new T.DirectionalLight(0xffffff, 2.2); key.position.set(-20, 30, 25); scene.add(key);
    const rim = new T.DirectionalLight(0x9fd8ff, 2.4); rim.position.set(25, 10, -30); scene.add(rim);
    scene.add(new T.HemisphereLight(0xbfe8ff, 0x0a2a5a, .9));
    comp = new X.EffectComposer(R); comp.addPass(new X.RenderPass(scene, cam));
    bloom = new X.UnrealBloomPass(new T.Vector2(w, h), .35, .45, 1.05); comp.addPass(bloom); comp.addPass(new X.OutputPass());

    GEO.lhead = new T.SphereGeometry(.5, 18, 12); GEO.ltail = new T.CylinderGeometry(.11, .08, 1.9, 6);
    GEO.dhead = new T.SphereGeometry(.72, 28, 20); GEO.bead = new T.SphereGeometry(.43, 22, 16); GEO.rbead = new T.SphereGeometry(.36, 18, 12);
    GEO.torus = new T.TorusGeometry(.62, .14, 12, 40); GEO.stalk = new T.CylinderGeometry(.2, .26, 1.6, 12); GEO.cup = new T.TorusGeometry(.8, .24, 14, 28, Math.PI);
    GEO.stick = new T.CylinderGeometry(.09, .09, 1.2, 6);
    GEO.malC = new T.SphereGeometry(.3, 18, 12); GEO.malN = new T.SphereGeometry(.34, 18, 12); GEO.malO = new T.SphereGeometry(.27, 16, 12);
    GEO.lk = new T.SphereGeometry(.3, 18, 12); GEO.cAt = new T.SphereGeometry(.24, 16, 12); GEO.resB = new T.SphereGeometry(.42, 20, 14); GEO.ringB = new T.TorusGeometry(1.05, .12, 10, 40);
    GEO.stalkI = new T.CylinderGeometry(.32, .4, 3.2, 14); GEO.prop = new T.TorusGeometry(.75, .35, 12, 7); GEO.lobe = new T.SphereGeometry(.85, 24, 16); GEO.ion = new T.SphereGeometry(.28, 16, 12); GEO.oAt = new T.SphereGeometry(.24, 14, 10); GEO.hAt = new T.SphereGeometry(.17, 12, 8);
    GEO.nAt = new T.SphereGeometry(.26, 16, 12); GEO.sAt = new T.SphereGeometry(.32, 18, 12); GEO.arom = new T.TorusGeometry(.4, .06, 8, 28); GEO.pocket = new T.TorusGeometry(.55, .14, 10, 28); GEO.bond = new T.CylinderGeometry(.09, .09, 1, 8); GEO.bondCC = new T.CylinderGeometry(.075, .075, 1, 8); GEO.bondFat = new T.CylinderGeometry(.16, .16, 1, 12);
    GEO.pbead = new T.SphereGeometry(.4, 18, 12); GEO.sS = new T.SphereGeometry(.42, 20, 14); GEO.sH = new T.SphereGeometry(.2, 12, 8);
    GEO.ome = new T.SphereGeometry(.5, 22, 16); GEO.ome2 = new T.SphereGeometry(.4, 20, 14); GEO.cap = new T.SphereGeometry(.42, 20, 14);
    GEO.lys = new T.CylinderGeometry(.16, .2, 1.2, 10); GEO.amine = new T.SphereGeometry(.42, 20, 14);
    GEO.plga = new T.SphereGeometry(.4, 16, 12); GEO.pres = new T.SphereGeometry(.27, 14, 10);
    GEO.wO = new T.SphereGeometry(.26, 12, 8); GEO.wH = new T.SphereGeometry(.15, 10, 6);
    const tail = sx => { const pts = []; for (let i = 0; i <= 10; i++) { const f = i / 10; pts.push(V(sx * (.28 + f * .25) + Math.sin(f * 7 + sx) * .14, -.5 - f * 3.1, Math.cos(f * 6) * .12 * sx)); }
      return new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, .2, 10, false); };
    GEO.tailL = tail(-1); GEO.tailR = tail(1);
    MAT.lhead = phys(hex(LOOK.lipidHead), { roughness: .18 }); MAT.ltail = phys(hex(LOOK.lipidTail), { roughness: .4, clearcoat: .3 });
    MAT.core = phys(0x2E7BC8, { transparent: true, opacity: .45, roughness: .3, depthWrite: false });
    const cA = hex(C.a), cL = hex(C.accent), cB = hex(C.b), dark = c => new T.Color(c).multiplyScalar(.28);
    MAT.dspe = phys(cA, { emissive: dark(cA), emissiveIntensity: .25 }); MAT.dspeT = phys(cA, { emissive: dark(cA), emissiveIntensity: .2 });
    MAT.peg = phys(cL, { emissive: dark(cL), emissiveIntensity: .3 });
    MAT.rgd = phys(cB, { emissive: dark(cB), emissiveIntensity: .5 }); MAT.rgdT = phys(cB, { transparent: true, opacity: .75, emissive: dark(cB), emissiveIntensity: .5 });
    MAT.cell = phys(0x2A6CB0, { roughness: .55, clearcoat: .4, transparent: true, opacity: .92 });
    MAT.rec = phys(0xE8F3FF, { emissive: 0x7a50ff, emissiveIntensity: 0 });
    MAT.nano = phys(0x7CC6EE, { roughness: .12 });
    MAT.shell = new T.MeshBasicMaterial({ color: 0x8fe3ff, transparent: true, opacity: .1, depthWrite: false, side: T.DoubleSide });
    MAT.water = phys(0xEFFBFF, { transparent: true, opacity: .8, roughness: .05, emissive: 0x2a6f99, emissiveIntensity: .3 });
    MAT.section = new T.MeshBasicMaterial({ map: hatchTex(), transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
    MAT.malO = phys(new T.Color(cB).lerp(new T.Color(0xffffff), .55).getHex(), { emissive: dark(cB), emissiveIntensity: .3 });
    MAT.malCC = phys(0xFFF2FA, { emissive: new T.Color(cB), emissiveIntensity: .9 });
    MAT.pep = phys(0xC9B8FF, { roughness: .3, emissive: 0x2a1f5a, emissiveIntensity: .3 });
    MAT.S = phys(0xFFD54A, { emissive: 0x7a5a00, emissiveIntensity: .6 }); MAT.H = phys(0xF4F8FF, { roughness: .15 });
    MAT.prot = phys(0xD9779F, { roughness: .35, clearcoat: .6, emissive: 0x3a0f24, emissiveIntensity: .3 }); MAT.prot2 = phys(0x8C7FB8, { roughness: .4, clearcoat: .5 });
    MAT.lysC = phys(0xE9D6E0, { roughness: .3 }); MAT.amine = phys(0x5C8DFF, { emissive: 0x2244aa, emissiveIntensity: .3 });
    MAT.amide = phys(cB, { emissive: dark(cB), emissiveIntensity: .6 }); MAT.dead = phys(0x7D8796, { roughness: .5, clearcoat: .2 });
    MAT.bond = new T.MeshBasicMaterial({ color: 0xFFF1C9 });
    MAT.dbcoC = phys(cA, { emissive: dark(cA), emissiveIntensity: .35 }); MAT.dbcoB = phys(0xFFE2B8, { roughness: .3 });
    MAT.alk = phys(0xFFF4DA, { emissive: new T.Color(cA), emissiveIntensity: 1 }); MAT.N3 = phys(0x5C8DFF, { emissive: 0x2a4fd0, emissiveIntensity: .5 });
    MAT.N3b = phys(0x9DB8FF, { emissive: 0x2a4fd0, emissiveIntensity: .4 });
    MAT.sav = phys(0x8C7FB8, { roughness: .4, clearcoat: .5, emissive: 0x39d27a, emissiveIntensity: 0 }); MAT.sav2 = phys(0x8C7FB8, { roughness: .4, clearcoat: .5, emissive: 0x7a5cff, emissiveIntensity: 0 }); MAT.glyco = phys(0xD8E6F5, { roughness: .45, transparent: true, opacity: .75 });
    MAT.azSugar = phys(0x9DB8FF, { emissive: 0x2a4fd0, emissiveIntensity: .5 }); MAT.pocket = phys(0x2B2250, { roughness: .6, emissive: 0x6a4fd0, emissiveIntensity: .3 });
    MAT.resR = phys(0x5C8DFF, { emissive: 0x2244aa, emissiveIntensity: .3 }); MAT.resG = phys(0xC9D3E3, { roughness: .3 });
    MAT.resD = phys(0xFF6B6B, { emissive: 0x551515, emissiveIntensity: .3 }); MAT.resF = phys(0xB98CFF, { emissive: 0x3a1f6a, emissiveIntensity: .3 });
    MAT.intA = phys(0x7FB7E8, { roughness: .4, clearcoat: .5, emissive: 0x1a3a6a, emissiveIntensity: 0 }); MAT.intB = phys(0x9ED6B8, { roughness: .4, clearcoat: .5, emissive: 0x1a5a3a, emissiveIntensity: 0 });
    MAT.ion = phys(0xFFFFFF, { emissive: 0x9fe8ff, emissiveIntensity: .8 });
    MAT.gold = phys(0xF2C25A, { metalness: 1, roughness: .22, clearcoat: .6, emissive: 0x3a2400, emissiveIntensity: .2 });
    MAT.hyd = phys(hex(window.HYD_COL || 0x9BE15D), { emissive: new T.Color(hex(window.HYD_COL || 0x9BE15D)).multiplyScalar(.4), emissiveIntensity: .5 });
    MAT.plga = phys(0xffffff, { roughness: .3, emissive: dark(cA), emissiveIntensity: .25 });
    MAT.plgaCore = phys(cA, { transparent: true, opacity: .32, roughness: .35, depthWrite: false, emissive: dark(cA), emissiveIntensity: .3 });
    MAT.oil = phys(0xFFD9A0, { transparent: true, opacity: .28, roughness: .05, depthWrite: false, emissive: 0x3a2400, emissiveIntensity: .2 });
    MAT.wO = phys(0xFF7A7A, { roughness: .2, emissive: 0x551515, emissiveIntensity: .3 }); MAT.wH = phys(0xF4F8FF, { roughness: .2 });
    MAT.glass = phys(0xCFEFFF, { transparent: true, opacity: .22, roughness: .05, depthWrite: false, side: T.DoubleSide });
    MAT.capV = phys(0x2B3A55, { roughness: .35 }); MAT.powder = phys(0xF3F6FA, { roughness: .7, clearcoat: 0 });
    MAT.argon = new T.MeshBasicMaterial({ color: 0xC9B6FF, transparent: true, opacity: .55, depthWrite: false });
    MAT.frost = new T.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: .8, depthWrite: false });
    MAT.bok = new T.MeshBasicMaterial({ color: 0xbfeeff, transparent: true, opacity: .22, depthWrite: false });
    MAT.trail = new T.MeshBasicMaterial({ color: 0xd9ccff, transparent: true, opacity: .9 });

    // ambient bokeh: soft spheres drifting through the whole world
    bok = new T.InstancedMesh(new T.SphereGeometry(1, 12, 8), MAT.bok, 90); bok.frustumCulled = false; scene.add(bok);
    const r = rnd(99); bok.seeds = [...Array(90)].map(() => [r() * 120 - 60, r() * 70 - 35, -r() * 90 + 10, .12 + r() * .45, .3 + r() * .8, r() * 6]);

    for (const id in W3.defs) { const d = W3.defs[id]; d.g = new T.Group(); d.g.visible = false; scene.add(d.g); d.build(d.g, W3); }
  };
  // reaction helpers: world position of any mesh / lysine amine, and the placement that puts a molecule's head on a target point
  const wpos = obj => { obj.updateWorldMatrix(true, false); return obj.getWorldPosition(V()); };
  const amineOf = lys => wpos(lys.N);
  // aimMol(mol, target, from, k): place `mol` so its tip sits at target when k = 1, approaching along (target - from); call after pose()
  function aimMol(m, target, from, k = 1, spin = 0) {
    const dir = target.clone().sub(from).normalize(), L = m.tip.length();
    m.place(target.clone().addScaledVector(dir, -L - (1 - k) * 6), dir, spin); return m;
  }
  W3.lib = { V, integrin, gold, glowTex, Azide, strept, Micelle, Lipo, Bilayer, Mol, Pep, seg, bond, setBond, protein, lysine, Waters, vial, receptor, nano, fib, wpos, amineOf, aimMol, MAT, GEO, T };
  W3.has = id => !!W3.defs[id];
  let anchor = [0, 0];
  W3.render = function (id, lt, E, beat, anch, t) {
    anchor = anch;
    for (const k in W3.defs) W3.defs[k].g.visible = k === id;
    // bokeh drift (deterministic in t)
    bok.seeds.forEach(([x, y, z, s, v, ph], i) => { _p.set(x + Math.sin(t * .3 + ph) * 2, ((y + t * v + 35) % 70 + 70) % 70 - 35, z); _s.setScalar(s); _m.compose(_p, _q.identity(), _s); bok.setMatrixAt(i, _m); });
    bok.instanceMatrix.needsUpdate = true;
    MAT.rgd.emissiveIntensity = .5; MAT.rec.emissiveIntensity = 0; bloom.strength = .35; MAT.dspe.emissiveIntensity = .25;
    MAT.malCC.emissiveIntensity = .9; MAT.hyd.emissiveIntensity = .5; MAT.alk.emissiveIntensity = 1; MAT.resR.emissiveIntensity = MAT.resD.emissiveIntensity = .3; MAT.intA.emissiveIntensity = MAT.intB.emissiveIntensity = 0; MAT.ion.emissiveIntensity = .8; MAT.N3.emissiveIntensity = .5; MAT.sav.emissiveIntensity = 0; MAT.sav2.emissiveIntensity = 0; MAT.pocket.emissiveIntensity = .3; MAT.S.emissiveIntensity = .6; MAT.amine.emissiveIntensity = .3; MAT.amide.emissiveIntensity = .6; MAT.prot.emissiveIntensity = .3;
    const d = W3.defs[id];
    if (d) d.update(lt, E, beat, W3);
    cam.setViewOffset(Wd, Ht, Wd / 2 - anchor[0], Ht / 2 - anchor[1], Wd, Ht);
    cam.updateMatrixWorld();
    comp.render();
  };
  W3.cam = (p, look, fov = 35) => { cam.position.copy(p); cam.fov = fov; cam.updateProjectionMatrix(); cam.lookAt(look); };
  W3.bloom = v => { bloom.strength = v * .7; };
  // world point → stage coordinates (1000×1000 stage placed by `lay`)
  W3.stage = (lay, p) => {
    cam.updateMatrixWorld(); const v = p.clone().project(cam);
    const sx = (v.x + 1) / 2 * Wd, sy = (1 - v.y) / 2 * Ht;
    return [(sx - lay.x) / lay.s, (sy - lay.y) / lay.s];
  };
})();
