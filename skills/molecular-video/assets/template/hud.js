// Live readout under the chapter list (landscape): one big number per chapter, computed by MODEL (model.js) from the same
// state that moves the 3D scene (W3.defs[id].hud). Each entry returns { at, lab, st, v, u, bar, sub, sl, bad, card } or null.
// card (optional floating glass card, top right): { title, rows: [[label, value, colour?]], chips: [[text, colour]], at?, out?, pos?: [x, y] }
(function () {
  const M = window.MODEL, el = document.getElementById('hud'), q = s => el.querySelector(s), cardEl = document.getElementById('card');
  const f = (v, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const dur = s => s < 3600 ? [s / 60, '分钟'] : s < 86400 * 120 ? [s / 86400, '天'] : [s / 86400 / 365, '年'];
  const D = {
    struct(lt, E) {
      const k = clamp((lt - E('亲水')) / (E('长链') - E('亲水') + .6)), n = M.N_EO * k;
      return lt < E('亲水') - .3 ? null : { at: E('亲水') - .3, lab: 'PEG2000 重复单元', st: 'n = 2000 / 44', v: f(n, 0), u: '个 EO', bar: k,
        sub: `每个 0.35 nm · 自由线团 R_F = a·N^3/5 ≈ ${f(M.RF)} nm` };
    },
    dspe(lt, E, h) {
      if (!h || lt < E('两条') - .3) return null;
      return { at: E('两条') - .3, lab: 'DSPE 疏水尾 · 嵌入深度', st: `已锚定 ${h.anchored} / 3`, v: f(h.depth), u: 'nm', bar: h.depth / M.tail(),
        sub: `2 × C18 硬脂酰链 · Tanford l = 0.154 + 0.127·17 = ${f(M.tail(), 2)} nm` };
    },
    peg(lt, E, h) {
      if (!h || lt < E('伸展') - .6) return null;
      return { at: E('伸展') - .6, lab: 'PEG 层厚度', st: h.regime, v: f(h.L), u: 'nm', bar: h.L / 5,
        sub: `接枝间距 D = σ^-1/2 = ${f(h.D)} nm ${h.D > M.RF ? '>' : '<'} R_F ${f(M.RF)} nm`,
        sl: { lab: '摩尔比', k: (h.x - .5) / 9.5, v: f(h.x) + ' %' },
        card: { title: '接枝密度 · 实时计算', at: E('伸展') - .3, rows: [['σ = x / A_L', f(h.sigma, 3) + ' nm⁻²'], ['间距 D', f(h.D) + ' nm'], ['线团 R_F', f(M.RF) + ' nm'],
          ['构象', h.regime, h.regime === '刷状区' ? C.accent : C.dim]], chips: [['水溶性 ↑', C.accent], ['团聚 ↓', C.b]] } };
    },
    rgd(lt, E, h) {
      if (!h || lt < E('暴露') - .3) return null;
      const P = M.peg(5);
      return { at: E('暴露') - .3, lab: 'cRGD 配体 / 100 nm 脂质体', st: h.bound ? '已结合 αvβ3' : lt > E('识别') ? '识别中' : '暴露在外层', v: f(P.ligands * clamp(h.k), 0), u: '个', bar: clamp(h.k),
        sub: `5 mol% × 4πR² / A_L（R = 50 nm，A_L = 0.65 nm²）`,
        card: { title: '靶向识别', at: E('识别') - .2, rows: [['配体', 'cRGD 环肽', C.b], ['受体', '整合素 αvβ3'], ['状态', h.bound ? '已结合' : '识别中', h.bound ? C.accent : C.dim]] } };
    },
    store(lt, E) {
      if (lt < E('低温') - .3) return null;
      const hot = lt > E('强酸强碱') - .1, [Tc, pH] = hot ? [70, 10] : [4, 7.4], [v, u] = dur(M.halfLife(Tc, pH));
      return { at: E('低温') - .3, lab: `酯键水解半衰期 · ${Tc} °C · pH ${pH}`, st: hot ? '快速水解' : '稳定', v: f(v), u, bar: hot ? .02 : .9, bad: hot,
        sub: 'Arrhenius + 碱催化估算（Ea 80 kJ/mol），示意' };
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
