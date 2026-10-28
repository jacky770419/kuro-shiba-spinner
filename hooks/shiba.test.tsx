import { expect, test } from 'claude-code/testing'

const spinner = (mode: string, message: string | null = null) =>
  ({
    plugin: 'kuro-shiba-spinner',
    component: 'Spinner',
    props: { word: 'Sauteing', message, suffix: '…', mode },
  }) as any

test('the shiba runs on desktop and counts tool calls', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.tool.call({ tool: 'Bash', command: 'pwd' })

  const ui = await $.ui.mount({ ...spinner('tool-use'), surface: 'desktop' })
  const svg = await ui.find({ type: 'Svg' })
  expect(svg?.props.alt).toMatch(/小黑柴跑步中：用工具/)
  expect(String(svg?.props.source)).toMatch(/dur="2.5s"/)
  expect((await ui.find({ type: 'Text', text: /🐾 2/ }))).toBeTruthy()
  await ui.unmount()
})

test('a new prompt resets the paw count, and a state message wins over the label', async ($, on) => {
  on('tool.call', () => ({ result: {} }))
  on('prompt.submit', (_: any, e: any) => ({ text: e.text }))
  await $.tool.call({ tool: 'Bash', command: 'ls' })
  await $.prompt.submit({ text: 'hi' } as any)

  const ui = await $.ui.mount({ ...spinner('thinking', 'Compacting'), surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /Compacting/ }))).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /🐾/ }))).toBeFalsy()
  await ui.unmount()
})

test('the terminal gets a text track', async ($, on) => {
  const ui = await $.ui.mount({ ...spinner('responding'), surface: 'terminal' })
  expect((await ui.find({ type: 'Text', text: /🐕/ }))).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /寫回覆/ }))).toBeTruthy()
  await ui.unmount()
})

test('desktop draws no stage words of its own, so the row does not say them twice', async ($, on) => {
  const ui = await $.ui.mount({ ...spinner('thinking'), surface: 'desktop' })
  expect(await ui.find({ type: 'Svg' })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /思考中/ })).toBeFalsy()
  await ui.unmount()
})
