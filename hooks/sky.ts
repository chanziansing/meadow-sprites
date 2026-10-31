import type { CacheFacts, Window } from '../types'
import { LILY, jiji, jijiProfile } from './characters'
import { FONT, lookStyle } from './palette'
import { blinkStar } from './scenery'
import type { Look } from './palette'

// The sky ribbon over Koriko: how much of each usage window is left, drawn as
// strips that shrink as they are used (a traffic light for the session, the sea for the
// week), and the prompt cache as Jiji, awake for an hour after the last request
// and curled up asleep once it goes cold.

export type Mode = 'warm' | 'cold'

export const SKY_H = 34
export const TTL_MIN = 60
export const TTL_MS = TTL_MIN * 60 * 1000
const LOW_AT = 15
const INK = '#c9c3dd'

// Prices per million tokens: a cold cache re-writes the context at twice the
// input price, a warm one reads it back.
type Model = { id: string; input: number; read: number }
const MODELS: Model[] = [
  { id: 'fable', input: 10, read: 0.25 },
  { id: 'opus', input: 4, read: 0.2 },
  { id: 'sonnet', input: 2, read: 0.2 },
  { id: 'haiku', input: 0.5, read: 0.05 },
]

const ORDER: Record<string, number> = { five_hour: 0, seven_day: 1 }

export const cleanWindows = (list: readonly Window[]): Window[] =>
  list
    .map(w => ({ kind: w.kind, percentUsed: w.percentUsed, resetsAt: w.resetsAt }))
    .sort((a, b) => (ORDER[a.kind] ?? 9) - (ORDER[b.kind] ?? 9))

/** Clock style: 0:52, 2:02, and past a day 3d 5:12. */
export const fmtSpan = (ms: number): string => {
  const mins = Math.max(0, Math.round(ms / 60000))
  const hours = Math.floor(mins / 60)
  const clock = `${hours % 24}:${String(mins % 60).padStart(2, '0')}`
  return hours < 24 ? clock : `${Math.floor(hours / 24)}d ${clock}`
}

const resetIn = (iso: string | undefined, now: number): string => {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (Number.isNaN(ms)) return ''
  return ms <= 0 ? 'now' : fmtSpan(ms)
}

export type CacheView = { mode: Mode; idleMs: number; cost: number | null }

export const cacheView = (c: CacheFacts | null, now: number): CacheView | null => {
  if (!c || c.lastAt <= 0) return null
  const idleMs = Math.max(0, now - c.lastAt)
  const mode: Mode = idleMs >= TTL_MS ? 'cold' : 'warm'
  const m = MODELS.find(x => (c.model ?? '').toLowerCase().includes(x.id))
  const cost = m && c.tokens > 0 ? (c.tokens / 1e6) * (mode === 'cold' ? m.input * 2 : m.read) : null
  return { mode, idleMs, cost }
}

const cacheText = (v: CacheView) =>
  v.mode === 'warm'
    ? fmtSpan(Math.max(0, TTL_MIN - Math.floor(v.idleMs / 60000)) * 60000)
    : `${fmtSpan(v.idleMs)}${v.cost !== null ? ` · $${v.cost.toFixed(2)}` : ''}`

/** Words for a reader that cannot see the drawing. */
export const skyAlt = (list: Window[], v: CacheView | null, now: number) => {
  const parts = list.map(w => {
    const left = Math.max(0, Math.round(100 - w.percentUsed))
    const reset = resetIn(w.resetsAt, now)
    return `${nameOf(w.kind)} ${left}% left${reset ? `, resets in ${reset}` : ''}`
  })
  if (v) parts.push(v.mode === 'warm' ? `cache warm, ${cacheText(v)} left` : `cache cold for ${cacheText(v)} next`)
  return parts.join('; ')
}

const nameOf = (kind: string) => (kind === 'five_hour' ? '5-hour' : kind === 'seven_day' ? '7-day' : kind.replace(/_/g, ' '))

// ---------- little drawings, centred on (0, 0) ----------

const clock = `<g><circle r="5.6" fill="#fffaf0" stroke="#8a6d4b" stroke-width="1"/>
  <line x1="0" y1="0" x2="0" y2="-3.8" stroke="#3a3350" stroke-width="0.9" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="10s" repeatCount="indefinite"/></line>
  <line x1="0" y1="0" x2="2.6" y2="0" stroke="#3a3350" stroke-width="0.9" stroke-linecap="round"/><circle r="0.7" fill="#c23b40"/></g>`

const moon = `<g><path d="M2 -5.5 A5.6 5.6 0 1 0 2 5.5 A4.4 4.4 0 1 1 2 -5.5 Z" fill="#f3e3a1" stroke="#d8c27a" stroke-width="0.5"/>
  <circle cx="4.5" cy="-4" r="0.7" fill="#fff"><animate attributeName="opacity" values="1;0.2;1" dur="2.6s" repeatCount="indefinite"/></circle></g>`

const parcelIcon = `<g><ellipse cx="0" cy="1.2" rx="3.4" ry="4" fill="#c98a4b"/><path d="M-4 -1 Q0 -5 4 -1 Z" fill="#7a5537"/><line x1="0" y1="-3.6" x2="0.6" y2="-5.4" stroke="#7a5537" stroke-width="0.8"/></g>`

const iconOf = (kind: string) => (kind === 'five_hour' ? clock : kind === 'seven_day' ? moon : parcelIcon)

// The session's strip is a traffic light: green with half or more left, yellow down to a fifth, red below.
const GREEN_AT = 50
const RED_AT = 20

type Tone = 'green' | 'yellow' | 'red' | 'sea'
/** The session's strip by how much is left; the week's is the sea until it runs low. */
const toneOf = (kind: string, left: number): Tone =>
  kind === 'five_hour'
    ? left >= GREEN_AT
      ? 'green'
      : left >= RED_AT
        ? 'yellow'
        : 'red'
    : left < LOW_AT
      ? 'red'
      : 'sea'

const FIELDS: Record<Tone, [string, string, string]> = {
  green: ['#b9e6a4', '#5fae5a', '#f0fbe8'],
  yellow: ['#f7e08e', '#e0b23e', '#fff8d6'],
  red: ['#f2b5b0', '#d97b74', '#fff3f0'],
  sea: ['#a9d6f2', '#3f7fb3', '#eaf6ff'],
}
const INKS: Record<Tone, string> = { green: '#5fae5a', yellow: '#e0b23e', red: '#d97b74', sea: '#3f7fb3' }

function bar(id: string, x: number, y: number, w: number, h: number, w8: Window) {
  const left = Math.max(0, Math.min(100, 100 - w8.percentUsed))
  const tone = toneOf(w8.kind, left)
  const isLow = tone === 'red'
  const [c1, c2, bloom] = FIELDS[tone]
  const fw = Math.max(0, (w * left) / 100)
  let tufts = ''
  // Blossoms dot the field still standing.
  for (let i = 0, px = x + 5; px < x + fw - 4; px += 11, i++) {
    tufts += `<circle cx="${px}" cy="${y + 3 + (i % 2) * 4}" r="${i % 3 === 0 ? 1.1 : 0.8}" fill="${bloom}" opacity="0.9"/>`
  }
  // Kiki's red bow rides the strip's edge.
  const sprout =
    fw > 6
      ? `<g transform="translate(${x + fw - 1} ${y + h / 2})"><g><animateTransform attributeName="transform" type="rotate" values="-8;8;-8" dur="2.4s" repeatCount="indefinite"/>
          <path d="M0 0 C -2 -4, -6 -4, -6 0 C -6 3, -2 2, 0 0 Z M0 0 C 2 -4, 6 -4, 6 0 C 6 3, 2 2, 0 0 Z" fill="${isLow ? '#9c2e33' : '#e0474c'}"/><circle r="1.3" fill="#b8323a"/></g></g>`
      : ''
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
      <clipPath id="${id}c"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}"/></clipPath></defs>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#2a2840" stroke="#433f5c" stroke-width="0.8" class="k-track"/>
    <g clip-path="url(#${id}c)"><rect x="${x}" y="${y}" width="${fw}" height="${h}" fill="url(#${id})"/>${tufts}</g>
    ${sprout}`
}

// ---------- the ribbon ----------

/** A few faint stars across the night ribbon. */
function twinkles(w: number, h: number) {
  let out = ''
  for (let i = 0, x = 40; x < w - 20; x += 53 + (i % 3) * 17, i++) {
    const y = 4 + ((i * 7) % Math.max(4, h - 8))
    out += blinkStar(x, y, i + 5)
  }
  return out
}

/** Width of the text a span takes, near enough for the layout: the mod can't measure text. */
const textW = (s: string, px: number) => s.length * px * 0.58

const WALKS = 3
const POINT_AT = 20
const SIT_S = 1.2
const POINT_S = 3.6

// When Jiji first saw a strip below POINT_AT. The ribbon is redrawn often, so this is how he knows how many
// of his walks are done, and picks the current one up where it was instead of starting over.
let lowSince: number | null = null

// ---------- Lily's visits ----------
// Every 10 to 15 minutes Lily, the white cat next door, trots in from the edge of the ribbon, plays with Jiji a
// few times and trots off again. The next visit is planned ahead and drawn with a delayed start, so it plays on
// time between redraws.

const VISIT_S = 13
const IN_S = 3
const OUT_S = 10
let nextVisit: number | null = null

/** Seconds until Lily's visit, negative once it has begun; a new one is planned 10 to 15 minutes out after each. */
function visitIn(now: number) {
  if (nextVisit === null || now - nextVisit > VISIT_S * 1000) nextVisit = now + (10 + Math.random() * 5) * 60_000
  return (nextVisit - now) / 1000
}

const r3 = (n: number) => Math.round(n * 1000) / 1000

/** SMIL timing over one visit, from [second, value] pairs. */
const track = (pts: [number, string | number][], begin: number) =>
  `values="${pts.map(p => p[1]).join(';')}" keyTimes="${pts.map(p => r3(p[0] / VISIT_S)).join(';')}" dur="${VISIT_S}s" begin="${r3(begin)}s"`

/** Jiji sitting, with Lily's visit queued up: `enterX` is the ribbon's edge, from where Jiji sits. */
function jijiWithLily(begin: number, enterX: number) {
  const stopX = 24
  // She pounces at him three times; he hops back, and on the last one they both jump and a heart floats up.
  const lily: [number, string][] = [[0, `${enterX} 1`], [IN_S, `${stopX} 1`]]
  for (const t of [3.6, 5.8, 8]) lily.push([t, `${stopX} 1`], [t + 0.45, `${stopX - 7} -3`], [t + 0.9, `${stopX} 1`])
  lily.push([OUT_S, `${stopX} 1`], [VISIT_S, `${enterX} 1`])
  const hop: [number, string][] = [[0, '0 0']]
  for (const t of [4.7, 6.9, 8.15]) hop.push([t, '0 0'], [t + 0.3, '0 -4'], [t + 0.6, '0 0'])
  hop.push([VISIT_S, '0 0'])
  const pose = (svg: string, on: number, flip = false) => {
    const vals = [0, 0, 0, 0]
    vals[on] = 1
    return `<g opacity="0"><animate attributeName="opacity" calcMode="discrete" ${track([[0, vals[0]!], [IN_S, vals[1]!], [OUT_S, vals[2]!], [VISIT_S, vals[3]!]], begin)}/>${flip ? `<g transform="scale(-1 1)">${svg}</g>` : svg}</g>`
  }
  const walking = jijiProfile(1.3, 'walk', LILY)
  const heart = `<g transform="translate(9 -14)" opacity="0">
      <animate attributeName="opacity" ${track([[0, 0], [8.3, 0], [8.6, 1], [10, 0], [VISIT_S, 0]], begin)}/>
      <animateTransform attributeName="transform" type="translate" additive="sum" ${track([[0, '0 0'], [8.3, '0 0'], [10, '0 -6'], [VISIT_S, '0 -6']], begin)}/>
      <path d="M0 1.6 C -2.6 -0.2, -2.2 -2.6, 0 -1.2 C 2.2 -2.6, 2.6 -0.2, 0 1.6 Z" transform="scale(1.8)" fill="#ff8fa8"/></g>`
  return `<g><animateTransform attributeName="transform" type="translate" ${track(hop, begin)}/>${jiji(1.45)}</g>
    <g><animateTransform attributeName="transform" type="translate" ${track(lily, begin)}/>
      ${pose(walking, 0)}${pose(jijiProfile(1.3, 'stand', LILY), 1)}${pose(walking, 2, true)}</g>${heart}`
}

/**
 * Jiji at his post. When a strip drops under POINT_AT he walks out along the ribbon, points at what is left of
 * it, and walks back, three times in all. The walk takes as long as the distance needs at a cat's pace, so his
 * paws don't skate.
 */
function jijiAt(v: CacheView, low: { left: number; edge: number } | null, cx: number, now: number, enterX: number) {
  if (v.mode === 'cold') return { svg: jiji(1.45, { asleep: true }), visit: null }
  const idle = () => {
    const visit = visitIn(now)
    return { svg: jijiWithLily(visit, enterX), visit }
  }
  if (!low) {
    lowSince = null
    return idle()
  }
  const dx = low.edge + 16 - cx
  if (dx > -30) return idle()
  lowSince ??= now
  const walkS = Math.max(2, Math.min(9, -dx / 24))
  const loopS = SIT_S * 2 + POINT_S + walkS * 2
  const elapsed = Math.max(0, (now - lowSince) / 1000)
  if (elapsed >= WALKS * loopS) return idle()
  const when = `begin="${-elapsed}s" dur="${loopS}s" repeatDur="${WALKS * loopS}s"`
  // Seated, out, pointing, back, seated. One pose shows at a time.
  const marks = [0, SIT_S, SIT_S + walkS, SIT_S + walkS + POINT_S, SIT_S + walkS * 2 + POINT_S, loopS]
  const K = `keyTimes="${marks.map(m => Math.round((m / loopS) * 1000) / 1000).join(';')}"`
  const pose = (svg: string, on: number, flip = false) => {
    const vals = [0, 0, 0, 0, 0, 0]
    vals[on] = 1
    if (on === 0) vals[4] = vals[5] = 1
    return `<g opacity="${vals[0]}"><animate attributeName="opacity" calcMode="discrete" values="${vals.join(';')}" ${K} ${when}/>${flip ? `<g transform="scale(-1 1)">${svg}</g>` : svg}</g>`
  }
  const walking = jijiProfile(1.45, 'walk')
  const svg = `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;${dx} 0;${dx} 0;0 0;0 0" ${K} ${when}/>
    ${pose(jiji(1.45), 0)}${pose(walking, 1)}${pose(jijiProfile(1.45, 'point'), 2)}${pose(walking, 3, true)}</g>`
  return { svg, visit: null }
}

export function skySvg(width: number, list: Window[], v: CacheView | null, now: number, look: Look = 'dark') {
  const h = SKY_H
  const barH = 10
  const y = (h - barH) / 2
  const cacheLabel = v ? cacheText(v) : ''
  const cacheW = v ? 32 + textW(cacheLabel, 11) + 10 : 0
  const resets = list.map(w => resetIn(w.resetsAt, now))
  const fixed = list.reduce((sum, _, i) => sum + 18 + 6 + textW(resets[i] ?? '', 10.5) + 18, 0)
  const barW = list.length ? Math.max(40, Math.min(240, (width - 16 - cacheW - fixed) / list.length)) : 0

  let x = 10
  let body = ''
  // The strip with least left, if any is under POINT_AT: Jiji walks to its edge.
  let low: { left: number; edge: number } | null = null
  list.forEach((w, i) => {
    body += `<g transform="translate(${x + 7} ${h / 2})">${iconOf(w.kind)}</g>`
    x += 18
    const left = Math.max(0, Math.min(100, 100 - w.percentUsed))
    if (left < POINT_AT && (!low || left < low.left)) low = { left, edge: x + (barW * left) / 100 }
    body += bar(`f${i}`, x, y, barW, barH, w)
    x += barW + 6
    const reset = resets[i] ?? ''
    if (reset) body += `<text x="${x}" y="${h / 2 + 3.6}" font-family="${FONT}" font-size="10.5" fill="${INK}" opacity="0.85" class="k-ink">${reset}</text>`
    x += textW(reset, 10.5) + 18
  })
  if (v) {
    const cx = width - cacheW + 12
    const { svg, visit } = jijiAt(v, low, cx, now, width + 16 - cx)
    body += `<g transform="translate(${cx} ${v.mode === 'warm' ? h - 10 : h - 9})">${svg}</g>`
    // The label steps aside while Lily is over it.
    const aside = visit === null ? '' : `<animate attributeName="opacity" ${track([[0, 1], [1.5, 0], [11.5, 0], [VISIT_S, 1]], visit)}/>`
    body += `<text x="${cx + 18}" y="${h / 2 + 4}" font-family="${FONT}" font-size="11" font-weight="700" fill="${v.mode === 'warm' ? '#ff8f92' : '#9fb2ee'}" class="${v.mode === 'warm' ? 'k-warm' : 'k-cold'}">${cacheLabel}${aside}</text>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}">${lookStyle(look)}
    <defs>
      <linearGradient id="skyb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1f2133" class="k-rib0"/><stop offset="1" stop-color="${v?.mode === 'cold' ? '#1e2640' : '#2e2235'}" class="${v?.mode === 'cold' ? 'k-rib1c' : 'k-rib1w'}"/></linearGradient>
    </defs>
    <rect width="${width}" height="${h}" rx="9" fill="url(#skyb)"/>
    <rect x="0.5" y="0.5" width="${width - 1}" height="${h - 1}" rx="9" fill="none" stroke="#3a3750" class="k-edge"/>
    ${twinkles(width, h)}
    ${body}
  </svg>`
}

/** The terminal's form: block bars, no dots. */
export function skyText(list: Window[], v: CacheView | null, now: number, cells: number) {
  const bars = list.map(w => {
    const left = Math.max(0, Math.min(100, 100 - w.percentUsed))
    const n = Math.round((left / 100) * cells)
    return {
      icon: w.kind === 'five_hour' ? '🕰' : w.kind === 'seven_day' ? '☾' : '📦',
      full: '▰'.repeat(n),
      empty: '▱'.repeat(cells - n),
      color: INKS[toneOf(w.kind, left)],
      reset: resetIn(w.resetsAt, now),
    }
  })
  const cache = v ? { icon: v.mode === 'warm' ? '🐈‍⬛' : '💤', text: cacheText(v), color: v.mode === 'warm' ? '#e0474c' : '#7f95c9' } : null
  return { bars, cache }
}
