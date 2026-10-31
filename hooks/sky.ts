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
  // By day the week's strip is a sandy cobbled road through town rather than the sea.
  const [k0, k1, kd] = tone === 'sea' ? [' class="k-wk0"', ' class="k-wk1"', ' class="k-wkdot"'] : ['', '', '']
  const fw = Math.max(0, (w * left) / 100)
  let tufts = ''
  // Blossoms dot the field still standing.
  for (let i = 0, px = x + 5; px < x + fw - 4; px += 11, i++) {
    tufts += `<circle cx="${px}" cy="${y + 3 + (i % 2) * 4}" r="${i % 3 === 0 ? 1.1 : 0.8}" fill="${bloom}" opacity="0.9"${kd}/>`
  }
  // Kiki's red bow rides the strip's edge.
  const sprout =
    fw > 6
      ? `<g transform="translate(${x + fw - 1} ${y + h / 2})"><g><animateTransform attributeName="transform" type="rotate" values="-8;8;-8" dur="2.4s" repeatCount="indefinite"/>
          <path d="M0 0 C -2 -4, -6 -4, -6 0 C -6 3, -2 2, 0 0 Z M0 0 C 2 -4, 6 -4, 6 0 C 6 3, 2 2, 0 0 Z" fill="${isLow ? '#9c2e33' : '#e0474c'}"/><circle r="1.3" fill="#b8323a"/></g></g>`
      : ''
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"${k0}/><stop offset="1" stop-color="${c2}"${k1}/></linearGradient>
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
// Every 10 to 15 minutes Lily, the white cat next door, trots in from the edge of the ribbon. Jiji turns to her,
// they touch noses, she rubs her head against his, they play at pouncing, a heart floats up, and she trots off.
// The next visit is planned ahead and drawn with a delayed start, so it plays on time between redraws. She is
// left out of the drawing until her visit is under LEAD_S away, so her walk doesn't animate unseen for minutes.

const VISIT_S = 16
/** More than the ribbon's 30-second redraw, so one redraw always lands inside it. */
const LEAD_S = 45
let nextVisit: number | null = null

/** Seconds until Lily's visit, negative once it has begun; a new one is planned 10 to 15 minutes out after each. */
function visitIn(now: number) {
  if (nextVisit === null || now - nextVisit > VISIT_S * 1000) nextVisit = now + (10 + Math.random() * 5) * 60_000
  return (nextVisit - now) / 1000
}

/** Call Lily over now, for `/meadow lily`: she sets off a moment later. */
export const callLily = (now: number) => {
  nextVisit = now + 1500
}

const r3 = (n: number) => Math.round(n * 1000) / 1000
const EASE = '0.42 0 0.58 1'

/**
 * SMIL timing over one visit, from [second, value, easing?] keys. Every move eases in and out unless a key names
 * its own curve, so nothing starts or stops dead.
 */
const track = (pts: [number, string | number, string?][], begin: number) =>
  `values="${pts.map(p => p[1]).join(';')}" keyTimes="${pts.map(p => r3(p[0] / VISIT_S)).join(';')}" calcMode="spline" keySplines="${pts
    .slice(1)
    .map(p => p[2] ?? EASE)
    .join(';')}" dur="${VISIT_S}s" begin="${r3(begin)}s"`

const fade = (pts: [number, number][], begin: number) => `<animate attributeName="opacity" ${track(pts, begin)}/>`
const move = (pts: [number, string, string?][], begin: number) =>
  `<animateTransform attributeName="transform" type="translate" additive="sum" ${track(pts, begin)}/>`
/** Squash and stretch, or a lean, about the paws at `ground`. */
const about = (type: 'scale' | 'rotate', ground: number, pts: [number, string | number][], begin: number, inner: string) =>
  `<g transform="translate(0 ${ground})"><g><animateTransform attributeName="transform" type="${type}" ${track(pts, begin)}/><g transform="translate(0 ${-ground})">${inner}</g></g></g>`

const HEART = 'M0 1.6 C -2.6 -0.2, -2.2 -2.6, 0 -1.2 C 2.2 -2.6, 2.6 -0.2, 0 1.6 Z'

/** Jiji sitting, with Lily's visit queued up: `enterX` is the ribbon's edge, from where Jiji sits. */
function jijiWithLily(begin: number, enterX: number) {
  const JG = 6 * 1.45 // Jiji's paws
  const LG = 6 * 1.3 // Lily's paws, in her own drawing
  const ly = r3(JG - LG)
  const at = (x: number, y = 0) => `${x} ${r3(ly + y)}`

  // Jiji: seated until she is near, then up on his feet and turned to her.
  const seated = `<g>${fade([[0, 1], [1.6, 1], [1.9, 0], [15, 0], [15.3, 1], [VISIT_S, 1]], begin)}${jiji(1.45)}</g>`
  const jijiSide = about(
    'rotate',
    JG,
    [[0, 0], [5.6, 0], [6, 4], [6.4, 1], [6.8, 4], [7.2, 0], [VISIT_S, 0]],
    begin,
    about(
      'scale',
      JG,
      [[0, '1 1'], [7.95, '1 1'], [8.15, '1.1 0.85'], [8.3, '0.92 1.1'], [8.55, '1.12 0.86'], [8.75, '1 1'], [9.2, '1 1'], [9.45, '1.1 0.86'], [9.6, '0.94 1.08'], [9.85, '1.1 0.88'], [10.05, '1 1'], [VISIT_S, '1 1']],
      begin,
      `<g transform="scale(-1 1)">${jijiProfile(1.45, 'stand')}</g>`,
    ),
  )
  const standing = `<g opacity="0">${fade([[0, 0], [1.6, 0], [1.9, 1], [15, 1], [15.3, 0], [VISIT_S, 0]], begin)}
    <g>${move([[0, '0 0'], [3.7, '0 0'], [4.2, '1 0'], [4.6, '1 0'], [5, '0 0'], [5.4, '0 0'], [5.8, '1 0'], [6.8, '1 0'], [7.2, '0 0'], [8.15, '0 0'], [8.35, '0 -5'], [8.55, '0 0'], [9.45, '0 0'], [9.65, '3 -4'], [9.85, '4 0'], [10.6, '0 0'], [VISIT_S, '0 0']], begin)}${jijiSide}</g></g>`

  // Lily: trots in and slows to a stop, boops his nose, rubs her head on his, springs at him, hops back from his
  // answer, then turns and trots off, gathering speed.
  const walking = jijiProfile(1.3, 'walk', LILY)
  const lilyPoses = `<g opacity="0">${fade([[0, 1], [3, 1], [3.3, 0], [VISIT_S, 0]], begin)}${walking}</g>
    <g opacity="0">${fade([[0, 0], [3, 0], [3.3, 1], [12, 1], [12.25, 0], [VISIT_S, 0]], begin)}${jijiProfile(1.3, 'stand', LILY)}</g>
    <g opacity="0">${fade([[0, 0], [12, 0], [12.25, 1], [VISIT_S, 1]], begin)}<g transform="scale(-1 1)">${walking}</g></g>`
  const lily = `<g>${move(
    [
      [0, at(enterX)], [3.2, at(34), '0.25 0.6 0.4 1'], [3.6, at(34)], [4.2, at(31)], [4.6, at(31)], [5, at(34)], [5.4, at(34)], [5.8, at(31.5)],
      [6.8, at(31.5)], [7.2, at(34)], [7.7, at(34)], [7.95, at(31, -6)], [8.2, at(30)], [9.5, at(30)], [9.75, at(33, -4)], [10, at(35)],
      [10.6, at(34)], [12.2, at(34)], [15.2, at(enterX), '0.55 0 0.8 0.5'], [VISIT_S, at(enterX)],
    ],
    begin,
  )}${about(
    'rotate',
    LG,
    [[0, 0], [5.6, 0], [5.9, -8], [6.2, -3], [6.5, -8], [6.8, -3], [7.2, 0], [7.75, 0], [7.9, 6], [8.1, -5], [8.3, 0], [9.6, 0], [9.75, 5], [10, 0], [VISIT_S, 0]],
    begin,
    about(
      'scale',
      LG,
      [[0, '1 1'], [7.4, '1 1'], [7.7, '1.1 0.86'], [7.85, '0.93 1.1'], [8.2, '1.12 0.87'], [8.4, '1 1'], [9.45, '1 1'], [9.6, '1.08 0.88'], [9.75, '0.95 1.06'], [10, '1.1 0.88'], [10.2, '1 1'], [VISIT_S, '1 1']],
      begin,
      lilyPoses,
    ),
  )}</g>`

  // A little heart pops where their noses meet, and a bigger one drifts up after they play.
  const boop = `<g transform="translate(17.5 -10)" opacity="0">${fade([[0, 0], [4.25, 0], [4.45, 1], [4.9, 1], [5.3, 0], [VISIT_S, 0]], begin)}
    <g><animateTransform attributeName="transform" type="scale" ${track([[0, 0], [4.25, 0], [4.5, 1.2], [4.7, 1], [VISIT_S, 1]], begin)}/><path d="${HEART}" transform="scale(1.3)" fill="#ff8fa8"/></g></g>`
  const drift = `<g transform="translate(18 -15)" opacity="0">${fade([[0, 0], [10.8, 0], [11.1, 1], [12.3, 1], [12.9, 0], [VISIT_S, 0]], begin)}
    ${move([[0, '0 0'], [10.8, '0 0'], [11.4, '1.5 -2'], [12, '-1.2 -4'], [12.9, '1 -6'], [VISIT_S, '1 -6']], begin)}
    <path d="${HEART}" transform="scale(1.8)" fill="#ff8fa8"/></g>`

  return `${seated}${standing}${lily}${boop}${drift}`
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
    return visit > LEAD_S ? { svg: jiji(1.45), visit: null } : { svg: jijiWithLily(visit, enterX), visit }
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
    const aside = visit === null ? '' : fade([[0, 1], [1, 0], [15.2, 0], [VISIT_S, 1]], visit)
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
