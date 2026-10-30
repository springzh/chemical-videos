// chem.js — lab apparatus, molecule characters and explainer cards for chemistry experiment videos.
// Same rules as lib.js: build once (in a scene's build), then set every attribute from scene time in update.
// No timers, no Math.random (use rnd(seed)). Coordinates are stage units (1000×1000). API: references/components.md.
// Every builder returns an object; its set*/run* function is pure in its arguments, so calling it each frame is safe.

const CHEM = {};
let _cid = 0;
const uid = p => `${p}${++_cid}`;
const txt = (parent, s, x, y, o = {}) => T(parent, s, x, y, { weight: 700, ...o });
function small(parent, s, x, y, o = {}) {   // captions under the 27 floor are allowed only for English glosses
  const e = T(parent, s, x, y, { weight: 400, fill: C.dim, ...o }); e.setAttribute('font-size', o.size || 22); return e;
}
const bob = (lt, seed = 0, amp = 6, f = 1.3) => Math.sin(lt * f * 2 + seed * 1.7) * amp;   // idle float
const blinkK = (lt, seed = 0) => (((lt + seed * .77) % 3.3) + 3.3) % 3.3 < .13 ? .12 : 1;

// ============================================================================================================
// APPARATUS
// ============================================================================================================

// Chromatography column. o: x (centre), y (top), w, h, head (solvent height above the bed).
// setColumn(c, { bands: [{ pos: 0..1 down the bed (may go past 1 into the tip), h, col, o }], solvent: 0..1,
//                drip: { col, k: 0..1 falling }, lens: { pos, k } })
function column(parent, o = {}) {
  const cx = o.x ?? 500, top = o.y ?? 40, w = o.w ?? 130, h = o.h ?? 860, head = o.head ?? 120;
  const g = el('g', {}, parent), id = uid('colclip');
  const bedTop = top + head, bedBot = top + h - 150, L = cx - w / 2, R = cx + w / 2, tipY = top + h;
  const c = { g, cx, top, w, h, bedTop, bedBot, L, R, tipY };
  const cp = el('clipPath', { id }, g); el('rect', { x: L + 4, y: top + 10, width: w - 8, height: bedBot - top + 4 }, cp);
  c.sol = el('rect', { x: L + 4, y: top + 26, width: w - 8, height: head - 26, fill: C.solvent }, g);
  c.bed = el('rect', { x: L + 4, y: bedTop, width: w - 8, height: bedBot - bedTop, fill: C.silica }, g);
  el('rect', { x: L + 4, y: bedTop, width: w - 8, height: bedBot - bedTop, fill: 'url(#chemDots)', opacity: .7 }, g);
  el('rect', { x: L + 4, y: bedTop, width: w - 8, height: 16, fill: C.sand }, g);
  el('rect', { x: L + 4, y: bedBot - 16, width: w - 8, height: 16, fill: C.sand }, g);
  c.bandG = el('g', { 'clip-path': `url(#${id})` }, g);
  c.bands = [];
  // glass outline: lip, walls, taper, tip
  const wall = `M${L - 12} ${top} L${L} ${top + 10} L${L} ${bedBot + 6} L${cx - 9} ${bedBot + 72} L${cx - 9} ${tipY}`
    + ` M${R + 12} ${top} L${R} ${top + 10} L${R} ${bedBot + 6} L${cx + 9} ${bedBot + 72} L${cx + 9} ${tipY}`;
  c.glass = el('path', { d: wall, fill: 'none', stroke: C.paper, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  c.taper = el('path', { d: `M${L + 3} ${bedBot + 8} L${cx - 6} ${bedBot + 70} L${cx - 6} ${tipY} L${cx + 6} ${tipY} L${cx + 6} ${bedBot + 70} L${R - 3} ${bedBot + 8} Z`, fill: C.solvent, opacity: .7 }, g);
  g.insertBefore(c.taper, c.glass);
  const sy = bedBot + 100;
  el('rect', { x: cx - 50, y: sy - 8, width: 100, height: 16, rx: 8, fill: C.paper }, g);
  el('circle', { cx, cy: sy, r: 13, fill: C.paper }, g);
  c.drip = el('ellipse', { cx, cy: tipY + 10, rx: 7, ry: 9, fill: C.solvent, opacity: 0 }, g);
  c.ring = el('circle', { r: 0, fill: 'none', stroke: C.accent, 'stroke-width': 7, opacity: 0 }, g);
  return c;
}
function setColumn(c, s = {}) {
  const bands = s.bands || [];
  while (c.bands.length < bands.length) c.bands.push(el('rect', { filter: 'url(#chemSoft)' }, c.bandG));
  c.bands.forEach((r, i) => {
    const b = bands[i]; if (!b) return op(r, 0);
    const y = c.bedTop + 16 + b.pos * (c.bedBot - c.bedTop - 32), hh = b.h ?? 26;
    r.setAttribute('x', c.L + 6); r.setAttribute('width', c.w - 12); r.setAttribute('y', y - hh / 2); r.setAttribute('height', hh);
    r.setAttribute('fill', b.col); op(r, b.o ?? 1);
  });
  if (s.solvent != null) { const hh = (c.bedTop - c.top - 26) * clamp(s.solvent); c.sol.setAttribute('y', c.bedTop - hh); c.sol.setAttribute('height', hh); }
  if (s.drip) { const k = clamp(s.drip.k); c.drip.setAttribute('fill', s.drip.col || C.solvent); c.drip.setAttribute('cy', c.tipY + 10 + k * 70); op(c.drip, k > 0 && k < 1 ? 1 - k * .6 : 0); }
  else op(c.drip, 0);
  if (s.lens) {   // orange "一尺镜" ring snapping onto a spot of the bed
    const y = c.bedTop + 16 + s.lens.pos * (c.bedBot - c.bedTop - 32), k = SP.pop(s.lens.k);
    c.ring.setAttribute('cx', c.cx); c.ring.setAttribute('cy', y); c.ring.setAttribute('r', Math.max(0, (c.w * .62) * k)); op(c.ring, s.lens.k > 0 ? 1 : 0);
  } else op(c.ring, 0);
}

// Ring stand with a clamp arm reaching to x = armX at height armY (draw it before the column so it sits behind).
function stand(parent, o = {}) {
  const g = el('g', {}, parent), x = o.x ?? 200, base = o.base ?? 960, top = o.top ?? 60, ax = o.armX ?? 500, ay = o.armY ?? 260;
  el('rect', { x: x - 110, y: base - 22, width: 260, height: 22, rx: 6, fill: C.glass }, g);
  el('rect', { x: x - 7, y: top, width: 14, height: base - top - 20, rx: 6, fill: C.glass }, g);
  el('rect', { x: x - 16, y: ay - 14, width: 32, height: 28, rx: 6, fill: C.paper }, g);
  el('rect', { x: Math.min(x, ax), y: ay - 6, width: Math.abs(ax - x), height: 12, fill: C.paper }, g);
  el('rect', { x: ax - 30, y: ay - 18, width: 60, height: 36, rx: 8, fill: 'none', stroke: C.paper, 'stroke-width': 6 }, g);
  return g;
}
// Collection tubes in a row; setTubes(tb, [{ col, level 0..1 }, …])
function tubes(parent, n = 4, o = {}) {
  const g = el('g', {}, parent), tb = { g, v: [] }, gap = o.gap ?? 70;
  for (let i = 0; i < n; i++) { const v = vessel(g, 'tube', { w: 44, h: o.h ?? 150 }); setT(v.g, i * gap, 0); tb.v.push(v); }
  return tb;
}
function setTubes(tb, list) { tb.v.forEach((v, i) => setVessel(v, { level: list[i] ? list[i].level : 0, col: list[i] ? list[i].col : C.solvent, o: .9 })); }

// Dropper (pipette) for loading a sample. setDropper(d, x, y, squeeze 0..1, o)
function dropper(parent, col = C.paper) {
  const g = el('g', {}, parent);
  el('path', { d: 'M-9 -150 L-9 -20 L0 8 L9 -20 L9 -150 Z', fill: C.bg2, stroke: col, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
  g._bulb = el('ellipse', { cx: 0, cy: -175, rx: 20, ry: 30, fill: C.paper }, g);
  g._drop = el('ellipse', { cx: 0, cy: 18, rx: 8, ry: 10, fill: '#3B4A52', opacity: 0 }, g);
  return g;
}
function setDropper(d, x, y, sq = 0, o = 1, dropCol, dropK = -1) {
  setT(d, x, y); op(d, o); d._bulb.setAttribute('rx', 20 - sq * 5);
  if (dropCol) d._drop.setAttribute('fill', dropCol);
  op(d._drop, dropK >= 0 && dropK < 1 ? 1 : 0); d._drop.setAttribute('cy', 18 + clamp(dropK) * 80);
}

// TLC plate. o: x, y (top-left), w, h, label (above, e.g. '5:1').
// setTLC(p, { front: 0..1, spots: [{ col, rf, k }], band: [lo, hi] | null, bandK, arrows: { rf, k }, tag: { text, kind, k } })
function tlc(parent, o = {}) {
  const x = o.x ?? 0, y = o.y ?? 0, w = o.w ?? 160, h = o.h ?? 440;
  const g = el('g', {}, parent), p = { g, x, y, w, h, base: y + h - 46, top: y + 30 };
  if (o.label) p.label = txt(g, o.label, x + w / 2, y - 22, { size: 32, weight: 800, anchor: 'middle' });
  el('rect', { x, y, width: w, height: h, rx: 6, fill: C.bg2, stroke: C.grid, 'stroke-width': 3, filter: 'url(#chemShadow)' }, g);
  p.wet = el('rect', { x: x + 3, y: p.base, width: w - 6, height: h - (p.base - y) - 3, fill: C.solvent, opacity: .55 }, g);
  p.bandR = el('rect', { x: x + 3, width: w - 6, fill: C.accent, opacity: 0 }, g);
  p.bandT = small(g, '', x + 10, 0, { size: 22, fill: C.accentHi, weight: 700 });
  el('line', { x1: x + 10, y1: p.base, x2: x + w - 10, y2: p.base, stroke: C.dim, 'stroke-width': 2.5, 'stroke-dasharray': '6 6' }, g);
  p.front = el('line', { x1: x + 4, x2: x + w - 4, stroke: '#5A8FB0', 'stroke-width': 3 }, g);
  p.spotG = el('g', {}, g); p.spots = [];
  p.arr = el('g', {}, g);
  const ac = { stroke: C.paper, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' };
  p.arrB = el('path', ac, p.arr); p.arrA = el('path', ac, p.arr);
  p.lb = txt(p.arr, 'b', 0, 0, { size: 28, weight: 700 }); p.la = txt(p.arr, 'a', 0, 0, { size: 28, weight: 700 });
  return p;
}
function setTLC(p, s = {}) {
  const run = p.base - p.top, fy = p.base - run * clamp(s.front ?? 0);
  p.front.setAttribute('y1', fy); p.front.setAttribute('y2', fy); op(p.front, (s.front ?? 0) > .02 ? 1 : 0);
  p.wet.setAttribute('y', fy); p.wet.setAttribute('height', Math.max(0, p.y + p.h - 3 - fy));
  const spots = s.spots || [];
  while (p.spots.length < spots.length) p.spots.push(el('circle', { r: 13 }, p.spotG));
  p.spots.forEach((c, i) => {
    const sp = spots[i]; if (!sp) return op(c, 0);
    const n = spots.length, x = p.x + p.w * (i + 1) / (n + 1), y = p.base - run * clamp(s.front ?? 0) * sp.rf;
    c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('fill', sp.col); op(c, sp.k ?? 1);
    c.setAttribute('r', 13 * (sp.k ?? 1));
  });
  if (s.band) {
    const y1 = p.base - run * s.band[1], y0 = p.base - run * s.band[0];
    p.bandR.setAttribute('y', y1); p.bandR.setAttribute('height', y0 - y1); op(p.bandR, .28 * clamp(s.bandK ?? 1));
    p.bandT.textContent = `${s.band[0]}–${s.band[1]}`; p.bandT.setAttribute('y', y0 - 8); op(p.bandT, clamp(s.bandK ?? 1));
  } else { op(p.bandR, 0); op(p.bandT, 0); }
  if (s.arrows) {   // b = baseline → front, a = baseline → spot (Rf = a ÷ b)
    const k = clamp(s.arrows.k), xb = p.x + 18, xa = p.x + p.w - 30, ya = p.base - run * s.arrows.rf;
    const head = (x, y) => `M${x - 8} ${y + 12} L${x} ${y} L${x + 8} ${y + 12}`;
    p.arrB.setAttribute('d', `M${xb} ${p.base} L${xb} ${lerp(p.base, p.top, k)} ${k > .95 ? head(xb, p.top) : ''}`);
    p.arrA.setAttribute('d', `M${xa} ${p.base} L${xa} ${lerp(p.base, ya, k)} ${k > .95 ? head(xa, ya) : ''}`);
    p.lb.setAttribute('x', xb + 10); p.lb.setAttribute('y', (p.base + p.top) / 2);
    p.la.setAttribute('x', xa - 26); p.la.setAttribute('y', (p.base + ya) / 2 + 10);
    op(p.arr, k > 0 ? 1 : 0);
  } else op(p.arr, 0);
  if (s.tag) {
    if (!p.tag || p.tag._text !== s.tag.text) { if (p.tag) p.tag.remove(); p.tag = tagPill(p.g, s.tag.text, s.tag.kind); p.tag._text = s.tag.text; }
    popAt(p.tag, s.tag.lt ?? 0, s.tag.at ?? 0, p.x + p.w / 2, p.y + p.h + 44, { s0: .5 });
  }
}

// Detector trace (UV signal vs time). o: x, y (top-left of plot), w, h, title, en.
// peaks: [{ c: 0..1 along x, w (width, 0..1), h (0..1), col, label }]. setChart(ch, k) draws the trace up to x = k.
function chart(parent, o = {}, peaks = []) {
  const x = o.x ?? 0, y = o.y ?? 0, w = o.w ?? 420, h = o.h ?? 300;
  const g = el('g', {}, parent), ch = { g, x, y, w, h, peaks };
  if (o.title) { txt(g, o.title, x, y - 30, { size: 30, weight: 800 }); if (o.en) small(g, o.en, x + o.title.length * 31 + 12, y - 30); }
  el('path', { d: `M${x} ${y} L${x} ${y + h} L${x + w} ${y + h}`, fill: 'none', stroke: C.paper, 'stroke-width': 4 }, g);
  ch.fills = peaks.map(p => el('path', { fill: p.col, opacity: .3 }, g));
  ch.line = el('path', { fill: 'none', stroke: '#3C556B', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
  ch.labels = peaks.map(p => txt(g, p.label || '', 0, 0, { size: 28, fill: p.col, anchor: 'middle' }));
  return ch;
}
function setChart(ch, k) {
  const { x, y, w, h, peaks } = ch, N = 120, f = u => peaks.reduce((a, p) => a + p.h * Math.exp(-(((u - p.c) / p.w) ** 2)), 0);
  const P = u => [x + u * w, y + h - 4 - f(u) * (h - 30)];
  let d = '';
  for (let i = 0; i <= N * clamp(k); i++) { const [px, py] = P(i / N); d += (i ? 'L' : 'M') + px.toFixed(1) + ' ' + py.toFixed(1); }
  ch.line.setAttribute('d', d || 'M0 0'); op(ch.line, k > 0 ? 1 : 0);
  peaks.forEach((p, j) => {
    const u1 = Math.min(clamp(k), p.c + 2.2 * p.w), u0 = Math.max(0, p.c - 2.2 * p.w);
    if (u1 <= u0) { op(ch.fills[j], 0); op(ch.labels[j], 0); return; }
    let fd = `M${x + u0 * w} ${y + h}`;
    for (let i = 0; i <= 40; i++) { const u = lerp(u0, u1, i / 40), py = y + h - 4 - p.h * Math.exp(-(((u - p.c) / p.w) ** 2)) * (h - 30); fd += `L${x + u * w} ${py}`; }
    ch.fills[j].setAttribute('d', fd + `L${x + u1 * w} ${y + h}Z`); op(ch.fills[j], .3);
    const [lx, ly] = P(p.c); ch.labels[j].setAttribute('x', lx); ch.labels[j].setAttribute('y', ly - 16);
    op(ch.labels[j], (k - p.c) / .05);
  });
}

// Beaker / flask with liquid. kind 'beaker' | 'flask' (round-bottom) | 'tube'. setVessel(v, { level 0..1, col, o })
function vessel(parent, kind = 'beaker', o = {}) {
  const g = el('g', {}, parent), w = o.w ?? 200, h = o.h ?? 240, id = uid('vclip'), v = { g, w, h, kind };
  const d = kind === 'flask' ? `M${-w * .14} ${-h} L${-w * .14} ${-h * .55} A${w * .5} ${w * .5} 0 1 0 ${w * .14} ${-h * .55} L${w * .14} ${-h}`
    : kind === 'tube' ? `M${-w * .5} ${-h} L${-w * .5} ${-w * .5} A${w * .5} ${w * .5} 0 0 0 ${w * .5} ${-w * .5} L${w * .5} ${-h}`
    : `M${-w / 2 - 10} ${-h} L${-w / 2} ${-h + 12} L${-w / 2} ${-10} Q${-w / 2} 0 ${-w / 2 + 10} 0 L${w / 2 - 10} 0 Q${w / 2} 0 ${w / 2} -10 L${w / 2} ${-h + 12} L${w / 2 + 10} ${-h}`;
  const cp = el('clipPath', { id }, g); el('path', { d: d + 'Z' }, cp);
  v.liq = el('rect', { x: -w, width: 2 * w, 'clip-path': `url(#${id})` }, g);
  v.glass = el('path', { d, fill: 'none', stroke: C.paper, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);
  if (kind === 'beaker') for (let i = 1; i <= 4; i++) el('line', { x1: -w / 2 + 6, x2: -w / 2 + 26, y1: -h * i / 5, y2: -h * i / 5, stroke: C.glass, 'stroke-width': 3 }, g);
  return v;
}
function setVessel(v, s = {}) {
  const bottom = v.kind === 'flask' ? v.w * .5 * .9 : 0, lvl = clamp(s.level ?? .5);
  const top = -v.h * lvl + bottom * (1 - lvl);
  v.liq.setAttribute('y', top); v.liq.setAttribute('height', v.h + v.w); v.liq.setAttribute('fill', s.col || C.solvent);
  op(v.liq, lvl > 0 ? (s.o ?? .85) : 0);
}

// Separatory funnel: two liquid layers, origin at the stopcock region. setFunnel(f, { x, y, s, o, top: col, bottom: col, split: 0..1 interface height, fill: 0..1,
// mix: 0..1 (1 = emulsion: one blended colour), tilt: degrees (shaking), drain: 0..1 lowers the bottom layer })
function sepFunnel(parent, o = {}) {
  const g = el('g', {}, parent), f = { g }, id = uid('fclip');
  const body = 'M-30 -330 L-30 -300 C-150 -230 -150 -40 -16 40 L-10 140 L10 140 L16 40 C150 -40 150 -230 30 -300 L30 -330';
  const cp = el('clipPath', { id }, g); el('path', { d: body + 'Z' }, cp);
  f.lo = el('rect', { x: -160, width: 320, 'clip-path': `url(#${id})` }, g);
  f.hi = el('rect', { x: -160, width: 320, 'clip-path': `url(#${id})` }, g);
  el('path', { d: body, fill: 'none', stroke: C.paper, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
  el('rect', { x: -38, y: -350, width: 76, height: 22, rx: 6, fill: C.paper }, g);
  el('rect', { x: -46, y: 70, width: 92, height: 16, rx: 8, fill: C.paper }, g); el('circle', { cy: 78, r: 13, fill: C.paper }, g);
  return f;
}
function setFunnel(f, s = {}) {
  const yTop = -300 + 290 * (1 - clamp(s.fill ?? 1)), yBot = 140, H = yBot - yTop;
  const yInt = yBot - H * clamp(s.split ?? .5) * (1 - clamp(s.drain ?? 0));
  const mix = clamp(s.mix ?? 0);
  const hiCol = mix > 0 ? mixCol(s.top, s.bottom, mix * .5) : s.top, loCol = mix > 0 ? mixCol(s.bottom, s.top, mix * .5) : s.bottom;
  f.hi.setAttribute('y', yTop); f.hi.setAttribute('height', Math.max(0, yInt - yTop + 2)); f.hi.setAttribute('fill', hiCol);
  f.lo.setAttribute('y', yInt); f.lo.setAttribute('height', Math.max(0, yBot - yInt)); f.lo.setAttribute('fill', loCol);
  f.g.setAttribute('transform', `translate(${s.x ?? 0} ${s.y ?? 0}) scale(${s.s ?? 1}) rotate(${s.tilt || 0})`); op(f.g, s.o ?? 1);
}
function mixCol(a, b, k) {   // '#RRGGBB' blend
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], k)).toString(16).padStart(2, '0')).join('');
}

// ============================================================================================================
// MOLECULAR WORLD
// ============================================================================================================

// Molecule character: coloured ball with eyes, optional functional group "hand" (pill) on one side.
// o: col, r, group ('OH' | 'C=O' | 'NH₂' | 'COOH' | …), groupCol, label (text inside small balls, e.g. 'EA'), seed.
// poseMol(m, lt, x, y, { s, o, look: [dx, dy], grpAng (deg, where the hand points), idle: true, squash })
function mol(parent, o = {}) {
  const g = el('g', {}, parent), r = o.r ?? 46, m = { g, r, seed: o.seed ?? 0 };
  m.grp = el('g', {}, g);
  if (o.group) {
    m.stalk = el('line', { x1: 0, y1: 0, x2: r + 14, y2: 0, stroke: o.groupCol || C.accent, 'stroke-width': 7, 'stroke-linecap': 'round' }, m.grp);
    const t = T(m.grp, o.group, 0, 0, { size: Math.max(27, r * .5), weight: 800, fill: C.paper, anchor: 'middle' });
    const tw = t.getComputedTextLength(), ph = Math.max(36, r * .72);
    const pw = Math.max(ph, tw + 16), cx = r + 10 + pw / 2;
    m.grp.insertBefore(el('rect', { x: cx - pw / 2, y: -ph / 2, width: pw, height: ph, rx: ph / 2, fill: o.groupCol || C.accent, stroke: C.bg2, 'stroke-width': 3 }), t);
    t.setAttribute('x', cx); t.setAttribute('y', Math.max(27, r * .5) * .36); m.tip = cx + pw / 2; m.gcx = cx;
  }
  m.body = el('circle', { r, fill: o.col || C.a }, g);
  el('circle', { r, fill: 'url(#chemGloss)' }, g);
  if (o.label) { const t = T(g, o.label, 0, 0, { size: Math.max(27, r * .62), weight: 800, fill: '#fff', anchor: 'middle' }); t.setAttribute('y', Math.max(27, r * .62) * .36); }
  else {
    m.eyes = el('g', {}, g);
    [-1, 1].forEach(sx => {
      const e = el('g', { transform: `translate(${sx * r * .3} ${-r * .1})` }, m.eyes);
      el('ellipse', { rx: r * .2, ry: r * .24, fill: '#fff' }, e);
      el('circle', { r: r * .11, fill: C.paper, class: 'pupil' }, e);
    });
  }
  return m;
}
function poseMol(m, lt, x, y, o = {}) {
  const idle = o.idle !== false, dy = idle ? bob(lt, m.seed, m.r * .08) : 0, s = o.s ?? 1, sq = o.squash || 0;
  m.g.setAttribute('transform', `translate(${x} ${y + dy}) scale(${s * (1 + sq * .12)} ${s * (1 - sq * .12)})`);
  op(m.g, o.o ?? 1);
  if (m.grp) m.grp.setAttribute('transform', `rotate(${o.grpAng ?? 0})`);
  if (m.eyes) {
    const [lx, ly] = o.look || [0, 0], b = idle ? blinkK(lt, m.seed) : 1;
    [...m.eyes.children].forEach(e => { const p = e.querySelector('.pupil'); p.setAttribute('cx', lx * m.r * .08); p.setAttribute('cy', ly * m.r * .08); });
    m.eyes.setAttribute('transform', `scale(1 ${b})`);
  }
}
// Where the group's pill centre is, in stage coords, for a mol posed at (x, y) with grpAng a and scale s.
function grpXY(m, x, y, a = 0, s = 1) { const d = (m.gcx || m.r) * s; return [x + Math.cos(a * Math.PI / 180) * d, y + Math.sin(a * Math.PI / 180) * d]; }

// Name card under a character: big Chinese nickname, then 'real name  english'. Returns g (place with popAt).
function nameTag(parent, zh, sub, o = {}) {
  const g = el('g', {}, parent);
  txt(g, zh, 0, 0, { size: o.size || 44, weight: 900, anchor: 'middle' });
  if (sub) small(g, sub, 0, 36, { anchor: 'middle', size: 24 });
  return g;
}

// Skeletal formula: benzene ring + substituent, drawn stroke by stroke. sub: 'CH3' | 'CH2OH' | 'OH' | 'COOH' | 'none'.
// drawSkeletal(sk, k) — k 0..1 draws ring then substituent; the functional group label takes the accent colour.
function skeletal(parent, sub = 'none', o = {}) {
  const g = el('g', {}, parent), r = o.r ?? 46, sk = { g, paths: [], labels: [] };
  const V = [...Array(6)].map((_, i) => polar(0, 0, r, -90 + i * 60));
  const st = { fill: 'none', stroke: C.paper, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  sk.paths.push(el('path', { d: 'M' + V.map(p => p.join(' ')).join(' L') + ' Z', ...st }, g));
  [[0, 1], [2, 3], [4, 5]].forEach(([a, b]) => {   // inner double bonds
    const p = V[a].map((v, i) => v * .72), q = V[b].map((v, i) => v * .72);
    sk.paths.push(el('path', { d: `M${p[0]} ${p[1]} L${q[0]} ${q[1]}`, ...st, 'stroke-width': 3.5 }, g));
  });
  const [vx, vy] = V[1], a1 = polar(vx, vy, r * .95, -30);   // bond from upper-right vertex
  const lab = (s, x, y, col) => { const t = txt(g, s, x, y, { size: 27, weight: 800, fill: col || C.paper }); sk.labels.push(t); return t; };
  if (sub === 'CH3') { sk.paths.push(el('path', { d: `M${vx} ${vy} L${a1[0]} ${a1[1]}`, ...st }, g)); lab('CH₃', a1[0] + 4, a1[1] - 4); }
  if (sub === 'OH') { sk.paths.push(el('path', { d: `M${vx} ${vy} L${a1[0]} ${a1[1]}`, ...st }, g)); lab('OH', a1[0] + 4, a1[1] + 2, C.accentHi); }
  if (sub === 'CH2OH') {
    const a2 = polar(a1[0], a1[1], r * .95, 30);
    sk.paths.push(el('path', { d: `M${vx} ${vy} L${a1[0]} ${a1[1]} L${a2[0]} ${a2[1]}`, ...st }, g));
    sk.oh = el('g', {}, g); el('circle', { cx: a2[0] + 22, cy: a2[1], r: 22, fill: C.accent }, sk.oh);
    const t = txt(sk.oh, 'OH', a2[0] + 22, a2[1] + 8, { size: 27, weight: 800, anchor: 'middle' }); t.setAttribute('font-size', 21); sk.labels.push(sk.oh);
  }
  if (sub === 'COOH') {
    const a2 = polar(a1[0], a1[1], r * .8, 30), o1 = polar(a1[0], a1[1], r * .8, -90);
    sk.paths.push(el('path', { d: `M${vx} ${vy} L${a1[0]} ${a1[1]} L${a2[0]} ${a2[1]} M${a1[0] - 4} ${a1[1]} L${o1[0] - 4} ${o1[1]} M${a1[0] + 4} ${a1[1]} L${o1[0] + 4} ${o1[1]}`, ...st }, g));
    lab('O', o1[0] - 9, o1[1] - 6); lab('OH', a2[0] + 4, a2[1] + 8, C.accentHi);
  }
  return sk;
}
function drawSkeletal(sk, k) {
  const n = sk.paths.length;
  sk.paths.forEach((p, i) => drawPath(p, clamp(k * (n + 1) - i)));
  sk.labels.forEach(l => op(l, clamp(k * (n + 1) - n)));
}

// Silica surface seen side-on: a Si–O chain on a speckled slab, an O–H "hand" growing from every Si.
// o: x0, x1, y (chain height), n. setSurface(sf, { line: 0..1, oh: i => 0..1, dipole: 0..1, hi: i => 0..1 })
function surface(parent, o = {}) {
  const x0 = o.x0 ?? 40, x1 = o.x1 ?? 960, y = o.y ?? 560, n = o.n ?? 7, g = el('g', {}, parent), sf = { g, sites: [], y };
  el('rect', { x: x0 - 40, y, width: x1 - x0 + 80, height: 230, fill: C.silica }, g);
  el('rect', { x: x0 - 40, y, width: x1 - x0 + 80, height: 230, fill: 'url(#chemDots)' }, g);
  sf.slabT = txt(g, o.label ?? '硅胶 SiO₂', (x0 + x1) / 2, y + 130, { size: 34, weight: 600, fill: C.dim, anchor: 'middle' });
  sf.line = el('path', { d: `M${x0 - 40} ${y} L${x1 + 40} ${y}`, stroke: C.paper, 'stroke-width': 5, fill: 'none' }, g);
  for (let i = 0; i < n; i++) {
    const x = lerp(x0 + 40, x1 - 40, n > 1 ? i / (n - 1) : .5), s = { x, g: el('g', {}, g) };
    s.stalk = el('line', { x1: x, y1: y - 18, x2: x, y2: y - 80, stroke: C.accent, 'stroke-width': 7, 'stroke-linecap': 'round' }, s.g);
    s.oh = el('g', {}, s.g); s.ring = el('circle', { r: 30, fill: C.accent, stroke: C.bg2, 'stroke-width': 3 }, s.oh);
    txt(s.oh, 'OH', 0, 10, { size: 27, weight: 800, anchor: 'middle' });
    const si = el('g', { transform: `translate(${x} ${y})` }, g); el('circle', { r: 22, fill: C.paper }, si);
    txt(si, 'Si', 0, 10, { size: 27, weight: 700, fill: '#fff', anchor: 'middle' }); s.si = si;
    s.dm = txt(s.g, 'δ−', x - 52, y - 108, { size: 28, weight: 800, fill: C.bad, anchor: 'middle' });
    s.dp = txt(s.g, 'δ+', x + 46, y - 120, { size: 28, weight: 800, fill: C.a, anchor: 'middle' });
    sf.sites.push(s);
  }
  return sf;
}
function setSurface(sf, s = {}) {
  drawPath(sf.line, s.line ?? 1);
  sf.sites.forEach((st, i) => {
    const k = s.oh ? s.oh(i) : 1, kk = SP.pop(k * .8);
    op(st.si, clamp((s.line ?? 1) * 1.2 - i * .1));
    st.stalk.setAttribute('y2', sf.y - 18 - 62 * clamp(k * 1.4)); op(st.stalk, k > 0 ? 1 : 0);
    setT(st.oh, st.x, sf.y - 110, kk); op(st.oh, clamp(k * 3));
    const hi = s.hi ? s.hi(i) : 0; st.ring.setAttribute('stroke', hi > 0 ? C.paper : C.bg2); st.ring.setAttribute('stroke-width', 3 + hi * 3);
    const dk = s.dipole != null ? (typeof s.dipole === 'function' ? s.dipole(i) : s.dipole) : 0;
    op(st.dm, dk); op(st.dp, dk);
  });
}

// Race track: a channel between two silica walls, Si–OH sites on both walls, solvent particles flowing down.
// o: x0, x1 (inner wall x), top, bot, n (sites per wall), flow (px/s), particles.
// runTrack(tr, lt, { flow, flowK }) — call every frame; siteXY(tr, side, i) → OH pill centre (side 0 left, 1 right).
function track(parent, o = {}) {
  const x0 = o.x0 ?? 230, x1 = o.x1 ?? 770, top = o.top ?? 0, bot = o.bot ?? 1000, n = o.n ?? 6;
  const g = el('g', {}, parent), tr = { g, x0, x1, top, bot, n, flow: o.flow ?? 90, sites: [[], []] };
  [[x0 - 200, x0], [x1, x1 + 200]].forEach(([a, b], side) => {
    el('rect', { x: a, y: top, width: b - a, height: bot - top, fill: C.silica }, g);
    el('rect', { x: a, y: top, width: b - a, height: bot - top, fill: 'url(#chemDots)', opacity: .8 }, g);
    el('line', { x1: side ? a : b, x2: side ? a : b, y1: top, y2: bot, stroke: C.paper, 'stroke-width': 5 }, g);
    txt(g, '硅胶', side ? b - 20 : a + 20, top + 50, { size: 28, weight: 600, fill: C.dim, anchor: side ? 'end' : 'start' });
  });
  const pr = rnd(o.seed ?? 7);
  tr.parts = [...Array(o.particles ?? 26)].map(() => ({ x: lerp(x0 + 30, x1 - 30, pr()), y0: pr() * (bot - top), v: .7 + pr() * .6,
    e: el('circle', { r: 5 + pr() * 3, fill: '#A9B6B2' }, g) }));
  for (let side = 0; side < 2; side++) for (let i = 0; i < n; i++) {
    const y = lerp(top + 110, bot - 70, n > 1 ? (i + (side ? .5 : 0)) / (n - .5) : .5), wx = side ? x1 : x0, dir = side ? -1 : 1;
    const sg = el('g', {}, g);
    el('line', { x1: wx, y1: y, x2: wx + dir * 34, y2: y, stroke: C.accent, 'stroke-width': 6 }, sg);
    const pill = el('g', { transform: `translate(${wx + dir * 58} ${y})` }, sg);
    const ring = el('circle', { r: 26, fill: C.accent, stroke: C.bg2, 'stroke-width': 3 }, pill);
    txt(pill, 'OH', 0, 9, { size: 27, weight: 800, anchor: 'middle' }).setAttribute('font-size', 22);
    tr.sites[side].push({ x: wx + dir * 58, y, g: sg, ring, dir });
  }
  tr.partG = g;
  return tr;
}
function runTrack(tr, lt, o = {}) {
  const H = tr.bot - tr.top, v = (o.flow ?? tr.flow) * (o.flowK ?? 1);
  tr.parts.forEach(p => { const y = tr.top + (((p.y0 + lt * v * p.v) % H) + H) % H; p.e.setAttribute('cx', p.x + Math.sin(lt * 1.3 + p.y0) * 6); p.e.setAttribute('cy', y);
    op(p.e, o.partO ?? .8); });
  tr.sites.flat().forEach(s => s.ring.setAttribute('stroke', s.busy ? C.paper : C.bg2));
}
const siteXY = (tr, side, i) => [tr.sites[side][i].x, tr.sites[side][i].y];

// Hydrogen bond: dashed accent line between two points, flowing dashes, optional label pill at the middle.
function hbond(parent, label) {
  const g = el('g', {}, parent), b = { g };
  b.l = el('line', { stroke: C.accent, 'stroke-width': 5, 'stroke-dasharray': '7 7', 'stroke-linecap': 'round' }, g);
  if (label) { b.tag = tagPill(g, label, 'info', 26); }
  return b;
}
function setBond(b, lt, x1, y1, x2, y2, k, tagK = 0) {
  k = clamp(k); b.l.setAttribute('x1', x1); b.l.setAttribute('y1', y1); b.l.setAttribute('x2', lerp(x1, x2, k)); b.l.setAttribute('y2', lerp(y1, y2, k));
  b.l.style.strokeDashoffset = -lt * 30; op(b.l, k > 0 ? 1 : 0);
  if (b.tag) { setT(b.tag, (x1 + x2) / 2, (y1 + y2) / 2 - 46, SP.pop(tagK)); op(b.tag, clamp(tagK * 3)); }
}

// ============================================================================================================
// CARDS, TAGS, METERS
// ============================================================================================================

// Term card: white card, big Chinese term + English gloss. Place with popAt.
function termCard(parent, zh, en, o = {}) {
  const g = el('g', {}, parent), size = o.size || 44;
  const t = txt(g, zh, 0, en ? -4 : size * .36, { size, weight: 900, anchor: 'middle' });
  const w = Math.max(t.getComputedTextLength(), en ? en.length * 12 : 0) + 80, h = en ? size * 2.3 : size * 1.8;
  g.insertBefore(el('rect', { x: -w / 2, y: -h / 2 - (en ? 6 : 0), width: w, height: h, rx: 22, fill: C.bg2, filter: 'url(#chemShadow)' }), t);
  if (en) small(g, en, 0, size * .72, { anchor: 'middle', size: 24 });
  g._w = w; return g;
}
// Conclusion bar: dark rounded bar, white text; the cause → effect chain the scene proves. Place with popAt.
function conclusionBar(parent, text, o = {}) {
  const g = el('g', {}, parent), size = o.size || 34;
  const t = txt(g, text, 0, size * .36, { size, weight: 800, fill: '#fff', anchor: 'middle' });
  const w = t.getComputedTextLength() + 60, h = size * 1.9;
  g.insertBefore(el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 14, fill: o.bg || C.paper, filter: 'url(#chemShadow)' }), t);
  g._w = w; return g;
}
// Small tag: kind 'good' (green), 'bad' (red), 'warn' (accent), 'info' (white with accent ring)
function tagPill(parent, text, kind = 'info', size = 28) {
  const bg = { good: C.good, bad: C.bad, warn: C.accent, info: C.bg2 }[kind] || C.bg2;
  const fg = kind === 'info' || kind === 'warn' ? C.paper : '#fff';
  const g = el('g', {}, parent), t = txt(g, text, 0, size * .36, { size, weight: 800, fill: fg, anchor: 'middle' });
  const w = t.getComputedTextLength() + size * 1.1, h = size * 1.6;
  g.insertBefore(el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 10, fill: bg, stroke: kind === 'info' ? C.accent : 'none', 'stroke-width': 3 }), t);
  g._w = w; return g;
}
// Timer pill: '小非  4.1 s' on the molecule's colour. setTimer(p, seconds)
function timerPill(parent, name, col) {
  const g = el('g', {}, parent);
  g._r = el('rect', { x: -110, y: -26, width: 220, height: 52, rx: 26, fill: col }, g);
  g._t = txt(g, name + '  0.0 s', 0, 10, { size: 28, weight: 800, fill: '#fff', anchor: 'middle' }); g._n = name;
  return g;
}
function setTimer(p, v) { const s = `${p._n}  ${Math.max(0, v).toFixed(1)} s`; if (p._t.textContent !== s) p._t.textContent = s; }

// Ratio slider: 'label  ████░░  10 : 1'. setRatio(rs, k 0..1 fill, text)
function ratioSlider(parent, label, o = {}) {
  const g = el('g', {}, parent), w = o.w ?? 300, rs = { g, w };
  txt(g, label, 0, 10, { size: 28, weight: 700 });
  const x = o.labelW ?? 220;
  el('rect', { x, y: -9, width: w, height: 18, rx: 9, fill: '#DDE5E2' }, g);
  rs.fill = el('rect', { x, y: -9, height: 18, rx: 9, fill: C.accent }, g);
  rs.knob = el('circle', { cy: 0, r: 15, fill: C.bg2, stroke: C.accent, 'stroke-width': 5 }, g);
  rs.val = txt(g, '', x + w + 24, 12, { size: 36, weight: 900 }); rs.x = x;
  return rs;
}
function setRatio(rs, k, text) { const w = rs.w * clamp(k); rs.fill.setAttribute('width', Math.max(18, w)); rs.knob.setAttribute('cx', rs.x + w); if (rs.val.textContent !== text) rs.val.textContent = text; }

// Legend row: [[col, '石油醚 PE'], ...]
function legend(parent, items, o = {}) {
  const g = el('g', {}, parent); let x = 0;
  items.forEach(([col, s, lab]) => { el('circle', { cx: x + 12, cy: 0, r: 12, fill: col }, g);
    if (lab) { const t = txt(g, lab, x + 12, 7, { size: 27, fill: '#fff', anchor: 'middle' }); t.setAttribute('font-size', 14); }
    const t = txt(g, s, x + 32, 10, { size: 27, weight: 600 }); x += 32 + t.getComputedTextLength() + 34; });
  g._w = x; return g;
}

// Quiz card: question + options A/B/C, countdown ring, answer reveal.
// runQuiz(q, lt, { show, opts: [t…], count: [t0, n seconds], reveal: t, explain: t })
function quiz(parent, question, en, options, answer, o = {}) {
  const g = el('g', {}, parent), q = { g, answer, rows: [] }, w = o.w ?? 920;
  q.card = el('g', {}, g);
  el('rect', { x: 0, y: 0, width: w, height: 130, rx: 18, fill: C.bg2, filter: 'url(#chemShadow)' }, q.card);
  txt(q.card, question, 30, 60, { size: 40, weight: 900 }); if (en) small(q.card, en, 30, 100, { size: 24 });
  options.forEach(([zh, enx], i) => {
    const r = el('g', {}, g), y = 170 + i * 110;
    r._bg = el('rect', { x: 0, y, width: w, height: 92, rx: 14, fill: C.bg2, stroke: C.grid, 'stroke-width': 2 }, r);
    r._l = txt(r, 'ABCD'[i], 30, y + 56, { size: 34, weight: 900, fill: C.dim });
    r._t = txt(r, zh, 80, y + 50, { size: 34, weight: 800 }); if (enx) r._e = small(r, enx, 80, y + 78, { size: 21 });
    q.rows.push(r);
  });
  q.cd = el('g', { transform: `translate(${w / 2} ${170 + options.length * 110 + 110})` }, g);
  el('circle', { r: 62, fill: C.bg2, stroke: '#DDE5E2', 'stroke-width': 10 }, q.cd);
  q.cdArc = el('path', { fill: 'none', stroke: C.accent, 'stroke-width': 10, 'stroke-linecap': 'round' }, q.cd);
  q.cdN = txt(q.cd, '', 0, 22, { size: 64, weight: 900, anchor: 'middle' });
  return q;
}
function runQuiz(q, lt, s = {}) {
  const k = SP.card(lt - (s.show ?? 0)); q.card.setAttribute('transform', `translate(0 ${(1 - k) * 40})`); op(q.card, k * 2);
  const rev = s.reveal != null && lt >= s.reveal;
  q.rows.forEach((r, i) => {
    const kk = SP.card(lt - (s.opts ? s.opts[i] : (s.show ?? 0) + .3 + i * .15));
    r.setAttribute('transform', `translate(${(1 - kk) * 60} 0)`);
    const isA = i === q.answer, dim = rev && !isA;
    op(r, clamp(kk * 2) * (dim ? .4 : 1));
    r._bg.setAttribute('fill', rev && isA ? C.b : C.bg2);
    [r._t, r._l].forEach(t => t.setAttribute('fill', rev && isA ? '#fff' : (t === r._l ? C.dim : C.paper)));
    if (r._e) r._e.setAttribute('fill', rev && isA ? '#E6F4EF' : C.dim);
  });
  if (s.count) {
    const [t0, n] = s.count, e = lt - t0, on = e >= 0 && e < n + .3;
    op(q.cd, on ? clamp(e * 4) * (1 - clamp((e - n) / .3)) : 0);
    if (on) { const left = Math.max(0, n - e); q.cdN.textContent = Math.ceil(left) || ''; q.cdArc.setAttribute('d', arcD(0, 0, 62, -90, -90 + 359.9 * (left / n))); }
  } else op(q.cd, 0);
}

// Numbered takeaways. runTakeaways(tk, lt, [t1, t2, t3])
function takeaways(parent, items, o = {}) {
  const g = el('g', {}, parent), tk = { g, rows: [] }, gap = o.gap ?? 130;
  items.forEach(([zh, en], i) => {
    const r = el('g', {}, g), y = i * gap;
    el('circle', { cx: 34, cy: y, r: 32, fill: C.accent }, r);
    txt(r, String(i + 1), 34, y + 13, { size: 36, weight: 900, anchor: 'middle' });
    txt(r, zh, 90, y + 4, { size: o.size || 38, weight: 900 }); if (en) small(r, en, 90, y + 40, { size: 23 });
    tk.rows.push(r);
  });
  return tk;
}
function runTakeaways(tk, lt, times) {
  tk.rows.forEach((r, i) => { const k = SP.card(lt - times[i]); r.setAttribute('transform', `translate(${(1 - k) * 80} 0)`); op(r, k * 2);
    const c = r.firstChild, y = +c.getAttribute('cy'); c.setAttribute('r', 32 * (1 + .06 * Math.sin(lt * 3 + i))); c.setAttribute('cy', y); });
}

// Safety badge: yellow triangle + short hazard text ('乙醚易燃 · 远离明火'). Place with popAt; keep it on screen ≥ 3 s.
function safetyBadge(parent, text) {
  const g = el('g', {}, parent);
  const t = txt(g, text, 52, 10, { size: 28, weight: 800 });
  const w = t.getComputedTextLength() + 80;
  g.insertBefore(el('rect', { x: -10, y: -30, width: w, height: 60, rx: 12, fill: '#FFF6DD', stroke: '#E0B020', 'stroke-width': 3 }), t);
  el('path', { d: 'M22 -20 L42 16 L2 16 Z', fill: '#F5C518', stroke: C.paper, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  txt(g, '!', 22, 12, { size: 27, weight: 900, anchor: 'middle' }).setAttribute('font-size', 24);
  g._w = w; return g;
}
// "示意" corner note for schematic colours / invented numbers (put it near the thing it qualifies).
function schematicNote(parent, text = '颜色为示意') { const g = el('g', {}, parent); small(g, text, 0, 0, { size: 22 }); return g; }

// Next-episode card (dark bar). Place with popAt.
function nextCard(parent, zh, en) {
  const g = el('g', {}, parent);
  el('rect', { x: -460, y: -60, width: 920, height: 120, rx: 18, fill: C.paper, filter: 'url(#chemShadow)' }, g);
  txt(g, zh, -400, 2, { size: 38, weight: 900, fill: '#fff' }); if (en) small(g, en, -400, 38, { size: 22, fill: '#B7C4C0' });
  return g;
}

// ============================================================================================================
// COVER ART (static, drawn once into the cover svg; L = landscape)
// ============================================================================================================
CHEM.coverArt = {
  column(g, L) {
    const c = column(g, { x: L ? 300 : 500, y: L ? 160 : 60, w: 150, h: L ? 820 : 1080, head: 120 });
    setColumn(c, { bands: [{ pos: .28, col: C.b, h: 34 }, { pos: .62, col: C.a, h: 34 }], solvent: 1 });
    const a = mol(g, { col: C.a, r: 70, seed: 1 }), b = mol(g, { col: C.b, r: 70, group: 'OH', seed: 2 });
    poseMol(a, 0, L ? 120 : 220, L ? 520 : 900, { idle: false }); poseMol(b, 0, L ? 480 : 760, L ? 400 : 760, { idle: false, grpAng: -30 });
  },
  tlc(g, L) {
    ['20:1', '5:1', '1:1'].forEach((lab, i) => { const p = tlc(g, { x: (L ? 40 : 120) + i * 290, y: L ? 260 : 300, w: 200, h: 560, label: lab });
      setTLC(p, { front: 1, spots: [{ col: C.a, rf: [.2, .55, .9][i] }, { col: C.b, rf: [.06, .28, .8][i] }] }); });
  },
  funnel(g, L) { const f = sepFunnel(g); setFunnel(f, { x: L ? 300 : 500, y: L ? 600 : 700, s: L ? 1.4 : 1.8, top: '#F3D27A', bottom: C.solvent, split: .45 }); },
  flask(g, L) { const v = vessel(g, 'flask', { w: 300, h: 420 }); setT(v.g, L ? 300 : 540, L ? 860 : 1060, L ? 1.3 : 1.6); setVessel(v, { level: .45, col: '#F3B5C8' }); },
};
