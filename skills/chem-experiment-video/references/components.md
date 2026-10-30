# 组件（`chem.js`）

`chem.js` 加在 `lib.js` 之后、`scenes.js` 之前，所以场景里可以直接用 `lib.js` 的全部工具（`el`、`T`、`setT`、`op`、`popAt`、`SP`、`ease`、`drawPath`、`arrow`、`pill`、`countUp`……，见 article-video 的 `references/motion.md`）和下面这些组件。

规则：在 `build(g)` 里创建一次，在 `update(lt, E)` 里每帧调用 `set*` / `run*` / `pose*`。这些函数只依赖传进去的参数，所以每帧调用是安全的；不要用定时器和 `Math.random`（要随机用 `rnd(seed)`）。

## 仪器

| 组件 | 创建 | 每帧 | 说明 |
|---|---|---|---|
| 色谱柱 | `c = column(g, { x, y, w, h, head })` | `setColumn(c, { bands, solvent, drip, lens })` | `bands: [{ pos: 0..1 沿柱床往下（>1 进入下端尖口）, h, col, o }]`；`lens: { pos, k }` 是橙色聚焦圈（`k` = 距它出现的秒数）；`drip: { col, k }` 是从尖口落下的一滴。`c.bedTop` / `c.bedBot` / `c.tipY` 可以用来对齐别的元素 |
| 铁架台 | `stand(g, { x, base, top, armX, armY })` | — | 在色谱柱之前创建，这样它会画在柱子后面 |
| 收集管 | `tb = tubes(g, n, { gap, h })`，用 `setT(tb.g, x, y)` 摆放 | `setTubes(tb, [{ col, level }])` | |
| 滴管 | `d = dropper(g)` | `setDropper(d, x, y, squeeze, o, dropCol, dropK)` | `dropK` 0..1 是滴下的那一滴 |
| TLC 板 | `p = tlc(g, { x, y, w, h, label })` | `setTLC(p, { front, spots, band, bandK, arrows, tag })` | `spots: [{ col, rf, k }]`，斑点高度 = 前沿 × rf；`band: [0.2, 0.35]` 是目标区间；`arrows: { rf, k }` 画出 a（基线到斑点）和 b（基线到前沿）；`tag: { text, kind, lt, at }` 是板下方的评价标签 |
| 检测器曲线 | `ch = chart(g, { x, y, w, h, title, en }, peaks)` | `setChart(ch, k)` | `peaks: [{ c, w, h, col, label }]`，`k` 0..1 把曲线画到横坐标 k。曲线上的峰要和色谱柱流出的时刻同步 |
| 容器 | `v = vessel(g, 'beaker' / 'flask' / 'tube', { w, h })`，原点在底部中心 | `setVessel(v, { level, col, o })` | |
| 加热板 | `hp = hotPlate(g, { w })`，原点在板面中心 | `setHot(hp, k)` | `k` 是加热丝发红的程度；容器放在它上面（容器原点在底部中心） |
| 蒸汽 | `st = steam(g, n)`，`setT(st.g, x, y)` 放在容器口 | `runSteam(st, lt, k)` | |
| 晶体 | `cr = crystals(g, n, [x0, y0, x1, y1], { seed })` | `setCrystals(cr, k, { size, col, dirty })` | 六棱片，按顺序一个个长出来；`dirty` 0..1 是包进杂质（橙红点）的比例 |
| 固体堆 | `h = heap(g, w)`，`setT(h.g, x, 杯底 y)` | `setHeap(h, k, col)` | 粗产品、未溶的固体，`k` 是剩下的量 |
| 示意曲线 | `cv = curvePlot(g, u => f(u), { x, y, w, h, xLabel, yLabel })` | `setCurve(cv, k)`；`cvXY(cv, u)` 取曲线上的点 | 溶解度–温度、滴定曲线等只画形状的曲线 |
| 过滤漏斗 | `ff = filterFunnel(g, { w, h })`，原点在下端尖口 | `setFilter(ff, { cake, drip, col })` | `cake` 是滤纸上的晶体量，`drip` 是滤液的一滴 |
| 分液漏斗 | `f = sepFunnel(g)` | `setFunnel(f, { x, y, s, top, bottom, split, fill, mix, tilt, drain })` | `mix` 1 = 振荡后乳化，两层颜色混在一起；`tilt` 用来演振荡；`drain` 0..1 从下口放出下层（上层跟着下沉），`pour` 0..1 从上口倒出上层 |

## 分子世界

| 组件 | 创建 | 每帧 | 说明 |
|---|---|---|---|
| 角色分子 | `m = mol(g, { col, r, group, groupCol, label, seed })` | `poseMol(m, lt, x, y, { s, o, look, grpAng, idle, squash })` | `group: 'OH'` 等会长出一只橙色小手；`label: 'EA'` 画成不带眼睛的溶剂小球。`grpAng` 是手的方向（度，0 = 向右）。`idle` 默认开：自动浮动和眨眼。`grpXY(m, x, y, a, s)` 给出手的位置，连氢键用 |
| 名牌 | `nameTag(g, '小非', '甲苯 toluene')` | `popAt` | |
| 骨架式 | `sk = skeletal(g, 'CH3' / 'CH2OH' / 'OH' / 'COOH' / 'none', { r })` | `drawSkeletal(sk, k)` | 先画环再画取代基，起作用的基团用 accent 色 |
| 硅胶表面 | `sf = surface(g, { x0, x1, y, n, label })` | `setSurface(sf, { line, oh: i => k, dipole, hi: i => k })` | Si–O 链从左往右画出，每个 Si 上长出 OH；`dipole` 显示 δ−/δ+（可以是数，也可以是 `i => k`） |
| 赛道 | `tr = track(g, { x0, x1, top, bot, n, flow, particles, seed })` | `runTrack(tr, lt, { flow, flowK, partO })` | 两侧硅胶壁，每侧 `n` 个 OH 位点，中间溶剂粒子往下流。`siteXY(tr, side, i)` 给出位点坐标；把 `tr.sites[side][i].busy = true` 标成已占用（描边变深） |
| 氢键 | `b = hbond(g, '氢键 H-bond')` | `setBond(b, lt, x1, y1, x2, y2, k, tagK)` | 流动的虚线；`tagK` 是标签出现后经过的秒数 |

赛跑写法（被吸附的角色每遇到一个位点停一下）：

```js
// update 里：y 随时间下行，经过位点时停 hold 秒
const stops = tr.sites[1].map(s => s.y);           // 右墙位点
let y = top, t = lt - start, held = 0;
for (const sy of stops) { const reach = (sy - y) / speed; if (t < reach) { y += t * speed; t = -1; break; } t -= reach; y = sy;
  if (t < hold) { /* 正握手：连氢键 */ t = -1; break; } t -= hold; }
```

示例项目 `assets/examples/column-chromatography/scenes.js` 里有完整写法（`race` 场景）。

## 卡片、标签、读数

| 组件 | 创建 | 每帧 | 说明 |
|---|---|---|---|
| 术语卡 | `termCard(g, '这就叫吸附', 'adsorption')` | `popAt` | 白卡 + 阴影 |
| 结论条 | `conclusionBar(g, '极性越大 → 吸附越强 → 跑得越慢')` | `popAt` | 深色，每个原理 / 变量场景一条 |
| 标签 | `tagPill(g, '刚好', 'good' / 'bad' / 'warn' / 'info')` | `popAt` | |
| 计时胶囊 | `p = timerPill(g, '小非', C.a)` | `setTimer(p, 秒)` | 示意数字，旁边加「示意」 |
| 进度条 | `m = meterBar(g, '水里还剩', C.a, { w, h })` | `setMeter(m, k, '20%')` | 百分比、产率、剩余量；数字用 `countUp` 的写法自己算好再传进来 |
| 比例滑条 | `rs = ratioSlider(g, '石油醚∶乙酸乙酯', { w, labelW })` | `setRatio(rs, k, '10∶1')` | |
| 图例 | `legend(g, [[C.dim, '石油醚 PE'], ['#2B3A44', '乙酸乙酯', 'EA']])` | `op` | |
| 测验 | `q = quiz(g, 题干, 英文, [[中, 英], …], 答案序号)` | `runQuiz(q, lt, { show, count: [t0, 秒数], reveal })` | 模板的 `quiz` / `answer` 场景已经接好，只填 `QUIZ` |
| 小结 | `tk = takeaways(g, [[中, 英], …])` | `runTakeaways(tk, lt, [t1, t2, t3])` | 模板的 `outro` 场景已经接好 |
| 安全角标 | `safetyBadge(g, '石油醚易燃 · 远离明火')` | `popAt` | 至少停留 3 秒 |
| 示意小字 | `schematicNote(g, '颜色为示意')` | `op` | |
| 下期预告 | `nextCard(g, '下期：……', 'Next: …')` | `popAt` | |

## 页面外框（`index.html`）提供的

- 场景标题：`script.json` 场景的 `title` + scene def 的 `en`；相邻场景标题相同时，标题不重播（适合同一主题拆成两个场景）。
- 比例尺（可选）：scene def 的 `scale`（字符串，或 `[[时刻或 cue, '1 μm'], …]`），读数变化时会弹一下；不设就不显示。
- 转场：scene def 的 `enter`（`fade` / `zoomIn` / `zoomOut` / `none`）。`none` 是硬切，用于接着上一个场景继续演的画面：两个场景共用同一个 build 函数，后一个场景用「距离前一个场景开始的秒数」接着算位置（示例的 `race` → `adsorb`、`quiz` → `answer`）。
- `still: true`：关掉这个场景的缓慢推镜（场景自己做镜头运动时用）。

## 加新组件

做新的实验（重结晶、蒸馏、滴定……）需要新的仪器时，先在项目里写，写成和上面一样的「创建 + 每帧设置」两个函数，参数用舞台坐标。片子做完后，把它补回本技能的 `chem.js` 和这一页（在技能仓库里单独开分支改）。
