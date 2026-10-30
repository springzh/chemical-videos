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
const segCol = i => i === 0 ? C.a : i === 4 ? C.dim : i < 4 ? C.accent : C.b;   // "mPEG-NHS"
function leader(parent, col) { return el('path', { fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-dasharray': '5 9', 'stroke-linecap': 'round' }, parent); }
const lab = (g, t, c, size = 32) => pill(g, t, c, { size, bg: 'rgba(5,25,60,.72)' });
function pinLine(p, x0, y0, x1, y1, k, lt) { p.setAttribute('d', `M${x0} ${y0} L${x1} ${y1}`); op(p, k * .85); p.style.strokeDashoffset = -lt * 30; }

const SCENE_DEFS = {
  intro: {
    full: true,
    build(g) {
      const s = this;
      s.chain = lab(g, '聚乙二醇长链', C.accent, 34); s.prot = lab(g, '蛋白质 · 赖氨酸', '#F2A6C6', 34);
      s.q = tx(g, '?', { size: 120, fam: 'Serif', weight: 900, fill: C.accentHi });
      s.sh = shock(g, 3, C.b);
      s.title = Chars(g, 'mPEG-NHS', 500, 880, { size: 104, weight: 900, anchor: 'middle' }); colorChars(s.title, segCol);
    },
    update(lt, E) {
      const s = this, d = W3.defs.intro.pts, tT = E('今天'), [qx, qy] = P(s, d.q), [px, py] = P(s, d.prot), [cx, cy] = P(s, d.chain);
      popAt(s.chain, lt, E('长链'), clamp(cx, 150, 850), clamp(cy - 90, 80, 700), { kind: 'card', dy: 20, out: tT - .2 });
      popAt(s.prot, lt, E('蛋白质'), clamp(px, 150, 850), clamp(py, 80, 760), { kind: 'card', dy: 20, out: tT - .2 });
      popAt(s.q, lt, E('蛋白质'), qx, qy, { s0: 2.2, kind: 'heavy', out: tT });
      runShock(s.sh, lt, E('蛋白质'), qx, qy + 80, 30, 240);
      slamChars(s.title, lt, tT + .2, .06);
    },
  },

  struct: {
    build(g) {
      const s = this;
      s.card = boxG(g, 960, 200, C.accent, { fill: '#F3F9FF', fo: 1, sw: 3, rx: 24 });
      const cp = el('clipPath', { id: 'structClip' }, g); s.clip = el('rect', { x: -480, y: -100, width: 0, height: 200 }, cp);
      s.inner = el('g', { 'clip-path': 'url(#structClip)' }, s.card);
      // schematic formula, three coloured blocks: CH3O– | (CH2CH2O)n | –CO–O–NHS (+ succinimide ring drawn as a pentagon)
      s.hl = [[-460, -250, C.a], [-240, 120, C.accent], [130, 460, C.b]].map(([x0, x1, c]) => el('rect', { x: x0, y: -80, width: x1 - x0, height: 130, rx: 14, fill: c, 'fill-opacity': .14, stroke: c, 'stroke-width': 3 }, s.inner));
      T(s.inner, 'CH₃O–', -355, 2, { size: 50, weight: 800, fill: '#B86A10', anchor: 'middle' });
      T(s.inner, '(CH₂CH₂O)ₙ', -60, 2, { size: 50, weight: 800, fill: '#1677A8', anchor: 'middle' });
      T(s.inner, '–C(=O)–O–N', 235, 2, { size: 44, weight: 800, fill: '#6A4FD0', anchor: 'middle' });
      const pent = [...Array(5)].map((_, i) => polar(395, -14, 36, -90 + i * 72 + 180)).map(p => p.join(' ')).join(' L');
      el('path', { d: 'M' + pent + ' Z', fill: 'none', stroke: '#6A4FD0', 'stroke-width': 5 }, s.inner);
      T(s.inner, 'O', 352, 52, { size: 28, weight: 700, fill: '#6A4FD0', anchor: 'middle' }); T(s.inner, 'O', 440, 52, { size: 28, weight: 700, fill: '#6A4FD0', anchor: 'middle' });
      T(s.inner, 'n ≈ 114 · MW ≈ 5000 · 活性酯连接方式以产品为准 · 示意', 0, 84, { size: 27, fill: '#4A6487', anchor: 'middle' });
      s.lines = [C.a, C.accent, C.b].map(c => leader(g, c));
      s.labs = [['甲氧基 · 惰性', C.a], ['PEG · 柔顺亲水', C.accent], ['NHS 酯 · 活性', C.b]].map(([t, c]) => lab(g, t, c, 34));
      s.inert = lab(g, '只有一头反应', C.paper, 30);
      s.find = lab(g, '找伯胺 –NH₂', '#8FB4FF', 30); s.fl = leader(g, '#8FB4FF');
      s.sh = shock(g, 3, C.b);
    },
    update(lt, E, beat) {
      const s = this, k0 = SP.card(lt), d = W3.defs.struct.pts;
      setT(s.card, 500, 135, lerp(.85, 1, k0)); op(s.card, k0 * 2);
      s.clip.setAttribute('width', 960 * ease((lt - .15) / 1.1));
      const cue = [E('甲氧基'), E('线性'), E('活性酯')], bx = [145, 470, 795];
      s.hl.forEach((r, i) => op(r, SP.card(lt - cue[i]) * (.75 + .25 * beatPulse(lt, beat))));
      const sp = d.seg.map(p => P(s, p));
      const ly = [Math.min(800, sp[0][1] + 150), Math.max(330, sp[1][1] - 170), Math.min(800, sp[2][1] + 150)];
      s.labs.forEach((l, i) => { const x = clamp(sp[i][0], 140, 860), k = popAt(l, lt, cue[i] + .15, x, ly[i], { kind: 'card', dy: 20 });
        pinLine(s.lines[i], x, ly[i] + (i === 1 ? 25 : -25), sp[i][0], sp[i][1], k, lt); });
      popAt(s.inert, lt, E('惰性') + .1, clamp(sp[0][0], 140, 860), ly[0] + 62, { kind: 'card', dy: 16, out: E('活性酯') });
      const [gx, gy] = P(s, d.ghost), kf = popAt(s.find, lt, E('氨基') + .1, clamp(gx + 40, 160, 860), gy - 80, { kind: 'card', dy: 16, out: E('柔顺') + .3 });
      pinLine(s.fl, sp[2][0], sp[2][1], gx, gy, kf, lt);
      runShock(s.sh, lt, E('活性酯'), sp[2][0], sp[2][1], 20, 220);
    },
  },

  couple: {
    build(g) {
      const s = this;
      s.lys = lab(g, '赖氨酸 ε-NH₂', '#8FB4FF', 32); s.ll = leader(g, '#8FB4FF');
      s.bond = tx(g, '酰胺键 –CO–NH–', { size: 44, weight: 900, fill: '#FFF1C9' });
      s.nhs = lab(g, 'NHS 离去', C.b, 32);
      s.done = lab(g, '蛋白 PEG 化 ✓', C.accent, 36);
      s.sh = shock(g, 3, '#FFF1C9');
    },
    update(lt, E) {
      const s = this, d = W3.defs.couple.pts, [ax, ay] = P(s, d.A), [nx, ny] = P(s, d.nhs), [bx, by] = P(s, d.bond), [px, py] = P(s, d.prot);
      const kL = popAt(s.lys, lt, E('赖氨酸'), clamp(ax + 30, 160, 860), clamp(ay + 170, 120, 820), { kind: 'card', dy: 16, out: E('成键') - .1 });
      pinLine(s.ll, clamp(ax + 30, 160, 860), clamp(ay + 145, 120, 820), ax, ay, kL * (lt < E('成键')), lt);
      popAt(s.bond, lt, E('成键') + .1, clamp(bx, 220, 780), clamp(by + 150, 60, 820), { kind: 'heavy', s0: 1.6, out: E('接上') - .1 });
      runShock(s.sh, lt, E('成键'), bx, by, 20, 260);
      popAt(s.nhs, lt, E('释放') + .2, clamp(nx + 30, 140, 860), clamp(ny - 70, 60, 800), { kind: 'card', dy: 16 });
      popAt(s.done, lt, E('接上'), clamp(px, 200, 800), clamp(py, 200, 830), { kind: 'card', dy: 20 });
    },
  },

  race: {
    build(g) {
      const s = this;
      s.water = lab(g, 'H₂O 进攻酯键', '#FF8C8C', 30);
      s.acid = [0, 1, 2].map(() => tx(g, '–COOH', { size: 30, weight: 800, fill: '#A9B4C6' }));
      s.dead = lab(g, '羧酸 · 失活', '#A9B4C6', 30);
      s.win = lab(g, '氨基先到 → 成键', C.accent, 34);
      s.vs = Chars(g, '氨基 vs 水', 330, 95, { size: 64, fam: 'Serif', weight: 900, fill: C.accentHi, anchor: 'middle' });
      s.sh = shock(g, 3, C.accentHi);
    },
    update(lt, E) {
      const s = this, d = W3.defs.race.pts, tH = E('水解'), tA = [tH, tH + .6, E('越快') + .3], L = d.lose.map(p => P(s, p)), [wx, wy] = P(s, d.win);
      popAt(s.water, lt, E('水也在抢'), clamp(L[0][0] - 20, 150, 850), clamp(L[0][1] + 120, 120, 840), { kind: 'card', dy: 16, out: tH + .2 });
      s.acid.forEach((a, j) => popAt(a, lt, tA[j] + .4, clamp(L[j][0] - 10, 80, 920), clamp(L[j][1] - 55, 40, 880), { kind: 'snap', dy: 10, out: E('谁先到') + 1.2 }));
      popAt(s.dead, lt, E('羧酸'), clamp(L[1][0] - 40, 150, 850), clamp(L[1][1] + 90, 120, 860), { kind: 'card', dy: 16, out: E('越快') + .8 });
      slamChars(s.vs, lt, E('谁先到') - .9, .06);
      popAt(s.win, lt, E('谁先到') + .4, clamp(wx, 180, 820), clamp(wy + 230, 120, 860), { kind: 'card', dy: 20 });
      runShock(s.sh, lt, E('谁先到') + .1, wx + 60, wy, 20, 260);
    },
  },

  pegyl: {
    build(g) {
      const s = this;
      s.shell = lab(g, '水合层', C.accentHi, 34); s.sl = leader(g, C.accentHi);
      s.x = crossG(g, '#FF6B6B', 34, 8); s.ad = lab(g, '吸附不上', C.b, 30);
      s.circ = el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 5, 'stroke-linecap': 'round', 'marker-end': '' }, g);
      s.cl = lab(g, '循环时间 ↑', C.accent, 34);
      s.sh = shock(g, 2, C.accentHi);
    },
    update(lt, E) {
      const s = this, d = W3.defs.pegyl.pts, tA = E('吸附'), tC = E('循环'), [ox, oy] = P(s, d.other), [hx, hy] = P(s, d.shell), [rx, ry] = P(s, d.root);
      const k = popAt(s.shell, lt, E('水合层') + .1, 170, 200, { kind: 'card', dy: 16 }); pinLine(s.sl, 210, 225, hx, hy, k, lt);
      runShock(s.sh, lt, tA, ox, oy, 20, 160, .8); runMark(s.x, lt, tA + .1, ox, oy);
      popAt(s.ad, lt, tA + .15, clamp(ox, 150, 860), clamp(oy + 90, 100, 860), { kind: 'card', dy: 16, out: tC + .8 });
      s.circ.setAttribute('d', arcD(rx, ry, 420, 200, 330)); drawPath(s.circ, ease((lt - tC) / .9)); op(s.circ, .8 * (lt > tC));
      popAt(s.cl, lt, tC + .2, 800, 860, { kind: 'card', dy: 20 });
    },
  },

  store: {
    build(g) {
      const s = this;
      s.items = [['-20 °C', 'snow', C.accent], ['干燥', 'drop', C.accent], ['密封避光', 'lock', C.accent], ['惰性气体', 'layers', '#C9B6FF']].map(([t, ic, c]) => ({ b: badge(g, ic, 0, 0, c, 54), l: tx(g, t, { size: 30, weight: 800, fill: C.paper }) }));
      s.warm = lab(g, '回温至室温再开封', '#FFC27A', 32);
      s.wet = lab(g, '冷瓶开封 → 冷凝吸潮 → 水解', '#FF8C8C', 30); s.wx = crossG(g, '#FF6B6B', 30, 8);
      s.fresh = lab(g, '现配现用', C.accent, 36);
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.store.pts, cue = [E('零下二十度'), E('干燥'), E('密封'), E('惰性气体')], [nx, ny] = P(s, d.neck);
      s.items.forEach((it, i) => { const x = 100, y = 170 + i * 150, on = lt > cue[i];
        placeBadge(it.b, lt, cue[i], x, y, { s: 1 + (on ? beatPulse(lt, beat) * .04 : 0), out: E('室温') + 4 });
        popAt(it.l, lt, cue[i] + .1, x, y + 78, { kind: 'snap', dy: 12, out: E('室温') + 4 }); });
      popAt(s.warm, lt, E('室温'), clamp(nx, 300, 800), clamp(ny - 110, 60, 400), { kind: 'card', dy: 16, out: E('吸潮') - .1 });
      popAt(s.wet, lt, E('吸潮'), clamp(nx, 320, 780), clamp(ny - 110, 60, 400), { kind: 'card', dy: 16, out: E('含氨') - .2 });
      runMark(s.wx, lt, E('吸潮') + .3, clamp(nx, 320, 780) + 230, clamp(ny - 110, 60, 400) - 40, lt < E('含氨') - .2 ? 1 : 0);
      popAt(s.fresh, lt, E('现配现用'), 640, 880, { kind: 'card', dy: 20 });
    },
  },

  outro: {
    full: true,
    build(g) {
      const s = this, M = TL.meta, CV = M.cover || {};
      s.l1 = Chars(g, 'mPEG-NHS', 500, 440, { size: 92, weight: 900, anchor: 'middle' }); colorChars(s.l1, segCol);
      s.l2 = T(g, CV.subtitle, 500, 515, { size: 36, fam: 'Serif', weight: 700, fill: C.accentHi, anchor: 'middle' });
      s.btn = el('g', {}, g);
      el('rect', { x: -170, y: -46, width: 340, height: 92, rx: 46, fill: C.accent }, s.btn);
      T(s.btn, M.cta, 0, 15, { size: 42, fam: 'Serif', weight: 900, fill: C.bg, anchor: 'middle', ls: 8 });
      s.ring = el('rect', { x: -170, y: -46, width: 340, height: 92, rx: 46, fill: 'none', stroke: C.accentHi, 'stroke-width': 3 }, s.btn);
      s.note = T(g, M.endnote, 500, 900, { size: 30, fill: C.paper, anchor: 'middle' });
    },
    update(lt, E, beat) {
      const s = this;
      revealChars(s.l1, lt, .3, .05, 50, 'snap');
      { const kk = SP.card(lt - .9); op(s.l2, kk); s.l2.setAttribute('transform', `translate(0 ${(1 - kk) * 30})`); }
      const at = E('为华课堂'), on = lt > at, th = on ? beatPulse(lt - at, beat) : 0, z = SP.pop(lt - at);
      setT(s.btn, 500, 680, z * (1 + th * .05)); op(s.btn, z * 3);
      const rk = on ? ((lt - at) % (beat * 2)) / (beat * 2) : 0;
      s.ring.setAttribute('transform', `scale(${1 + rk * .35})`); op(s.ring, on ? 1 - rk : 0);
      op(s.note, (lt - 1.6) / .5 * .8);
    },
  },
};
