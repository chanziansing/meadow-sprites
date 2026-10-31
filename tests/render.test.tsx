import { expect, mock, test } from 'claude-code/testing'

import { bandSvg } from '../hooks/koriko'
import { skySvg } from '../hooks/sky'

const ABOVE = {
  plugin: 'meadow-sprites',
  component: 'AbovePrompt',
  requestId: 'above',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const

test('the sky ribbon and the deliveries band draw on the desktop', async ($, on) => {
  on('command.register', () => ({ value: { command: 'meadow' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.usage', () => ({
    value: {
      rateLimits: [
        { kind: 'five_hour', percentUsed: 40, resetsAt: new Date(Date.now() + 7.2e6).toISOString() },
        { kind: 'seven_day', percentUsed: 20, resetsAt: new Date(Date.now() + 2.6e8).toISOString() },
      ],
      context: { tokens: 50000, window: 200000 },
    } as never,
  }))
  on('clock.now', () => ({ value: Date.now() }))
  on('clock.every', () => ({ value: undefined }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('agent.spawn', () => ({ model: 'claude-opus-5-5', agentId: 'a1' }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.agent.spawn({ subagentType: 'general-purpose', description: 'test delivery', prompt: 'x', tool_use_id: 't1' } as never)

  for (const surface of ['desktop', 'terminal'] as const) {
    const ui = await $.ui.mount({ ...ABOVE, surface })
    const label = await ui.find({ type: 'Text', text: /in flight/ })
    expect(label?.text).toContain('in flight')
    await ui.unmount()
  }
})

test('your message is a letter on the desktop', async ($, on) => {
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'meadow-sprites',
    component: 'UserMessage',
    requestId: 'm1',
    surface: 'desktop',
    props: { text: 'hello Kiki', origin: { kind: 'composer' }, isExpanded: true },
  } as never)
  expect((await ui.find({ type: 'Text', text: /hello Kiki/ }))?.text).toBe('hello Kiki')
  expect((await ui.find({ type: 'Text', text: /letter/ }))?.text).toContain('letter')
  await ui.unmount()
})

test('the spinner speaks Kiki', async ($, on) => {
  let seen = ''
  on('ui.render', ($, e) => {
    seen = String((e.props as { word?: string }).word)
    const { Text } = $.ui.resolve(e)
    return <Text>{seen}</Text>
  })
  const ui = await $.ui.mount({
    plugin: 'meadow-sprites',
    component: 'Spinner',
    requestId: 's1',
    surface: 'desktop',
    props: { word: 'Working', message: null, suffix: '…', mode: 'thinking' },
  } as never)
  expect(['Asking Jiji', 'Reading the map', 'Thinking it over at the bakery', 'Watching the clock tower']).toContain(seen)
  await ui.unmount()
})

test('Koriko draws by night, by day, or by the app on auto', () => {
  const sky = (look: 'auto' | 'light' | 'dark') => skySvg(400, [{ kind: 'five_hour', percentUsed: 30 }], null, Date.now(), look)
  expect(bandSvg(300, [], 'dark')).not.toContain('<style>')
  expect(bandSvg(300, [], 'light')).toContain('.k-sky0{')
  expect(sky('light')).not.toContain('prefers-color-scheme')
  expect(sky('auto')).toContain('@media (prefers-color-scheme: light)')
})

test('/meadow theme saves the look, and by day your letter is cream paper', async ($, on) => {
  mock.store(on)
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine</Text>
  })
  const ran = await $.command.run({ command: 'meadow', args: 'theme light', origin: { kind: 'composer' } } as never)
  expect(JSON.stringify(ran)).toContain('by day')
  const ui = await $.ui.mount({
    plugin: 'meadow-sprites',
    component: 'UserMessage',
    requestId: 'm2',
    surface: 'desktop',
    props: { text: 'hello by day', origin: { kind: 'composer' }, isExpanded: true },
  } as never)
  expect(JSON.stringify(await ui.find({ type: 'Box' }))).toContain('#fbf3e2')
  await ui.unmount()
})
