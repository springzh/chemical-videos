---
name: chem-experiment-video
description: 把一个化学实验（柱层析 / 过柱子、TLC 薄层色谱、萃取 / 分液、重结晶、蒸馏、滴定、沉淀、显色反应等高中到本科的有机 / 无机 / 分析实验）讲成「原理 + 操作」的竖屏动画讲解短片：浅色扁平矢量风格，宏观仪器和微观分子之间用「一尺镜」推拉切换，用拟人的分子角色把机理演出来（氢键 = 握手、保留时间 = 赛跑计时），一次只改一个变量，最后落到实验台上能用的规则，以选择题 + 三点小结收尾；带中文配音、烧录字幕和配乐，默认 9:16，1.5–2.5 分钟。先精读写事实表和配音稿给用户确认，再用 HTML/SVG 组件逐帧渲染。只要用户想给一个化学实验、实验操作、实验原理做讲解视频、动画短片、科普视频、「一条视频看懂……」，就使用本技能，例如「做个视频讲柱层析为什么能分开」「把萃取的原理做成动画」「给重结晶做条抖音讲解」「TLC 怎么选展开剂，做个短视频」「照过柱子那条片子再做一期萃取」；哪怕用户只给了实验名称或一份实验讲义、说「做个视频」，也适用；在已有的化学实验视频项目上改稿、重渲，同样使用本技能。分子 / 材料产品的 3D 科普（脂质体、PEG 衍生物）用 molecular-video，数学题用 math-video。
---

# 化学实验讲解视频

把一个化学实验讲成一条 1.5–2.5 分钟的竖屏动画：先给出一个让人想问「为什么」的现象，再用「一尺镜」推进到分子尺度，让拟人的分子角色把机理演出来，然后拉回宏观对上看得见的结果，一次改一个变量，最后给出实验台上能直接用的规则，以一道选择题和三点小结收尾。

这套做法来自对一条优秀竖屏化学片（「过柱子：为什么能分开？」）的逐镜头拆解，以及对它缺点的修正。原片好在尺度切换清楚、角色化讲机理、一次一个变量、落到实操；缺点是没有配音、字幕被平台界面挡住、节奏不均、示意没有标注、没有安全提示。拆解和取舍见 `references/narrative.md` 末尾。

## 核心原则

- **现象 → 钻进去 → 演机理 → 拉回来 → 改变量 → 落到实操 → 测验、揭晓和小结。** 每个场景标一个 `role`（`references/narrative.md`），`lint.py` 会检查顺序。
- **尺度永远看得见。** 进出分子世界都要有套圈、推拉转场（`enter: 'zoomIn' / 'zoomOut'`）和标尺读数（scene `scale`）。观众始终知道自己在看 1 cm 还是 1 nm。
- **机理要演出来，不要贴字说明。** 被比较的两种物质各给一个名字里带着性质的角色（小非 / 小极）；起作用的基团是一只「手」；氢键是握手，保留时间是赛跑计时，溶剂强度是抢位置。动作清单见 `references/style.md`「标志性的动作」。
- **一次只改一个变量，每个结论落一条结论条。** 「极性越大 → 吸附越强 → 跑得越慢」，念到的那一刻落下，静音观看也能带走。
- **配色就是语义，全片锁定。** a 蓝 = 非极性 / 先出峰，b 绿 = 极性 / 被吸附，accent 橙 = 起作用的基团（`references/style.md`）。
- **科学准确，示意要标出来。** 每个数字都在 `reading.md` 的事实表里有出处；本来无色的物质上了色、计时是模拟的，就在画面上标「示意」，`endnote` 也写上；涉及危险试剂必须有安全角标（`references/science.md`）。
- **竖屏下方 25% 留给平台。** 字幕底边约在 70% 高度，y > 1440 不放重要内容。
- **配音讲，字幕辅助，画面一直在动。** 节拍网格驱动场景切换和动作；1 秒以上的静止画面不超过 5%。

## 依赖

- **article-video** skill（`~/.claude/skills/article-video`）：时间轴 `timeline.py`、配乐 `music.py`、渲染 `render.py` 直接用它的，配音 `tts.py` 用本技能的包装版，`script.json` 的基础字段和它相同（先读它的 `references/fields.md`、`script.md`、`motion.md`、`sound.md`）。本技能自带 `tts.py`（时间戳不全就重新提交）、`check.py`（它的包装版，换了舞台位置）、`lint.py`（化学专用检查）、页面模板和 `chem.js` 组件库。
- 工作区根目录的 `.venv`（numpy scipy pillow requests playwright），ffmpeg / ffprobe。
- `VOLC_TTS_KEY`（豆包语音 2.0），在 shell 环境变量或任意上层 `.env` 里；检查时只看有没有值，不要回显：`printenv VOLC_TTS_KEY >/dev/null && echo set`。没有 key 时只能用 Edge TTS，卡点只能估算，要告诉用户。

```bash
PY=<工作区>/.venv/bin/python; AV=~/.claude/skills/article-video/scripts; CV=~/.claude/skills/chem-experiment-video
```

所有脚本都在**项目目录**下运行。

## 流程

确认节点的规矩：要用户看的内容（读稿、方案）先写进回复正文，再调用 AskUserQuestion。用户说「直接做」「不用问我」时跳过所有确认节点，用默认值做完，在汇报里列出替用户做的决定。

### 1. 建项目、读材料

```bash
$CV/scripts/new_project.sh projects/<短名>      # 模板 index.html lib.js chem.js scenes.js + 字体链接
```

用户给的讲义、教材段落、参考视频存进 `source/`。参考视频先拆解（`ffmpeg` 抽帧拼图看画面；没有人声就别转写），只取知识点和例子，不照搬品牌名、角色名、原句和版式细节。

### 2. 精读 → `reading.md`

读 `references/science.md`，按它的模板写：受众、一句话核心、物质表（每种物质的真实颜色、角色昵称、画面颜色）、机理骨架、**事实表**、常见误解、安全、简化与示意、不能写的。用户没给材料时，按教材常识写，并在事实表的出处里注明「教材常识，待核对」。完成后用 3–5 行告诉用户核心原理、选了哪两个角色、变量是什么、有哪些需要核对的数字。

### 3. 配音稿 → `script.json`、`script.md`（确认节点 ①）

读 `references/narrative.md` 和 article-video 的 `references/script.md`。按场景角色排场景，每个场景写 `role`、`title`（中文标题，上屏）、`lines`、`cues`，中段标 `pull`；示意场景标 `"schematic": true`。顶层字段在 article-video `fields.md` 的基础上，本技能的默认值是：

```json
{"output": "<短名>", "formats": ["9:16"], "voice": "zh_male_liufei_uranus_bigtts", "rate": 0, "bpm": 100, "max_chars": 15,
 "brand": "有机化学实验 · EP01", "endnote": "颜色与数字为示意",
 "safety": ["石油醚、乙酸乙酯易燃，远离明火，在通风橱中操作"],
 "cover": {"lines": ["过柱子", "为什么能分开？"], "subtitle": "柱层析的原理", "en": "Column chromatography: why it separates", "kicker": "有机化学实验 · EP01", "art": "column"}}
```

`cover.art` 可选 `column` / `tlc` / `funnel` / `flask`。写完跑：

```bash
$PY $AV/timeline.py check <目标秒数>   # 时长、cue 顺序、标点对应、数字
$PY $CV/scripts/lint.py               # 角色顺序、钩子长度、测验倒计时、安全、示意、事实表、中段节拍
```

两者都干净后，把读稿（概要、正文按场景分段并加粗 cue、读音清单、说明）写进 `script.md`，在回复正文完整贴出，再请用户确认；确认后在 `script.md` 末尾写「已确认」。

### 4. 配音、时间轴、配乐

```bash
$PY $CV/scripts/tts.py && $PY $AV/timeline.py && $PY $AV/music.py
```

本技能的 `tts.py` 是 article-video `tts.py` 的包装版：豆包有时返回空的或缺一句的字级时间戳（实测一次 13 个场景里 12 个出问题），它会自动重新提交，直到时间戳覆盖每一个字；`timeline.py` 不再报「no usable word timestamps」才算好。总时长偏离目标超过 15% 就删改台词再重跑。字幕里一个数字被折成两行（「0.」「2–0.35」）时，只改字幕文本让这一句变短，配音不用重做。`timeline.py` 报 cue not found 时，把 cue 改成配音文本里的原样。配乐用合成的占位配乐，场景 `energy` 一般 1–2（讲解片不要太吵），结论场景可以 `lift`。

### 5. 分镜 → `brief.md`（确认节点 ②）

每个场景写一行：**画面主体**（哪个仪器 / 哪个微观视图）、**主动作**（这一句话被演成什么）、**落点**（哪个 cue 落下什么：结论条、标签、读数）、**尺度**（`scale`）、**转场**（`enter`）。给出一个最有代表性的场景（通常是 `principle` 的赛跑）的关键帧：先把那个场景写进 `scenes.js`，`$PY $AV/render.py --still <秒>` 出图，自己先看一遍再给用户看。风格是固定的（`references/style.md`），这里确认的是分镜，不是三套风格。

### 6. 逐场景制作

读 `references/components.md`（`chem.js` 的全部组件）、`references/style.md`，以及 article-video 的 `references/motion.md`。按场景顺序在 `scenes.js` 里写 `build` / `update`；模板自带 `quiz` / `answer`（同一张题卡，内容写在顶部的 `QUIZ` 里）、`outro`（三点小结 + 下期）和 `_cues`（草稿布局），它们只需要填内容。完整的参考写法在 `assets/examples/column-chromatography/`（本技能的验证片，12 个场景全都有）。

每写完一个场景：

```bash
$PY $AV/render.py --scene <id>          # 三张静帧 + build/stills/sheet_9x16_<id>.jpg
```

按 `references/review.md`「逐场景自检」看拼图，修好再写下一个。场景 id 和 cue 名同时出现在 `script.json` 和 `scenes.js` 里，改一边就要改另一边（`grep -n "E('" scenes.js`）。`build()` 里不要把元素存成保留名（`sc`、`div`、`cam`、`lay`、`full`、`i`、`anchor`）。

### 7. 渲染与验收

```bash
$PY $AV/render.py              # → <output>_9x16.mp4 + .cover.png；放后台跑，不要接管道
$PY $CV/scripts/check.py       # 技术参数、响度、静止时长、字幕、抽帧拼图 build/check_9x16_*.jpg
```

渲染耗时：浅色扁平画面很轻，空闲的 M 系列 Mac、5 个 worker 实测约 0.02 秒/帧（151 秒成片 1.8 分钟）。按 `references/review.md` 打分、派独立子代理审查，有问题改完整片重渲。每项 8 分以上、`check.py` 没有 PROBLEM 才交付。

### 8. 汇报

成片路径、时长、大小、封面、SRT、`brief.md`，附一张抽帧拼图；一张表写清楚检查过什么、怎么检查的（技术参数和响度看 `check.py`；画面看拼图并经独立审查；科学事实看 `reading.md` 事实表，另列需要核对的数字；**配音读音和配乐需要用户自己听**）；读音听检清单；示意和简化清单；已知不足。

## 跳过与续做

- 已有 `reading.md` 就不再精读；`script.md` 末尾有「已确认」就从第 4 步开始；`build/vo/` 的配音按指纹复用；已有 `brief.md` 就从第 6 步开始，`scenes.js` 里写好的场景保留。
- 「照 xx 那期再做一个 yy」：新建项目，从 `assets/examples/` 或往期项目复制 `scenes.js` 里能复用的场景（`quiz`、`outro`、一尺镜推进），其余重写。

## 迭代

| 改动 | 修改 | 重新运行 |
|---|---|---|
| 台词、读音、音色 | `script.json`（同步 `script.md`） | `tts.py` → `timeline.py` → `music.py` → `render.py` |
| cue、能量、音效 | `script.json` | `timeline.py` → `music.py` → `render.py` |
| 某个场景的画面 | `scenes.js` | `render.py --scene <id>` → `render.py` |
| 配色、封面、片尾 | `script.json` 的 `theme` / `cover` / `endnote` | `timeline.py` → `render.py` |
| 版式 | `index.html` 的 `LAY`（同步 `scripts/check.py` 的 `box`） | `render.py` |

## 文件

- `assets/template/index.html`：浅色外框——封面（`cover.art` 画仪器）、场景标题（中 + 英）、一尺镜标尺、转场（fade / zoomIn / zoomOut / none）、进度条、白底字幕；`LAY` 定义竖屏 / 横屏版式和平台安全区
- `assets/template/lib.js`：article-video 的工具库（弹簧、逐字、描线、箭头……），换成浅色语义配色
- `assets/template/chem.js`：化学组件——色谱柱、铁架台、收集管、滴管、TLC 板、检测器曲线、烧杯 / 烧瓶 / 试管、分液漏斗；分子角色、名牌、骨架式、硅胶表面、赛道、氢键；术语卡、结论条、标签、计时胶囊、比例滑条、图例、测验、小结、安全角标、示意小字、下期预告；封面插图
- `assets/template/scenes.js`：示例钩子、`quiz` / `answer`（共用 `QUIZ`）、`outro`、`_cues` 草稿布局
- `assets/examples/column-chromatography/`：验证片「过柱子：为什么能分开？」（151 秒、13 个场景）的 `script.json`、`script.md`、`reading.md`、`brief.md`、`scenes.js`：赛跑的走走停停（`racePos`）、跨场景接着演（`race` → `adsorb`）、一尺镜三级推进（`dive`）、色带流出和出峰同步（`back`）、溶剂抢位点（`solvent`）都可以直接复制改
- `scripts/new_project.sh`：建项目、复制模板、链接字体
- `scripts/lint.py`：化学专用的稿子检查
- `scripts/tts.py`：article-video `tts.py` 的包装版，字级时间戳不全时自动重新提交
- `scripts/check.py`：article-video `check.py` 的包装版（本技能的舞台位置）
- `references/narrative.md`：场景角色、中段留人、角色化、配音稿写法（化学式读法、多音字）、时长、钩子 / 测验 / 小结、原片缺点怎么补
- `references/style.md`：版式与安全区、语义配色、字体、角色与仪器、标志性的动作、运动
- `references/components.md`：`chem.js` API
- `references/science.md`：`reading.md` 模板、事实表、示意、安全、化学写法
- `references/review.md`：逐场景自检、评分表、独立审查提示
