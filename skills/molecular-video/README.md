# molecular-video

一个 Claude Code skill：把化学 / 生物材料产品的介绍文案做成 **3D 分子科普讲解视频**。适用产品包括磷脂-PEG-配体、PEG 衍生物、脂质体、纳米载体、荧光染料、多肽偶联物等。

成片包含：
- Three.js 程序化建模的脂质体、磷脂双层、三段式分子、受体、蛋白和试剂瓶；
- 剖切视图；
- 由公式实时计算的读数卡和浮层信息卡；
- 中文配音、烧录字幕和卡点配乐。

画幅为横屏 16:9，时长约 1–2 分钟。

这套做法来自 DSPE-PEG-cRGD 的六版对比：2D 动态图形、玻璃产品风格、等轴测仪器图（anatomy）、写实机械实验台（machine）、Three.js 3D 都试过，最后选定 Three.js 3D 版作为模板。之后又用 DSPE-PEG-Maleimide、mPEG-NHS 两个产品做了两轮完整测试来迭代。

## 依赖

- [Claude Code](https://claude.com/claude-code)
- **article-video** skill：配音、时间轴、配乐、渲染、验收这些脚本由它提供。要安装在 `~/.claude/skills/article-video`。
- Python 环境，需要 numpy、scipy、pillow、requests、playwright。
- ffmpeg 和 Chromium（Playwright）。macOS 上用 Metal GPU 渲染。
- 豆包语音 2.0 的 API Key，写在 `.env` 的 `VOLC_TTS_KEY` 里。不要把它提交进仓库。

## 安装

```bash
git clone git@github.com:springzh/molecular-video.git
ln -s "$(pwd)/molecular-video" ~/.claude/skills/molecular-video
```

## 使用

在 Claude Code 里直接说，例如：

- 「给 DSPE-PEG-Maleimide 做个科普视频，文案在 docs/mal.md」
- 「把这段产品文案做成分子动画」
- 「照 PEG-cRGD 那条片子再做一个 Folate 的」

Claude 会按 `SKILL.md` 的流程做：
1. 建项目；
2. 写配音稿；
3. 生成配音、时间轴和配乐；
4. 规划场景；
5. 搭 3D 场景；
6. 出静帧自检；
7. 渲染整片并验收；
8. 汇报。

也可以手动建项目：

```bash
~/.claude/skills/molecular-video/scripts/new_project.sh projects/<短名> [字体目录]
```

## 目录

| 路径 | 内容 |
|---|---|
| `SKILL.md` | skill 入口：触发描述和完整流程 |
| `assets/template/` | 完整工程模板，以 DSPE-PEG-cRGD 为例：`index.html`、`world3d.js`（3D 组件库）、`scenes3d.js`、`scenes.js`（SVG 标签层）、`model.js`、`hud.js`（读数卡 / 信息卡），以及 Three.js 打包文件 |
| `assets/examples/` | 两个跑通的完整示例：反应基团类 `dspe-peg-mal`，线性 PEG 类 `mpeg-nhs` |
| `references/components.md` | 3D 组件 API，以及怎么扩展到新的分子形状 |
| `references/camera-and-scenes.md` | 各产品族的章节表和镜头套路 |
| `references/hud-model.md` | 读数面板、公式库和诚实规则 |
| `references/pitfalls.md` | 踩过的坑和对应修法 |
| `scripts/new_project.sh` | 新建项目 |
| `scripts/cover3d.py` | 渲染 3D 封面图 |
| `evals/evals.json` | 端到端测试题和检查项 |

## 说明

- 片中的数字由教科书模型估算，比如 Flory 半径、Alexander–de Gennes 刷高、Tanford 链长、酯键水解、pKa 去质子比例。片中会标“示意 / 估算”，正式发布前请专业人员核对。
- 分子和载体都是示意模型，不是真实构象。
