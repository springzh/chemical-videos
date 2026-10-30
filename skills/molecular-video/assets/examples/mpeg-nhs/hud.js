// Live readout under the chapter list (landscape): one big number per chapter, computed by MODEL (model.js) from the same
// state that moves the 3D scene (W3.defs[id].hud). Each entry returns { at, lab, st, v, u, bar, sub, sl, bad, card } or null.
// card (optional floating glass card, top right): { title, rows: [[label, value, colour?]], chips: [[text, colour]], at?, out?, pos?: [x, y] }
(function () {
  const M = window.MODEL, el = document.getElementById('hud'), q = s => el.querySelector(s), cardEl = document.getElementById('card');
  const f = (v, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const dur = s => s < 3600 ? [s / 60, '分钟'] : s < 86400 * 120 ? [s / 86400, '天'] : [s / 86400 / 365, '年'];
  const D = {
    struct(lt, E, h) {
      if (!h || lt < E('线性') - .3) return null;
      const n = M.N_EO * h.k;
      return { at: E('线性') - .3, lab: 'PEG5000 重复单元', st: 'n = 5000 / 44', v: f(n, 0), u: '个 EO', bar: h.k,
        sub: `每个 −CH₂CH₂O− 44 g/mol · 线团 R_F = a·N^3/5 ≈ ${f(M.RF)} nm` };
    },
    couple(lt, E, h) {
      if (!h || lt < E('七到九') - .3) return null;
      const bonded = lt > E('成键');
      return { at: E('七到九') - .3, lab: '赖氨酸 ε-NH₂ 可反应比例', st: bonded ? '已成酰胺键' : '去质子才进攻', v: f(h.f * 100, 2), u: '%', bar: Math.log10(h.f / 3e-4) / 2,
        sub: 'f = 1 / (1 + 10^(pKa − pH))，pKa ≈ 10.5（估算）',
        sl: { lab: 'pH', k: (h.pH - 6) / 4, v: f(h.pH) },
        card: { title: '偶联反应', at: E('伯胺') - .2, pos: [1390, 96], rows: [['PEG–CO–NHS + H₂N–Lys', ''], ['→ PEG–CO–NH–Lys', '酰胺键', C.accent], ['离去基团', 'NHS', C.b], ['条件', 'pH 7–9']],
          chips: [['无伯胺缓冲液', C.accent]] } };
    },
    race(lt, E, h) {
      if (!h || lt < E('水解') - .3) return null;
      const [v, u] = h.half < 3600 ? [h.half / 60, '分钟'] : [h.half / 3600, '小时'], bad = h.pH > 8.55;
      return { at: E('水解') - .3, lab: `NHS 酯水解半衰期 · pH ${f(h.pH)}`, st: bad ? '水解抢先' : '还来得及', v: f(v), u, bar: clamp(Math.log10(h.half / 60) / 2.5), bad,
        sub: 't½ ≈ 4 h × 10^(7 − pH)（常用经验值，估算）',
        sl: { lab: 'pH', k: (h.pH - 6) / 4, v: f(h.pH) },
        card: { title: '氨基 vs 水', at: E('谁先到') - .3, pos: [1390, 96], rows: [['氨基可反应 f', f(h.f * 100, 2) + ' %', C.accent], ['水解 t½', f(v) + ' ' + u, bad ? '#FF7A7A' : C.paper], ['已成键 / 已水解', `${h.won} / ${h.lost}`]],
          chips: [['pH ↑ 两边都加快', C.b]] } };
    },
    pegyl(lt, E, h) {
      if (!h || lt < E('水合层') - .4) return null;
      return { at: E('水合层') - .4, lab: 'PEG5000 线团尺寸 R_F', st: `示意 ${h.n} 条链`, v: f(M.RF), u: 'nm', bar: M.RF / 8,
        sub: 'R_F = a·N^3/5 = 0.35 × 114^0.6 nm（估算）',
        card: { title: 'PEG 化的收获', at: E('水溶性') - .2, pos: [1390, 96], rows: [['水溶性', '↑', C.accent], ['非特异性吸附', '↓', C.b], ['免疫原性', '↓', C.b], ['循环时间', '↑', C.accent]] } };
    },
    store(lt, E, h) {
      if (!h || lt < E('零下二十度') - .3) return null;
      const buf = lt > E('含氨') - .2 ? { title: '反应缓冲液', at: E('含氨') - .2, pos: [1390, 96], rows: [['PBS · HEPES · 硼酸盐', '✓ 可用', '#7EE0A8'], ['Tris · 甘氨酸', '✗ 含伯胺', '#FF7A7A']], chips: [['溶液现配现用', C.accent]] } : null;
      if (h.wet) { const left = M.left(3600, 8);
        return { at: E('零下二十度') - .3, lab: '受潮进水 · pH 8 放置 1 小时', st: '活性在流失', v: f(left * 100), u: '% 剩余', bar: left, bad: true,
          sub: `t½(pH 8) ≈ ${f(M.nhsHalf(8) / 60, 0)} min → 0.5^(60/24)（估算）`, card: buf }; }
      return { at: E('零下二十度') - .3, lab: '溶液中水解速率 · −20 °C 对比 25 °C', st: '慢下来', v: f(M.slow(-20), 0), u: '倍', bar: .9,
        sub: 'Arrhenius，Ea ≈ 70 kJ/mol；干粉无水即不水解', card: buf };
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
