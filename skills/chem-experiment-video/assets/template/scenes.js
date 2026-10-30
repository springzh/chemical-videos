// Scenes, keyed by the scene id in script.json. Each is built in a 1000×1000 stage:
//   build(g)            create the SVG once (fonts are loaded; store elements on `this`)
//   update(lt, E, beat) set every attribute for scene time lt (seconds since the scene's downbeat).
//                       E('词') = that cue's time in scene time, already on the eighth-note grid.
// Optional fields on a scene def:
//   en: 'Meet the racers'      English line under the heading (the heading itself is the scene "title" in script.json)
//   full: true                 no heading (hook, big moments)
//   scale: '1 cm' | [[0, '1 cm'], ['放大', '1 μm'], ['一千万倍', '1 nm']]   optional scale bar; at = seconds or a cue
//   enter: 'fade' | 'zoomIn' | 'zoomOut'   zoomIn = diving in to the molecular scale, zoomOut = pulling back out
// Rules (references/motion.md in article-video, plus references/style.md here): something lands on the downbeat;
// every element enters on a cue; something always moves (bob, flow, particles); nothing smaller than MIN_FONT
// except English glosses. `_cues` is the draft fallback — labelled 草稿布局, never in the final cut.
const QUIZ = {
  q: '题目？', qen: 'Question?', options: [['选项一', 'Option one'], ['选项二', 'Option two'], ['选项三', 'Option three']],
  answer: 1, explain: ['解释一句', '再补一句'],
};
function buildQuiz(s, g) {
  txt(g, '小测验', 40, 40, { size: 60, weight: 900 }); small(g, 'Quick check', 40, 80, { size: 26 });
  s.qz = quiz(g, QUIZ.q, QUIZ.qen, QUIZ.options, QUIZ.answer); setT(s.qz.g, 40, 130);
  s.ex = QUIZ.explain.map((line, i) => txt(g, line, 500, 790 + i * 52, { size: 36, weight: 800, anchor: 'middle' }));
}

const SCENE_DEFS = {
  // Demo hook: a beaker fills, a question mark pops. Rewrite per film (see assets/examples/ for real ones).
  hook: {
    full: true, scale: '1 cm',
    build(g) {
      const s = this, keys = Object.keys(s.sc.ev);
      s.v = vessel(g, 'beaker', { w: 320, h: 380 });
      s.q = txt(g, '?', 760, 360, { size: 160, weight: 900, fill: C.accent, anchor: 'middle' });
      s.k0 = keys[0];
    },
    update(lt, E) {
      const s = this, k = SP.heavy(lt);
      setT(s.v.g, 500, 760 + (1 - k) * 80); op(s.v.g, k * 2);
      setVessel(s.v, { level: .2 + .5 * ease((lt - .3) / 2.5), col: C.solvent });
      const at = s.k0 ? E(s.k0) : 1.2; popAt(s.q, lt, at, 0, 0, { s0: .3 }); s.q.setAttribute('transform', `translate(0 ${bob(lt, 1, 8)}) ` + s.q.getAttribute('transform'));
    },
  },

  // Quiz in two scenes so the countdown runs in silence: `quiz` reads the question and counts down in its tail bars
  // (script.json "tail_bars": 2); `answer` shows the same card, reveals on its downbeat and explains. Fill in q / qen /
  // options / answer / explain here (answer is shared through QUIZ).
  quiz: {
    full: true,
    build(g) { buildQuiz(this, g); },
    update(lt, E) {
      const s = this, sc = s.sc, end = sc.end - sc.start, c0 = sc.vo_at != null ? sc.vo_at - sc.start + sc.vo_dur + .2 : 1.2;
      runQuiz(s.qz, lt, { show: .1, count: [c0, Math.max(3, Math.floor(end - c0 - .2))] });
      s.ex.forEach(e => op(e, 0));   // the explanation belongs to `answer`
    },
  },
  answer: {
    full: true,
    build(g) { buildQuiz(this, g); },
    update(lt, E) {
      const s = this; runQuiz(s.qz, lt, { show: -5, reveal: .15 });
      s.ex.forEach((e, i) => { const k = SP.card(lt - .9 - i * .3); op(e, k * 2); e.setAttribute('transform', `translate(0 ${(1 - k) * 20})`); });
    },
  },

  // Outro: three takeaways, then the next-episode card. items / next filled per film.
  outro: {
    full: true,
    items: [['第一件事', 'First'], ['第二件事', 'Second'], ['第三件事', 'Third']], next: ['下期：……', 'Next: …'],
    build(g) {
      const s = this, M = TL.meta;
      s.title = txt(g, '三件事', 40, 40, { size: 60, weight: 900 }); small(g, 'Three takeaways', 40, 80, { size: 26 });
      s.tk = takeaways(g, s.items); setT(s.tk.g, 40, 220);
      s.nx = s.next && nextCard(g, s.next[0], s.next[1]);
      s.note = M.endnote && small(g, M.endnote, 500, 980, { anchor: 'middle', size: 24 });
    },
    update(lt, E) {
      const s = this, keys = Object.keys(s.sc.ev);
      const ts = s.items.map((_, i) => keys[i] ? E(keys[i]) : .3 + i * .8);
      runTakeaways(s.tk, lt, ts);
      if (s.nx) { const at = '下期' in s.sc.ev ? E('下期') : ts[ts.length - 1] + 1.6;
        popAt(s.nx, lt, at, 500, 740 + Math.sin(lt * 2) * 4, { kind: 'card', dy: 60, s0: .9 }); }
      if (s.note) op(s.note, (lt - 1) / .5);
    },
  },

  _cues: {
    build(g) {
      const s = this, keys = Object.keys(s.sc.ev), cols = keys.length > 8 ? 3 : 2, w = 900 / cols;
      s.pills = keys.map((k, i) => ({ k, p: pill(g, k, i % 2 ? C.b : C.a, { size: 32, bg: C.bg2 }),
        x: 50 + w * (i % cols + .5), y: 120 + Math.floor(i / cols) * 105 }));
      s.tag = T(g, '草稿布局', 500, 960, { size: 28, fill: C.dim, anchor: 'middle' });
    },
    update(lt, E, beat) {
      const s = this, pulse = Math.exp(-((lt % beat) / beat) * 5);
      s.pills.forEach(({ k, p, x, y }) => { const z = SP.pop(lt - E(k)); setT(p, x, y, z * (1 + pulse * .03)); op(p, z * 3); });
    },
  },
};
