// 萃取：为什么少量多次更好？ — scenes. Template: chem-experiment-video (index.html, lib.js, chem.js).
// Colours: C.a = 产物「小油」 (and its tint in a layer), ETHER = 乙醚层 (schematic pale yellow), C.solvent = 水层.

const ETHER = '#F7E6A6', PROD = '#5E78E0';
const tint = (base, c) => mixCol(base, PROD, clamp(c) * .8);   // how much product a layer holds, as colour
// interface height in funnel coordinates for a given fill / split (see setFunnel)
const ifaceY = (fill, split) => { const yTop = -300 + 290 * (1 - fill); return 140 - (140 - yTop) * split; };

const QUIZ = {
  q: '如果 K 只有 0.5，多萃几次还有用吗？', qen: 'If K is only 0.5, do more extractions help?',
  options: [['没用，一次就够', 'No use at all'], ['有用，但提升很小，最好换萃取剂', 'A little — better change the solvent'], ['和 K = 4 时一样好', 'Just as good as K = 4']],
  answer: 1, explain: ['一次约带走 33%，三次约 37%', 'K 太小 → 换一种萃取剂'],
};
function buildQuiz(s, g) {
  txt(g, '小测验', 40, 40, { size: 60, weight: 900 }); small(g, 'Quick check', 40, 80, { size: 26 });
  s.qz = quiz(g, QUIZ.q, QUIZ.qen, QUIZ.options, QUIZ.answer); setT(s.qz.g, 40, 130);
  s.ex = QUIZ.explain.map((line, i) => txt(g, line, 500, 790 + i * 52, { size: 36, weight: 800, anchor: 'middle' }));
}

// ---------- the molecular hop model shared by `hop` and `ratio` (seconds since `hop` started) ----------
// 10 product molecules start in water; 8 end in ether, 2 in water (equal volumes, K = 4). After settling,
// pairs keep swapping (one up, one down) so the equilibrium stays visibly dynamic while the counts hold.
const HOP = (() => {
  const r = rnd(21), N = 10, ev = [...Array(N)].map(() => []), CROSS = .7;
  for (let i = 0; i < N; i++) {
    const n = i < 8 ? (r() < .55 ? 1 : 3) : (i === 8 ? 2 : 0);
    const ts = [...Array(n)].map(() => 3.0 + r() * 7.6).sort((a, b) => a - b);
    for (let k = 1; k < ts.length; k++) ts[k] = Math.max(ts[k], ts[k - 1] + 1.1);
    ev[i].push(...ts);
  }
  // swaps toggle a fixed (ether, water) pair together, so the 8 : 2 count never changes
  for (let k = 0; k < 6; k++) { const t = 12.2 + k * 2.1, [a, b] = k % 2 ? [5, 9] : [2, 8]; ev[a].push(t); ev[b].push(t); }
  ev.forEach(e => e.sort((a, b) => a - b));
  return { N, ev, CROSS };
})();
function hopState(i, t) {   // → { up: in ether?, k: crossing progress or -1, from, to }
  const e = HOP.ev[i]; let n = 0;
  for (const at of e) {
    if (t < at) break;
    if (t < at + HOP.CROSS) return { up: n % 2 === 1, k: (t - at) / HOP.CROSS, fromUp: n % 2 === 1 };
    n++;
  }
  return { up: n % 2 === 1, k: -1 };
}
const IFACE = 480, ETH_Y = [230, 420], WAT_Y = [550, 880];
function buildHop(s, g) {
  el('rect', { x: -40, y: 40, width: 1080, height: IFACE - 40, fill: ETHER, opacity: .55 }, g);
  el('rect', { x: -40, y: IFACE, width: 1080, height: 920 - IFACE, fill: C.solvent, opacity: .8 }, g);
  el('line', { x1: -40, x2: 1040, y1: IFACE, y2: IFACE, stroke: C.paper, 'stroke-width': 3, 'stroke-dasharray': '10 8' }, g);
  txt(g, '乙醚', 40, 90, { size: 34, weight: 800, fill: '#9A8642' });
  txt(g, '水', 40, IFACE + 60, { size: 34, weight: 800, fill: '#5A8FB0' });
  const r = rnd(4);
  s.amb = [...Array(30)].map((_, j) => ({ up: j < 14, x: r() * 1000, y: r(), v: .5 + r(),
    e: el('circle', { r: j < 14 ? 6 : 5, fill: j < 14 ? '#C8B36A' : '#7FB3D0', opacity: .7 }, g) }));
  s.ms = [...Array(HOP.N)].map((_, i) => mol(g, { col: C.a, r: i ? 28 : 42, seed: i }));
  s.tagHero = nameTag(g, '小油', '产物分子（示意）', { size: 38 });
  s.cE = tagPill(g, '乙醚层  0', 'info', 32); s.cW = tagPill(g, '水层  10', 'info', 32);
  s.cEt = s.cE.querySelector('text'); s.cWt = s.cW.querySelector('text');
}
function runHop(s, lt, ht, o = {}) {   // ht = seconds since `hop` started
  s.amb.forEach((p, j) => { const y0 = p.up ? 60 : IFACE + 20, hh = p.up ? IFACE - 80 : 380;
    p.e.setAttribute('cx', (p.x + lt * 18 * p.v) % 1000); p.e.setAttribute('cy', y0 + p.y * hh + Math.sin(lt * p.v + j) * 10); });
  let nE = 0;
  s.ms.forEach((m, i) => {
    const st = hopState(i, ht), x = 150 + i * 75 + Math.sin(ht * .8 + i * 2) * 18;
    const yE = lerp(ETH_Y[0], ETH_Y[1], ((i * 37) % 100) / 100) + Math.sin(ht * 1.1 + i) * 14;
    const yW = lerp(WAT_Y[0], WAT_Y[1], ((i * 53) % 100) / 100) + Math.sin(ht * 1.3 + i) * 14;
    let y = st.up ? yE : yW;
    if (st.k >= 0) { const e = ease(st.k); y = st.fromUp ? lerp(yE, yW, e) : lerp(yW, yE, e); y -= Math.sin(e * Math.PI) * 30; }
    const inE = st.k >= 0 ? (st.fromUp ? st.k < .5 : st.k >= .5) : st.up; if (inE) nE++;
    poseMol(m, lt, x, y, { o: clamp((ht + .3) * 3), look: [0, st.up ? -1 : (o.lookUp ? -1 : 0)] });
    if (i === 0) s.hero = [x, y];
  });
  s.cEt.textContent = `乙醚层  ${nE}`; s.cWt.textContent = `水层  ${HOP.N - nE}`;
  return nE;
}

const SCENE_DEFS = {
  // ---------- 钩子：同样的乙醚，一次 vs 三次 ----------
  hook: {
    full: true, scale: '1 cm',
    build(g) {
      const s = this;
      s.fs = [0, 1].map(() => sepFunnel(g));
      s.lb = [tagPill(g, '一次用完 30 mL', 'info', 32), tagPill(g, '分三次 × 10 mL', 'info', 32)];
      s.mt = [meterBar(g, '带走', C.a, { w: 250 }), meterBar(g, '带走', C.a, { w: 250 })];
      setT(s.mt[0].g, 90, 780); setT(s.mt[1].g, 560, 780);
      s.q = txt(g, '?', 0, 0, { size: 150, weight: 900, fill: C.accentHi, anchor: 'middle' });
      s.note = schematicNote(g, '颜色为示意，K=4 为设定值'); setT(s.note, 330, 870);
    },
    update(lt, E) {
      const s = this;
      [[270, 0, E('一次用完'), E('八成'), .8, '80%'], [730, 1, E('分三次用'), E('九成多'), .92, '92%']].forEach(([x, i, tl, tv, v, lab]) => {
        const k = SP.heavy(lt + .1 - i * .15), done = ease((lt - tv + .8) / .8);
        setFunnel(s.fs[i], { x, y: 500 + (1 - k) * 60, s: 1.05, o: clamp(k * 3), fill: .85, split: .5,
          top: tint(ETHER, lerp(.1, v, done)), bottom: tint(C.solvent, lerp(.9, 1 - v, done)), tilt: Math.sin(lt * 1.6 + i) * 2 });
        popAt(s.lb[i], lt, tl, x, 120, { s0: .6 });
        op(s.mt[i].g, clamp((lt - tl) / .3)); setMeter(s.mt[i], v * done, Math.round(v * 100 * done) + '%');
      });
      popAt(s.q, lt, E('为什么'), 500, 520 + bob(lt, 1, 8), { s0: .3 });
      op(s.note, (lt - E('九成多')) / .5);
    },
  },

  // ---------- 分液漏斗萃取：加乙醚、振荡、放气、分层 ----------
  setup: {
    en: 'Shake, vent, let it settle',
    build(g) {
      const s = this;
      s.bk = vessel(g, 'beaker', { w: 120, h: 150 });
      s.f = sepFunnel(g);
      s.puff = el('g', {}, g);
      [0, 1, 2].forEach(j => el('circle', { cx: j * 26, cy: -j * 18, r: 16 + j * 6, fill: '#fff', stroke: C.grid, 'stroke-width': 3 }, s.puff));
      s.vent = tagPill(g, '放气', 'warn', 32);
      s.lE = tagPill(g, '乙醚层（上）', 'info', 30); s.lW = tagPill(g, '水层（下）', 'info', 30);
      s.dens = small(g, '乙醚 0.71 g/mL < 水 1.00 g/mL', 500, 900, { anchor: 'middle', size: 26 });
      s.safe = safetyBadge(g, '乙醚易挥发 · 放气时出口别对着人');
    },
    update(lt, E) {
      const s = this, tPour = E('倒进乙醚'), tShake = E('振荡'), tVent = E('放气'), tSettle = E('两层');
      const pour = ease((lt - tPour) / 1.2), shakeOn = lt > tShake && lt < tSettle - .3;
      const tilt = shakeOn ? Math.sin((lt - tShake) * 11) * 28 * clamp((lt - tShake) / .3) * clamp((tSettle - .3 - lt) / .3) : 0;
      const mix = lt < tShake ? 0 : lt < tSettle ? 1 : 1 - ease((lt - tSettle) / 1.2);
      const moved = ease((lt - tShake) / (tSettle - tShake + 1));   // product passes into the ether while shaking
      const fill = lerp(.45, .85, pour), split = lerp(1, .5, pour);
      setFunnel(s.f, { x: 500, y: 470, s: 1.15, fill, split, mix, tilt, top: tint(ETHER, .75 * moved), bottom: tint(C.solvent, lerp(.95, .2, moved)) });
      // beaker of ether pouring in from the right
      const bk = SP.card(lt - tPour + .6) * (1 - clamp((lt - tPour - 1.6) / .4));
      s.bk.g.setAttribute('transform', `translate(${780 - pour * 40} ${150}) rotate(${-pour * 70})`); op(s.bk.g, clamp(bk * 2));
      setVessel(s.bk, { level: lerp(.7, .05, pour), col: ETHER });
      const vk = clamp((lt - tVent) / 1.2);
      op(s.puff, vk > 0 && vk < 1 ? 1 - vk : 0); s.puff.setAttribute('transform', `translate(${520 + vk * 40} ${640 - vk * 60}) scale(${.6 + vk})`);
      popAt(s.vent, lt, tVent, 660, 650, { s0: .5, out: tVent + 1.6 });
      const yI = 470 + 1.15 * ifaceY(fill, split), yT = 470 + 1.15 * (-300 + 290 * (1 - fill));
      popAt(s.lE, lt, E('在上层') - .3, 790, (yT + yI) / 2, { kind: 'card', s0: .8 });
      popAt(s.lW, lt, E('在上层') + .1, 790, (yI + 470 + 1.15 * 140) / 2, { kind: 'card', s0: .8 });
      op(s.dens, (lt - E('在上层')) / .5);
      popAt(s.safe, lt, tVent + .3, 90, 30, { kind: 'card', s0: .8, out: E('在上层') - .4 });
    },
  },

  // ---------- 一尺镜：推进到两层的交界 ----------
  dive: {
    en: 'Zoom into the interface', still: true,
    scale: [[0, '1 cm'], ['交界', '1 mm'], [4.2, '1 μm'], ['一千万倍', '1 nm']],
    build(g) {
      const s = this; s.world = el('g', {}, g); s.f = sepFunnel(s.world);
      s.mag = el('g', {}, g);
      el('line', { x1: 70, y1: 70, x2: 150, y2: 150, stroke: C.paper, 'stroke-width': 18, 'stroke-linecap': 'round' }, s.mag);
      el('circle', { r: 100, fill: '#fff', 'fill-opacity': .15, stroke: C.accent, 'stroke-width': 12 }, s.mag);
      s.lbl = tagPill(g, '一尺镜', 'warn', 30);
      const r = rnd(5); s.dots = [...Array(40)].map((_, j) => ({ x: r() * 1000, y: r() * 1000, e: el('circle', { r: 4 + r() * 9, fill: j % 2 ? '#C8B36A' : '#7FB3D0' }, g) }));
    },
    update(lt, E) {
      const s = this, cx = 500, yI = 470 + 1.15 * ifaceY(.85, .5);
      setFunnel(s.f, { x: 500, y: 470, s: 1.15, fill: .85, split: .5, top: tint(ETHER, .75), bottom: tint(C.solvent, .2), tilt: Math.sin(lt) * 1.5 });
      const fly = SP.card(lt - E('一尺镜')), lock = SP.heavy(lt - E('交界'));
      const mx = lerp(lerp(900, 760, fly), cx, lock), my = lerp(lerp(140, 230, fly), yI, lock);
      popAt(s.lbl, lt, E('一尺镜') + .2, mx + 130, my - 110, { out: E('交界') + .4 });
      const z = 1 + 1.3 * ease((lt - E('交界') - .4) / .6) + 2.5 * ease((lt - 4.2) / .6) + 9 * ease((lt - E('一千万倍')) / 1.2);
      s.world.setAttribute('transform', `translate(${cx} ${yI}) scale(${z}) translate(${-cx} ${-yI})`);
      setT(s.mag, mx, my, .78 * Math.min(z, 3)); op(s.mag, clamp(fly * 3));
      const gz = clamp((z - 2) / 4);
      s.dots.forEach((p, i) => { const k = (lt * (.6 + (i % 5) * .2)) % 1, sc = 1 + k * 3;
        p.e.setAttribute('cx', cx + (p.x - cx) * sc); p.e.setAttribute('cy', yI + (p.y - 500) * sc); op(p.e, gz * (1 - k)); });
    },
  },

  // ---------- 小油在两层之间跳 ----------
  hop: {
    en: 'Hopping across the interface', scale: '1 nm', enter: 'zoomIn',
    build(g) { buildHop(this, g); },
    update(lt, E) {
      const s = this; runHop(s, lt, lt, { lookUp: lt > E('更喜欢乙醚') });
      const [hx, hy] = s.hero;
      popAt(s.tagHero, lt, E('小油'), hx, hy + 80, { kind: 'card', s0: .7, out: E('来回跳') + 1.2 });
      popAt(s.cE, lt, E('来回跳'), 870, 110, { s0: .7 }); popAt(s.cW, lt, E('来回跳') + .15, 870, IFACE + 50, { s0: .7 });
    },
  },

  // ---------- 分配系数 K（同一个画面继续） ----------
  ratio: {
    en: 'The distribution coefficient', scale: '1 nm', enter: 'none',
    build(g) {
      const s = this; buildHop(s, g);
      s.card = termCard(g, '分配系数 K', 'K = 乙醚中浓度 ÷ 水中浓度', { size: 46 });
      s.kTag = tagPill(g, 'K = 4（设定值）', 'warn', 36);
      s.ratioT = tagPill(g, '乙醚 8 ∶ 水 2', 'good', 34);
    },
    update(lt, E) {
      const s = this, ht = lt + (s.sc.start - TL.scenes.find(x => x.id === 'hop').start);
      runHop(s, lt, ht, { lookUp: true }); op(s.tagHero, 0);
      setT(s.cE, 870, 110); setT(s.cW, 870, IFACE + 50);
      popAt(s.ratioT, lt, E('固定比例'), 500, IFACE, { s0: .6 });
      popAt(s.card, lt, E('分配系数'), 500, 150, { kind: 'card', s0: .8 });
      popAt(s.kTag, lt, E('等于四'), 500, 300, { s0: .5 });
    },
  },

  // ---------- 回到漏斗：一次用完 30 mL ----------
  once: {
    en: 'One 30 mL portion', scale: '1 cm', enter: 'zoomOut',
    build(g) {
      const s = this; s.f = sepFunnel(g);
      s.lE = tagPill(g, '乙醚 30 mL', 'info', 28); s.lW = tagPill(g, '水 30 mL', 'info', 28);
      s.mt = meterBar(g, '水里还剩的产物', C.a, { w: 300 }); setT(s.mt.g, 480, 640);
      s.note = schematicNote(g, 'K = 4，示意'); setT(s.note, 480, 720);
    },
    update(lt, E) {
      const s = this, t1 = E('一次萃取'), t2 = E('百分之二十');
      const shake = lt > t1 && lt < t1 + 1.2 ? Math.sin((lt - t1) * 11) * 20 * Math.sin((lt - t1) / 1.2 * Math.PI) : 0;
      const moved = ease((lt - t1) / (t2 - t1 + .2));
      setFunnel(s.f, { x: 270, y: 500, s: 1.2, fill: .85, split: .5, tilt: shake + Math.sin(lt) * 1.5,
        top: tint(ETHER, .8 * moved), bottom: tint(C.solvent, lerp(.95, .2, moved)) });
      const yI = 500 + 1.2 * ifaceY(.85, .5), yT = 500 + 1.2 * (-300 + 290 * .15);
      popAt(s.lE, lt, .3, 530, (yT + yI) / 2, { kind: 'card', s0: .8 }); popAt(s.lW, lt, .5, 530, (yI + 500 + 1.2 * 140) / 2, { kind: 'card', s0: .8 });
      const v = lerp(1, .2, moved); op(s.mt.g, clamp((lt - .6) / .4)); setMeter(s.mt, v, Math.round(v * 100) + '%');
      op(s.note, (lt - t2) / .5);
    },
  },

  // ---------- 分三次，每次 10 mL ----------
  thrice: {
    en: 'Three 10 mL portions', scale: '1 cm',
    build(g) {
      const s = this;
      s.fs = [0, 1, 2].map(() => sepFunnel(g));
      s.fl = ['第 1 次', '第 2 次', '第 3 次'].map(t => txt(g, t, 0, 0, { size: 30, weight: 800, anchor: 'middle' }));
      el('line', { x1: 80, x2: 780, y1: 900, y2: 900, stroke: C.paper, 'stroke-width': 4 }, g);
      s.line20 = el('line', { x1: 80, x2: 780, y1: 900 - 330 * .2, y2: 900 - 330 * .2, stroke: C.bad, 'stroke-width': 3, 'stroke-dasharray': '10 8' }, g);
      s.line20T = txt(g, '一次用完：20%', 790, 900 - 330 * .2 + 10, { size: 27, weight: 800, fill: C.bad });
      s.bars = [1, .429, .184, .079].map((v, i) => ({ v, r: el('rect', { x: 110 + i * 175, width: 110, rx: 10, fill: i ? C.a : '#9DAAE8' }, g),
        t: txt(g, Math.round(v * 100) + '%', 165 + i * 175, 0, { size: 34, weight: 900, anchor: 'middle', fill: C.a }) }));
      s.cap = txt(g, '水里还剩的产物', 400, 520, { size: 28, weight: 700, fill: C.dim });
    },
    update(lt, E) {
      const s = this, ts = [E('每次十毫升') - .3, E('百分之四十三'), E('百分之十八'), E('百分之八')];
      s.fs.forEach((f, j) => {
        const at = ts[j + 1], k = SP.card(lt - .1 - j * .15), moved = ease((lt - at + 1) / 1);
        const sh = lt > at - 1 && lt < at ? Math.sin((lt - at) * 11) * 16 * Math.sin((lt - at + 1) * Math.PI) : 0;
        const prev = [1, .429, .184][j];
        setFunnel(f, { x: 180 + j * 320, y: 330 + (1 - k) * 40, s: .55, o: clamp(k * 3), fill: .62, split: .75, tilt: sh,
          top: tint(ETHER, .7 * moved), bottom: tint(C.solvent, lerp(.95 * prev, .95 * prev * .43, moved)) });
        setT(s.fl[j], 180 + j * 320, 120); op(s.fl[j], k);
      });
      s.bars.forEach((b, i) => { const k = SP.heavy(lt - ts[i]), h = 330 * b.v * clamp(k);
        b.r.setAttribute('y', 900 - h); b.r.setAttribute('height', Math.max(0, h)); op(b.r, k > 0 ? 1 : 0);
        b.t.setAttribute('y', 900 - h - 14); op(b.t, (lt - ts[i]) / .3); });
      op(s.cap, (lt - ts[0]) / .3);
      const l = clamp((lt - E('百分之八') - .3) / .4); op(s.line20, l); op(s.line20T, l);
    },
  },

  // ---------- 比例相乘 ----------
  why: {
    en: 'The fractions multiply', scale: null,
    build(g) {
      const s = this, r = rnd(31);
      s.grids = [0, 1].map(gi => { const order = [...Array(100).keys()].map(i => [r(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
        const rank = []; order.forEach((idx, k) => { rank[idx] = k; });
        return [...Array(100)].map((_, i) => ({ i, rank: rank[i], x: (gi ? 590 : 120) + (i % 10) * 28, y: 300 + Math.floor(i / 10) * 28,
          e: el('circle', { r: 10, fill: C.a }, g) })); });
      s.hd = [txt(g, '一次 30 mL', 245, 260, { size: 34, weight: 900, anchor: 'middle' }), txt(g, '3 次 × 10 mL', 715, 260, { size: 34, weight: 900, anchor: 'middle' })];
      s.cnt = [txt(g, '', 245, 620, { size: 34, weight: 900, anchor: 'middle', fill: C.a }), txt(g, '', 715, 620, { size: 34, weight: 900, anchor: 'middle', fill: C.a })];
      s.f1 = txt(g, '剩 1/5 = 20%', 245, 690, { size: 32, weight: 800, anchor: 'middle' });
      s.f2 = txt(g, '剩 (3/7)³ ≈ 8%', 715, 690, { size: 32, weight: 800, anchor: 'middle' });
      s.bar = conclusionBar(g, '同样的溶剂：少量多次 → 剩得更少', { size: 34 });
      s.tag = tagPill(g, '一般萃 3 次', 'good', 34);
      s.cap = small(g, '每个点 = 1% 的产物（示意）', 500, 200, { anchor: 'middle', size: 24 });
    },
    update(lt, E) {
      const s = this, t1 = E('同样的一份'), t3 = E('三份相乘');
      const left = lt < .8 ? 100 : Math.round(lerp(100, 20, ease((lt - .8) / 1)));
      const steps = [[t1 - .6, 43], [t1 + .5, 18], [t3 - .3, 8]];
      let right = 100; steps.forEach(([at, v], k) => { const pv = k ? steps[k - 1][1] : 100; if (lt >= at) right = Math.round(lerp(pv, v, ease((lt - at) / .7))); });
      [[0, left], [1, right]].forEach(([gi, n]) => s.grids[gi].forEach(d => {
        const gone = d.rank >= n, k = gone ? 1 : 0;
        d.e.setAttribute('cx', d.x); d.e.setAttribute('cy', d.y + bob(lt, d.i, 2)); op(d.e, gone ? .12 : 1); d.e.setAttribute('fill', gone ? C.grid : C.a); }));
      s.cnt[0].textContent = `剩 ${left}`; s.cnt[1].textContent = `剩 ${right}`;
      s.hd.forEach((h, i) => op(h, (lt - .1 - i * .2) / .3)); op(s.cap, (lt - .4) / .4);
      op(s.f1, (lt - 2) / .4); op(s.f2, (lt - t3) / .4);
      popAt(s.bar, lt, E('少量多次'), 500, 790, { kind: 'card', s0: .9, dy: 30 });
      popAt(s.tag, lt, E('三次就够'), 500, 880, { s0: .5 });
    },
  },

  // ---------- 操作要点 + 安全 ----------
  practice: {
    en: 'At the bench', scale: '1 cm',
    build(g) {
      const s = this;
      s.bk = vessel(g, 'beaker', { w: 150, h: 140 }); setT(s.bk.g, 290, 900);
      s.bk2 = vessel(g, 'beaker', { w: 150, h: 140 }); setT(s.bk2.g, 110, 900);
      s.bkT = [small(g, '水层', 290, 940, { anchor: 'middle', size: 24 }), small(g, '乙醚层', 110, 940, { anchor: 'middle', size: 24 })];
      s.f = sepFunnel(g);
      s.rows = [['① 下层 → 下口放出', 'lower layer: out through the tap'], ['② 上层 → 上口倒出', 'upper layer: pour from the top']].map(([zh, en]) => {
        const r = el('g', {}, g); txt(r, zh, 0, 0, { size: 36, weight: 900 }); small(r, en, 0, 34, { size: 22 }); return r; });
      s.safe = safetyBadge(g, '乙醚极易燃 · 远离明火 · 通风橱');
      s.dropK = 0;
    },
    update(lt, E) {
      const s = this, tD = E('下口'), tU = E('上口');
      const drain = ease((lt - tD) / 1.6), pourT = clamp((lt - tU) / .6) * (1 - clamp((lt - tU - 2.2) / .6));
      setFunnel(s.f, { x: 290, y: 470, s: 1.05, fill: .85, split: .5, drain, pour: ease((lt - tU - .5) / 1.2), tilt: -40 * ease(pourT) + Math.sin(lt) * 1.2,
        top: tint(ETHER, .7), bottom: tint(C.solvent, .2) });
      setVessel(s.bk, { level: .05 + .55 * drain, col: tint(C.solvent, .2) });
      const pr = ease((lt - tU - .5) / 1.2); setVessel(s.bk2, { level: .05 + .5 * pr, col: tint(ETHER, .7) });
      op(s.bk2.g, clamp((lt - tU + .6) / .4)); op(s.bkT[0], clamp((lt - tD) / .4)); op(s.bkT[1], clamp((lt - tU + .6) / .4));
      [[E('下层'), 0], [tU - .4, 1]].forEach(([at, i]) => { const k = SP.card(lt - at); s.rows[i].setAttribute('transform', `translate(${560 + (1 - k) * 60} ${230 + i * 130})`); op(s.rows[i], k * 2); });
      popAt(s.safe, lt, E('远离明火') - .2, 470, 560, { kind: 'card', s0: .8, dy: 30, s: 1.05 });
    },
  },

  // ---------- 测验（念题 + 静音倒计时）和揭晓 ----------
  quiz: {
    full: true,
    build(g) { buildQuiz(this, g); },
    update(lt, E) {
      const s = this, sc = s.sc, end = sc.end - sc.start, c0 = sc.vo_at - sc.start + sc.vo_dur + .2;
      runQuiz(s.qz, lt, { show: .1, count: [c0, Math.max(3, Math.floor(end - c0 - .2))] });
      s.ex.forEach(e => op(e, 0));
    },
  },
  answer: {
    full: true, enter: 'none',
    build(g) { buildQuiz(this, g); },
    update(lt, E) {
      const s = this; runQuiz(s.qz, lt, { show: -5, reveal: E('答案') - .3 });
      s.ex.forEach((e, i) => { const k = SP.card(lt - E('一点点') + .3 - i * .5); op(e, k * 2); e.setAttribute('transform', `translate(0 ${(1 - k) * 20})`); });
    },
  },

  // ---------- 三件事 + 下期 ----------
  outro: {
    full: true,
    items: [['产物按分配系数 K 分到两层', 'The product splits between layers by K'], ['同样的溶剂，少量多次更彻底', 'Several small portions beat one big one'],
      ['乙醚在上层，振荡要放气', 'Ether on top; vent after shaking']],
    next: ['下期：洗涤与干燥', 'Next: washing and drying'],
    build(g) {
      const s = this, M = TL.meta;
      txt(g, '三件事', 40, 40, { size: 60, weight: 900 }); small(g, 'Three takeaways', 40, 80, { size: 26 });
      s.tk = takeaways(g, s.items, { size: 36 }); setT(s.tk.g, 30, 220);
      s.nx = nextCard(g, s.next[0], s.next[1]);
      s.note = small(g, M.endnote, 500, 900, { anchor: 'middle', size: 24 });
    },
    update(lt, E) {
      const s = this;
      runTakeaways(s.tk, lt, [E('分配系数'), E('少量多次'), E('乙醚在上层')]);
      popAt(s.nx, lt, E('下期'), 500, 700 + Math.sin(lt * 2) * 4, { kind: 'card', dy: 60, s0: .9 });
      op(s.note, (lt - 1) / .5);
    },
  },

  _cues: {
    build(g) {
      const s = this, keys = Object.keys(s.sc.ev), cols = keys.length > 8 ? 3 : 2, w = 900 / cols;
      s.pills = keys.map((k, i) => ({ k, p: pill(g, k, i % 2 ? C.b : C.a, { size: 32, bg: C.bg2 }), x: 50 + w * (i % cols + .5), y: 120 + Math.floor(i / cols) * 105 }));
      T(g, '草稿布局', 500, 960, { size: 28, fill: C.dim, anchor: 'middle' });
    },
    update(lt, E) { this.pills.forEach(({ k, p, x, y }) => { const z = SP.pop(lt - E(k)); setT(p, x, y, z); op(p, z * 3); }); },
  },
};
