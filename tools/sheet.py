"""把一列 N 格的 sprite sheet 轉成等大的像素影格。
步驟：邊緣 flood fill 去背 → 依空白欄切出每隻狗 → 全部用同一個縮放比例 → 以腳底對齊、以鼻尖（最右端）對齊 → 壓色票。
用法：python -I sheet.py <圖> <目標高度格數> <輸出 ts> <預覽 png> [容差]
"""
import sys
from collections import deque

from PIL import Image

src, target_rows, out_ts, out_png = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
TOL = int(sys.argv[5]) if len(sys.argv) > 5 else 16

img = Image.open(src).convert('RGB')
w, h = img.size
px = img.load()
bg = px[5, 5]


def dist(a, b):
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


is_bg = bytearray(w * h)
q = deque([(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)])
while q:
    x, y = q.popleft()
    i = y * w + x
    if is_bg[i] or dist(px[x, y], bg) > TOL:
        continue
    is_bg[i] = 1
    if x > 0: q.append((x - 1, y))
    if x < w - 1: q.append((x + 1, y))
    if y > 0: q.append((x, y - 1))
    if y < h - 1: q.append((x, y + 1))

# 依空白欄切格：連續 25 欄以上沒有前景就算分隔
col_has = [any(not is_bg[y * w + x] for y in range(h)) for x in range(w)]
spans, start, gap = [], None, 0
for x, has in enumerate(col_has + [False] * 30):
    if has:
        if start is None:
            start = x
        gap = 0
        end = x
    elif start is not None:
        gap += 1
        if gap > 25:
            spans.append((start, end))
            start = None
spans = [s for s in spans if s[1] - s[0] > 40]

boxes = []
for x0, x1 in spans:
    ys = [y for y in range(h) for x in range(x0, x1 + 1, 2) if not is_bg[y * w + x]]
    boxes.append((x0, min(ys), x1, max(ys)))

# 同一個縮放比例；垂直方向用共同基準線，保留原圖每格的上下起伏（騰空那格會浮起來）
top_all = min(b[1] for b in boxes)
bottom_all = max(b[3] for b in boxes)
cell = (bottom_all - top_all + 1) / target_rows
cols = max(round((b[2] - b[0] + 1) / cell) for b in boxes)

PALETTE = {
    'K': (34, 31, 38),
    'T': (190, 140, 86),
    'C': (234, 218, 190),
    'W': (252, 248, 240),
    'P': (214, 106, 122),
}
MATCH = dict(PALETTE, K2=(80, 72, 70), K3=(110, 72, 44))
ALIAS = {'K2': 'K', 'K3': 'K'}

frames = []
for x0, y0, x1, y1 in boxes:
    # 鼻尖對齊右緣；只取這一格自己的範圍，避免吃到隔壁那隻
    left = x1 + 1 - cols * cell
    top = top_all
    grid = []
    for r in range(target_rows):
        line = ''
        for c in range(cols):
            sx0, sx1 = int(left + c * cell), int(left + (c + 1) * cell)
            sy0, sy1 = int(top + r * cell), int(top + (r + 1) * cell)
            fg = [px[x, y] for y in range(max(0, sy0), min(sy1, h)) for x in range(max(x0, sx0), min(sx1, x1 + 1)) if not is_bg[y * w + x]]
            total = max(1, (sx1 - sx0) * (sy1 - sy0))
            if len(fg) / total < 0.45:
                line += '.'
                continue
            fg.sort(key=sum)
            med = fg[len(fg) // 2]
            best = min(MATCH, key=lambda k: dist(MATCH[k], med))
            line += ALIAS.get(best, best)
        grid.append(line)
    frames.append(grid)

out = [
    '// 由 4 格奔跑 sprite sheet 經 tools/sheet.py 轉出，請勿手改；要換圖就重跑轉檔。',
    '// K 黑毛  T 麻色  C 奶油  W 白  P 舌頭。每格等大，鼻尖對齊右緣、腳底對齊下緣。',
    'export const SPRITE_FRAMES: string[][] = [',
]
for g in frames:
    out.append('  [')
    out += [f"    '{r}'," for r in g]
    out.append('  ],')
out += [']', '', 'export const SPRITE_COLORS: Record<string, string> = {']
out += [f"  {k}: '#%02x%02x%02x'," % v for k, v in PALETTE.items()]
out += ['}', '']
open(out_ts, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))

scale = 8
prev = Image.new('RGB', ((cols + 2) * scale * len(frames), target_rows * scale), (38, 38, 36))
pp = prev.load()
for f, grid in enumerate(frames):
    ox = f * (cols + 2) * scale
    for r, line in enumerate(grid):
        for c, ch in enumerate(line):
            if ch == '.':
                continue
            for y in range(scale):
                for x in range(scale):
                    pp[ox + c * scale + x, r * scale + y] = PALETTE[ch]
prev.save(out_png)
print(len(frames), 'frames', cols, 'x', target_rows, 'boxes', boxes)
