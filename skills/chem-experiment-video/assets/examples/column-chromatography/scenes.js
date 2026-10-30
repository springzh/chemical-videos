// 过柱子：为什么能分开？ — scenes. Template: chem-experiment-video (index.html, lib.js, chem.js).
// Colours: C.a = 小非 (toluene, nonpolar), C.b = 小极 (benzyl alcohol, polar), C.accent = Si–OH / –OH / H-bond.

const EA_COL = '#33424C';
const MIX_COL = '#3B4A52';
// Race model shared by `race` and `adsorb` (adsorb continues the same race): seconds since the race started.
const RACE = { t0: 1.5, y0: 40, v: 130, holds: [2.2, 1.4, 1.4, 1.4, 1.4], exitY: 1080, show: 4.1 / 7.8 };
// position of a racer that stops `holds[i]` seconds at each y in `stops`
function racePos(t, y0, v, stops = [], holds = []) {
  let y = y0, rem = t;
  for (let i = 0; i < stops.length; i++) {
    const d = (stops[i] - y) / v; if (rem < d) return { y: y + rem * v, hold: -1 };
    rem -= d; y = stops[i];
    if (rem < holds[i]) return { y, hold: i, hk: rem };
    rem -= holds[i];
  }
  return { y: y + rem * v, hold: -1 };
}
const RACK = { x0: 250, x1: 750, top: 60, bot: 1000, n: 5, flow: 110, particles: 24 };

const QUIZ = {
  q: '展开剂换成纯乙酸乙酯，会怎样？', qen: 'What happens in pure ethyl acetate?',
  options: [['小极先出来', 'The polar one comes out first'], ['两个都冲下来，分不开', 'Both rush out together'], ['两个都不动', 'Neither moves']],
  answer: 1, explain: ['Si–OH 几乎都被乙酸乙酯抢占', '谁都很难握到手，一起冲下去'],
};
function buildQuiz(s, g) {
  txt(g, '小测验', 40, 40, { size: 60, weight: 900 }); small(g, 'Quick check', 40, 80, { size: 26 });
  s.qz = quiz(g, QUIZ.q, QUIZ.qen, QUIZ.options, QUIZ.answer); setT(s.qz.g, 40, 130);
  s.ex = QUIZ.explain.map((line, i) => txt(g, line, 500, 790 + i * 52, { size: 36, weight: 800, anchor: 'middle' }));
}
// a racer track with 小极 and 小非, used by race / adsorb
function buildRace(s, g) {
  s.tr = track(g, RACK);
  s.bond = hbond(g, '氢键 H-bond');
  s.fei = mol(g, { col: C.a, r: 46, seed: 1 });
  s.ji = mol(g, { col: C.b, r: 46, group: 'OH', seed: 2 });
  s.tf = timerPill(g, '小非', C.a); s.tj = timerPill(g, '小极', C.b);
  s.note = schematicNote(g, '计时为示意');
  s.stops = s.tr.sites[1].map(st => st.y);
}
function runRace(s, lt, rt) {   // rt = seconds since the race started (negative = not yet)
  runTrack(s.tr, lt);
  const xf = 360, xj = 490;
  const pf = { y: RACE.y0 + Math.max(0, rt) * RACE.v };
  const pj = racePos(Math.max(0, rt), RACE.y0, RACE.v, s.stops, RACE.holds);
  const inF = pf.y < RACE.exitY, inJ = pj.y < RACE.exitY;
  poseMol(s.fei, lt, xf, pf.y, { o: inF ? clamp((rt + .4) * 3) : 0, look: [0, 1], squash: rt > 0 ? .3 : 0 });
  const tug = pj.hold >= 0 ? Math.sin(Math.min(pj.hk, .5) / .5 * Math.PI) * 10 : 0;   // pulled toward the wall, springs back
  poseMol(s.ji, lt, xj + tug, pj.y, { o: inJ ? clamp((rt + .4) * 3) : 0, look: pj.hold >= 0 ? [1, 0] : [0, 1] });
  s.tr.sites[1].forEach((st, i) => { st.busy = pj.hold === i; });
  if (pj.hold >= 0) {
    const [hx, hy] = grpXY(s.ji, xj + tug, pj.y, 0), [sx, sy] = siteXY(s.tr, 1, pj.hold);
    setBond(s.bond, lt, hx + 28, hy, sx - 26, sy, pj.hk / .25, s.bondTag != null ? lt - s.bondTag : -1);
  } else setBond(s.bond, lt, 0, 0, 0, 0, 0, -1);
  const fEnd = (RACE.exitY - RACE.y0) / RACE.v;
  let jEnd = 0; { let y = RACE.y0, t = 0; s.stops.forEach((sy, i) => { t += (sy - y) / RACE.v + RACE.holds[i]; y = sy; }); jEnd = t + (RACE.exitY - y) / RACE.v; }
  setTimer(s.tf, Math.min(rt, fEnd) * RACE.show); setTimer(s.tj, Math.min(rt, jEnd) * RACE.show);
  return { fEnd, jEnd };
}

const SCENE_DEFS = {
  // ---------- 钩子：一滴混合物在柱中分成两条 ----------
  hook: {
    full: true, scale: '1 cm',
    build(g) {
      const s = this;
      s.col = column(g, { x: 500, y: -200, w: 150, h: 1110, head: 140 });
      s.dr = dropper(g);
      s.q1 = txt(g, '?', 0, 0, { size: 110, weight: 900, fill: C.b, anchor: 'middle' });
      s.q2 = txt(g, '?', 0, 0, { size: 110, weight: 900, fill: C.a, anchor: 'middle' });
      s.note = schematicNote(g, '颜色为示意'); setT(s.note, 600, 760);
    },
    update(lt, E) {
      const s = this, c = s.col, t1 = E('混合物'), t2 = E('流着');
      const dk = SP.heavy(lt + .1);
      setDropper(s.dr, 500, lerp(-420, -150, dk) + (lt > t1 + .8 ? (lt - t1 - .8) * -260 : 0), clamp((lt - t1 + .3) / .3) * (1 - clamp((lt - t1 - .3) / .3)),
        1 - clamp((lt - t1 - 1) / .4), MIX_COL, (lt - t1) / .5);
      const loaded = clamp((lt - t1 - .4) / .3);
      const mv = ease((lt - t2 + .4) / 4.2), split = ease((lt - t2) / 2.4);
      const ctr = .04 + .42 * mv + .02 * Math.max(0, lt - t2 - 4.2);
      setColumn(c, { solvent: 1, bands: [
        { pos: ctr - .14 * split, col: C.b, h: 30, o: loaded },
        { pos: ctr + .14 * split, col: C.a, h: 30, o: loaded },
        { pos: ctr, col: MIX_COL, h: 34, o: loaded * (1 - split) }],
        drip: { col: C.solvent, k: ((lt * .9) % 1) } });
      const bandY = p => c.bedTop + 16 + p * (c.bedBot - c.bedTop - 32);
      const qa = E('为什么');
      popAt(s.q1, lt, qa, 680, bandY(ctr - .14 * split) + 36 + bob(lt, 1, 6), { s0: .2 });
      popAt(s.q2, lt, qa + .15, 680, bandY(ctr + .14 * split) + 36 + bob(lt, 2, 6), { s0: .2 });
      op(s.note, (lt - E('两条')) / .5);
    },
  },

  // ---------- 两位选手 ----------
  racers: {
    en: 'Meet the racers',
    build(g) {
      const s = this;
      s.card = termCard(g, '过柱子 = 柱层析', 'column chromatography', { size: 40 });
      s.fei = mol(g, { col: C.a, r: 90, seed: 1 });
      s.ji = mol(g, { col: C.b, r: 90, group: 'OH', seed: 2 });
      s.nf = nameTag(g, '小非', '甲苯 toluene'); s.nj = nameTag(g, '小极', '苯甲醇 benzyl alcohol');
      s.sf = skeletal(g, 'CH3', { r: 52 }); setT(s.sf.g, 250, 680);
      s.sj = skeletal(g, 'CH2OH', { r: 52 }); setT(s.sj.g, 680, 680);
      s.cf = txt(g, '没有能“握手”的基团', 250, 820, { size: 28, weight: 600, fill: C.dim, anchor: 'middle' });
      s.tag = tagPill(g, '多一个 –OH：一只“手”', 'warn', 30);
      s.vs = txt(g, 'VS', 500, 360, { size: 54, weight: 900, fill: C.grid, anchor: 'middle' });
    },
    update(lt, E) {
      const s = this;
      popAt(s.card, lt, .1, 500, 90, { kind: 'card', s0: .8, dy: -30 });
      const kf = SP.heavy(lt - E('小非') + .3), kj = SP.heavy(lt - E('小极') + .3);
      poseMol(s.fei, lt, 250, 340 + (1 - kf) * -200, { o: clamp(kf * 3), look: [kj > .5 ? 1 : 0, 0] });
      const hand = SP.pop(lt - E('羟基'));
      poseMol(s.ji, lt, 690, 340 + (1 - kj) * -200, { o: clamp(kj * 3), look: [-1, 0], grpAng: -25 + Math.sin(lt * 4) * 8 * clamp(lt - E('羟基')) });
      popAt(s.nf, lt, E('小非') + .2, 250, 490, { kind: 'card', s0: .7 });
      popAt(s.nj, lt, E('小极') + .2, 690, 490, { kind: 'card', s0: .7 });
      setT(s.sf.g, 250, 680); drawSkeletal(s.sf, (lt - E('甲苯')) / 1.0);
      setT(s.sj.g, 690, 680); drawSkeletal(s.sj, (lt - E('苯甲醇')) / 1.0);
      op(s.cf, (lt - E('甲苯') - 1) / .4);
      popAt(s.tag, lt, E('羟基'), 690, 830, { s0: .4, s: 1 + .04 * Math.sin(lt * 5) * clamp(hand) });
      op(s.vs, (lt - E('小极') - .3) / .4); s.vs.setAttribute('transform', `translate(0 ${bob(lt, 3, 5)})`);
    },
  },

  // ---------- 一尺镜：推进到 1 nm ----------
  dive: {
    en: 'Into the column with the ruler lens', still: true,
    scale: [[0, '1 cm'], ['放大', '1 mm'], ['再放大', '1 μm'], ['一千万倍', '1 nm']],
    build(g) {
      const s = this;
      s.world = el('g', {}, g);
      s.col = column(s.world, { x: 500, y: 20, w: 150, h: 880, head: 110 });
      s.mag = el('g', {}, g);
      el('line', { x1: 70, y1: 70, x2: 150, y2: 150, stroke: C.paper, 'stroke-width': 18, 'stroke-linecap': 'round' }, s.mag);
      el('circle', { r: 100, fill: '#fff', 'fill-opacity': .15, stroke: C.accent, 'stroke-width': 12 }, s.mag);
      s.lbl = tagPill(g, '一尺镜', 'warn', 30);
      s.dots = el('g', {}, g);   // silica grains rushing past during the zoom
      const r = rnd(5); s.grains = [...Array(40)].map(() => ({ x: r() * 1000, y: r() * 1000, e: el('circle', { r: 4 + r() * 10, fill: '#C9D3CF' }, s.dots) }));
    },
    update(lt, E) {
      const s = this, c = s.col, bandP = .3 + lt * .004;
      setColumn(c, { solvent: 1, bands: [{ pos: bandP, col: C.b, h: 30 }, { pos: .6 + lt * .006, col: C.a, h: 30 }], drip: { col: C.solvent, k: (lt * .9) % 1 } });
      const by = c.bedTop + 16 + bandP * (c.bedBot - c.bedTop - 32), cx = 500;
      const fly = SP.card(lt - E('一尺镜')), lock = SP.heavy(lt - E('套住'));
      const mx = lerp(lerp(900, 760, fly), cx, lock), my = lerp(lerp(120, 220, fly), by, lock);
      setT(s.mag, mx, my, lerp(.8, .78, lock)); op(s.mag, clamp(fly * 3));
      popAt(s.lbl, lt, E('一尺镜') + .2, mx + 130, my - 110, { out: E('套住') + .4 });
      const z = 1 + 1.3 * ease((lt - E('放大')) / .6) + 2.5 * ease((lt - E('再放大')) / .6) + 9 * ease((lt - E('一千万倍')) / 1.2);
      s.world.setAttribute('transform', `translate(${cx} ${by}) scale(${z}) translate(${-cx} ${-by})`);
      s.mag.setAttribute('transform', s.mag.getAttribute('transform') + ` scale(${Math.min(z, 3)})`);
      const gz = clamp((z - 2) / 4);
      s.grains.forEach((p, i) => { const k = (lt * (.6 + (i % 5) * .2)) % 1, sc = 1 + k * 3;
        p.e.setAttribute('cx', cx + (p.x - cx) * sc); p.e.setAttribute('cy', by + (p.y - 500) * sc); op(p.e, gz * (1 - k)); });
    },
  },

  // ---------- 硅胶表面布满了“手” ----------
  surface: {
    en: 'Silica is covered in “hands”', scale: '1 nm', enter: 'zoomIn',
    build(g) {
      const s = this;
      s.sf = surface(g, { x0: 90, x1: 910, y: 620, n: 7 });
      s.card = termCard(g, '硅胶颗粒的表面', 'the surface of a silica particle', { size: 38 });
      s.pill = tagPill(g, 'Si–OH ＝ 黏人的手', 'warn', 40);
      const r = rnd(9); s.sol = [...Array(14)].map(() => ({ x: r() * 1000, y: 60 + r() * 360, v: 20 + r() * 30, e: el('circle', { r: 5 + r() * 3, fill: '#A9B6B2' }, g) }));
    },
    update(lt, E) {
      const s = this, tOH = E('硅羟基'), tP = E('极性很强'), tH = E('氢键');
      s.sol.forEach(p => { p.e.setAttribute('cx', (p.x + lt * p.v) % 1000); p.e.setAttribute('cy', p.y + Math.sin(lt + p.x) * 8); op(p.e, .7); });
      setSurface(s.sf, { line: ease(lt / 1.2), oh: i => (lt - tOH - i * .12) / .4, dipole: i => i % 3 ? 0 : (lt - tP - i * .1) / .3,
        hi: i => lt > tH ? .5 + .5 * Math.sin((lt - tH) * 6 - i * .7) : 0 });
      s.sf.sites.forEach((st, i) => { if (lt > tOH + i * .12 + .4) st.oh.setAttribute('transform', st.oh.getAttribute('transform') + ` rotate(${Math.sin(lt * 3 + i) * 8})`); });
      popAt(s.card, lt, E('表面') - .3, 500, 170, { kind: 'card', s0: .8, out: tH - .2 });
      popAt(s.pill, lt, E('黏人的手'), 500, 190, { s0: .4 });
    },
  },

  // ---------- 赛跑：握手 = 氢键 ----------
  race: {
    en: 'The race', scale: '1 nm',
    build(g) { const s = this; buildRace(s, g); },
    update(lt, E) {
      const s = this; s.bondTag = E('握手');
      runRace(s, lt, lt - RACE.t0);
      popAt(s.tf, lt, .2, 380, 22, { kind: 'card', s0: .8 }); popAt(s.tj, lt, .35, 620, 22, { kind: 'card', s0: .8 });
      setT(s.note, 735, 30); op(s.note, (lt - .6) / .4);
    },
  },

  // ---------- 这就叫吸附（同一场比赛继续） ----------
  adsorb: {
    en: 'This is adsorption', scale: '1 nm', enter: 'none',
    build(g) {
      const s = this; buildRace(s, g);
      s.card = termCard(g, '这就叫吸附', 'adsorption', { size: 48 });
      s.bar = conclusionBar(g, '极性越大 → 吸附越强 → 跑得越慢', { size: 34 });
    },
    update(lt, E) {
      const s = this; s.bondTag = -9;
      const rt = lt + (this.sc.start - TL.scenes.find(x => x.id === 'race').start) - RACE.t0;
      runRace(s, lt, rt);
      setT(s.tf, 380, 22); setT(s.tj, 620, 22); setT(s.note, 735, 30);
      popAt(s.card, lt, E('吸附'), 500, 330, { kind: 'card', s0: .7 });
      popAt(s.bar, lt, E('极性越大'), 500, 520, { kind: 'card', s0: .9, dy: 30 });
    },
  },

  // ---------- 回到柱子上：出峰 ----------
  back: {
    en: 'Back to full scale', scale: '1 cm', enter: 'zoomOut',
    build(g) {
      const s = this;
      s.st = stand(g, { x: 95, base: 960, top: 40, armX: 230, armY: 200 });
      s.col = column(g, { x: 230, y: 30, w: 120, h: 860, head: 100 });
      s.ch = chart(g, { x: 400, y: 170, w: 540, h: 330, title: '检测器信号', en: 'UV signal' },
        [{ c: .35, w: .045, h: .85, col: C.a, label: '小非' }, { c: .72, w: .055, h: .7, col: C.b, label: '小极' }]);
      s.note = schematicNote(g, '颜色为示意'); setT(s.note, 300, 975);
      s.bar = conclusionBar(g, '非极性的先出峰', { size: 32 });
    },
    update(lt, E) {
      const s = this, p1 = E('第一个峰'), p2 = E('第二个峰');
      // bands reach the tip (pos 1.05) when their peak is drawn
      const v = .11, blue = 1.05 - v * (p1 - .3 - lt), green = 1.05 - v * (p2 - .3 - lt);
      setColumn(s.col, { solvent: 1, bands: [{ pos: green, col: C.b, h: 26, o: clamp((1.25 - green) / .2) }, { pos: blue, col: C.a, h: 26, o: clamp((1.25 - blue) / .2) }],
        drip: lt > p1 - .5 && lt < p1 + .7 ? { col: C.a, k: (lt - p1 + .5) / 1.2 } : lt > p2 - .5 && lt < p2 + .7 ? { col: C.b, k: (lt - p2 + .5) / 1.2 } : { col: C.solvent, k: (lt * .9) % 1 } });
      const k = .35 + (lt - p1) * (.72 - .35) / (p2 - p1);
      popAt(s.ch.g, lt, .2, 0, 0, { kind: 'card', s0: .95 }); setChart(s.ch, k);
      op(s.note, (lt - 1) / .5);
      popAt(s.bar, lt, p2 + .6, 670, 640, { kind: 'card', s0: .9 });
    },
  },

  // ---------- 溶剂也是一群分子：乙酸乙酯来抢 Si–OH ----------
  solvent: {
    en: 'The solvent is molecules too', scale: '1 nm', enter: 'zoomIn',
    build(g) {
      const s = this;
      s.tr = track(g, { ...RACK, top: 150, particles: 20, seed: 11 });
      s.rs = ratioSlider(g, '石油醚∶乙酸乙酯', { w: 330, labelW: 250 }); setT(s.rs.g, 40, 30);
      s.lg1 = legend(g, [['#A9B6B2', '石油醚 PE']]); setT(s.lg1, 60, 92);
      s.lg2 = legend(g, [[EA_COL, '乙酸乙酯 EA', 'EA']]); setT(s.lg2, 300, 92);
      s.bond = hbond(g);
      s.ji = mol(g, { col: C.b, r: 46, group: 'OH', seed: 2 });
      const sites = [...s.tr.sites[0].map((st, i) => ({ st, side: 0, i })), ...s.tr.sites[1].map((st, i) => ({ st, side: 1, i }))];
      sites.sort((a, b) => a.st.y - b.st.y);
      s.ea = sites.map((o, j) => ({ ...o, m: mol(g, { col: EA_COL, r: 22, label: 'EA', seed: j }), x0: 300 + (j * 137) % 400 }));
      s.bar = conclusionBar(g, '溶剂极性越大 → 化合物跑得越快', { size: 34 });
    },
    update(lt, E) {
      const s = this, tEA = E('乙酸乙酯'), tGrab = E('抢'), tRush = E('往下冲');
      runTrack(s.tr, lt);
      const ratio = ease((lt - tEA) / .8);
      setRatio(s.rs, lerp(.09, .25, ratio), ratio < .5 ? '10∶1' : '3∶1'); op(s.rs.g, clamp((lt - E('溶剂') + .6) / .4));
      op(s.lg1, (lt - E('石油醚')) / .3); op(s.lg2, (lt - tEA) / .3);
      // EA molecules drift in and take the sites one after another; 小极's site (right wall #1) goes at tGrab
      const jSite = s.tr.sites[1][1];
      s.ea.forEach((e, j) => {
        const isJ = e.side === 1 && e.i === 1, at = isJ ? tGrab : tEA + .3 + j * .32;
        const k = ease((lt - at) / .7), [sx, sy] = siteXY(s.tr, e.side, e.i), tx = sx + (e.side ? -50 : 50);
        poseMol(e.m, lt, lerp(e.x0, tx, k), lerp(s.tr.top - 30, sy, k), { o: clamp((lt - at + .5) * 3) });
        e.st.busy = k > .9;
      });
      // 小极 holds its site until EA pushes in, drifts, then rushes down (no free hands left)
      const rel = tGrab + .5, y0 = jSite.y;
      let y = y0, held = lt < rel;
      if (!held) { const d = lt - rel, slow = Math.min(d, tRush - rel); y = y0 + slow * 60 + Math.max(0, d - (tRush - rel)) * 340; }
      const xj = held ? 490 : 490 - 40 * clamp((lt - rel) / .4);
      poseMol(s.ji, lt, xj, y, { o: clamp(lt * 3) * clamp((1100 - y) / 80), look: held ? [1, 0] : [0, 1], squash: lt > tRush ? .4 : 0 });
      if (held) { const [hx, hy] = grpXY(s.ji, xj, y, 0); setBond(s.bond, lt, hx + 28, hy, jSite.x - 26, jSite.y, 1); }
      else setBond(s.bond, lt, 0, 0, 0, 0, 0);
      popAt(s.bar, lt, E('大家都跑得越快'), 500, 600, { kind: 'card', s0: .9, dy: 30 });
    },
  },

  // ---------- TLC 预赛：三块板 ----------
  tlc: {
    en: 'A TLC heat before the column', scale: '1 cm', enter: 'zoomOut',
    build(g) {
      const s = this;
      s.rf = [[.5, .06], [.75, .28], [.9, .75]];
      s.plates = ['20∶1', '5∶1', '1∶1'].map((lab, i) => tlc(g, { x: 70 + i * 320, y: 120, w: 220, h: 520, label: lab }));
      s.focus = el('rect', { width: 250, height: 560, rx: 16, fill: 'none', stroke: C.accent, 'stroke-width': 6 }, g);
      s.note = schematicNote(g, 'Rf 数值为示意'); setT(s.note, 70, 790);
      s.leg = legend(g, [[C.a, '小非'], [C.b, '小极']]); setT(s.leg, 620, 788);
    },
    update(lt, E) {
      const s = this, front = ease((lt - .9) / 3.0);
      const t20 = E('二十比一'), t11 = E('一比一'), t5 = E('五比一刚好');
      const tags = [[E('几乎不动'), '太慢', 'bad'], [t5 + .2, '刚好', 'good'], [E('挤到前沿'), '挤在一起', 'bad']];
      s.plates.forEach((p, i) => {
        const k = SP.card(lt - .1 - i * .15); p.g.setAttribute('transform', `translate(0 ${(1 - k) * 60})`); op(p.g, k * 2);
        setTLC(p, { front, spots: [{ col: C.a, rf: s.rf[i][0] }, { col: C.b, rf: s.rf[i][1] }],
          band: i === 1 ? [.2, .35] : null, bandK: (lt - t5 - .3) / .5,
          tag: lt >= tags[i][0] ? { text: tags[i][1], kind: tags[i][2], lt, at: tags[i][0] } : null });
      });
      const act = lt >= t5 ? 1 : lt >= t11 ? 2 : lt >= t20 ? 0 : -1;
      if (act >= 0) { const p = s.plates[act]; s.focus.setAttribute('x', p.x - 15); s.focus.setAttribute('y', p.y - 20);
        op(s.focus, .55 + .45 * Math.sin(lt * 5)); } else op(s.focus, 0);
      op(s.note, (lt - 4) / .5); op(s.leg, (lt - 1) / .5);
    },
  },

  // ---------- Rf 的定义和目标区间 + 安全 ----------
  rf: {
    en: 'Rf: how far the spot travels', scale: '1 cm',
    build(g) {
      const s = this;
      s.p = tlc(g, { x: 70, y: 80, w: 250, h: 640, label: '5∶1' });
      s.card = el('g', {}, g);
      el('rect', { x: -280, y: -110, width: 560, height: 220, rx: 22, fill: C.bg2, filter: 'url(#chemShadow)' }, s.card);
      txt(s.card, 'Rf = a ÷ b', 0, -10, { size: 64, weight: 900, anchor: 'middle' });
      txt(s.card, '斑点移动距离 ÷ 溶剂前沿移动距离', 0, 60, { size: 28, weight: 600, fill: C.dim, anchor: 'middle' });
      s.goal = tagPill(g, '目标 Rf 0.2–0.35', 'good', 40);
      s.bar = conclusionBar(g, 'Rf 落在 0.2–0.35 → 过柱最好分', { size: 32 });
      s.safe = safetyBadge(g, '石油醚、乙酸乙酯、甲苯易燃 · 通风橱操作');
    },
    update(lt, E) {
      const s = this, tA = E('斑点距离'), tG = E('零点二');
      setTLC(s.p, { front: 1, spots: [{ col: C.a, rf: .75 }, { col: C.b, rf: .28, k: 1 + (lt > tG ? .25 * Math.sin(lt * 6) : 0) }],
        arrows: { rf: .28, k: (lt - tA) / 1.4 }, band: [.2, .35], bandK: (lt - tG) / .5 });
      popAt(s.card, lt, tA, 660, 200, { kind: 'card', s0: .8 });
      popAt(s.goal, lt, tG, 660, 420, { s0: .4 });
      popAt(s.bar, lt, E('最好分'), 655, 560, { kind: 'card', s0: .9 });
      popAt(s.safe, lt, E('最好分') + 1.2, 110, 850, { kind: 'card', s0: .8, dy: 30, s: 1.15 });
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
      s.ex.forEach((e, i) => { const k = SP.card(lt - E('占了') + .3 - i * .3); op(e, k * 2); e.setAttribute('transform', `translate(0 ${(1 - k) * 20})`); });
    },
  },

  // ---------- 三件事 + 下期 ----------
  outro: {
    full: true,
    items: [['硅胶的 Si–OH 会和极性基团“握手”', "Silica's Si–OH grabs polar groups"], ['握得越多跑得越慢：非极性的先出', 'More grabbing, slower travel'],
      ['用 TLC 选溶剂，目标 Rf 0.2–0.35', 'Pick the solvent by TLC: Rf 0.2–0.35']],
    next: ['下期：动手装柱与上样', 'Next: packing and loading a column'],
    build(g) {
      const s = this, M = TL.meta;
      txt(g, '三件事', 40, 40, { size: 60, weight: 900 }); small(g, 'Three takeaways', 40, 80, { size: 26 });
      s.tk = takeaways(g, s.items, { size: 36 }); setT(s.tk.g, 30, 220);
      s.nx = nextCard(g, s.next[0], s.next[1]);
      s.note = small(g, M.endnote, 500, 900, { anchor: 'middle', size: 24 });
    },
    update(lt, E) {
      const s = this;
      runTakeaways(s.tk, lt, [E('硅羟基'), E('握得越多'), E('薄层色谱')]);
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
