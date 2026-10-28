# kuro-shiba-spinner

A Claude Code mod that replaces the "working" spinner with a pixel-art **black shiba inu (kuro shiba)** running across a dotted track while Claude works.

- 4-frame gallop cycle, drawn as an animated SVG (no timers, no redraw churn)
- Runs faster while tools are running, slower while thinking
- Shows `🐾 N`, the number of tool calls in the current turn; resets on each new prompt
- A soft outline keeps the black coat visible on dark themes
- The terminal, which cannot draw SVG, gets a text track: `∴  ∴  🐕······`

Requires a recent Claude Code (2.1.309 or newer) with function-hook mods.

## Install

At the prompt of a terminal session:

```
/plugin install kuro-shiba-spinner --marketplace jacky770419/kuro-shiba-spinner
```

From a shell:

```
claude plugin install kuro-shiba-spinner --marketplace jacky770419/kuro-shiba-spinner
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `jacky770419/kuro-shiba-spinner`, then **Add plugin**.

## Use your own sprite

`hooks/sprite-data.ts` is generated; do not edit it by hand. To swap in another dog (or any animal), draw a single-row sprite sheet with 2 to 6 frames, side view facing right, on a plain background, then run:

```
python -I tools/sheet.py <sheet.png> 34 hooks/sprite-data.ts preview.png
```

`tools/sheet.py` needs Pillow. It removes the background, splits the frames at the empty columns, scales them all by one factor, aligns the noses and keeps each frame's own bounce, and maps colors to a small palette.

## 中文說明

把 Claude Code 工作中的轉圈換成一隻在跑道上奔跑的像素小黑柴。用工具時跑得快、思考時跑得慢，旁邊的 `🐾 N` 是這一輪呼叫工具的次數。想換成自己的狗，照上面「Use your own sprite」準備一列 sprite sheet，跑 `tools/sheet.py` 即可。
