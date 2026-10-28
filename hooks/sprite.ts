// 小黑柴：4 格奔跑 sprite sheet 轉成的像素影格（sprite-data.ts，每格 62×34）。
// 四格依序輪播＝換腿奔跑；整隻沿跑道平移，上下起伏保留自原圖。
import { SPRITE_COLORS, SPRITE_FRAMES } from './sprite-data'

export const SPRITE_W = SPRITE_FRAMES[0][0].length
export const SPRITE_H = SPRITE_FRAMES[0].length

const PX = 1

// 同一列相鄰同色的格子併成一條 rect：64×34 一格一個 rect 會超過 Svg 13 萬字元上限
const runs = (rows: string[], fillOf: (ch: string) => string | undefined) => {
  const out: string[] = []
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const fill = fillOf(row[x])
      let end = x + 1
      while (end < row.length && fillOf(row[end]) === fill) end++
      if (fill) out.push(`<rect x="${x * PX}" y="${y * PX}" width="${(end - x) * PX}" height="${PX}" fill="${fill}"/>`)
      x = end
    }
  })
  return out.join('')
}

// 黑毛在深色主題會跟背景糊在一起：輪廓外一格描一圈半透明淺色，淺色主題下幾乎看不出來
const outlineRows = (rows: string[]) => {
  const filled = (x: number, y: number) => !!SPRITE_COLORS[rows[y]?.[x] ?? '.']
  const out: string[] = []
  for (let y = -1; y <= rows.length; y++) {
    let line = ''
    for (let x = -1; x <= SPRITE_W; x++) {
      const edge = !filled(x, y) && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1))
      line += edge ? 'o' : '.'
    }
    out.push(line)
  }
  return out
}

const drawFrame = (rows: string[]) =>
  `<g transform="translate(-${PX} -${PX})" opacity="0.45">${runs(outlineRows(rows), ch => (ch === 'o' ? '#c9c2b6' : undefined))}</g>` +
  runs(rows, ch => SPRITE_COLORS[ch])

const FRAMES = SPRITE_FRAMES.map(drawFrame)

export const TRACK_WIDTH = 220

// 用 SMIL 讓 SVG 自己動，不靠計時器重畫，所以不會一直寫 state。
export function shibaSvg(lapSeconds: number): string {
  const h = SPRITE_H * PX + 4
  const stride = '0.44s'
  // 每格只在自己那 1/N 時段不透明：discrete 的 N 個值平均分配時間
  const frames = FRAMES.map((frame, i) => {
    const values = FRAMES.map((_, j) => (j === i ? 1 : 0)).join(';')
    return `<g opacity="${i === 0 ? 1 : 0}">${frame}<animate attributeName="opacity" values="${values}" dur="${stride}" calcMode="discrete" repeatCount="indefinite"/></g>`
  }).join('')
  const dust = [0, 1, 2]
    .map(
      i =>
        `<circle cx="${-2 - i * 5}" cy="${h - 4}" r="1.6" fill="#9a8f80" opacity="0">` +
        `<animate attributeName="opacity" values="0;0.7;0" dur="${stride}" begin="${i * 0.13}s" repeatCount="indefinite"/>` +
        `</circle>`,
    )
    .join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TRACK_WIDTH} ${h}" width="${TRACK_WIDTH}" height="${h}" shape-rendering="crispEdges">` +
    `<line x1="0" y1="${h - 1}" x2="${TRACK_WIDTH}" y2="${h - 1}" stroke="#8a8a8a" stroke-width="1" stroke-dasharray="3 3"/>` +
    `<g>` +
    `<animateTransform attributeName="transform" type="translate" from="-${SPRITE_W * PX + 16} 0" to="${TRACK_WIDTH} 0" dur="${lapSeconds}s" repeatCount="indefinite"/>` +
    dust +
    frames +
    `</g></svg>`
  )
}

// 終端機沒有 Svg：文字跑道，位置跟著工具呼叫次數前進
export function shibaText(steps: number, width = 24): string {
  const pos = steps % width
  const trail = [...Array(pos)].map((_, i) => (i % 3 === 2 ? '∴' : ' ')).join('')
  return trail + '🐕' + '·'.repeat(width - pos - 1)
}
