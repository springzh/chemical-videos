---
name: molecular-video
description: 把化学 / 生物材料产品（磷脂-PEG-配体如 DSPE-PEG-cRGD / -Mal / -NH2 / -Biotin / -Folate、PEG 衍生物、脂质体、纳米载体、荧光染料、多肽偶联物等）的介绍文案做成 3D 分子科普讲解视频：Three.js 程序化建模的脂质体、磷脂双层、三段式分子、受体，剖切视图，由公式实时计算的数字读数面板，配合中文配音、烧录字幕、卡点配乐，横屏 16:9 约 1–2 分钟。先写配音稿，再按“一章一个 3D 动作 + 一个特写 + 一个读数”搭场景，逐帧渲染出 mp4。只要用户想给一个分子、试剂、高分子材料、药物载体或生物材料产品做动画视频、科普短片、产品讲解视频、“分子结构动画”，就使用本技能，例如「给 DSPE-PEG-Maleimide 做个科普视频」「把这段产品文案做成分子动画」「做一条视频讲 PEG 修饰脂质体」「照 PEG-cRGD 那条片子再做一个 Folate 的」；哪怕用户只贴了产品说明、说“做个视频”，也适用。机械 / 设备类视频不用本技能。
---

# 分子产品 3D 科普视频

把一段产品文案讲成一条 3D 动态科普片：观众看到分子真的嵌进膜里、PEG 链真的从线团伸成刷子、配体真的落进受体口袋，屏幕上的数字跟着画面一起变，而且是算出来的。

这套做法来自 DSPE-PEG-cRGD 的六版对比：2D 动态图形太简单，玻璃产品风格细节不够，anatomy（等轴测仪器隐喻）和 machine（写实机械实验台）只适合机器；**article-video 流水线 + Three.js 3D 层 + 剖切 + 公式读数**被用户认为最好（v6）。模板就是 v6 的完整工程，可以直接跑通。

## 依赖

- 已安装 **article-video** skill（`~/.claude/skills/article-video`）：配音 `tts.py`、时间轴 `timeline.py`、配乐 `music.py`、渲染 `render.py`、验收 `check.py` 都用它的。先读它的 SKILL.md 和 `references/fields.md`、`script.md`、`sound.md`，`script.json` 字段与它完全相同。
- 工作区根目录的 `.venv`（numpy scipy pillow requests playwright）、ffmpeg、`.env` 里的 `VOLC_TTS_KEY`（不要回显）。
- macOS 上 render.py 用 `--use-angle=metal` 走 GPU：空闲的 M 系列 Mac、5 个 worker 约 0.07 秒/帧（90 秒成片约 3 分钟）；机器上同时有别的渲染时约 0.15–0.2 秒/帧，相应减少 `--workers`。

```bash
PY=<工作区>/.venv/bin/python; AV=~/.claude/skills/article-video/scripts; MV=~/.claude/skills/molecular-video
```

## 流程

### 1. 建项目、读材料

```bash
$MV/scripts/new_project.sh projects/<短名> [已有字体目录]
```

模板会带上 `script.example.json`、`reading.example.md`（PEG-cRGD 示例）和全部 3D 代码。把用户给的文案存进 `source/article.md`，结构式图片放进 `assets/structure.png`（场景 01 的结构卡用它）。没有结构式图片时不要留空：用 SVG 画一张示意结构卡（三段色块 + 简化化学式文字，如 `CH₃O-(CH₂CH₂O)ₙ-CO-O-NHS`、C18 双链 + P + PEG + 马来酰亚胺环），标“示意”。参考视频只看风格不照搬。

**先判断产品属于哪一族**，决定章节表（`references/camera-and-scenes.md`）和起点代码。模板（`assets/template/`）是脂质-PEG-配体（cRGD）的完整工程；另有两个跑通的完整示例可以直接拿场景代码改：`assets/examples/dspe-peg-mal/`（反应基团：偶联、pH 窗口、试剂瓶储存、SVG 示意结构卡 `structSchematic`）和 `assets/examples/mpeg-nhs/`（线性 PEG：蛋白 + 赖氨酸偶联、水解竞争、PEG 化、储存）。各示例的 `world3d.project.js` 只供参考，项目里用模板的 `world3d.js`（已合并它们的组件）。产品族：脂质-PEG-配体（cRGD、叶酸、生物素…）→ 标准表；脂质-PEG-反应基团（Mal、NHS、N₃…）→ 偶联 + pH 窗口表；线性 PEG 试剂（mPEG-X）→ 线性 PEG 表；其他 → 按“一章一个 3D 动作”自拟。

写 `reading.md`：一句话核心、三段（或几段）结构各自的作用、事实表（每条有原文出处）、原文没说清不能写的。细节可以不精准时也不要编造事实；示意图和估算数字在片尾注明“示意”。

### 2. 配音稿 → `script.json`

照 `script.example.json` 的结构写：封面 + intro（full）+ 按产品族的章节 + outro（full）。**场景数按目标时长定**（用户没给时长就按 90 秒）：90 秒 → 7 个场景、约 270–300 字；2 分钟 → 8–9 个场景、约 380 字（目录栏最多 8 章）。章节表比时长允许的多时，把“应用”并进 intro/outro，“先组装后偶联”并进偶联章。每个场景的 cues 选**画面要发生动作的词**（“嵌进”“伸展”“识别”“成键”），不要用带连字符或字母数字混排的产品名做 cue（TTS 时间戳对不上），产品名需要时配音写成“mPEG NHS”、字幕保留连字符。`$PY $AV/timeline.py check <秒数>` 查到干净，偏离目标超过 10 % 先删字再配音。用户没说“直接做”就把稿子贴出来确认（article-video 的确认节点 ①）。

主题：分子片默认深海蓝（示例 theme），`a` = 锚定段颜色、`accent` = 连接链颜色、`b` = 配体颜色——3D 分子直接用这三个色，换产品换色即可。

### 3. 配音、时间轴、配乐

```bash
$PY $AV/tts.py && $PY $AV/timeline.py && $PY $AV/music.py
```

### 4. 场景规划（写进 `brief.md`，不另出三方案）

先读 `references/camera-and-scenes.md`。每章填一行：**3D 动作**（这句话被“演”成什么）、**特写/剖切**（旁白点名细节的那一刻推近）、**读数**（这一章唯一的大数字和它的公式）。同一族产品（脂质-PEG-配体）沿用标准章节表，只换配体形状、颜色、文字和数字；不同族照表后面的改法。

### 5. 搭场景

需要时读 `references/components.md`（组件 API、图层、扩展新分子形状）和 `references/hud-model.md`（读数面板、公式库、诚实规则）。

- 模板里的场景 id 和 cue 名（`E('固定')` 等）同时出现在 `scenes.js`、`scenes3d.js`、`hud.js` 三个文件里；改了 `script.json` 的场景或关键词，三个文件一起改（`grep -n "E('" *.js`），否则页面报 `no cue`。
- 默认分子头：在 `scenes3d.js` 顶部写 `W3.molHead = 'mal'`（或 `'ring'`），所有 `new Mol()` 都用它；单个分子用 `new Mol(g, n, { head, anchor, own })` 覆盖。
- 查每个场景的 cue 时刻（挑静帧时间、写镜头）：`$PY -c "import json;[print(s['id'],s['start'],{k:round(v,1) for k,v in s.get('ev',{}).items()}) for s in json.load(open('timeline.json'))['scenes']]"`（时间是全片绝对秒）。
- SVG 标签、徽章建好后默认要隐藏（`op(x, 0)` 或在 update 里每帧设透明度）；只 build 不 update 的标签会以满透明度停在左上角。
- 新产品需要的部件先看 `W3.lib` 有没有（马来酰亚胺原子头、甲氧基端、多肽、蛋白、赖氨酸、水分子、成键、试剂瓶都已有）；新做的部件写成通用组件，做完补回本 skill 的模板和 `components.md`。
- `scenes3d.js`：每个场景 `build(g)` 建物体，`update(lt, E, beat, W)` 摆姿态、设镜头、导出 `this.pts`（给 SVG 标签）和 `this.hud`（给读数）。
- `scenes.js`：SVG 标签、结构卡、图标、冲击波，用 `P(this, 3D点)` 钉在 3D 物体上。
- `model.js` + `hud.js`：公式和每章读数（左栏玻璃卡）；`card` 字段可加浮层信息卡（反应式、条件、中间值，3–5 行 + 标签）。卡片 `pos` 是屏幕像素（宽约 470，x ≤ 1400 才不出右边），默认右上 `[1390, 110]`；章节特写镜头的主体放在右栏中下部，或把卡片移到右下 `[1390, 560]`。SVG 标签用舞台坐标（横屏章节：屏幕 x = 830 + 0.86·u）。`at` 必须由提示词时间算出。不同化学用各自的常数（NHS 酯水解是分钟到小时，磷脂酯键是年）。
- 改完先 `for f in *.js; do node --check $f; done`。

### 6. 静帧自检（至少两轮）

```bash
$PY $AV/render.py --still 3 6 13 18 27 31 34 38 42 53 55 57 63 72 78 84 89   # 按自己的时间轴挑：每个动作的开始、特写中、拉回后
```

看 `build/stills/sheet_16x9.jpg`，关键帧单独拼大图看。逐项查：主体在右栏内且不压字幕；特写里真的“对上了”（配体在受体杯里、尾巴在疏水核心里）；读数出现、数值合理、滑块值正确；片尾标题区干净；标签没有钉在被剖掉的部分上。踩过的坑见 `references/pitfalls.md`，遇到怪现象先查它。

封面 3D 图：`$PY $MV/scripts/cover3d.py <秒> <ax>`（秒 = 全片绝对时间，挑 intro 里载体最完整的一刻；ax ≈ 1500 把主体推到右边给标题留位）→ `assets/cover3d.png`，写进 `script.json` 的 `cover.image` 后重跑 `timeline.py`（`cover.image` 是写进 timeline.js 的；最好在第 3 步第一次跑 `timeline.py` 前就填好路径，图片后补）。

片尾按钮 `cta` 不要和品牌字样重复：科普片写“了解更多”“关注获取更多分子科普”之类，品牌放 `brand`。

### 7. 整片渲染与验收

```bash
$PY $AV/render.py --workers 5          # 放后台；空闲机器约 3 分钟 / 90 秒成片
$PY $AV/check.py                        # 响度、静止时长、字幕、抽帧拼图 build/check_16x9_*.jpg
```

看完全部抽帧拼图再交付；有问题改场景、重渲。

### 8. 汇报

成片路径、时长、大小、封面、SRT；每章的 3D 动作和读数一览表；**读数是模型估算**（列出每个数字和公式，请用户把关）；声音需要用户听（读音清单：分子名、数字、英文缩写）；已知不足。把本次新增的组件或踩到的新坑补进本 skill 的 references，下一个产品更快。

## 跳过与续做

- 用户说“直接做”：配音稿不确认，主题用示例深海蓝换三段颜色，横屏一版，合成配乐，汇报里列出替用户做的决定。
- “同一个产品再改一版”：复制项目目录到 `v<n>/`，`script.json` 的 `output` 改名，`build/vo/` 和 `build/mix.wav` 复用（台词不变就不重做配音）。
- 已有 `timeline.json` 和 `build/mix.wav` 就从第 4 步开始。
