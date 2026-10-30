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
const segCol = i => i < 4 ? C.a : i === 4 || i === 8 ? C.dim : i < 8 ? C.accent : C.b;   // "DSPE-PEG-cRGD"
function leader(parent, col) { return el('path', { fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-dasharray': '5 9', 'stroke-linecap': 'round' }, parent); }

const SCENE_DEFS = {
  intro: {
    full: true,
    build(g) {
      const s = this;
      s.lab = pill(g, '纳米载体', C.accent, { size: 34, bg: 'rgba(5,25,60,.55)' });
      s.q = tx(g, '?', { size: 120, fam: 'Serif', weight: 900, fill: C.accentHi });
      s.sh = shock(g, 3, C.b);
      s.title = Chars(g, 'DSPE-PEG-cRGD', 500, 905, { size: 96, weight: 900, anchor: 'middle' });
      colorChars(s.title, segCol);
    },
    update(lt, E) {
      const s = this, d = W3.defs.intro.pts, tR = E('认路'), [lx, ly] = P(s, d.lab), [qx, qy] = P(s, d.q), [tx2, ty2] = P(s, d.target);
      popAt(s.lab, lt, E('纳米载体'), lx, Math.min(ly, 800), { kind: 'card', dy: 30, out: E('今天') - .2 });
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
      el('image', { href: 'assets/structure.png', x: -470, y: -170, width: 940, height: 340, preserveAspectRatio: 'xMidYMid meet' }, s.imgG);
      s.br = [0, 1, 2].map(() => el('path', { fill: 'none', stroke: C.dim, 'stroke-width': 5, 'stroke-linecap': 'round' }, g));
      s.lines = [C.a, C.accent, C.b].map(c => leader(g, c));
      s.labs = [['DSPE · 疏水', C.a], ['PEG2000 · 亲水', C.accent], ['cRGD · 环肽', C.b]].map(([t, c]) => tx(g, t, { size: 36, weight: 800, fill: c }));
      s.sh = shock(g, 3);
    },
    update(lt, E, beat) {
      const s = this, k0 = SP.card(lt), d = W3.defs.struct.pts;
      setT(s.card, 500, 250, lerp(.85, 1, k0)); op(s.card, k0 * 2);
      s.clip.setAttribute('width', 980 * ease((lt - .15) / 1.1));
      const cue = [E('疏水'), E('亲水'), E('环肽')], seg = [[30, 455], [465, 740], [750, 975]];
      s.hl.forEach((r, i) => op(r, SP.card(lt - cue[i]) * (.75 + .25 * beatPulse(lt, beat))));
      s.br.forEach((p, i) => { const [a, b] = seg[i];
        p.setAttribute('d', `M${a} 455 L${a} 470 L${b} 470 L${b} 455`); drawPath(p, ease((lt - E('三段式') - i * .12) / .4));
        p.setAttribute('stroke', lt > cue[i] ? [C.a, C.accent, C.b][i] : C.dim); });
      runShock(s.sh, lt, E('三段式'), 500, 470, 40, 520);
      const sp = d.seg.map(p => P(s, p)), lx = [Math.max(130, sp[0][0]), sp[1][0], Math.min(870, sp[2][0])];
      s.lines.forEach((p, i) => { const [a, b] = seg[i], k = ease((lt - cue[i] - .1) / .4);
        p.setAttribute('d', `M${(a + b) / 2} 478 L${sp[i][0]} ${sp[i][1] - 30}`); op(p, k * .8); p.style.strokeDashoffset = -lt * 30; });
      s.labs.forEach((l, i) => popAt(l, lt, cue[i] + .15, lx[i], 850, { kind: 'card', dy: 30 }));
    },
  },

  dspe: {
    build(g) {
      const s = this;
      s.tailLab = pill(g, '两条脂肪酸链', C.a, { size: 34, bg: 'rgba(5,25,60,.7)' }); s.tailLine = leader(g, C.a);
      s.bLab = pill(g, '磷脂双层', C.accentHi, { size: 34, bg: 'rgba(5,25,60,.7)' }); s.bLine = leader(g, C.accentHi);
      s.lock = badge(g, 'lock', 0, 0, C.a, 44);
      s.cLab = pill(g, '剖面 · 疏水核心', C.a, { size: 30, bg: 'rgba(5,25,60,.75)' });
      s.sh = shock(g, 3, C.a);
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.dspe.pts, tIn = E('嵌进'), tF = E('固定');
      const [tx2, ty2] = P(s, d.tails), [hx, hy] = P(s, d.head), [mx, my] = P(s, d.mem);
      const kL = popAt(s.tailLab, lt, E('两条'), 790, 260, { kind: 'card', dy: 20, out: tIn + 1.2 });
      s.tailLine.setAttribute('d', `M${790 - s.tailLab._w / 2} 275 L${tx2 + 20} ${ty2}`); op(s.tailLine, kL * (1 - ease((lt - tIn - 1.2) / .4)));
      s.tailLine.style.strokeDashoffset = -lt * 30;
      const kB = popAt(s.bLab, lt, E('磷脂双层') + .1, 150, 900, { kind: 'card', dy: 20 });
      s.bLine.setAttribute('d', `M150 ${900 - 30} L${mx} ${my}`); op(s.bLine, kB); s.bLine.style.strokeDashoffset = -lt * 30;
      placeBadge(s.lock, lt, tF, hx, hy - 110, { ink: C.a, s: 1 + beatPulse(lt, beat) * .05 * (lt > tF) });
      runShock(s.sh, lt, tF, hx, hy, 30, 380);
      const [cx2, cy2] = P(s, d.core); popAt(s.cLab, lt, E('磷脂双层') + .5, cx2, cy2, { kind: 'card', dy: 16, out: tF - .1 });
    },
  },

  peg: {
    build(g) {
      const s = this;
      s.brush = tx(g, '水合保护层', { size: 40, weight: 800, fill: C.accentHi });
      s.wLab = pill(g, '水溶性 ↑', C.accent, { size: 36, bg: 'rgba(5,25,60,.7)' });
      s.x = crossG(g, '#FF6B6B', 34, 8);
      s.aLab = pill(g, '不易团聚', C.b, { size: 34, bg: 'rgba(5,25,60,.7)' });
      s.sh = shock(g, 2, C.accentHi);
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.peg.pts, tA = E('团聚'), [nx, ny] = P(s, d.np);
      popAt(s.brush, lt, E('保护刷') + .2, 500, 90, { kind: 'card', dy: 20 });
      popAt(s.wLab, lt, E('水溶性'), 160, 200, { kind: 'card', dy: 20, s: 1 + beatPulse(lt, beat) * .04 * (lt > E('水溶性')) });
      runShock(s.sh, lt, tA, nx, ny, 20, 170, .8);
      runMark(s.x, lt, tA + .1, nx, ny);
      popAt(s.aLab, lt, tA + .15, Math.min(nx, 860), ny + 90, { kind: 'card', dy: 20 });
    },
  },

  rgd: {
    build(g) {
      const s = this;
      s.cellLab = tx(g, '细胞表面', { size: 32, fill: C.paper, weight: 700 });
      s.rays = [...Array(7)].map(() => el('line', { stroke: '#D9CCFF', 'stroke-width': 3, 'stroke-dasharray': '4 12', 'stroke-linecap': 'round' }, g));
      s.rLab = pill(g, 'cRGD 环肽', C.b, { size: 34, bg: 'rgba(5,25,60,.7)' });
      s.sLab = pill(g, '生物活性位点', C.paper, { size: 32, bg: 'rgba(5,25,60,.7)' });
      s.big = Chars(g, '靶向结合', 500, 120, { size: 84, fam: 'Serif', weight: 900, fill: C.accentHi, anchor: 'middle' });
      s.sh = shock(g, 3, C.b);
    },
    update(lt, E) {
      const s = this, d = W3.defs.rgd.pts, tN = E('导航'), [px, py] = P(s, d.tip), rec = d.recs.map(p => P(s, p));
      popAt(s.cellLab, lt, .3, 900, 960, { kind: 'card' });
      popAt(s.rLab, lt, E('环肽') + .1, px - 40, py - 90, { kind: 'card', dy: 20, out: tN - .5 });
      s.rays.forEach((ry, i) => { const k = ease((lt - E('识别') - i * .06) / .4), fade = 1 - ease((lt - tN + .3) / .4), [rx, rY] = rec[i];
        ry.setAttribute('x1', px); ry.setAttribute('y1', py); ry.setAttribute('x2', lerp(px, rx, k)); ry.setAttribute('y2', lerp(py, rY, k));
        op(ry, (k > 0) * .9 * fade); ry.style.strokeDashoffset = -lt * 40; });
      popAt(s.sLab, lt, E('位点') + .1, 800, 860, { kind: 'card', dy: 20 });
      slamChars(s.big, lt, tN, .07);
      runShock(s.sh, lt, tN, rec[3][0], rec[3][1], 30, 300);
    },
  },

  apply: {
    build(g) {
      const s = this;
      s.parts = [['DSPE', C.a], ['PEG', C.accent], ['cRGD', C.b]].map(([t, c]) => tx(g, t, { size: 34, weight: 900, fill: c }));
      s.word = tx(g, '各司其职 · 协同', { size: 40, weight: 800, fill: C.accentHi });
      s.sh = shock(g, 3);
      s.slots = [0, 1, 2].map(() => boxG(g, 290, 330, C.dim, { rx: 22, fo: .25, dash: '10 12', sw: 2 }));
      s.cards = ['功能性脂质体', '纳米载体修饰', '靶向载体构建'].map((t, i) => {
        const c = boxG(g, 290, 330, [C.accent, C.a, C.b][i], { rx: 22, fill: '#0A2C5E', fo: .85 });
        T(c, t, 0, 125, { size: 36, weight: 800, anchor: 'middle' }); c._ic = el('g', {}, c); return c; });
      s.cl = lipoIcon(s.cards[0]._ic, 70, 18);
      s.np = nanoIcon(s.cards[1]._ic, 42, 10);
      s.tg = iconG(s.cards[2]._ic, 'target', C.b, 150, 3.5);
      s.np2 = nanoIcon(s.cards[2]._ic, 22, 7);
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.apply.pts, tC = E('协同');
      s.parts.forEach((l, i) => { const [x, y] = P(s, d.parts[i]); popAt(l, lt, .2 + i * .15, x, y - 70, { kind: 'card', dy: 20, out: tC - .3 }); });
      popAt(s.word, lt, tC + .2, 500, 410, { kind: 'card', dy: 20 });
      const [cx, cy] = P(s, d.parts[1]); runShock(s.sh, lt, tC, cx, cy, 40, 480);
      const cue = [E('脂质体'), E('修饰'), E('靶向载体')];
      s.slots.forEach((b, i) => { popAt(b, lt, .2 + i * .12, 175 + i * 325, 690, { kind: 'card', s0: .8, out: cue[i] }); b._r.style.strokeDashoffset = -lt * 20; });
      s.cards.forEach((c, i) => { popAt(c, lt, cue[i], 175 + i * 325, 690 + Math.sin(lt * 1.5 + i) * 5, { kind: 'card', dy: 60, s0: .6 });
        c._r.setAttribute('stroke-width', 3 + beatPulse(lt, beat) * 2 * (lt > cue[i])); });
      setT(s.cl, 0, -45, .9, lt * 6);
      setT(s.np, 0, -45, 1, lt * 15);
      setT(s.tg, 0, -45, 1); drawIconG(s.tg, (lt - cue[2]) / .6);
      setT(s.np2, lerp(-110, 0, SP.heavy(lt - cue[2] - .4)), -45 + (1 - SP.heavy(lt - cue[2] - .4)) * 50, 1, lt * 30); op(s.np2, (lt - cue[2] - .3) * 3);
    },
  },

  store: {
    build(g) {
      const s = this;
      s.panel = el('rect', { x: 60, y: 120, width: 940, height: 720, rx: 30, fill: '#05214A', 'fill-opacity': .72, stroke: C.accent, 'stroke-opacity': .25, 'stroke-width': 2 }, g);
      s.rows = [['储存', 250, C.accent], ['操作', 680, C.b]].map(([t, y, c]) => { const r = tx(g, t, { size: 44, fam: 'Serif', weight: 900, fill: c });
        r._l = el('line', { x1: 140, y1: y, x2: 980, y2: y, stroke: c, 'stroke-width': 2, 'stroke-opacity': .35 }, g); return r; });
      const items = [['低温', 'snow', C.accent], ['干燥', 'drop', C.accent], ['密封', 'lock', C.accent], ['温和缓冲', 'beaker', '#7EE0A8'], ['强酸强碱', null, '#FF6B6B'], ['高温', 'flame', '#FF6B6B']];
      s.items = items.map(([t, ic, c], i) => { const b = badge(g, ic || 'vial', 0, 0, c, 72);
        if (!ic) { b.name = null; T(b.ic, 'pH', 32, 44, { size: 34, weight: 900, fill: C.paper, anchor: 'middle' }); }
        const lab = tx(g, t, { size: 38, weight: 800, fill: C.paper });
        const mk = i < 4 ? checkG(g, '#7EE0A8', 1, 8) : crossG(g, '#FF6B6B', 30, 9);
        return { b, lab, mk, x: 320 + (i % 3) * 270, y: i < 3 ? 250 : 680 }; });
    },
    update(lt, E, beat) {
      const s = this, cue = [E('低温'), E('干燥'), E('密封'), E('缓冲'), E('强酸强碱'), E('高温')];
      op(s.panel, SP.card(lt) * 1);
      s.rows.forEach((r, i) => { popAt(r, lt, i * .15, 120, [250, 680][i], { kind: 'card', dy: 20 }); drawPath(r._l, ease((lt - i * .15) / .8)); });
      s.items.forEach((it, i) => { const at = cue[i], on = lt > at, k = SP.pop(lt - at), bob = Math.sin(lt * 2 + i) * 4;
        setT(it.b.g, it.x, it.y - 30 + bob, k * (1 + (on ? beatPulse(lt, beat) * .04 : 0))); op(it.b.g, k * 3);
        if (it.b.name) drawIcon(it.b.ic, it.b.name, C.paper, clamp((lt - at - .05) / .55), 3.4);
        popAt(it.lab, lt, at + .1, it.x, it.y + 100, { kind: 'snap', dy: 20 });
        runMark(it.mk, lt, at + .35, it.x + 60, it.y - 85, 1); });
    },
  },

  outro: {
    full: true,
    build(g) {
      const s = this, M = TL.meta, CV = M.cover || {};
      s.l1 = Chars(g, 'DSPE-PEG-cRGD', 500, 420, { size: 80, weight: 900, anchor: 'middle' }); colorChars(s.l1, segCol);
      s.l2 = T(g, CV.subtitle, 500, 495, { size: 36, fam: 'Serif', weight: 700, fill: C.accentHi, anchor: 'middle' });
      s.btn = el('g', {}, g);
      el('rect', { x: -170, y: -46, width: 340, height: 92, rx: 46, fill: C.accent }, s.btn);
      T(s.btn, M.cta, 0, 15, { size: 42, fam: 'Serif', weight: 900, fill: C.bg, anchor: 'middle', ls: 8 });
      s.ring = el('rect', { x: -170, y: -46, width: 340, height: 92, rx: 46, fill: 'none', stroke: C.accentHi, 'stroke-width': 3 }, s.btn);
      s.note = T(g, M.endnote, 500, 900, { size: 30, fill: C.paper, anchor: 'middle' });
    },
    update(lt, E, beat) {
      const s = this;
      revealChars(s.l1, lt, .3, .04, 50, 'snap');
      { const kk = SP.card(lt - .9); op(s.l2, kk); s.l2.setAttribute('transform', `translate(0 ${(1 - kk) * 30})`); }
      const at = E('为华课堂'), on = lt > at, th = on ? beatPulse(lt - at, beat) : 0, z = SP.pop(lt - at);
      setT(s.btn, 500, 660, z * (1 + th * .05)); op(s.btn, z * 3);
      const rk = on ? ((lt - at) % (beat * 2)) / (beat * 2) : 0;
      s.ring.setAttribute('transform', `scale(${1 + rk * .35})`); op(s.ring, on ? 1 - rk : 0);
      op(s.note, (lt - 1.6) / .5 * .8);
    },
  },
};
