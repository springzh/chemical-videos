// SVG overlay for the 3D version: labels, structure card, icons and impacts. The molecules, liposomes and cells are
// drawn by the 3D layer (world3d.js + scenes3d.js); labels pin to 3D points with P(this, point).
const P = (s, p) => W3.stage(s.lay, p);

// ---------- small 2D icons used inside the application cards ----------
const _GL = {};
function shade(hex, k) { const n = parseInt(hex.slice(1), 16), f = v => Math.round(clamp(v * (1 + k), 0, 255)); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`; }
function GL(col) {
  if (_GL[col]) return _GL[col];
  const svg = $('#orn'), d = svg.querySelector('defs') || el('defs', {}, svg), id = 'gl' + Object.keys(_GL).length;
  const rg = el('radialGradient', { id, cx: .36, cy: .32, r: .78 }, d);
  el('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': .95 }, rg); el('stop', { offset: .28, 'stop-color': col }, rg); el('stop', { offset: 1, 'stop-color': shade(col, -.55) }, rg);
  return _GL[col] = `url(#${id})`;
}
function lipid2(parent) { const g = el('g', {}, parent);
  el('path', { d: 'M-5 12 L-5 66 M5 12 L5 66', stroke: '#5B85BC', 'stroke-width': 4.5, 'stroke-linecap': 'round', fill: 'none' }, g); el('circle', { r: 14, fill: GL('#8ED4F6') }, g); return g; }
function lipoIcon(parent, R, n) { const g = el('g', {}, parent);
  for (let i = 0; i < n; i++) { const a = i / n * 360, [x, y] = polar(0, 0, R, a); setT(lipid2(g), x, y, 1, a + 90); } return g; }
function nanoIcon(parent, R = 40, n = 10) {
  const g = el('g', {}, parent);
  for (let i = 0; i < n; i++) { const a = i / n * 360, [x0, y0] = polar(0, 0, R, a), [x1, y1] = polar(0, 0, R + 26, a);
    el('line', { x1: x0, y1: y0, x2: x1, y2: y1, stroke: C.accent, 'stroke-width': 4, 'stroke-linecap': 'round' }, g); el('circle', { cx: x1, cy: y1, r: 6, fill: GL(C.b) }, g); }
  el('circle', { r: R, fill: GL('#5FB4E8') }, g); return g;
}
Object.assign(ICONS, {
  snow:   ['M32 6 L32 58', 'M9 19 L55 45', 'M9 45 L55 19', 'M25 10 L32 17 L39 10', 'M25 54 L32 47 L39 54'],
  drop:   ['M32 8 C24 22 16 30 16 40 A16 16 0 0 0 48 40 C48 30 40 22 32 8', 'M10 12 L54 56'],
  lock:   ['M14 30 L50 30 L50 58 L14 58 Z', 'M21 30 L21 21 A11 11 0 0 1 43 21 L43 30', 'M32 40 L32 48'],
  beaker: ['M22 8 L22 26 L10 56 L54 56 L42 26 L42 8', 'M16 8 L48 8', 'M15 44 C23 39 29 48 37 43 C43 40 46 43 50 43'],
  flame:  ['M32 58 C18 58 12 46 18 34 C22 26 28 24 28 10 C38 20 46 30 46 42 C46 52 40 58 32 58',
           'M32 56 C26 56 24 50 27 44 C29 40 32 39 32 33 C37 38 40 44 38 50 C37 54 35 56 32 56'],
  vial:   ['M24 6 L40 6', 'M26 6 L26 18 L18 30 L18 56 L46 56 L46 30 L38 18 L38 6', 'M18 40 L46 40'],
});
function colorChars(ch, fn) { ch.chars.forEach((c, i) => c.e.setAttribute('fill', fn(i))); }
const segCol = i => i < 4 ? C.a : i === 4 || i === 8 ? C.dim : i < 8 ? C.accent : C.b;   // "PLGA-PEG-SP94"
function leader(parent, col) { return el('path', { fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-dasharray': '5 9', 'stroke-linecap': 'round' }, parent); }

// schematic structure card (no product structure image was supplied): PLGA block · PEG block · SP94 peptide
function structSchematic(parent) {
  const g = el('g', {}, parent), ink = '#1B2D4A', sub = '#4D6283';
  T(g, '–[O–CH(CH₃)–CO]ₓ–', -255, -52, { size: 38, fam: 'Serif', weight: 800, fill: ink, anchor: 'middle' });
  T(g, '–[O–CH₂–CO]ᵧ–', -255, 12, { size: 38, fam: 'Serif', weight: 800, fill: ink, anchor: 'middle' });
  T(g, '乳酸 LA ／ 羟基乙酸 GA', -255, 70, { size: 28, weight: 600, fill: sub, anchor: 'middle' });
  T(g, 'PLGA', -255, 130, { size: 34, weight: 900, fill: ink, anchor: 'middle' });
  T(g, '–(CH₂CH₂O)ₙ–', 105, -8, { size: 44, fam: 'Serif', weight: 800, fill: ink, anchor: 'middle' });
  T(g, '聚乙二醇', 105, 50, { size: 28, weight: 600, fill: sub, anchor: 'middle' });
  T(g, 'PEG', 105, 130, { size: 34, weight: 900, fill: ink, anchor: 'middle' });
  g._res = [...'SFSIIHTPILPL'].map((c, i) => { const x = 290 + (i % 6) * 32, y = i < 6 ? -50 : 2;
    const r = el('g', {}, g); el('circle', { cx: x, cy: y - 12, r: 15, fill: C.b, 'fill-opacity': .3, stroke: C.b, 'stroke-width': 2 }, r);
    T(r, c, x, y - 2, { size: 27, weight: 900, fill: ink, anchor: 'middle' }); return r; });
  T(g, '12 个氨基酸', 370, 50, { size: 28, weight: 600, fill: sub, anchor: 'middle' });
  T(g, 'SP94', 370, 130, { size: 34, weight: 900, fill: ink, anchor: 'middle' });
  T(g, '示意', 455, -140, { size: 27, weight: 700, fill: '#7A8DAA', anchor: 'end' });
  return g;
}

const SCENE_DEFS = {
  intro: {
    full: true,
    build(g) {
      const s = this;
      s.lab = pill(g, '纳米载体', C.accent, { size: 34, bg: 'rgba(5,25,60,.55)' });
      s.poly = pill(g, '两亲共聚物 自组装', C.a, { size: 32, bg: 'rgba(5,25,60,.55)' });
      s.cell = pill(g, '肝癌细胞', C.b, { size: 34, bg: 'rgba(5,25,60,.6)' });
      s.q = tx(g, '?', { size: 120, fam: 'Serif', weight: 900, fill: C.accentHi });
      s.sh = shock(g, 3, C.b);
      s.title = Chars(g, 'PLGA-PEG-SP94', 500, 905, { size: 96, weight: 900, anchor: 'middle' });
      colorChars(s.title, segCol);
    },
    update(lt, E) {
      const s = this, d = W3.defs.intro.pts, tR = E('肝癌细胞'), [lx, ly] = P(s, d.lab), [qx, qy] = P(s, d.q), [tx2, ty2] = P(s, d.target), [cx, cy] = P(s, d.cell);
      popAt(s.poly, lt, E('高分子'), 500, 120, { kind: 'card', dy: 20, out: E('纳米载体') - .1 });
      popAt(s.lab, lt, E('纳米载体'), lx, Math.min(ly, 800), { kind: 'card', dy: 30, out: E('今天') - .2 });
      popAt(s.cell, lt, tR + .1, clamp(cx, 600, 900), clamp(cy, 120, 300), { kind: 'card', dy: 20, out: E('今天') - .1 });
      popAt(s.q, lt, tR, qx, qy, { s0: 2.2, kind: 'heavy', out: E('今天') });
      runShock(s.sh, lt, tR, tx2, ty2, 30, 260);
      slamChars(s.title, lt, E('今天'), .05);
    },
  },

  struct: {
    build(g) {
      const s = this;
      s.card = boxG(g, 980, 380, C.accent, { fill: '#F3F9FF', fo: 1, sw: 3, rx: 26 });
      const cp = el('clipPath', { id: 'structClip' }, g); s.clip = el('rect', { x: -490, y: -190, width: 0, height: 380 }, cp);
      s.imgG = el('g', { 'clip-path': 'url(#structClip)' }, s.card);
      s.hl = [[-470, -40], [-40, 250], [250, 470]].map(([x0, x1], i) => el('rect', { x: x0, y: -175, width: x1 - x0, height: 350, rx: 14,
        fill: [C.a, C.accent, C.b][i], 'fill-opacity': .16, stroke: [C.a, C.accent, C.b][i], 'stroke-width': 4 }, s.imgG));
      s.sch = structSchematic(s.imgG);
      s.br = [0, 1, 2].map(() => el('path', { fill: 'none', stroke: C.dim, 'stroke-width': 5, 'stroke-linecap': 'round' }, g));
      s.lines = [C.a, C.accent, C.b].map(c => leader(g, c));
      s.labs = [['PLGA · 疏水', C.a], ['PEG · 亲水', C.accent], ['SP94 · 多肽', C.b]].map(([t, c]) => tx(g, t, { size: 36, weight: 800, fill: c }));
      s.sh = shock(g, 3);
    },
    update(lt, E, beat) {
      const s = this, k0 = SP.card(lt), d = W3.defs.struct.pts;
      setT(s.card, 500, 250, lerp(.85, 1, k0)); op(s.card, k0 * 2);
      s.clip.setAttribute('width', 980 * ease((lt - .15) / 1.1));
      const cue = [E('疏水'), E('亲水'), E('接枝')], seg = [[30, 455], [465, 740], [750, 975]];
      s.hl.forEach((r, i) => op(r, SP.card(lt - cue[i]) * (.75 + .25 * beatPulse(lt, beat))));
      s.sch._res.forEach((r, i) => op(r, .35 + .65 * clamp((lt - cue[2]) / 1.4 * 12 - i)));
      s.br.forEach((p, i) => { const [a, b] = seg[i];
        p.setAttribute('d', `M${a} 455 L${a} 470 L${b} 470 L${b} 455`); drawPath(p, ease((lt - E('两亲') - i * .12) / .4));
        p.setAttribute('stroke', lt > cue[i] ? [C.a, C.accent, C.b][i] : C.dim); });
      runShock(s.sh, lt, E('两亲'), 500, 470, 40, 520);
      const sp = d.seg.map(p => P(s, p)), lx = [Math.max(130, sp[0][0]), sp[1][0], Math.min(870, sp[2][0])];
      s.lines.forEach((p, i) => { const [a, b] = seg[i], k = ease((lt - cue[i] - .1) / .4);
        p.setAttribute('d', `M${(a + b) / 2} 478 L${sp[i][0]} ${sp[i][1] - 30}`); op(p, k * .8); p.style.strokeDashoffset = -lt * 30; });
      s.labs.forEach((l, i) => popAt(l, lt, cue[i] + .15, lx[i], 850, { kind: 'card', dy: 30 }));
    },
  },

  core: {
    build(g) {
      const s = this;
      s.water = pill(g, '水相', C.accentHi, { size: 32, bg: 'rgba(5,25,60,.6)' });
      s.cLab = pill(g, '剖面 · PLGA 疏水内核', C.a, { size: 32, bg: 'rgba(5,25,60,.75)' }); s.cLine = leader(g, C.a);
      s.la = pill(g, '乳酸', C.a, { size: 28, bg: 'rgba(5,25,60,.8)' }); s.ga = pill(g, '羟基乙酸', '#FBD3A2', { size: 28, bg: 'rgba(5,25,60,.8)' });
      s.h2o = pill(g, 'H₂O 进攻酯键', '#FF9A9A', { size: 30, bg: 'rgba(5,25,60,.75)' });
      s.big = Chars(g, '可降解', 500, 120, { size: 80, fam: 'Serif', weight: 900, fill: C.accentHi, anchor: 'middle' });
      s.sh = shock(g, 3, C.a);
    },
    update(lt, E) {
      const s = this, d = W3.defs.core.pts, tK = E('内核'), tD = E('降解'), [cx, cy] = P(s, d.core);
      popAt(s.water, lt, .3, 160, 140, { kind: 'card', dy: 20, out: E('聚拢') });
      const kc = popAt(s.cLab, lt, tK + .3, 230, 860, { kind: 'card', dy: 20, out: E('水解') - .2 });
      s.cLine.setAttribute('d', `M${230 + s.cLab._w / 2} 860 L${cx} ${cy}`); op(s.cLine, kc * (1 - ease((lt - E('水解') + .2) / .3))); s.cLine.style.strokeDashoffset = -lt * 30;
      const [ax, ay] = P(s, d.LA), [gx, gy] = P(s, d.GA);
      popAt(s.la, lt, E('乳酸'), ax - 70, ay - 60, { kind: 'card', dy: 16, out: E('水解') });
      popAt(s.ga, lt, E('乳酸') + .5, gx + 90, gy + 60, { kind: 'card', dy: 16, out: E('水解') });
      popAt(s.h2o, lt, E('水解') + .1, 800, 140, { kind: 'card', dy: 20, out: tD - .1 });
      slamChars(s.big, lt, tD, .08);
      runShock(s.sh, lt, tD, cx, cy, 40, 380);
    },
  },

  peg: {
    build(g) {
      const s = this;
      s.brush = tx(g, '水合保护层', { size: 40, weight: 800, fill: C.accentHi });
      s.x = crossG(g, '#FF6B6B', 34, 8);
      s.aLab = pill(g, '不易团聚', C.b, { size: 34, bg: 'rgba(5,25,60,.7)' });
      s.dLab = pill(g, '液相分散 ↑', C.accent, { size: 36, bg: 'rgba(5,25,60,.7)' });
      s.sh = shock(g, 2, C.accentHi);
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.peg.pts, tA = E('团聚'), [nx, ny] = P(s, d.np);
      popAt(s.brush, lt, E('保护层') + .2, 500, 90, { kind: 'card', dy: 20 });
      runShock(s.sh, lt, tA, nx, ny, 20, 170, .8);
      runMark(s.x, lt, tA + .1, nx, ny);
      popAt(s.aLab, lt, tA + .15, Math.min(nx, 860), ny + 90, { kind: 'card', dy: 20 });
      popAt(s.dLab, lt, E('分散'), 170, 200, { kind: 'card', dy: 20, s: 1 + beatPulse(lt, beat) * .04 * (lt > E('分散')) });
    },
  },

  sp94: {
    build(g) {
      const s = this;
      s.cellLab = tx(g, '肝癌细胞表面', { size: 32, fill: C.paper, weight: 700 });
      s.rays = [...Array(7)].map(() => el('line', { stroke: '#FFC2E2', 'stroke-width': 3, 'stroke-dasharray': '4 12', 'stroke-linecap': 'round' }, g));
      s.rLab = pill(g, 'SP94 多肽', C.b, { size: 34, bg: 'rgba(5,25,60,.7)' });
      s.big = Chars(g, '靶向识别', 400, 120, { size: 84, fam: 'Serif', weight: 900, fill: C.accentHi, anchor: 'middle' });
      s.sh = shock(g, 3, C.b);
    },
    update(lt, E) {
      const s = this, d = W3.defs.sp94.pts, tN = E('导航'), [px, py] = P(s, d.tip), rec = d.recs.map(p => P(s, p));
      popAt(s.cellLab, lt, E('肝癌细胞'), 860, 960, { kind: 'card' });
      popAt(s.rLab, lt, E('最外层') + .1, px - 40, py - 90, { kind: 'card', dy: 20, out: tN - .5 });
      s.rays.forEach((ry, i) => { const k = ease((lt - E('识别') - i * .06) / .4), fade = 1 - ease((lt - tN + .3) / .4), [rx, rY] = rec[i];
        ry.setAttribute('x1', px); ry.setAttribute('y1', py); ry.setAttribute('x2', lerp(px, rx, k)); ry.setAttribute('y2', lerp(py, rY, k));
        op(ry, (k > 0) * .9 * fade); ry.style.strokeDashoffset = -lt * 40; });
      slamChars(s.big, lt, tN, .07);
      runShock(s.sh, lt, tN, rec[3][0], rec[3][1], 30, 300);
    },
  },

  make: {
    build(g) {
      const s = this;
      s.drop = pill(g, '乳液液滴（油相）', '#FFD9A0', { size: 32, bg: 'rgba(5,25,60,.7)' });
      s.mc = pill(g, '纳米胶束', C.accent, { size: 36, bg: 'rgba(5,25,60,.7)' });
      s.ms = pill(g, '微球', C.a, { size: 36, bg: 'rgba(5,25,60,.7)' });
      s.use = pill(g, '生物界面修饰 · 纳米载体研究', C.accentHi, { size: 32, bg: 'rgba(5,25,60,.75)' });
      s.sh = shock(g, 2, C.accent);
    },
    update(lt, E) {
      const s = this, d = W3.defs.make.pts, [dx, dy] = P(s, d.drop), [mx, my] = P(s, d.mc), [sx, sy] = P(s, d.ms);
      popAt(s.drop, lt, E('乳化') + .1, dx, clamp(dy, 0, 820), { kind: 'card', dy: 16, out: E('纳米胶束') - .3 });
      popAt(s.mc, lt, E('纳米胶束') + .1, mx, clamp(my, 0, 800), { kind: 'card', dy: 20 });
      popAt(s.ms, lt, E('微球') + .2, clamp(sx, 0, 900), clamp(sy, 0, 800), { kind: 'card', dy: 20 });
      popAt(s.use, lt, E('界面修饰'), 300, 60, { kind: 'card', dy: 20 });
      runShock(s.sh, lt, E('纳米胶束'), mx, my - 200, 20, 220, .7);
    },
  },

  apply: {
    build(g) {
      const s = this;
      s.plain = pill(g, '普通高分子载体', C.dim, { size: 32, bg: 'rgba(5,25,60,.7)' });
      s.x = crossG(g, '#FF6B6B', 34, 8);
      s.one = pill(g, '无特异性识别', '#FF9A9A', { size: 30, bg: 'rgba(5,25,60,.7)' });
      s.sp = pill(g, '+ SP94 多肽', C.b, { size: 34, bg: 'rgba(5,25,60,.7)' });
      s.sh = shock(g, 3, C.b);
      s.cards = ['仿生材料', '多功能纳米载体', '靶向成像研究'].map((t, i) => {
        const c = boxG(g, 290, 300, [C.accent, C.a, C.b][i], { rx: 22, fill: '#0A2C5E', fo: .85 });
        T(c, t, 0, 115, { size: 34, weight: 800, anchor: 'middle' }); c._ic = el('g', {}, c); return c; });
      s.ic = [lipoIcon(s.cards[0]._ic, 62, 16), nanoIcon(s.cards[1]._ic, 40, 10), iconG(s.cards[2]._ic, 'target', C.b, 140, 3.5)];
      s.np2 = nanoIcon(s.cards[2]._ic, 20, 7);
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.apply.pts, t1 = E('单一'), tJ = E('接上'), [px, py] = P(s, d.plain), [cx, cy] = P(s, d.mc);
      popAt(s.plain, lt, E('普通'), clamp(px, 150, 850), clamp(py, 60, 800), { kind: 'card', dy: 16, out: tJ - .3 });
      runMark(s.x, lt, t1 - .3, clamp(px, 150, 850), clamp(py + 90, 60, 860), 1 - ease((lt - tJ + .3) / .4));
      popAt(s.one, lt, t1 - .2, clamp(px, 150, 850), clamp(py + 170, 60, 900), { kind: 'card', dy: 16, out: tJ - .3 });
      popAt(s.sp, lt, tJ + .1, clamp(cx, 150, 850), clamp(cy, 60, 800), { kind: 'card', dy: 16, out: E('仿生材料') - .3 });
      runShock(s.sh, lt, tJ, clamp(cx, 150, 850), clamp(cy + 120, 60, 900), 30, 300);
      const cue = [E('仿生材料'), E('多功能'), E('成像')];
      s.cards.forEach((c, i) => { popAt(c, lt, cue[i], 175 + i * 325, 700 + Math.sin(lt * 1.5 + i) * 5, { kind: 'card', dy: 60, s0: .6 });
        c._r.setAttribute('stroke-width', 3 + beatPulse(lt, beat) * 2 * (lt > cue[i])); });
      setT(s.ic[0], 0, -40, .85, lt * 6);
      setT(s.ic[1], 0, -40, 1, lt * 15);
      setT(s.ic[2], 0, -40, 1); drawIconG(s.ic[2], (lt - cue[2]) / .6);
      setT(s.np2, lerp(-110, 0, SP.heavy(lt - cue[2] - .4)), -40 + (1 - SP.heavy(lt - cue[2] - .4)) * 50, 1, lt * 30); op(s.np2, (lt - cue[2] - .3) * 3);
    },
  },

  outro: {
    full: true,
    build(g) {
      const s = this, M = TL.meta, CV = M.cover || {};
      s.l1 = Chars(g, 'PLGA-PEG-SP94', 500, 420, { size: 80, weight: 900, anchor: 'middle' }); colorChars(s.l1, segCol);
      s.l2 = T(g, CV.subtitle, 500, 495, { size: 36, fam: 'Serif', weight: 700, fill: C.accentHi, anchor: 'middle' });
      s.btn = el('g', {}, g);
      el('rect', { x: -170, y: -46, width: 340, height: 92, rx: 46, fill: C.accent }, s.btn);
      T(s.btn, M.cta, 0, 15, { size: 42, fam: 'Serif', weight: 900, fill: C.bg, anchor: 'middle', ls: 8 });
      s.ring = el('rect', { x: -170, y: -46, width: 340, height: 92, rx: 46, fill: 'none', stroke: C.accentHi, 'stroke-width': 3 }, s.btn);
      s.brand = T(g, M.brand, 500, 800, { size: 38, fam: 'Serif', weight: 900, fill: C.paper, anchor: 'middle', ls: 6 });
      s.note = T(g, M.endnote, 500, 900, { size: 28, fill: C.paper, anchor: 'middle' });
    },
    update(lt, E, beat) {
      const s = this;
      revealChars(s.l1, lt, .3, .04, 50, 'snap');
      { const kk = SP.card(lt - .9); op(s.l2, kk); s.l2.setAttribute('transform', `translate(0 ${(1 - kk) * 30})`); }
      const at = E('为华生物'), on = lt > at, th = on ? beatPulse(lt - at, beat) : 0, z = SP.pop(lt - at);
      setT(s.btn, 500, 660, z * (1 + th * .05)); op(s.btn, z * 3);
      const rk = on ? ((lt - at) % (beat * 2)) / (beat * 2) : 0;
      s.ring.setAttribute('transform', `scale(${1 + rk * .35})`); op(s.ring, on ? 1 - rk : 0);
      op(s.brand, (lt - at) / .4);
      op(s.note, (lt - 1.6) / .5 * .8);
    },
  },
};
