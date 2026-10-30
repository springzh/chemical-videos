// Live readout under the chapter list (landscape): one big number per chapter, computed by MODEL (model.js) from the same
// state that moves the 3D scene (W3.defs[id].hud). Each entry returns { at, lab, st, v, u, bar, sub, sl, bad, card } or null.
// card (optional floating glass card, top right): { title, rows: [[label, value, colour?]], chips: [[text, colour]], at?, out?, pos?: [x, y] }
(function () {
  const M = window.MODEL, el = document.getElementById('hud'), q = s => el.querySelector(s), cardEl = document.getElementById('card');
  const f = (v, d = 1) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const dur = s => s < 3600 ? [s / 60, '分钟'] : s < 86400 * 120 ? [s / 86400, '天'] : [s / 86400 / 365, '年'];
  const D = {
    struct(lt, E) {
      const k = clamp((lt - E('亲水')) / (E('末端') - E('亲水'))), n = M.N_EO * k;
      return lt < E('亲水') - .3 ? null : { at: E('亲水') - .3, lab: 'PEG2000 重复单元', st: 'n = 2000 / 44', v: f(n, 0), u: '个 EO', bar: k,
        sub: `每个 0.35 nm · 自由线团 R_F = a·N^3/5 ≈ ${f(M.RF)} nm` };
    },
    dspe(lt, E, h) {
      if (!h || lt < E('两条') - .3) return null;
      return { at: E('两条') - .3, lab: 'DSPE 疏水尾 · 嵌入深度', st: `已锚定 ${h.anchored} / 3`, v: f(h.depth), u: 'nm', bar: h.depth / M.tail(),
        sub: `2 × C18 硬脂酰链 · Tanford l = 0.154 + 0.127·17 = ${f(M.tail(), 2)} nm` };
    },
    peg(lt, E, h) {
      if (!h || lt < E('伸展') - 1.2) return null;
      return { at: E('伸展') - 1.2, lab: 'PEG 层厚度', st: h.regime, v: f(h.L), u: 'nm', bar: h.L / 5,
        sub: `接枝间距 D = σ^-1/2 = ${f(h.D)} nm ${h.D > M.RF ? '>' : '<'} R_F ${f(M.RF)} nm`,
        sl: { lab: '摩尔比', k: (h.x - .5) / 9.5, v: f(h.x) + ' %' },
        card: { title: '接枝密度 · 实时计算', at: E('伸展') - .3, rows: [['σ = x / A_L', f(h.sigma, 3) + ' nm⁻²'], ['间距 D', f(h.D) + ' nm'], ['线团 R_F', f(M.RF) + ' nm'],
          ['构象', h.regime, h.regime === '刷状区' ? C.accent : C.dim]], chips: [['空间稳定 ↑', C.accent], ['团聚 ↓', C.b]] } };
    },
    couple(lt, E, h) {
      if (!h || lt < E('巯基') - .3) return null;
      const P = M.peg(5), k = clamp((lt - E('巯基') + .3) / 1.2), tM = E('迈克尔加成'), tS = E('硫醚键');
      return { at: E('巯基') - .3, lab: 'Mal 位点 / 100 nm 脂质体', st: lt > E('先组装') ? '先组装 · 后偶联' : lt > tS ? '已成键' : lt > tM ? '加成中' : '等待巯基', v: f(P.sites * k, 0), u: '个', bar: k,
        sub: '5 mol% × 4πR² / A_L（R = 50 nm，A_L = 0.65 nm²）· 估算',
        card: { title: '迈克尔加成', at: tM - .2, pos: [1370, 590], rows: [['反应', 'C=C + R–SH', C.b], ['产物', '硫醚键 C–S', C.accent], ['条件', 'pH 6.5–7.5'], ['选择性', '巯基 ≫ 氨基']],
          chips: [['共价 · 稳定', C.accent]] } };
    },
    ph(lt, E, h) {
      if (!h || lt < E('窗口') - 1.2) return null;
      const pH = h.pH, r = M.hydRel(pH), out = pH > 7.5, fc = M.frac(M.PKA_CYS, pH), fl = M.frac(M.PKA_LYS, pH);
      return { at: E('窗口') - 1.2, lab: '马来酰亚胺开环水解 · 相对速率', st: out ? '超出窗口' : pH >= 6.5 ? '窗口内' : '偏酸', v: '×' + f(r, r < 10 ? 1 : 0), u: '（pH 7 = 1）', bar: clamp(Math.log10(r * 10) / 3), bad: out,
        sub: 'k/k₇ = 10^(pH−7)，OH⁻ 催化一级假设 · 估算',
        sl: { lab: 'pH', k: (pH - 6) / 3, v: f(pH) },
        card: { title: '去质子比例 · 实时计算', at: E('高于') - .3, rows: [['f = 1/(1+10^(pKa−pH))', ''], ['Cys –SH（pKa 8.3）', f(fc * 100) + ' %', '#FFD54A'],
          ['Lys –NH₂（pKa 10.5）', f(fl * 100, 2) + ' %', out ? '#FF8A8A' : C.dim]], chips: [['窗口 6.5–7.5', '#7EE0A8'], ['> 7.5 副反应 ↑', '#FF8A8A']] } };
    },
    store(lt, E, h) {
      if (!h || lt < E('零下二十度') - .4) return null;
      const r = M.slow(h.T);
      return { at: E('零下二十度') - .4, lab: '溶液中反应变慢 · 对比 25 °C', st: h.T < 0 ? '低温' : '室温', v: '×' + f(r, 0), u: '倍', bar: clamp(Math.log(r) / Math.log(200)),
        sub: 'k₂₅/k_T = e^(Ea/R·(1/T−1/298))，Ea≈70 kJ/mol · 估算',
        sl: { lab: '温度', k: (25 - h.T) / 50, v: f(h.T, 0) + ' °C' } };
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
