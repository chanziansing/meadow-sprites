import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { CacheFacts, Sprite, SpriteStatus, Window } from '../types'
import { BAND_H, bandSvg, bandText, bowSvg, headerSvg, iconSvg, statusWord, whatIs } from './koriko'
import { DUSK, KIKI_RED, LOOK_LABEL, NAVY, RAIN, ROOF, duskOf, fmtTime, hash, isLook, nextLook } from './palette'
import type { Look } from './palette'
import { SKY_H, cacheView, callLily, cleanWindows, skyAlt, skySvg, skyText } from './sky'
import { FLIGHT, LANDED } from './words'

// Kiki's Delivery Service for Claude Code. The hooks and state live here. The
// drawings: ./koriko (band and panel), ./sky (usage and cache ribbon), built from
// ./characters and ./scenery, in the colours and day and night looks of ./palette.

/** How often the sky redraws, so reset times and the warm-to-cold flip stay current. */
const SKY_TICK_MS = 30_000

type Ui = ReturnType<EngineInterface['ui']['resolve']>

// ---------- state ----------

const PANE = 'meadow'

// The atoms stay in this file: the validator checks each one where it is read.
// Change the tag when a sprite's fields change: it declines what an earlier version stored.
const sprites = atom({ plugin: 'meadow-sprites', key: 'sprites' } as const, [], { shape: 'sprites-1' })
const batch = atom({ plugin: 'meadow-sprites', key: 'batch' } as const, 0)
const dismissed = atom({ plugin: 'meadow-sprites', key: 'dismissed' } as const, -1)
const now = atom({ plugin: 'meadow-sprites', key: 'now' } as const, 0)
const autoOpened = atom({ plugin: 'meadow-sprites', key: 'autoOpened' } as const, false)
const windows = atom({ plugin: 'meadow-sprites', key: 'windows' } as const, [] as Window[])
const cache = atom({ plugin: 'meadow-sprites', key: 'cache' } as const, null as CacheFacts | null)
/** Day or night Koriko; kept in the plugin's store so the choice outlives the session. */
const look = atom({ plugin: 'meadow-sprites', key: 'look' } as const, 'auto' as Look)

async function setLook($: EngineInterface, next: Look) {
  await update($, look, () => next)
  await $.store.set('look', next)
}

async function addSprite($: EngineInterface, input: Omit<Sprite, 'batch' | 'startedAt' | 'status' | 'steps'>) {
  const at = await $.clock.now()
  const list = await read($, sprites)
  let b = await read($, batch)
  // A new route starts once every delivery of the last one is in.
  if (!list.some(s => s.status === 'running' && s.batch === b) && list.some(s => s.batch === b)) {
    b = await update($, batch, x => x + 1)
  }
  const sprite: Sprite = { ...input, status: 'running', startedAt: at, steps: 0, batch: b }
  await update($, sprites, l => [...l.filter(x => x.id !== sprite.id), sprite].slice(-120))
  await update($, now, () => at)
  if (!(await read($, autoOpened))) {
    await update($, autoOpened, () => true)
    void $.ui.open({ id: PANE, title: 'Deliveries' })
  }
}

async function settle($: EngineInterface, match: (s: Sprite) => boolean, status: SpriteStatus) {
  const at = await $.clock.now()
  let changed = false
  await update($, sprites, l =>
    l.map(s => {
      if (s.status !== 'running' || !match(s)) return s
      changed = true
      return { ...s, status, endedAt: at }
    }),
  )
  if (changed) await update($, now, () => at)
}

async function togglePane($: EngineInterface) {
  const isOpen = (await $.ui.panes()).some(p => p.id === PANE)
  if (isOpen) {
    await $.ui.close({ id: PANE })
    return false
  }
  const at = await $.clock.now()
  await update($, now, () => at)
  await $.ui.open({ id: PANE, title: 'Deliveries' })
  return true
}

// ---------- the module ----------

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const started = await next(e)
    await $.command.register({
      name: 'meadow',
      description: "Show or hide Kiki's delivery board of subagents and background tasks (`/meadow clear` clears the finished ones, `/meadow theme auto|light|dark` picks day or night, `/meadow lily` calls Lily over)",
    })
    // Ticks the clocks of deliveries in flight; quiet when none are out.
    $.clock.every(1000, () => {
      void (async () => {
        const list = await read($, sprites)
        if (!list.some(s => s.status === 'running')) return
        const at = await $.clock.now()
        await update($, now, () => at)
      })()
    })
    const saved = await $.store.get('look')
    if (isLook(saved)) await update($, look, () => saved)
    const u = await $.session.usage()
    await update($, windows, () => cleanWindows(u.rateLimits))
    $.clock.every(SKY_TICK_MS, () => $.ui.invalidate('ui.render'))
    return started
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('rateLimits')) await update($, windows, () => cleanWindows(e.rateLimits))
    if (e.changed.includes('context') && e.context.tokens && e.context.tokens > 0) {
      const tokens = e.context.tokens
      await update($, cache, c => (c ? { ...c, tokens } : c))
    }
    return next(e)
  })

  // A resumed or forked session knows how long it was away; a cleared or compacted one starts cold.
  on('classic.SessionStart', async ($, e, next) => {
    const r = await next(e)
    if (e.source === 'clear' || e.source === 'compact') {
      await update($, cache, () => null)
    } else if ((e.source === 'resume' || e.source === 'fork') && typeof e.seconds_since_last_response === 'number') {
      const lastAt = (await $.clock.now()) - e.seconds_since_last_response * 1000
      const model = typeof e.model === 'string' ? e.model : await $.session.model()
      const tokens = typeof e.context_tokens === 'number' ? e.context_tokens : 0
      await update($, cache, () => ({ lastAt, tokens, model }))
    }
    return r
  }).catch(($, e, next) => next(e)) // a band that fails to seed never holds up the session

  on('command.run', { command: 'meadow' }, async ($, e) => {
    const [verb, arg] = e.args.trim().split(/\s+/)
    if (verb === 'theme') {
      const cur = await read($, look)
      const next = isLook(arg) ? arg : nextLook(cur)
      await setLook($, next)
      return { text: next === 'auto' ? 'Koriko follows the app: day when it is light, night when it is dark.' : next === 'light' ? 'Koriko by day.' : 'Koriko by night.' }
    }
    if (verb === 'lily') {
      callLily(await $.clock.now())
      $.ui.invalidate('ui.render')
      return { text: 'Lily is on her way to see Jiji. She only comes while the cache is warm and Jiji is at home.' }
    }
    if (verb === 'clear') {
      await update($, sprites, l => l.filter(s => s.status === 'running'))
      return { text: 'Cleared the delivered parcels: only the ones in flight remain.' }
    }
    const isOpen = await togglePane($)
    return { text: isOpen ? 'The delivery board opens.' : 'The delivery board closes.' }
  })

  // Subagents, foreground or background.
  on('agent.spawn', async ($, e, next) => {
    const started = await next(e)
    if (started.deny !== undefined) return started
    await addSprite($, {
      id: started.agentId ?? e.tool_use_id,
      taskId: started.agentId,
      kind: 'agent',
      label: e.description || e.subagentType || 'a little errand',
      type: e.subagentType,
    })
    return started
  })

  // Each model request a subagent makes is one more step along the path.
  // Each request of the main thread warms the prompt cache, restarting its hour.
  on('turn.step', async function* ($, e, next) {
    const agentId = e.agentId
    if (!agentId) {
      const at = await $.clock.now()
      await update($, cache, c => ({ lastAt: at, tokens: c?.tokens ?? 0, model: c?.model ?? null }))
    }
    const result = yield* next(e)
    if (agentId) await update($, sprites, l => l.map(s => (s.taskId === agentId ? { ...s, steps: s.steps + 1 } : s)))
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const agentId = e.agentId
    if (agentId) {
      await settle($, s => s.taskId === agentId, e.reason === 'answer' ? 'home' : 'lost')
      return next(e)
    }
    const r = await next(e)
    const at = await $.clock.now()
    const u = await $.session.usage()
    const model = e.usage?.model || (await $.session.model()) || null
    await update($, cache, c => ({
      // turn.step stamps the exact request time; when no step of this turn did, the turn's end is the floor.
      lastAt: !c || at - c.lastAt > e.durationMs ? at : c.lastAt,
      tokens: u.context.tokens && u.context.tokens > 0 ? u.context.tokens : (c?.tokens ?? 0),
      model: model ?? c?.model ?? null,
    }))
    return r
  })

  // Background shell commands, started that way or moved there with Ctrl+B.
  on('tool.call', { tool: 'Bash' }, async ($, e, next) => {
    const ran = await next(e)
    const taskId = (ran as unknown as { result?: { backgroundTaskId?: string } }).result?.backgroundTaskId
    if (taskId) {
      const cmd = String(e.command ?? '')
      await addSprite($, {
        id: `shell-${taskId}`,
        taskId,
        kind: 'shell',
        label: String(e.description ?? '') || cmd.slice(0, 60) || 'a background chore',
        type: 'shell',
      })
    }
    return ran
  })

  on('tool.call', { tool: 'TaskStop' }, async ($, e, next) => {
    const ran = await next(e)
    const id = String((e as { task_id?: string; shell_id?: string }).task_id ?? (e as { shell_id?: string }).shell_id ?? '')
    if (id) await settle($, s => s.taskId === id, 'landed')
    return ran
  })

  // A new prompt picks Kiki's next words; a redraw of the same turn keeps them.
  let flight = 0

  // A background task reports back through a task notification.
  on('prompt.submit', async ($, e, next) => {
    flight += 1
    if (e.origin.kind === 'task-notification') {
      const id = /<task-id>([^<]+)<\/task-id>/.exec(e.text)?.[1]?.trim()
      const status = /<status>([^<]+)<\/status>/.exec(e.text)?.[1]?.trim()
      // Stopped on purpose (killed, or ended by a signal: exit code 128 and up) lands early; anything else failed.
      const code = Number(/exit code (\d+)/.exec(e.text)?.[1] ?? 0)
      const ending = status === 'completed' ? 'home' : status === 'killed' || status === 'stopped' || code >= 128 ? 'landed' : 'lost'
      if (id) await settle($, s => s.taskId === id, ending)
    }
    return next(e)
  })

  // ---------- Kiki's words for the spinner and the turn's last line ----------

  // Your own prompts, as letters for Kiki to carry: her navy dress, her red bow.
  // The terminal keeps its row: there the colour theme already paints it.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (e.surface === 'terminal' || e.props.origin.kind !== 'composer') return next(e)
    const ui: Ui = $.ui.resolve(e)
    if (!('Svg' in ui)) return next(e)
    const { Box, Text, Svg } = ui
    // By day the letter is cream paper; otherwise Kiki's navy dress.
    const isDay = (await read($, look)) === 'light'
    return (
      <Box flexDirection="column" backgroundColor={isDay ? '#fbf3e2' : NAVY} borderStyle="round" borderColor={KIKI_RED} paddingX={2} paddingY={1} gap={1}>
        <Box flexDirection="row" alignItems="center" gap={1}>
          <Svg source={bowSvg} alt="Kiki's red bow" width={26} height={18} isInteractive />
          <Text color={isDay ? '#c0392b' : '#f2b45a'} bold>
            a letter for delivery
          </Text>
        </Box>
        <Text color={isDay ? '#3a2f28' : '#f6ecd6'} wrap="wrap">
          {e.props.text}
        </Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Spinner' }, ($, e, next) => {
    const words = FLIGHT[e.props.mode] ?? FLIGHT.requesting
    const word = words[(hash(e.requestId) + flight) % words.length] ?? e.props.word
    // On the desktop a step's own words ("Creating notes.md") say more than ours do.
    if (e.surface === 'desktop' && e.props.word !== 'Working' && e.props.mode === 'tool-use') return next(e)
    return next({ ...e, props: { ...e.props, word } })
  })

  on('ui.render', { component: 'TurnDuration' }, ($, e, next) => {
    const word = LANDED[(hash(e.requestId) + flight) % LANDED.length] ?? e.props.word
    return next({ ...e, props: { ...e.props, word } })
  })

  // ---------- drawing ----------

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const at = await $.clock.now()
    const usage = await read($, windows)
    const cacheNow = cacheView(await read($, cache), at)
    const b = await read($, batch)
    const l = await read($, look)
    const list = (await read($, sprites)).filter(s => s.batch === b)
    const isBand = list.length > 0 && (await read($, dismissed)) !== b
    const isSky = usage.length > 0 || cacheNow !== null
    if (!isSky && !isBand) return next(e)

    // Other mods' bands go beneath these rows; Claude Code's own placeholder is never nested.
    const drawn = await Promise.resolve(next(e)).catch(() => null)
    const below = drawn && typeof drawn === 'object' && (drawn as { type?: string }).type !== 'engine' ? drawn : null

    const ui: Ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const label = bandText(list)
    const open = <Button key="meadow-open" label="📦 deliveries" plain onPress={() => void togglePane($)} />
    const hide = <Button key="meadow-hide" label="✕" plain role="dismiss" onPress={() => update($, dismissed, () => b)} />
    const flip = (
      <Button key="meadow-look" label={LOOK_LABEL[l]} plain onPress={() => setLook($, nextLook(l))} />
    )

    if (e.surface !== 'terminal' && 'Svg' in ui) {
      const { Svg } = ui
      const full = Math.max(220, Math.min(1600, (e.props.bodyColumns || 100) * 8 - 100))
      const width = Math.max(180, Math.min(1400, (e.props.bodyColumns || 100) * 8 - 300))
      return (
        <Box flexDirection="column" gap={1}>
          {isSky && (
            <Box key="sky" flexDirection="row" alignItems="center" gap={1}>
              <Svg source={skySvg(full, usage, cacheNow, at, l)} alt={skyAlt(usage, cacheNow, at)} width={full} height={SKY_H} isInteractive />
              {flip}
            </Box>
          )}
          {isBand && (
            <Box key="band" flexDirection="row" alignItems="center" gap={1}>
              <Svg source={bandSvg(width, list, l)} alt={`Deliveries: ${label}`} width={width} height={BAND_H} isInteractive />
              <Text color={duskOf(l)}>{label}</Text>
              {open}
              {hide}
              {!isSky && flip}
            </Box>
          )}
          {below}
        </Box>
      )
    }

    // Terminal: block bars for the sky, Kiki's route with her broom at its head for the deliveries.
    const sky = skyText(usage, cacheNow, at, e.props.bodyColumns >= 78 ? 10 : 6)
    const skyRow = isSky ? (
      <Box key="sky" flexDirection="row" gap={2}>
        {sky.bars.map((s, i) => (
          <Box key={`bar-${i}`} flexDirection="row" flexShrink={0}>
            <Text color={s.color}>{s.icon} </Text>
            <Text color={s.color}>{s.full}</Text>
            <Text color="#c9b98f">{s.empty}</Text>
            {s.reset ? <Text dimColor> {s.reset}</Text> : null}
          </Box>
        ))}
        {sky.cache && (
          <Box key="cache" flexDirection="row" flexShrink={0}>
            <Text>{sky.cache.icon} </Text>
            <Text color={sky.cache.color} bold>
              {sky.cache.text}
            </Text>
          </Box>
        )}
      </Box>
    ) : null

    let bandRow = null
    if (isBand) {
      const total = list.length
      const home = list.filter(s => s.status !== 'running').length
      const pathW = Math.max(8, Math.min(30, e.props.bodyColumns - 48))
      const filled = Math.round((home / total) * pathW)
      const isDone = home === total
      const path = '━'.repeat(filled) + (isDone ? '' : '🧹') + '┄'.repeat(Math.max(0, pathW - filled - (isDone ? 0 : 2)))
      bandRow = (
        <Box key="band" flexDirection="row" gap={1}>
          <Text color={KIKI_RED}>{isDone ? '🎀' : '🧹'}</Text>
          <Text color={KIKI_RED}>{path}</Text>
          <Text color={ROOF}>{isDone ? '⌂ all delivered' : '⌂'}</Text>
          <Text dimColor>{label}</Text>
          {open}
          {hide}
        </Box>
      )
    }
    return (
      <Box flexDirection="column">
        {skyRow}
        {bandRow}
        {below}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui: Ui = $.ui.resolve(e)
    const { Box, Text, Button } = ui
    const list = await read($, sprites)
    const l = await read($, look)
    const at = Math.max(await read($, now), ...list.map(s => s.startedAt), 0)
    const running = list.filter(s => s.status === 'running').reverse()
    const finished = list.filter(s => s.status !== 'running').reverse()
    const ordered = [...running, ...finished]
    const sweep =
      finished.length > 0 ? (
        <Button key="sweep" label={`📦 clear ${finished.length} delivered`} plain onPress={() => update($, sprites, l => l.filter(s => s.status === 'running'))} />
      ) : null

    const meta = (s: Sprite) => {
      const time = fmtTime((s.endedAt ?? at) - s.startedAt)
      const steps = s.kind === 'agent' && s.steps > 0 ? ` · ${'✉'.repeat(Math.min(s.steps, 6))}${s.steps > 6 ? `+${s.steps - 6}` : ''}` : ''
      return `${whatIs(s)} · ${statusWord(s.status)} · ${time}${steps}`
    }

    if (e.surface !== 'terminal' && 'Svg' in ui) {
      const { Svg } = ui
      const W = Math.max(220, Math.min(760, (e.props.bodyColumns || 40) * 8 - 8))
      return (
        <Box flexDirection="column" gap={1}>
          <Svg source={headerSvg(W, list, l)} alt={`Deliveries: ${running.length} in flight, ${finished.length} delivered`} width={W} height={100} isInteractive />
          {list.length === 0 && <Text dimColor>No deliveries yet. Each subagent or background task shows up here as a parcel Kiki carries.</Text>}
          {ordered.map(s => (
            <Box key={s.id} flexDirection="row" alignItems="center" gap={1}>
              <Svg source={iconSvg(s, at, l)} alt={`${s.label}: ${statusWord(s.status)}`} width={44} height={44} isInteractive />
              <Box flexDirection="column" flexShrink={1}>
                <Text bold={s.status === 'running'} dimColor={s.status !== 'running'} wrap="truncate-end">
                  {s.label}
                </Text>
                <Text color={s.status === 'lost' ? RAIN : duskOf(l)}>{meta(s)}</Text>
              </Box>
            </Box>
          ))}
          {sweep}
        </Box>
      )
    }

    const glyph = (s: Sprite) =>
      s.status === 'running' ? (s.kind === 'shell' ? '🍞' : '🧹') : s.status === 'home' ? '📦' : s.status === 'landed' ? '🏠' : '☂'
    const room = Math.max(1, (e.viewport?.rows ?? 24) - 4)
    return (
      <Box flexDirection="column">
        <Text bold color={KIKI_RED}>
          🎀 Kiki's Delivery Service
        </Text>
        <Text dimColor>
          {running.length} in flight · {finished.length} delivered
        </Text>
        {list.length === 0 && <Text dimColor>No deliveries yet. Jiji is napping.</Text>}
        {ordered.slice(0, room).map(s => (
          <Box key={s.id} flexDirection="row" gap={1}>
            <Text color={s.status === 'running' ? DUSK : s.status === 'home' ? KIKI_RED : RAIN}>{glyph(s)}</Text>
            <Text wrap="truncate-end" dimColor={s.status !== 'running'}>
              {s.label}
            </Text>
            <Text color={DUSK}>{meta(s)}</Text>
          </Box>
        ))}
        {sweep}
      </Box>
    )
  })
}
