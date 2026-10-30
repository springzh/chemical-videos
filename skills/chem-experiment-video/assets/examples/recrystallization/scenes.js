// 重结晶：为什么热溶冷析就能提纯？ — scenes. Template: chem-experiment-video (index.html, lib.js, chem.js).
// Colours: C.a = 小苯 (benzoic acid, schematic blue), C.c4 = 杂质 (yellow-coloured impurity, character orange-red),
// YEL = the impurity's yellow tint in solution and in the crude solid.

const YEL = '#E9CF6B', SOL = '#F4EBC4', CRUDE = '#E2C35A';

const QUIZ = {
  q: '热水加多了，会怎样？', qen: 'What if you add too much hot water?',
  options: [['晶体更纯', 'Purer crystals'], ['析出变少，产物损失更多', 'Fewer crystals, more product lost'], ['没有影响', 'No effect']],
  answer: 1, explain: ['水多了，冷下来也能多溶几个小苯', '留在母液里的产物更多 → 损失大'],
};
function buildQuiz(s, g) {
  txt(g, '小测验', 40, 40, { size: 60, weight: 900 }); small(g, 'Quick check', 40, 80, { size: 26 });
  s.qz = quiz(g, QUIZ.q, QUIZ.qen, QUIZ.options, QUIZ.answer); setT(s.qz.g, 40, 130);
  s.ex = QUIZ.explain.map((line, i) => txt(g, line, 500, 790 + i * 52, { size: 36, weight: 800, anchor: 'middle' }));
}

// beaker on a hot plate: crude heap → dissolves hot → crystals grow on cooling
function buildRig(s, g, x = 500, y = 760, o = {}) {
  s.hp = hotPlate(g, { w: 380 }); setT(s.hp.g, x, y + 8);
  s.st = steam(g); setT(s.st.g, x, y - (o.h ?? 340) - 10);
  s.v = vessel(g, 'beaker', { w: o.w ?? 300, h: o.h ?? 340 }); setT(s.v.g, x, y);
  s.hpw = heap(g, 170); setT(s.hpw.g, x, y - 6);
  s.cr = crystals(g, 18, [x - 120, y - 90, x + 120, y - 20], { seed: o.seed ?? 4 });
  s.temp = tagPill(g, '25 ℃', 'info', 30); s.rx = x; s.ry = y; s.rh = o.h ?? 340;
}
function runRig(s, lt, st) {   // st: { water 0..1, heat 0..1, dissolve 0..1, grow 0..1, temp, tint }
  setHot(s.hp, st.heat); runSteam(s.st, lt, st.heat);
  setVessel(s.v, { level: st.water * .62, col: mixCol(C.solvent, YEL, st.tint ?? 0), o: .85 });
  setHeap(s.hpw, 1 - st.dissolve, CRUDE);
  setCrystals(s.cr, st.grow, { size: 20, col: '#FFFFFF' });
  if (st.temp != null) { s.temp.querySelector('text').textContent = `${Math.round(st.temp)} ℃`; }
}

const SCENE_DEFS = {
  // ---------- 钩子：发黄的粗品 → 雪白晶体，杂质去哪了？ ----------
  hook: {
    full: true,
    build(g) {
      const s = this; buildRig(s, g, 500, 800);
      s.tag = tagPill(g, '粗产品（发黄）', 'warn', 32);
      s.q = txt(g, '?', 0, 0, { size: 150, weight: 900, fill: C.accentHi, anchor: 'middle' });
      s.qt = tagPill(g, '杂质呢？', 'info', 34);
      s.note = schematicNote(g, '颜色为示意'); setT(s.note, 690, 880);
    },
    update(lt, E) {
      const s = this, tH = E('热水一溶'), tC = E('放凉'), tW = E('雪白');
      const water = ease((lt - tH + .4) / .8), heat = clamp((lt - tH + .2) / .4) * (1 - clamp((lt - tC) / .6));
      runRig(s, lt, { water, heat, dissolve: ease((lt - tH) / 1.4), grow: clamp((lt - tW + 1.2) / 1.6), tint: .55 * water });
      op(s.temp, 0);
      popAt(s.tag, lt, E('发黄') - .4, 500, 300, { s0: .6, out: tH + .8 });
      popAt(s.q, lt, E('杂质去哪了'), 790, 420 + bob(lt, 1, 8), { s0: .3 });
      popAt(s.qt, lt, E('杂质去哪了') + .2, 760, 560, { s0: .6 });
      op(s.note, (lt - tW) / .5);
    },
  },

  // ---------- 重结晶：最少的热水溶完，慢慢冷却 ----------
  setup: {
    en: 'Dissolve hot, crystallize cold',
    build(g) {
      const s = this; buildRig(s, g, 340, 820, { w: 280, h: 320 });
      s.card = nameTag(g, '苯甲酸', 'benzoic acid'); s.sk = skeletal(g, 'COOH', { r: 46 });
      s.min = tagPill(g, '最少量热水', 'good', 30);
    },
    update(lt, E) {
      const s = this, tH = E('加热水'), tD = E('刚好溶完'), tC = E('慢慢冷却'), tG = E('一颗颗冒出来');
      const water = ease((lt - tH) / 1), heat = clamp((lt - tH + .2) / .4) * (1 - clamp((lt - tC) / .6));
      const temp = lt < tH ? 25 : lt < tC ? lerp(25, 100, ease((lt - tH) / 1.2)) : lerp(100, 25, ease((lt - tC) / 2.4));
      runRig(s, lt, { water, heat, dissolve: ease((lt - tH - .2) / (tD - tH - .1)), grow: clamp((lt - tG + .4) / 1.8), tint: .5 * water, temp });
      popAt(s.temp, lt, tH, 640, 420, { s0: .6 });
      s.temp.querySelector('rect').setAttribute('stroke', temp > 60 ? C.bad : C.accent);
      popAt(s.card, lt, E('苯甲酸'), 760, 110, { kind: 'card', s0: .8 });
      setT(s.sk.g, 760, 260); drawSkeletal(s.sk, (lt - E('苯甲酸')) / 1);
      popAt(s.min, lt, tD, 640, 520, { s0: .5 });
    },
  },

  // ---------- 溶解度曲线：热时溶得多，冷时溶得少 ----------
  curve: {
    en: 'Solubility rises with temperature',
    build(g) {
      const s = this;
      s.cv = curvePlot(g, u => .06 + .88 * Math.pow(u, 2.2), { x: 120, y: 80, w: 640, h: 560, xLabel: '温度 →', yLabel: '↑ 溶解度' });
      s.dot = el('circle', { r: 16, fill: C.accent, stroke: '#fff', 'stroke-width': 4 }, g);
      s.hot = tagPill(g, '热：溶得多', 'warn', 30); s.cold = tagPill(g, '冷：溶得少', 'info', 30);
      s.lvl = el('line', { stroke: C.accentHi, 'stroke-width': 3, 'stroke-dasharray': '8 8' }, g);
      s.gap = el('rect', { width: 30, fill: C.accent, opacity: 0, rx: 6 }, g);
      s.gapT = txt(g, '多出来的部分 → 析出', 120, 760, { size: 32, weight: 900, fill: C.accentHi });
      s.cr = crystals(g, 8, [500, 720, 700, 780], { seed: 9 });
      s.note = schematicNote(g, '曲线只画形状（示意）'); setT(s.note, 560, 870);
    },
    update(lt, E) {
      const s = this, tHot = E('溶得多'), tCold = E('溶得少'), tGap = E('多出来的那部分'), tOut = E('只好析出');
      setCurve(s.cv, ease((lt - .1) / 1.6));
      const u = lt < tCold - .8 ? .95 : lerp(.95, .2, ease((lt - tCold + .8) / .9));
      const [dx, dy] = cvXY(s.cv, u); s.dot.setAttribute('cx', dx); s.dot.setAttribute('cy', dy); op(s.dot, clamp((lt - tHot + .3) / .3));
      const [hx, hy] = cvXY(s.cv, .95), [cx, cy] = cvXY(s.cv, .2);
      popAt(s.hot, lt, tHot, hx - 120, hy - 10, { s0: .6 }); popAt(s.cold, lt, tCold, cx + 70, cy - 70, { s0: .6 });
      const gk = ease((lt - tGap) / .5);
      const bx = hx + 34;   // bracket right of the curve: from the hot level down to the cold level
      s.gap.setAttribute('x', bx); s.gap.setAttribute('y', hy); s.gap.setAttribute('height', Math.max(0, (cy - hy) * gk)); op(s.gap, .5 * gk);
      s.lvl.setAttribute('x1', cx); s.lvl.setAttribute('y1', cy); s.lvl.setAttribute('x2', lerp(cx, bx + 30, gk)); s.lvl.setAttribute('y2', cy); op(s.lvl, gk);
      op(s.gapT, (lt - tGap - .2) / .4);
      setCrystals(s.cr, clamp((lt - tOut) / 1.5), { size: 18 });
      op(s.note, (lt - 1.5) / .5);
    },
  },

  // ---------- 推进到溶液里 ----------
  dive: {
    en: 'Into the solution', still: true, scale: [[0, '1 cm'], ['推进', '1 nm']],
    build(g) {
      const s = this; s.world = el('g', {}, g); buildRig(s, s.world, 500, 820);
      s.ring = el('circle', { r: 0, fill: 'none', stroke: C.accent, 'stroke-width': 10 }, g);
      const r = rnd(12); s.dots = [...Array(36)].map((_, j) => ({ x: r() * 1000, y: r() * 1000, e: el('circle', { r: 6 + r() * 10, fill: j % 6 ? '#7FB3D0' : C.a }, g) }));
    },
    update(lt, E) {
      const s = this, cx = 500, cy = 640;
      runRig(s, lt, { water: 1, heat: 1, dissolve: 1, grow: 0, tint: .55 }); op(s.temp, 0);
      const rk = SP.pop(lt - E('杂质') + .3); s.ring.setAttribute('cx', cx); s.ring.setAttribute('cy', cy);
      s.ring.setAttribute('r', 90 * rk); op(s.ring, rk > 0 ? 1 - clamp((lt - E('推进') - .4) / .4) : 0);
      const z = 1 + 2 * ease((lt - E('不跟着析出')) / .7) + 9 * ease((lt - E('推进')) / 1.1);
      s.world.setAttribute('transform', `translate(${cx} ${cy}) scale(${z}) translate(${-cx} ${-cy})`);
      const gz = clamp((z - 2.5) / 4);
      s.dots.forEach((p, i) => { const k = (lt * (.6 + (i % 5) * .2)) % 1, sc = 1 + k * 3;
        p.e.setAttribute('cx', cx + (p.x - cx) * sc); p.e.setAttribute('cy', cy + (p.y - 500) * sc); op(p.e, gz * (1 - k)); });
    },
  },

  // ---------- 数一数：20 个小苯、3 个杂质 ----------
  count: {
    en: 'Count them', scale: '1 nm', enter: 'zoomIn',
    build(g) {
      const s = this, r = rnd(17);
      el('rect', { x: 20, y: 20, width: 960, height: 640, rx: 30, fill: mixCol(C.solvent, YEL, .25), opacity: .7 }, g);
      s.water = [...Array(30)].map(() => ({ x: 40 + r() * 920, y: 40 + r() * 600, v: .5 + r(), e: el('circle', { r: 5, fill: '#7FB3D0', opacity: .7 }, g) }));
      s.ben = [...Array(20)].map((_, i) => ({ m: mol(g, { col: C.a, r: 24, seed: i }), x: 90 + (i % 7) * 120 + r() * 40, y: 80 + Math.floor(i / 7) * 150 + r() * 60 }));
      s.imp = [...Array(3)].map((_, i) => ({ m: mol(g, { col: C.c4, r: 26, seed: 30 + i, group: 'X', groupCol: C.c4 }), x: 210 + i * 260, y: 400 + r() * 40 }));
      s.stay = [3, 9, 12, 18];   // the 4 that stay dissolved
      s.cap = meterBar(g, '水能装下的小苯', C.a, { w: 520 }); setT(s.cap.g, 60, 760);
      s.capI = meterBar(g, '杂质只有 3 个：远没到它的上限', C.c4, { w: 520 }); setT(s.capI.g, 60, 880);
      s.note = schematicNote(g, '分子个数与上限均为示意'); setT(s.note, 640, 730);
      s.left = tagPill(g, '析出 16', 'good', 32); s.stayT = tagPill(g, '留在母液', 'warn', 30);
    },
    update(lt, E) {
      const s = this, tCool = E('冷下来'), t16 = E('十六个'), tStay = E('留在溶液里');
      s.water.forEach(p => { p.e.setAttribute('cx', p.x + Math.sin(lt * p.v + p.y) * 12); p.e.setAttribute('cy', p.y + Math.cos(lt * p.v + p.x) * 10); });
      let row = 0;
      s.ben.forEach((b, i) => {
        const fall = !s.stay.includes(i), k = fall ? ease((lt - t16 - (i % 7) * .06) / .8) : 0;
        const slot = fall ? row++ : 0, tx = 120 + (slot % 8) * 100, ty = 610 - Math.floor(slot / 8) * 46;
        poseMol(b.m, lt, lerp(b.x, tx, k), lerp(b.y, ty, k), { o: clamp((lt - E('二十个小苯') + .6 - i * .02) * 3), idle: k < .99, squash: k > .99 ? .3 : 0 });
      });
      s.imp.forEach((p, i) => poseMol(p.m, lt, p.x + Math.sin(lt + i) * 20, p.y, { o: clamp((lt - E('三个杂质') + .3) * 3), grpAng: -30 + i * 30,
        s: 1 + (lt > tStay ? .12 * Math.sin((lt - tStay) * 6) : 0) }));
      const capV = lt < tCool ? 25 : lerp(25, 4, ease((lt - tCool) / 1.2));
      op(s.cap.g, clamp((lt - tCool + .6) / .4)); setMeter(s.cap, capV / 25, `${Math.round(capV)} 个`);
      op(s.capI.g, clamp((lt - E('没到上限') + .4) / .4)); setMeter(s.capI, .3, '未饱和');
      op(s.note, (lt - E('二十个小苯')) / .5);
      popAt(s.left, lt, t16 + .6, 860, 480, { s0: .5 });
      popAt(s.stayT, lt, tStay, 500, 330, { s0: .5 });
    },
  },

  // ---------- 晶格只收「自己人」 ----------
  lattice: {
    en: 'The lattice only fits its own kind', scale: '1 nm',
    build(g) {
      const s = this, cols = 6, rows = 5;
      s.slots = []; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s.slots.push([250 + c * 82, 230 + r * 82]);
      s.grid = el('g', {}, g);
      s.slots.forEach(([x, y]) => el('rect', { x: x - 38, y: y - 38, width: 76, height: 76, rx: 10, fill: 'none', stroke: C.grid, 'stroke-width': 3, 'stroke-dasharray': '6 6' }, s.grid));
      s.hole = s.slots.length - 4;
      s.ms = s.slots.map((_, i) => mol(g, { col: C.a, r: 30, seed: i }));
      s.imp = mol(g, { col: C.c4, r: 30, seed: 40, group: 'X', groupCol: C.c4 });
      s.note = schematicNote(g, '杂质画成带一只「X」的球（示意）'); setT(s.note, 560, 960);
      s.bad = tagPill(g, '形状对不上', 'bad', 32); s.ok = tagPill(g, '同种分子 → 严丝合缝', 'good', 30);
    },
    update(lt, E) {
      const s = this, tG = E('整齐的晶格'), tBad = E('插不进去');
      s.ms.forEach((m, i) => {
        if (i === s.hole) { op(m.g, 0); return; }
        const at = tG - 1.5 + i * .12, k = ease((lt - at) / .6), [sx, sy] = s.slots[i];
        poseMol(m, lt, lerp(sx + 300, sx, k), lerp(sy - 260, sy, k), { o: clamp((lt - at + .2) * 4), idle: k < .99 });
      });
      const [hx, hy] = s.slots[s.hole], a = tBad - .9, k = ease((lt - a) / .8), back = ease((lt - tBad - .05) / .6);
      const ix = lerp(900, hx + 30, k) + back * 220, iy = lerp(800, hy + 6, k) + back * 120;
      poseMol(s.imp, lt, ix, iy, { o: clamp((lt - a + .6) * 3), grpAng: 40, squash: lt > tBad - .1 && lt < tBad + .2 ? .5 : 0, look: [-1, -1] });
      popAt(s.ok, lt, E('嵌进去'), 500, 100, { s0: .6 }); popAt(s.bad, lt, tBad + .2, 720, 820, { s0: .5 });
      s.grid.setAttribute('opacity', .6 + .4 * Math.sin(lt * 3)); op(s.note, (lt - tBad) / .5);
    },
  },

  // ---------- 回到烧杯：滤出晶体，杂质随母液走 ----------
  back: {
    en: 'Filter off the crystals', scale: '1 cm', enter: 'zoomOut',
    build(g) {
      const s = this;
      s.fl = vessel(g, 'flask', { w: 260, h: 300 }); setT(s.fl.g, 400, 930);
      s.ff = filterFunnel(g, { w: 280, h: 210 }); setT(s.ff.g, 400, 660);
      s.bk = vessel(g, 'beaker', { w: 200, h: 220 });
      s.bcr = crystals(g, 10, [-70, -60, 70, -15], { seed: 5 });
      s.lC = tagPill(g, '晶体（较纯）', 'good', 30); s.lM = tagPill(g, '母液（含杂质）', 'warn', 30);
    },
    update(lt, E) {
      const s = this, tF = E('滤出来'), tM = E('母液');
      const tilt = ease((lt - tF + .8) / .8) * (1 - ease((lt - tF - 2.4) / .6));
      s.bk.g.setAttribute('transform', `translate(${720 - tilt * 80} ${300 - tilt * 60}) rotate(${-tilt * 80})`);
      setVessel(s.bk, { level: lerp(.55, .05, ease((lt - tF) / 2)), col: mixCol(C.solvent, YEL, .55) });
      s.bcr.g.setAttribute('transform', s.bk.g.getAttribute('transform')); setCrystals(s.bcr, 1 - ease((lt - tF) / 1.5), { size: 16 });
      setFilter(s.ff, { cake: ease((lt - tF - .2) / 1.6), drip: lt > tF ? ((lt - tF) * 1.4) % 1 : -1, col: YEL });
      setVessel(s.fl, { level: .05 + .45 * ease((lt - tF) / 3), col: mixCol(C.solvent, YEL, .6) });
      popAt(s.lC, lt, E('被滤掉') - .4, 640, 520, { s0: .6 }); popAt(s.lM, lt, tM, 700, 820, { s0: .6 });
    },
  },

  // ---------- 急冷行不行？ ----------
  speed: {
    en: 'Slow cooling vs. an ice bath', scale: '1 cm',
    build(g) {
      const s = this;
      s.hl = [txt(g, '慢慢冷却', 250, 80, { size: 38, weight: 900, anchor: 'middle' }), txt(g, '冰水急冷', 750, 80, { size: 38, weight: 900, anchor: 'middle' })];
      s.v1 = vessel(g, 'beaker', { w: 260, h: 300 }); setT(s.v1.g, 250, 560);
      s.basin = el('g', {}, g);
      el('rect', { x: 560, y: 360, width: 380, height: 220, rx: 18, fill: '#DCEFF8', stroke: C.paper, 'stroke-width': 5 }, s.basin);
      [[590, 390], [880, 400], [600, 520], [890, 520], [740, 375]].forEach(([x, y], i) => el('rect', { x, y, width: 40, height: 40, rx: 6, fill: '#fff', stroke: '#9CC8DE', 'stroke-width': 3, transform: `rotate(${i * 17} ${x + 20} ${y + 20})` }, s.basin));
      s.v2 = vessel(g, 'beaker', { w: 260, h: 300 }); setT(s.v2.g, 750, 560);
      s.big = crystals(g, 5, [170, 450, 330, 530], { seed: 2 });
      s.tiny = crystals(g, 40, [650, 420, 850, 540], { seed: 6 });
      s.good = tagPill(g, '大而纯', 'good', 32); s.bad = tagPill(g, '小而碎，包进杂质', 'bad', 30);
      s.bar = conclusionBar(g, '慢慢冷却 → 晶体大、更纯', { size: 36 });
      s.note = schematicNote(g, '橙红点 = 被包进去的杂质（示意）'); setT(s.note, 600, 720);
    },
    update(lt, E) {
      const s = this, tIce = E('冰水'), tFast = E('又小又快'), tIn = E('包进去'), tBad = E('反而不纯');
      s.hl.forEach((h, i) => op(h, (lt - .1 - (i ? tIce - .3 : 0)) / .3));
      setVessel(s.v1, { level: .55, col: mixCol(C.solvent, YEL, .4) }); setVessel(s.v2, { level: .55, col: mixCol(C.solvent, YEL, .4) });
      op(s.basin, clamp((lt - tIce + .3) / .4)); op(s.v2.g, clamp((lt - tIce + .3) / .4));
      setCrystals(s.big, clamp(lt / 7.5), { size: 40 + 6 * Math.sin(lt) * 0 });
      setCrystals(s.tiny, clamp((lt - tFast + .6) / .9), { size: 11, dirty: lt > tIn ? .45 : 0 });
      popAt(s.good, lt, tBad - .2, 250, 640, { s0: .6 }); popAt(s.bad, lt, tBad, 750, 640, { s0: .6 });
      popAt(s.bar, lt, tBad + 1.2, 500, 820, { kind: 'card', s0: .9, dy: 30 });
      op(s.note, (lt - tIn) / .4);
    },
  },

  // ---------- 操作要点 + 安全 ----------
  practice: {
    en: 'At the bench',
    build(g) {
      const s = this; buildRig(s, g, 500, 360, { w: 200, h: 220, seed: 7 }); op(s.temp, 0);
      s.rows = [['① 用最少量的热溶剂', 'Minimum hot solvent'], ['② 先自然冷却，再冰浴', 'Cool slowly, then ice'], ['③ 抽滤后用少量冷溶剂洗', 'Rinse with a little cold solvent']].map(([zh, en]) => {
        const r = el('g', {}, g); txt(r, zh, 0, 0, { size: 38, weight: 900 }); small(r, en, 0, 34, { size: 22 }); return r; });
      s.safe = safetyBadge(g, '热溶液防烫 · 戴隔热手套 · 防暴沸');
    },
    update(lt, E) {
      const s = this, tCool = E('自然冷却');
      runRig(s, lt, { water: 1, heat: lt < tCool ? 1 : 1 - clamp((lt - tCool) / .6), dissolve: 1, grow: clamp((lt - tCool) / 3), tint: .45 });
      [[E('最少量'), 0], [tCool, 1], [E('冷溶剂'), 2]].forEach(([at, i]) => { const k = SP.card(lt - at); s.rows[i].setAttribute('transform', `translate(${120 + (1 - k) * 60} ${520 + i * 110})`); op(s.rows[i], k * 2); });
      popAt(s.safe, lt, E('防烫') - .6, 140, 890, { kind: 'card', s0: .8, dy: 30, s: 1.05 });
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
      s.ex.forEach((e, i) => { const k = SP.card(lt - E('多溶几个') + .3 - i * .6); op(e, k * 2); e.setAttribute('transform', `translate(0 ${(1 - k) * 20})`); });
    },
  },

  // ---------- 三件事 + 下期 ----------
  outro: {
    full: true,
    items: [['热时溶得多，冷时溶得少', 'Soluble hot, much less soluble cold'], ['晶格只收“自己人”，杂质留在母液', 'The lattice rejects impurities'],
      ['最少量热溶剂，慢慢冷却', 'Minimum hot solvent, cool slowly']],
    next: ['下期：抽滤与干燥', 'Next: suction filtration and drying'],
    build(g) {
      const s = this, M = TL.meta;
      txt(g, '三件事', 40, 40, { size: 60, weight: 900 }); small(g, 'Three takeaways', 40, 80, { size: 26 });
      s.tk = takeaways(g, s.items, { size: 36 }); setT(s.tk.g, 30, 220);
      s.nx = nextCard(g, s.next[0], s.next[1]);
      s.note = small(g, M.endnote, 500, 900, { anchor: 'middle', size: 24 });
    },
    update(lt, E) {
      const s = this;
      runTakeaways(s.tk, lt, [E('热时溶得多'), E('晶格'), E('最少热溶剂')]);
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
