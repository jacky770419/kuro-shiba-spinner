import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import { TRACK_WIDTH, shibaSvg, shibaText } from './sprite'

const tools = atom({ plugin: 'kuro-shiba-spinner', key: 'tools' } as const, 0)

// 階段 → 字＋跑一圈幾秒（用工具時跑最快）
const MODES = {
  thinking: { label: '思考中', lap: 6 },
  requesting: { label: '等回應', lap: 5 },
  responding: { label: '寫回覆', lap: 4 },
  'tool-input': { label: '備工具', lap: 3.5 },
  'tool-use': { label: '用工具', lap: 2.5 },
} as const

export const register: Register = on => {
  // 計數只是裝飾：寫 state 失敗也絕不能擋住提示或工具
  on('prompt.submit', async ($, e, next) => {
    await update($, tools, () => 0).catch(() => undefined)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('tool.call', async ($, e, next) => {
    await update($, tools, n => n + 1).catch(() => undefined)

    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const count = await read($, tools)
    const mode = MODES[e.props.mode] ?? MODES.thinking
    const words = e.props.message ?? mode.label
    const paws = count > 0 ? `　🐾 ${count}` : ''

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" gap={1}>
          <Text>{shibaText(count)}</Text>
          <Text dimColor>
            {words}
            {paws}
          </Text>
        </Box>
      )
    }

    if (e.surface === 'desktop' || e.surface === 'vscode') {
      const { Box, Svg, Text } = $.ui.resolve(e)

      return (
        <Box flexDirection="row" gap={1} alignItems="center">
          <Svg source={shibaSvg(mode.lap)} alt={`小黑柴跑步中：${words}`} width={TRACK_WIDTH} isInteractive />
          {/* 桌面版這一列自己會顯示階段文字，這裡再寫一次就會出現兩個「思考中」 */}
          {count > 0 && <Text dimColor>🐾 {count}</Text>}
        </Box>
      )
    }

    return next(e)
  })
}
