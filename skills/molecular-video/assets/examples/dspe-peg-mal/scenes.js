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
  sun:    ['M32 32 m-10 0 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0', 'M32 6 L32 14', 'M32 50 L32 58', 'M6 32 L14 32', 'M50 32 L58 32',
           'M14 14 L19 19', 'M45 45 L50 50', 'M50 14 L45 19', 'M19 45 L14 50', 'M8 56 L56 8'],
  clock:  ['M32 34 m-22 0 a22 22 0 1 0 44 0 a22 22 0 1 0 -44 0', 'M32 34 L32 20', 'M32 34 L42 40', 'M26 6 L38 6'],
  vial:   ['M24 6 L40 6', 'M26 6 L26 18 L18 30 L18 56 L46 56 L46 30 L38 18 L38 6', 'M18 40 L46 40'],
});
function colorChars(ch, fn) { ch.chars.forEach((c, i) => c.e.setAttribute('fill', fn(i))); }
const segCol = i => i < 4 ? C.a : i === 4 || i === 8 ? C.dim : i < 8 ? C.accent : C.b;   // "DSPE-PEG-MAL"
function leader(parent, col) { return el('path', { fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-dasharray': '5 9', 'stroke-linecap': 'round' }, parent); }

// Schematic structure card (no structure image supplied): C18 ×2 – glycerol – phosphate – NH | –(CH2CH2O)n– | maleimide ring.
// Card-local coordinates: x −470..470, y −170..170. Marked "示意".
function structSchematic(parent) {
  const g = el('g', {}, parent), ink = '#1B2D4A', ln = (d, col = ink, w = 4) => el('path', { d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  const zig = (x0, x1, y) => { let d = `M${x0} ${y}`; for (let x = x0 + 18, k = 1; x <= x1; x += 18, k++) d += ` L${x} ${y + (k % 2 ? -11 : 11)}`; return d; };
  ln(zig(-455, -310, -60)); ln(zig(-455, -310, 30));
  ln('M-310 -60 L-280 -60 L-250 -20 M-310 30 L-280 30 L-250 -20'); T(g, 'O', -296, -78, { size: 27, weight: 700, fill: ink, anchor: 'middle' }); T(g, 'O', -296, 70, { size: 27, weight: 700, fill: ink, anchor: 'middle' });
  ln('M-250 -20 L-205 -20');
  el('circle', { cx: -180, cy: -20, r: 25, fill: C.a }, g); T(g, 'P', -180, -9, { size: 30, weight: 900, fill: '#fff', anchor: 'middle' });
  T(g, 'O⁻', -180, -58, { size: 27, weight: 700, fill: ink, anchor: 'middle' });
  ln('M-155 -20 L-120 -20'); T(g, 'NH', -92, -9, { size: 30, weight: 800, fill: ink, anchor: 'middle' }); ln('M-64 -20 L-40 -20');
  T(g, '2 × C18 硬脂酰', -380, 120, { size: 28, weight: 700, fill: ink, anchor: 'middle' }); T(g, '磷酸乙醇胺', -150, 60, { size: 27, weight: 600, fill: '#4D6283', anchor: 'middle' });
  ln('M-40 -20 L-25 -20');
  T(g, '–(CH₂CH₂O)ₙ–', 105, -8, { size: 44, fam: 'Serif', weight: 800, fill: ink, anchor: 'middle' });
  T(g, 'n ≈ 45（PEG2000）', 105, 50, { size: 28, weight: 600, fill: '#4D6283', anchor: 'middle' });
  ln('M235 -20 L290 -20');
  const cx = 365, cy = -20, R = 58, V5 = { N: 180, C2: 252, C3: 324, C4: 36, C5: 108 }, pt = k => polar(cx, cy, R, V5[k]);
  const [N, C2, C3, C4, C5] = ['N', 'C2', 'C3', 'C4', 'C5'].map(pt);
  ln(`M${N[0]} ${N[1]} L${C2[0]} ${C2[1]} L${C3[0]} ${C3[1]} M${C4[0]} ${C4[1]} L${C5[0]} ${C5[1]} L${N[0]} ${N[1]}`);
  const cc = ln(`M${C3[0]} ${C3[1]} L${C4[0]} ${C4[1]}`, C.b, 6), off = (p, a, r) => polar(p[0], p[1], r, a);
  const i3 = off(C3, 180, 12), i4 = off(C4, 180, 12); ln(`M${i3[0]} ${i3[1] + 6} L${i4[0]} ${i4[1] - 6}`, C.b, 6);
  [[C2, 252], [C5, 108]].forEach(([p, a]) => { const q = polar(p[0], p[1], 40, a), s1 = polar(0, 0, 6, a + 90);
    ln(`M${p[0] + s1[0]} ${p[1] + s1[1]} L${q[0] + s1[0]} ${q[1] + s1[1]} M${p[0] - s1[0]} ${p[1] - s1[1]} L${q[0] - s1[0]} ${q[1] - s1[1]}`);
    const o = polar(p[0], p[1], 58, a); T(g, 'O', o[0], o[1] + 10, { size: 30, weight: 800, fill: ink, anchor: 'middle' }); });
  el('circle', { cx: N[0], cy: N[1], r: 20, fill: '#F3F9FF' }, g); T(g, 'N', N[0], N[1] + 11, { size: 32, weight: 900, fill: ink, anchor: 'middle' });
  T(g, 'C=C', 466, 62, { size: 27, weight: 900, fill: C.b, anchor: 'end' });
  T(g, '马来酰亚胺', cx, 120, { size: 28, weight: 700, fill: ink, anchor: 'middle' });
  T(g, '示意', 455, -140, { size: 27, weight: 700, fill: '#7A8DAA', anchor: 'end' });
  g._cc = cc; return g;
}

const SCENE_DEFS = {
  intro: {
    full: true,
    build(g) {
      const s = this;
      s.pep = pill(g, '多肽', '#C9B8FF', { size: 32, bg: 'rgba(5,25,60,.6)' });
      s.ab = pill(g, '抗体片段', '#C9B8FF', { size: 32, bg: 'rgba(5,25,60,.6)' });
      s.lab = pill(g, '脂质体', C.accent, { size: 34, bg: 'rgba(5,25,60,.55)' });
      s.sh = shock(g, 3, C.b);
      s.title = Chars(g, 'DSPE-PEG-MAL', 500, 905, { size: 96, weight: 900, anchor: 'middle' });
      colorChars(s.title, segCol);
    },
    update(lt, E) {
      const s = this, d = W3.defs.intro.pts, tA = E('答案'), [px, py] = P(s, d.pep), [bx, by] = P(s, d.ab), [lx, ly] = P(s, d.lab), [cx, cy] = P(s, d.c);
      popAt(s.pep, lt, E('多肽') + .1, clamp(px, 80, 920), clamp(py - 60, 60, 760), { kind: 'card', dy: 20, out: tA - .3 });
      popAt(s.ab, lt, E('多肽') + .8, clamp(bx, 80, 920), clamp(by - 70, 60, 760), { kind: 'card', dy: 20, out: tA - .3 });
      popAt(s.lab, lt, E('脂质体'), lx, Math.min(ly, 780), { kind: 'card', dy: 30, out: tA - .1 });
      runShock(s.sh, lt, tA, cx, cy, 60, 420);
      slamChars(s.title, lt, tA, .05);
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
      s.labs = [['DSPE · 疏水', C.a], ['PEG2000 · 亲水', C.accent], ['马来酰亚胺 · 反应', C.b]].map(([t, c]) => tx(g, t, { size: 34, weight: 800, fill: c }));
      s.ccLab = pill(g, 'C=C 反应位点', C.b, { size: 30, bg: 'rgba(5,25,60,.75)' });
      s.sh = shock(g, 3);
    },
    update(lt, E, beat) {
      const s = this, k0 = SP.card(lt), d = W3.defs.struct.pts;
      setT(s.card, 500, 250, lerp(.85, 1, k0)); op(s.card, k0 * 2);
      s.clip.setAttribute('width', 980 * ease((lt - .15) / 1.1));
      const cue = [E('疏水'), E('亲水'), E('末端')], seg = [[30, 455], [465, 740], [750, 975]];
      s.hl.forEach((r, i) => op(r, SP.card(lt - cue[i]) * (.75 + .25 * beatPulse(lt, beat))));
      s.sch._cc.setAttribute('stroke-width', 6 + (lt > E('反应基团') ? beatPulse(lt, beat) * 4 : 0));
      s.br.forEach((p, i) => { const [a, b] = seg[i];
        p.setAttribute('d', `M${a} 455 L${a} 470 L${b} 470 L${b} 455`); drawPath(p, ease((lt - E('三段式') - i * .12) / .4));
        p.setAttribute('stroke', lt > cue[i] ? [C.a, C.accent, C.b][i] : C.dim); });
      runShock(s.sh, lt, E('三段式'), 500, 470, 40, 520);
      const sp = d.seg.map(p => P(s, p)), lx = [Math.max(130, sp[0][0]), sp[1][0], Math.min(850, sp[2][0])];
      const kOut = ease((lt - E('反应基团') + .2) / .4);
      s.lines.forEach((p, i) => { const [a, b] = seg[i], k = ease((lt - cue[i] - .1) / .4);
        p.setAttribute('d', `M${(a + b) / 2} 478 L${sp[i][0]} ${sp[i][1] - 30}`); op(p, k * .8 * (i < 2 ? 1 - kOut : 1)); p.style.strokeDashoffset = -lt * 30; });
      s.labs.forEach((l, i) => popAt(l, lt, cue[i] + .15, lx[i], 850, { kind: 'card', dy: 30, out: i < 2 ? E('反应基团') - .2 : undefined }));
      const [ccx, ccy] = P(s, d.cc); popAt(s.ccLab, lt, E('反应基团') + .2, clamp(ccx - 60, 150, 850), clamp(ccy - 90, 520, 780), { kind: 'card', dy: 20 });
    },
  },

  dspe: {
    build(g) {
      const s = this;
      s.tailLab = pill(g, '两条硬脂酰链', C.a, { size: 34, bg: 'rgba(5,25,60,.7)' }); s.tailLine = leader(g, C.a);
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
      s.brush = tx(g, '水合层', { size: 40, weight: 800, fill: C.accentHi });
      s.wLab = pill(g, '体系稳定 ↑', C.accent, { size: 36, bg: 'rgba(5,25,60,.7)' });
      s.x = crossG(g, '#FF6B6B', 34, 8);
      s.aLab = pill(g, '不易团聚', C.b, { size: 34, bg: 'rgba(5,25,60,.7)' });
      s.sh = shock(g, 2, C.accentHi);
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.peg.pts, tA = E('团聚'), [nx, ny] = P(s, d.np);
      popAt(s.brush, lt, E('水合层') + .2, 330, 90, { kind: 'card', dy: 20 });
      popAt(s.wLab, lt, E('稳定'), 200, 200, { kind: 'card', dy: 20, s: 1 + beatPulse(lt, beat) * .04 * (lt > E('稳定')) });
      runShock(s.sh, lt, tA, nx, ny, 20, 170, .8);
      runMark(s.x, lt, tA + .1, nx, ny);
      popAt(s.aLab, lt, tA + .15, Math.min(nx, 860), ny + 90, { kind: 'card', dy: 20 });
    },
  },

  couple: {
    build(g) {
      const s = this;
      s.cc = pill(g, '马来酰亚胺 C=C', C.b, { size: 32, bg: 'rgba(5,25,60,.75)' }); s.ccLine = leader(g, C.b);
      s.sh0 = pill(g, '半胱氨酸 –SH', '#FFD54A', { size: 32, bg: 'rgba(5,25,60,.75)' });
      s.big = Chars(g, '硫醚键 C–S', 330, 120, { size: 76, fam: 'Serif', weight: 900, fill: C.accentHi, anchor: 'middle' });
      s.sh = shock(g, 3, '#FFF1C9');
      s.flow = pill(g, '先组装  →  后偶联', C.accent, { size: 36, bg: 'rgba(5,25,60,.75)' });
      s.pep = pill(g, '多肽', '#C9B8FF', { size: 30, bg: 'rgba(5,25,60,.7)' });
      s.ab = pill(g, '抗体片段', '#C9B8FF', { size: 30, bg: 'rgba(5,25,60,.7)' });
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.couple.pts, tS = E('硫醚键'), tG = E('先组装'), [cx, cy] = P(s, d.cc), [sx, sy] = P(s, d.S), [bx, by] = P(s, d.bond);
      const kC = popAt(s.cc, lt, E('巯基'), 250, 780, { kind: 'card', dy: 20, out: E('迈克尔加成') + .3 });
      s.ccLine.setAttribute('d', `M250 750 L${cx} ${cy + 18}`); op(s.ccLine, kC * (1 - ease((lt - E('迈克尔加成') - .3) / .4))); s.ccLine.style.strokeDashoffset = -lt * 30;
      popAt(s.sh0, lt, E('半胱氨酸') + .1, clamp(sx - 170, 150, 850), clamp(sy - 90, 200, 800), { kind: 'card', dy: 20, out: tS - .2 });
      slamChars(s.big, lt, tS, .07); { const q = ease((lt - tG + .2) / .4); s.big.g.setAttribute('opacity', 1 - q); }
      runShock(s.sh, lt, tS, bx, by, 20, 300);
      popAt(s.flow, lt, tG + .1, 500, 860, { kind: 'card', dy: 30 });
      const [px, py] = P(s, d.pep2), [ax, ay] = P(s, d.ab);
      popAt(s.pep, lt, tG + 1.3, clamp(px, 100, 900), clamp(py - 60, 120, 760), { kind: 'card', dy: 20 });
      popAt(s.ab, lt, E('抗体片段') + .3, clamp(ax, 100, 900), clamp(ay - 70, 120, 760), { kind: 'card', dy: 20 });
    },
  },

  ph: {
    build(g) {
      const s = this, X = p => 140 + (p - 6) / 3 * 720;
      s.X = X; s.scale = el('g', {}, g);
      el('rect', { x: 140, y: 862, width: 720, height: 16, rx: 8, fill: '#0A2C5E', stroke: C.dim, 'stroke-width': 2 }, s.scale);
      s.win = el('rect', { x: X(6.5), y: 856, width: X(7.5) - X(6.5), height: 28, rx: 10, fill: '#7EE0A8', 'fill-opacity': .45, stroke: '#7EE0A8', 'stroke-width': 3 }, s.scale);
      [6, 6.5, 7, 7.5, 8, 8.5, 9].forEach(p => { el('line', { x1: X(p), y1: 884, x2: X(p), y2: 896, stroke: C.dim, 'stroke-width': 3 }, s.scale);
        if (p !== 7 && p !== 8) T(s.scale, String(p), X(p), 930, { size: 28, weight: 700, fill: p === 6.5 || p === 7.5 ? '#7EE0A8' : C.dim, anchor: 'middle' }); });
      T(s.scale, 'pH', 100, 880, { size: 32, weight: 900, fill: C.paper, anchor: 'middle' });
      s.needle = el('g', {}, s.scale); el('path', { d: 'M0 850 L-14 826 L14 826 Z', fill: C.paper }, s.needle); el('line', { x1: 0, y1: 850, x2: 0, y2: 890, stroke: C.paper, 'stroke-width': 4 }, s.needle);
      s.ok = pill(g, '只认巯基 ✓', '#7EE0A8', { size: 32, bg: 'rgba(5,25,60,.75)' });
      s.hyd = pill(g, '开环水解', '#FF8A8A', { size: 32, bg: 'rgba(5,25,60,.75)' });
      s.side = pill(g, '氨基副反应', '#FF8A8A', { size: 32, bg: 'rgba(5,25,60,.75)' });
      s.big = Chars(g, '偶联效率 ↓', 330, 120, { size: 72, fam: 'Serif', weight: 900, fill: '#FF8A8A', anchor: 'middle' });
      s.sh = shock(g, 3, '#FF8A8A');
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.ph.pts, pH = W3.defs.ph.pH(lt, E), out = pH > 7.5;
      op(s.scale, SP.card(lt - .1) * 1.5); s.needle.setAttribute('transform', `translate(${s.X(pH)} 0)`);
      s.win.setAttribute('fill-opacity', .3 + (lt > E('窗口') && !out ? beatPulse(lt, beat) * .4 : 0)); s.win.setAttribute('stroke', out ? C.dim : '#7EE0A8');
      const [ax, ay] = P(s, d.m0), [hx, hy] = P(s, d.m2), [sx, sy] = P(s, d.side);
      popAt(s.ok, lt, E('只认') + .2, clamp(ax, 120, 880), clamp(ay - 50, 120, 780), { kind: 'card', dy: 20, out: E('开环水解') - .2 });
      popAt(s.hyd, lt, E('开环水解') + .3, clamp(hx, 120, 880), clamp(hy - 120, 120, 780), { kind: 'card', dy: 20, out: E('氨基') + .2 });
      popAt(s.side, lt, E('氨基') + .4, clamp(sx, 120, 850), clamp(sy - 110, 120, 780), { kind: 'card', dy: 20 });
      slamChars(s.big, lt, E('下降'), .07);
      runShock(s.sh, lt, E('开环水解') + .3, hx, hy, 20, 260);
    },
  },

  store: {
    build(g) {
      const s = this;
      s.panel = el('rect', { x: 470, y: 90, width: 520, height: 790, rx: 30, fill: '#05214A', 'fill-opacity': .72, stroke: C.accent, 'stroke-opacity': .25, 'stroke-width': 2 }, g);
      const items = [['−20 °C 低温', 'snow', C.accent, 1], ['密封 · 干燥', 'lock', C.accent, 1], ['避光', 'sun', C.accent, 1], ['惰性气体保护', null, C.accent, 1],
        ['溶液现配现用', 'clock', '#7EE0A8', 1], ['DTT · 巯基乙醇', 'beaker', '#FF6B6B', 0]];
      s.items = items.map(([t, ic, c, good], i) => { const b = badge(g, ic || 'vial', 0, 0, c, 40);
        if (!ic) { b.name = null; T(b.ic, 'Ar', 32, 44, { size: 34, weight: 900, fill: C.paper, anchor: 'middle' }); }
        const lab = tx(g, t, { size: 34, weight: 800, fill: C.paper, anchor: 'start' });
        const mk = good ? checkG(g, '#7EE0A8', .8, 8) : crossG(g, '#FF6B6B', 22, 8);
        return { b, lab, mk, y: 170 + i * 126 }; });
      s.vLab = pill(g, '−20 °C', C.accentHi, { size: 32, bg: 'rgba(5,25,60,.7)' });
    },
    update(lt, E, beat) {
      const s = this, d = W3.defs.store.pts, cue = [E('零下二十度'), E('密封'), E('避光'), E('惰性气体'), E('现配现用'), E('还原剂')];
      op(s.panel, SP.card(lt) * 1);
      s.items.forEach((it, i) => { const at = cue[i], on = lt > at, k = SP.pop(lt - at), bob = Math.sin(lt * 2 + i) * 3;
        setT(it.b.g, 545, it.y + bob, k * (1 + (on ? beatPulse(lt, beat) * .04 : 0))); op(it.b.g, k * 3);
        if (it.b.name) drawIcon(it.b.ic, it.b.name, C.paper, clamp((lt - at - .05) / .55), 3.4);
        popAt(it.lab, lt, at + .1, 605, it.y, { kind: 'snap', dy: 20 });
        runMark(it.mk, lt, at + .35, 940, it.y, 1); });
      const [vx, vy] = P(s, d.cap); popAt(s.vLab, lt, cue[0] + .1, clamp(vx, 120, 420), clamp(vy - 70, 80, 800), { kind: 'card', dy: 20 });
    },
  },

  outro: {
    full: true,
    build(g) {
      const s = this, M = TL.meta, CV = M.cover || {};
      s.l1 = Chars(g, 'DSPE-PEG-MAL', 500, 420, { size: 80, weight: 900, anchor: 'middle' }); colorChars(s.l1, segCol);
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
