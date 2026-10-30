// Live readout under the chapter list (landscape): one big number per chapter, computed by MODEL (model.js) from the same
// state that moves the 3D scene (W3.defs[id].hud). Each entry returns { at, lab, st, v, u, bar, sub, sl, bad, card } or null.
// card (optional floating glass card, top right): { title, rows: [[label, value, colour?]], chips: [[text, colour]], at?, out?, pos?: [x, y] }
(function () {
  const M = window.MODEL, el = document.getElementById('hud'), q = s => el.querySelector(s), cardEl = document.getElementById('card');
  const f = (v, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const dur = s => s < 3600 ? [s / 60, '分钟'] : s < 86400 * 120 ? [s / 86400, '天'] : [s / 86400 / 365, '年'];
  const D = {
    struct(lt, E, h) {
      if (!h || lt < E('接枝') - .4) return null;
      const n = Math.round(12 * h.kpep);
      return { at: E('接枝') - .4, lab: 'SP94 多肽 · 氨基酸残基', st: M.SP94.slice(0, n) || '—', v: f(n, 0), u: '个', bar: h.kpep,
        sub: `序列 ${M.SP94}（文献，Lo 等 2008）` };
    },
    core(lt, E) {
      if (lt < E('乳酸') - .3) return null;
      const deg = lt > E('水解');
      return { v: null, card: { title: 'PLGA · 聚(乳酸-羟基乙酸)', at: E('乳酸') - .3, pos: [1390, 520], rows: [['单体', '乳酸 LA + 羟基乙酸 GA', C.a], ['主链连接', '酯键 –CO–O–'],
        ['水解产物', deg ? '乳酸 · 羟基乙酸' : '—', deg ? C.accent : C.dim], ['降解快慢', '随 LA:GA 比例与分子量变化', C.dim]], chips: [['疏水内核', C.a], ['可降解', C.accent]] } };
    },
    peg(lt, E, h) {
      if (!h || lt < E('伸展') - .6) return null;
      return { at: E('伸展') - .6, lab: 'PEG 链 · 自由线团尺寸', st: `PEG${h.Mw}`, v: f(h.RF), u: 'nm', bar: h.RF / M.RF(5000),
        sub: `R_F = a·N^3/5，N = M/44 = ${f(h.N, 0)}，a = 0.35 nm（估算）`,
        sl: { lab: '分子量', k: (h.Mw - 1000) / 4000, v: f(h.Mw, 0) },
        card: { title: '链越长 · 保护层越厚', at: E('保护层') - .3, rows: [['EO 单元 N', f(h.N, 0)], ['线团 R_F', f(h.RF) + ' nm'], ['外层', '水合 PEG', C.accent]],
          chips: [['团聚 ↓', C.b], ['分散 ↑', C.accent]] } };
    },
    sp94(lt, E, h) {
      if (!h || lt < E('最外层') - .3) return null;
      return { at: E('最外层') - .3, lab: 'SP94 → 结合位点 · 距离', st: h.bound ? '已结合' : lt > E('识别') ? '识别中' : '暴露在外层', v: f(Math.max(0, h.dist - .55), 1), u: 'nm', bar: 1 - clamp(h.dist / 16),
        sub: '画面几何距离（1 单位 ≈ 1 nm，示意）',
        card: { title: 'SP94 靶向肽', at: E('识别') - .2, rows: [['序列', M.SP94, C.b], ['长度', '12 个氨基酸'], ['识别对象', '肝癌细胞'], ['状态', h.bound ? '已结合' : '识别中', h.bound ? C.accent : C.dim]] } };
    },
    make(lt, E) {
      if (lt < E('乳化') - .3) return null;
      return { v: null, card: { title: '乳化法制备 · 示意', at: E('乳化') - .3, pos: [1390, 110], rows: [['油相', '共聚物 + 有机溶剂', C.a], ['水相', '乳化分散成液滴', C.accent], ['溶剂挥发', '液滴收缩、固化']],
        chips: [['纳米胶束', C.accent], ['微球', C.a]] } };
    },
  };
  let cur = null, cardKey = '';
  function showCard(c, lt, len) {
    if (!c || lt < (c.at ?? 0)) { cardEl.style.opacity = 0; return; }
    const html = `<h3>${c.title}</h3>` + (c.rows || []).map(([k, v, col]) => `<div class="r"><span>${k}</span><b${col ? ` style="color:${col}"` : ''}>${v}</b></div>`).join('')
      + (c.chips ? `<div class="ch">${c.chips.map(([t, col]) => `<span style="color:${col || C.accent}">${t}</span>`).join('')}</div>` : '');
    if (html !== cardKey) { cardEl.innerHTML = html; cardKey = html; }
    const [x, y] = c.pos || [1390, 110], k = SP.card(lt - (c.at ?? 0)) * (1 - ease(clamp((lt - (c.out ?? len - .45)) / .4)));
    Object.assign(cardEl.style, { left: x + 'px', top: y + 'px', opacity: clamp(k * 1.5), transform: `translateY(${(1 - k) * -24}px)` });
  }
  window.HUD = {
    render(id, lt, E, t, full) {
      const sc = TL.scenes.find(s => s.id === id), len = sc ? sc.end - sc.start : 10, fn = D[id];
      const r = !full && fn ? fn(lt, E, W3.defs[id] && W3.defs[id].hud) : null;
      showCard(r && r.card, lt, len);
      if (!r || r.v == null) { el.style.opacity = 0; cur = null; return; }
      if (cur !== id) { cur = id; Object.assign(el.style, { left: '100px', top: '790px' }); }
      const k = SP.card(lt - r.at) * (1 - ease(clamp((lt - len + .45) / .4)));
      el.style.opacity = clamp(k * 1.5); el.style.transform = `translateY(${(1 - k) * 30}px)`;
      el.classList.toggle('bad', !!r.bad);
      q('.lab').textContent = r.lab; q('.st').textContent = r.st || ''; q('.v').textContent = r.v; q('.u').textContent = r.u;
      q('.bar i').style.width = clamp(r.bar) * 100 + '%'; q('.sub').textContent = r.sub;
      const sl = q('.sl'); sl.style.display = r.sl ? 'flex' : 'none';
      if (r.sl) { q('.sll').textContent = r.sl.lab; q('.tr i').style.left = clamp(r.sl.k) * 100 + '%'; q('.slv').textContent = r.sl.v; }
    },
  };
})();
