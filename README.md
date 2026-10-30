# chemical-videos

一组用来生成化学相关视频的 Claude Code skills。每个 skill 放在 `skills/` 下的独立目录里，带自己的 `SKILL.md`、模板、参考文档和脚本，可以单独安装使用。

## Skills

| Skill | 用途 |
|---|---|
| [`molecular-video`](skills/molecular-video/) | 把化学 / 生物材料产品（磷脂-PEG-配体、PEG 衍生物、脂质体、纳米载体等）的介绍文案做成 Three.js 3D 分子科普讲解视频，带中文配音、字幕和配乐，横屏 16:9，约 1–2 分钟 |
| [`chem-experiment-video`](skills/chem-experiment-video/) | 把一个化学实验（柱层析、TLC、萃取、重结晶……）做成「原理 + 操作」的竖屏动画讲解：浅色扁平风格，一尺镜在宏观仪器和微观分子之间推拉，拟人分子角色演机理，带中文配音、字幕和配乐，9:16，1.5–2.5 分钟 |

## 安装

克隆仓库后，把需要的 skill 软链到 `~/.claude/skills/`：

```bash
git clone git@github.com:springzh/chemical-videos.git
cd chemical-videos

# 安装单个 skill
ln -s "$(pwd)/skills/molecular-video" ~/.claude/skills/molecular-video

# 或者一次装全部
for d in skills/*/; do ln -s "$(pwd)/$d" ~/.claude/skills/"$(basename "$d")"; done
```

各 skill 的依赖（Python 环境、ffmpeg、TTS Key、依赖的其他 skill 等）见各自目录下的 `README.md`。

## 目录结构

```
chemical-videos/
├── README.md
├── .gitignore
└── skills/
    └── <skill-name>/
        ├── SKILL.md        # skill 入口：触发描述和完整流程
        ├── README.md       # 说明、依赖、用法
        ├── assets/         # 工程模板和示例
        ├── references/     # 参考文档
        ├── scripts/        # 辅助脚本
        └── evals/          # 测试题和检查项
```

## 新增 skill

1. 在 `skills/` 下新建目录，目录名与 `SKILL.md` frontmatter 里的 `name` 一致。
2. 写好 `SKILL.md` 和 `README.md`。
3. 在本文件的 Skills 表格里加一行。

## 约定

- 渲染产物（mp4、wav、帧图、字体等）和测试工作区不进仓库，见 `.gitignore`。
- API Key 等密钥只放 `.env`，不要提交。
- 片中的科学数字多为教科书模型估算，正式发布前请专业人员核对。
