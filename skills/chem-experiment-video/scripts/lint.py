"""Chemistry-specific checks on script.json, before TTS (stdlib only). Run after article-video's `timeline.py check`.

Usage (from the project dir): python <skill>/scripts/lint.py

PROBLEM (exit 1):
- no `role: hook` first scene, or its spoken text is over 30 characters (the hook must land within ~6 s)
- no `role: quiz` scene, it has fewer than 2 tail bars (the countdown needs ≥ 5 s on screen), or no `role: answer` right after it
- the last scene is not `role: takeaways`
- a hazardous reagent is named in the narration but script.json has no "safety" text
- schematic material (scene "schematic": true, or invented numbers) but "endnote" does not say 示意
- reading.md missing or without a 事实表 section
WARNING:
- no `role: dive` scene (no trip into the molecular scale — fine for a pure-procedure film, say why in brief.md)
- a stretch of more than 30 s between scenes with "pull" (ask / reveal / twist) after the hook
- max_chars over 16 (portrait subtitles wrap into two rows too often)
"""
import json, math, pathlib, re, sys

HAZARD = {
    "乙醚": "极易燃，远离明火，通风橱操作", "石油醚": "易燃，远离明火", "正己烷": "易燃", "己烷": "易燃",
    "丙酮": "易燃", "甲醇": "有毒、易燃", "乙醇": "易燃", "乙酸乙酯": "易燃", "二氯甲烷": "有毒，通风橱操作",
    "氯仿": "有毒，通风橱操作", "三氯甲烷": "有毒，通风橱操作", "甲苯": "易燃、有毒",
    "浓硫酸": "强腐蚀，酸入水", "浓硝酸": "强腐蚀、强氧化", "浓盐酸": "腐蚀、挥发", "氢氧化钠": "强腐蚀",
    "金属钠": "遇水剧烈反应", "过氧化氢": "强氧化", "高锰酸钾": "强氧化", "溴": "剧毒、腐蚀", "氢氟酸": "剧毒、强腐蚀",
}
# a hazard name inside a longer, different compound name is not that hazard (苯甲醇 is not 甲醇)
INSIDE = {"甲醇": ["苯甲醇"], "乙醇": ["苯乙醇"], "己烷": ["正己烷", "环己烷"], "溴": ["溴化", "溴代", "溴苯"]}
ROLES = {"hook", "phenomenon", "dive", "principle", "back", "variable", "practice", "quiz", "answer", "takeaways"}
CPS = 4.3


def spoken(s): return "".join(a for a, _ in s.get("lines", []))


def est_len(s, bpm, rate):
    B = 60 / bpm; BAR = 4 * B
    if not s.get("lines"): return s.get("bars", 0) * BAR
    w = len(re.sub(r"[^一-鿿A-Za-z]", "", spoken(s)))
    d = w / (CPS * (1 + rate / 100))
    return (math.ceil((2 * B + d + .5) / BAR) + s.get("tail_bars", 0)) * BAR


def main():
    sc = json.load(open("script.json")); scenes = sc["scenes"]; P, Wn = [], []
    roles = [s.get("role") for s in scenes]
    for s in scenes:
        if s.get("role") and s["role"] not in ROLES: P.append(f'{s["id"]}: unknown role "{s["role"]}" (use one of {sorted(ROLES)})')
    if roles[0] != "hook": P.append("first scene must be role: hook")
    elif len(re.sub(r"[，。？！；、\s]", "", spoken(scenes[0]))) > 30: P.append("hook narration over 30 characters — it must land in the first ~6 s")
    qz = [s for s in scenes if s.get("role") == "quiz"]
    if not qz: P.append("no role: quiz scene (the film ends on a question viewers can answer)")
    else:
        if qz[0].get("tail_bars", 0) < 2: P.append(f'{qz[0]["id"]}: quiz needs "tail_bars" ≥ 2 so the countdown stays ≥ 5 s')
        i = scenes.index(qz[0])
        if i + 1 >= len(scenes) or scenes[i + 1].get("role") != "answer": P.append("the quiz scene must be followed by a role: answer scene (reveal + explanation)")
    if roles[-1] != "takeaways": P.append("last scene must be role: takeaways (three points + next episode)")
    if "dive" not in roles: Wn.append("no role: dive scene — the film never shows the molecular scale")
    text = "".join(spoken(s) + "".join(b for _, b in s.get("lines", [])) for s in scenes)
    hz = sorted(k for k in HAZARD if k in text and text.count(k) > sum(text.count(w) for w in INSIDE.get(k, [])))
    if hz and not sc.get("safety"):
        P.append("hazardous reagents in the narration (" + "、".join(f"{k}：{HAZARD[k]}" for k in hz) + ') but no "safety" text in script.json')
    if (any(s.get("schematic") for s in scenes) or sc.get("schematic")) and "示意" not in sc.get("endnote", ""):
        P.append('schematic colours / numbers used but "endnote" does not say 示意')
    rd = pathlib.Path("reading.md")
    if not rd.exists(): P.append("reading.md missing (facts table first)")
    elif "事实表" not in rd.read_text(): P.append("reading.md has no 事实表 section")
    if sc.get("max_chars", 18) > 16 and "9:16" in sc.get("formats", ["9:16"]): Wn.append("max_chars > 16 — portrait subtitles will wrap often")
    bpm, rate = sc.get("bpm", 100), sc.get("rate", 0)
    t = sc.get("cover_bars", 1) * 240 / bpm; last = None; started = False
    for s in scenes:
        L = est_len(s, bpm, rate)
        if s.get("role") == "hook": started = True; last = t + L
        elif started and s.get("pull"):
            if last is not None and t - last > 30: Wn.append(f'{s["id"]}: {t - last:.0f}s since the last pull — add an ask / reveal / twist earlier')
            last = t + L
        t += L
    print(f"lint: {len(scenes)} scenes, roles {roles}, ~{t:.0f}s estimated, hazards: {'、'.join(hz) or 'none'}")
    for w in Wn: print("WARNING " + w)
    for p in P: print("PROBLEM " + p)
    sys.exit(1 if P else 0)


if __name__ == "__main__":
    main()
