// Shared helpers for scenes.js. Everything is a pure function of time: no timers, no Math.random (use rnd(seed)).
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = x => 1 - Math.pow(1 - clamp(x), 4);
// Damped spring step response: 0 before x = 0, overshoots, settles at 1.
function spring(x, w = 16, z = .72) {
  if (x <= 0) return 0;
  const wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + (z * w / wd) * Math.sin(wd * x));
}
// Four spring presets: snap = text and subtitles, card = panels and labels, heavy = big things that land, pop = icons and badges.
const SP = { snap: x => spring(x, 24, .8), card: x => spring(x, 15, .72), heavy: x => spring(x, 10, .9), pop: x => spring(x, 18, .45) };
function rnd(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const $ = (s, r = document) => r.querySelector(s);
const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
// Palette (light lab style). script.json "theme" overrides any key. The colours carry meaning and stay fixed for
// the whole film (references/style.md): a = nonpolar / first compound, b = polar / second compound, accent =
// the interacting group (Si–OH, –OH, H-bond), paper = ink for text, bg2 = card white.
const C = Object.assign({ bg: '#EEF3F1', bg2: '#FFFFFF', accent: '#F2A93B', accentHi: '#D9861A', a: '#2D4FD6', b: '#1E8C6E',
  paper: '#1F2A30', dim: '#7A8A86', grid: '#D3DDD9', good: '#2E9E6A', bad: '#E5484D', glass: '#8FA39E',
  sand: '#E8CF9C', silica: '#FAFBF8', solvent: '#D6ECF5', c3: '#8E5BD6', c4: '#D2603A' }, (window.TL && TL.meta.theme) || {});
// Project fonts (fonts/*.ttf, declared in index.html) first, then system CJK fonts if those files are missing.
const FONT = { Sans: "ProjSans, 'PingFang SC', 'Noto Sans CJK SC', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif",
  Serif: "ProjSerif, 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', serif" };
const MIN_FONT = 27;   // stage units; anything smaller is unreadable on a phone

// ---------- text ----------
function T(parent, str, x, y, o = {}) {
  const e = el('text', { x, y, fill: o.fill || C.paper, 'font-family': FONT[o.fam || 'Sans'] || o.fam, 'font-size': Math.max(o.size || 32, MIN_FONT),
    'font-weight': o.weight || 500, 'text-anchor': o.anchor || 'start', 'letter-spacing': o.ls || 0 }, parent);
  e.textContent = str; return e;
}
// One <text> per character so each can move on its own. Needs fonts loaded (uses getComputedTextLength).
function Chars(parent, str, x, y, o = {}) {
  const g = el('g', {}, parent), chars = []; let w = 0;
  for (const c of str) { const e = T(g, c, 0, 0, { ...o, anchor: 'start' }); const cw = e.getComputedTextLength() + (o.ls || 0); chars.push({ e, x: w, w: cw }); w += cw; }
  const x0 = o.anchor === 'middle' ? x - w / 2 : o.anchor === 'end' ? x - w : x;
  chars.forEach(c => { c.x += x0; c.y = y; c.e.setAttribute('x', c.x); c.e.setAttribute('y', y); });
  return { g, chars, w, x0 };
}
function revealChars(ch, lt, at, step = .045, dy = 60, kind = 'pop') {
  ch.chars.forEach((c, i) => { const k = SP[kind](lt - at - i * step); c.e.setAttribute('transform', `translate(0 ${(1 - k) * dy})`); op(c.e, k * 2.5); });
}
// Characters slam in from 2.2× (for the one phrase per scene that must hit hard).
function slamChars(ch, lt, at, step = .09) {
  ch.chars.forEach((c, i) => { const k = SP.heavy(lt - at - i * step), cx = c.x + c.w / 2, cy = c.y - 40;
    c.e.setAttribute('transform', `translate(${cx} ${cy}) scale(${lerp(2.2, 1, k)}) translate(${-cx} ${-cy})`); op(c.e, k * 3); });
}
// Number rolling from a to b as k goes 0 → 1 (pass a spring or ease of scene time); keeps decimals of b.
function countUp(e, a, b, k, suffix = '') {
  const dec = (String(b).split('.')[1] || '').length;
  e.textContent = (a + (b - a) * clamp(k)).toFixed(dec) + suffix;
}
function setT(e, x, y, s = 1, r = 0) { e.setAttribute('transform', `translate(${x} ${y}) rotate(${r}) scale(${s})`); }
function op(e, v) { e.setAttribute('opacity', clamp(v)); }
function pill(parent, str, col, o = {}) {
  const g = el('g', {}, parent), size = o.size || 28;
  const t = T(g, str, 0, size * .36, { size, fill: o.text || col, weight: 600, anchor: 'middle' });
  const w = t.getComputedTextLength() + size * 1.4, h = size * 1.75;
  g.insertBefore(el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: o.bg || 'none', stroke: col, 'stroke-width': 2.5 }), t);
  g._w = w; return g;
}

// ---------- placing things ----------
const beatPulse = (lt, beat) => Math.exp(-((((lt % beat) + beat) % beat) / beat) * 5);   // 1 on every beat, decays
const fadeOut = (lt, at, d = .4) => 1 - ease((lt - at) / d);
function tx(parent, str, o = {}) {   // centred text in its own <g>, so setT / popAt can place and scale it; text node = g._t
  const g = el('g', {}, parent), size = Math.max(o.size || 32, MIN_FONT);
  g._t = T(g, str, 0, size * .36, { ...o, anchor: o.anchor || 'middle' }); return g;
}
// Spring e in at `at` to (x, y). o: kind (SP preset, default pop), s0 start scale, dy start offset, s extra scale,
// r rotation, o opacity cap, out = time to fade and shrink away. Returns the spring value.
function popAt(e, lt, at, x, y, o = {}) {
  const k = SP[o.kind || 'pop'](lt - at), q = o.out != null ? ease((lt - o.out) / .4) : 0;
  setT(e, x, y + (o.dy || 0) * (1 - k), lerp(o.s0 ?? 0, 1, k) * (1 - q * .3) * (o.s || 1), o.r || 0);
  op(e, Math.min(1, k * 3) * (1 - q) * (o.o ?? 1)); return k;
}
function boxG(parent, w, h, col, o = {}) {   // rounded card centred on (0, 0); rect = g._r. o: fill, fo, sw, rx, dash
  const g = el('g', {}, parent);
  g._r = el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: o.rx ?? 18, fill: o.fill || C.bg2, 'fill-opacity': o.fo ?? .9,
    stroke: col, 'stroke-width': o.sw || 3, ...(o.dash ? { 'stroke-dasharray': o.dash } : {}) }, g);
  return g;
}
function nodeG(parent, col, r = 20) {   // network / org-chart node: halo + ring + dot
  const g = el('g', {}, parent);
  g._h = el('circle', { r: r + 10, fill: col, opacity: .16 }, g);
  g._c = el('circle', { r, fill: C.bg, stroke: col, 'stroke-width': 4 }, g);
  g._d = el('circle', { r: r * .38, fill: col }, g);
  return g;
}
function nodeCol(n, col) { if (n._col === col) return; n._col = col; n._h.setAttribute('fill', col); n._c.setAttribute('stroke', col); n._d.setAttribute('fill', col); }
function seg(parent, col, w = 3, o = {}) { return el('line', { stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', ...o }, parent); }
function setSeg(l, x1, y1, x2, y2, k = 1) {   // line growing from (x1, y1) as k goes 0 → 1; l._o = its full opacity
  k = clamp(k); l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', lerp(x1, x2, k)); l.setAttribute('y2', lerp(y1, y2, k));
  op(l, k > 0 ? (l._o ?? 1) : 0);
}
// ✕ / ✓ stamps, drawn stroke by stroke with runMark
function crossG(parent, col, s = 50, w = 9) {
  const g = el('g', {}, parent), a = { stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', fill: 'none' };
  g._p = [el('path', { d: `M${-s} ${-s} L${s} ${s}`, ...a }, g), el('path', { d: `M${s} ${-s} L${-s} ${s}`, ...a }, g)]; return g;
}
function checkG(parent, col, s = 1, w = 8) {
  const g = el('g', {}, parent);
  g._p = [el('path', { d: `M${-28 * s} ${2 * s} L${-8 * s} ${22 * s} L${30 * s} ${-22 * s}`, stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, g)]; return g;
}
function runMark(g, lt, at, x, y, o = 1) { setT(g, x, y, 1 + .5 * (1 - SP.pop(lt - at))); op(g, lt >= at ? o : 0); g._p.forEach((p, i) => drawPath(p, ease((lt - at - i * .1) / .16))); }

// ---------- strokes, arrows, shock waves ----------
// Animates stroke-dasharray, so it replaces any dash pattern on p: animate a dashed line with opacity or stroke-dashoffset.
function drawPath(p, k) { p._L = p._L || p.getTotalLength(); p.style.strokeDasharray = p._L; p.style.strokeDashoffset = p._L * (1 - clamp(k)); }
const polar = (cx, cy, r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];
function arcD(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0} ${y0} A${r} ${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1} ${y1}`;
}
function shock(parent, n = 3, col = C.accent) { return [...Array(n)].map(() => el('circle', { r: 0, fill: 'none', stroke: col, 'stroke-width': 4, opacity: 0 }, parent)); }
function runShock(rings, lt, at, cx, cy, r0, r1, dur = 1.2) {
  rings.forEach((c, i) => { const k = clamp((lt - at - i * .12) / dur), on = lt >= at + i * .12 && k < 1;
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', r0 + easeOut(k) * (r1 - r0));
    c.setAttribute('opacity', on ? (1 - k) * .8 : 0); c.setAttribute('stroke-width', 8 * (1 - k) + 1); });
}
function arrow(parent, x0, y0, x1, y1, col, w = 8) {
  const g = el('g', {}, parent), L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L;
  const ln = el('path', { d: `M${x0} ${y0} L${x1 - ux * 18} ${y1 - uy * 18}`, stroke: col, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round' }, g);
  const hx = x1 - ux * 26, hy = y1 - uy * 26;
  const hd = el('path', { d: `M${hx - uy * 20} ${hy + ux * 20} L${x1} ${y1} L${hx + uy * 20} ${hy - ux * 20}`, stroke: col, 'stroke-width': w, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
  const fl = el('path', { d: `M${x0} ${y0} L${x1 - ux * 18} ${y1 - uy * 18}`, stroke: C.paper, 'stroke-width': 3, opacity: 0, fill: 'none', 'stroke-dasharray': '3 16', 'stroke-linecap': 'round' }, g);
  return { g, ln, hd, fl };
}
function runArrow(a, lt, at) {   // draws in, then keeps flowing so the frame never freezes
  drawPath(a.ln, ease((lt - at) / .45)); op(a.hd, (lt - at - .3) / .15); op(a.fl, (lt - at - .4) / .2 * .6);
  a.fl.style.strokeDashoffset = -(lt - at) * 60;
}

// ---------- icons: 64×64 stroke paths, one path per stroke so they draw in order ----------
// Add the article's own components here (a seal, a tool, an object) instead of using screenshots.
const ICONS = {
  person: ['M32 14 m-7 0 a7 7 0 1 0 14 0 a7 7 0 1 0 -14 0', 'M20 58 L20 36 C20 28 44 28 44 36 L44 58'],
  book:   ['M8 14 L30 18 L30 56 L8 52 Z', 'M56 14 L34 18 L34 56 L56 52 Z', 'M14 26 L24 28', 'M14 34 L24 36', 'M40 28 L50 26', 'M40 36 L50 34'],
  flag:   ['M16 58 L16 8', 'M16 10 L50 14 L42 24 L50 34 L16 30'],
  wheat:  ['M32 60 L32 14', 'M32 20 C26 18 24 12 26 8 C30 10 32 14 32 20', 'M32 20 C38 18 40 12 38 8 C34 10 32 14 32 20',
           'M32 30 C25 28 22 22 24 17 C29 19 32 24 32 30', 'M32 30 C39 28 42 22 40 17 C35 19 32 24 32 30'],
  gear:   ['M32 32 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0', 'M32 8 L32 16', 'M32 48 L32 56', 'M8 32 L16 32', 'M48 32 L56 32',
           'M15 15 L21 21', 'M43 43 L49 49', 'M49 15 L43 21', 'M21 43 L15 49'],
  scale:  ['M32 8 L32 56', 'M18 56 L46 56', 'M10 18 L54 18', 'M10 18 L4 36 L16 36 Z', 'M54 18 L48 36 L60 36 Z'],
  chart:  ['M8 56 L56 56', 'M8 56 L8 8', 'M16 46 L28 34 L38 40 L54 18', 'M46 18 L54 18 L54 26'],
  city:   ['M6 56 L58 56', 'M10 56 L10 30 L22 30 L22 56', 'M26 56 L26 14 L40 14 L40 56', 'M44 56 L44 24 L54 24 L54 56'],
  doc:    ['M14 6 L40 6 L52 18 L52 58 L14 58 Z', 'M40 6 L40 18 L52 18', 'M22 30 L44 30', 'M22 40 L44 40', 'M22 50 L36 50'],
  coin:   ['M32 32 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0', 'M32 32 m-16 0 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0',
           'M38 24 C34 21 26 22 26 28 C26 34 38 31 38 37 C38 43 29 43 26 40', 'M32 18 L32 46'],
  target: ['M32 32 m-24 0 a24 24 0 1 0 48 0 a24 24 0 1 0 -48 0', 'M32 32 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0',
           'M32 32 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0'],
  layers: ['M32 8 L58 20 L32 32 L6 20 Z', 'M6 32 L32 44 L58 32', 'M6 44 L32 56 L58 44'],
  spark:  ['M32 6 L37 27 L58 32 L37 37 L32 58 L27 37 L6 32 L27 27 Z'],
};
function drawIcon(g, name, color, prog, sw = 3) {   // prog 0..1: strokes draw one after another
  if (!g._paths) {
    if (!ICONS[name]) throw new Error(`no icon "${name}" in ICONS`);
    g._paths = ICONS[name].map(d => el('path', { d, fill: 'none', stroke: color, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g));
  }
  const n = g._paths.length;
  g._paths.forEach((p, i) => drawPath(p, ease(clamp(prog * n - i * .7))));
}
function badge(parent, name, x, y, col, r = 58) {   // round token holding an icon
  const g = el('g', {}, parent);
  el('circle', { r: r + 14, fill: col, opacity: .14 }, g);
  el('circle', { r, fill: C.bg, stroke: col, 'stroke-width': 4 }, g);
  const ic = el('g', { transform: `translate(${-r * .62} ${-r * .62}) scale(${r * 1.24 / 64})` }, g);
  return { g, ic, name, x, y, col };
}
function iconG(parent, name, col, size = 40, sw = 3.4) {   // bare icon centred on (0, 0), for icons that move or spin
  const g = el('g', {}, parent), ic = el('g', { transform: `translate(${-size / 2} ${-size / 2}) scale(${size / 64})` }, g);
  g._ic = ic; g._name = name; g._col = col; g._sw = sw * 64 / size; return g;
}
function drawIconG(g, prog) { drawIcon(g._ic, g._name, g._col, prog, g._sw); }
// A badge that moves: popAt options plus o.ink for the icon colour.
function placeBadge(b, lt, at, x, y, o = {}) { const k = popAt(b.g, lt, at, x, y, o); drawIcon(b.ic, b.name, o.ink || C.paper, clamp((lt - at - .05) / .55), 3.4); return k; }
function popBadge(b, lt, at) { const s = SP.pop(lt - at); setT(b.g, b.x, b.y, s); op(b.g, s * 3); drawIcon(b.ic, b.name, C.paper, clamp((lt - at - .05) / .55), 3.4); }

// ---------- film grain: 6 seeded tiles, 12 changes per second ----------
function grain(canvas, t, alpha = .08) {
  const ctx = canvas.getContext('2d');
  if (!canvas._tiles) canvas._tiles = [...Array(6)].map((_, k) => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d'), im = x.createImageData(256, 256), r = rnd(k * 977 + 13);
    for (let i = 0; i < im.data.length; i += 4) { im.data[i] = im.data[i + 1] = im.data[i + 2] = r() * 255; im.data[i + 3] = 255; }
    x.putImageData(im, 0, 0); return c;
  });
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.globalAlpha = alpha;
  ctx.fillStyle = ctx.createPattern(canvas._tiles[Math.floor(t * 12) % 6], 'repeat'); ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;
}
