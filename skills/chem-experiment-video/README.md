# chem-experiment-video

把一个化学实验讲成「原理 + 操作」的竖屏动画讲解短片（9:16，1.5–2.5 分钟）：浅色扁平矢量风格；机理在分子层面时，在宏观仪器和微观分子之间推拉切换；拟人的分子角色把机理演出来（氢键 = 握手、保留时间 = 赛跑计时）；一次只改一个变量；最后落到实验台上能用的规则，用选择题和三点小结收尾。带中文配音、烧录字幕和合成配乐。

做法来自对一条无配音竖屏化学片（「过柱子：为什么能分开？」）的逐镜头拆解：保留它的叙事骨架和视觉语言，补上它的缺点（没有配音、字幕被平台界面挡住、节奏不均、示意没有标注、没有安全提示、TLC 一处说法有误）。

## 依赖

| 依赖 | 用途 |
|---|---|
| [article-video](../../../promo-video/skills/article-video) skill，装在 `~/.claude/skills/article-video` | `timeline.py`、`music.py`、`render.py`、`check.py`、`tts.py` 的本体（本技能的 `tts.py`、`check.py` 是它们的包装版） |
| 工作区 `.venv`：numpy scipy pillow requests playwright | 渲染、混音、检查 |
| ffmpeg / ffprobe | 编码、检查 |
| `VOLC_TTS_KEY`（豆包语音 2.0），在环境变量或上层 `.env` | 配音和字级时间戳 |
| Noto Sans SC | `new_project.sh` 从 `~/.cache/chem-video/fonts`（或 math-video 的缓存）链接，没有就下载一次 |

## 用法

在 Claude Code 里说「做个视频讲柱层析为什么能分开」「把萃取的原理做成动画」之类的话，技能会触发。流程：精读写事实表 → 配音稿（确认）→ 配音、时间轴、配乐 → 分镜（确认）→ 逐场景制作 → 渲染、检查、独立审查。详见 `SKILL.md`。

## 目录

```
SKILL.md                  入口：原则、流程、迭代
assets/template/          index.html（浅色外框、比例尺、转场、字幕）、lib.js、chem.js（化学组件库）、scenes.js
assets/examples/         三条验证片（柱层析、萃取、重结晶）的 script.json、script.md、reading.md、brief.md、scenes.js
scripts/                  new_project.sh、tts.py、lint.py、check.py
references/               narrative.md、style.md、components.md、science.md、review.md
evals/evals.json          测试题
```

## 验证

`assets/examples/` 里是用本技能从头做出的三条验证片：`column-chromatography/`（柱层析，151 秒，13 个场景）、`extraction/`（萃取，132 秒，12 个场景）和 `recrystallization/`（重结晶，130 秒，12 个场景）。制作过程中发现并修进技能的问题见 `SKILL.md`（测验拆成两个场景、时间戳重试、`none` 转场、字幕折行）。
