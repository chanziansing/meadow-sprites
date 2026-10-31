import type { CacheFacts, Window } from '../types'
import { jiji } from './characters'
import { FONT, lookStyle } from './palette'
import { blinkStar } from './scenery'
import type { Look } from './palette'

// The sky ribbon over Koriko: how much of each usage window is left, drawn as
// strips that shrink as they are used (bakery bread for the day, the sea for the
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

/** Bakery bread for the day's window, the sea for the week's; a rose red once it runs low. */
const fieldOf = (kind: string, isLow: boolean): [string, string, string] =>
  isLow
    ? ['#f2b5b0', '#d97b74', '#fff3f0']
    : kind === 'five_hour'
      ? ['#f7d58e', '#e3a157', '#fff6d6']
      : ['#a9d6f2', '#3f7fb3', '#eaf6ff']

function bar(id: string, x: number, y: number, w: number, h: number, w8: Window) {
  const left = Math.max(0, Math.min(100, 100 - w8.percentUsed))
  const isLow = left < LOW_AT
  const [c1, c2, bloom] = fieldOf(w8.kind, isLow)
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
  list.forEach((w, i) => {
    body += `<g transform="translate(${x + 7} ${h / 2})">${iconOf(w.kind)}</g>`
    x += 18
    body += bar(`f${i}`, x, y, barW, barH, w)
    x += barW + 6
    const reset = resets[i] ?? ''
    if (reset) body += `<text x="${x}" y="${h / 2 + 3.6}" font-family="${FONT}" font-size="10.5" fill="${INK}" opacity="0.85" class="k-ink">${reset}</text>`
    x += textW(reset, 10.5) + 18
  })
  if (v) {
    const cx = width - cacheW + 12
    body += `<g transform="translate(${cx} ${v.mode === 'warm' ? h - 10 : h - 9})">${jiji(1.45, { asleep: v.mode === 'cold' })}</g>`
    body += `<text x="${cx + 18}" y="${h / 2 + 4}" font-family="${FONT}" font-size="11" font-weight="700" fill="${v.mode === 'warm' ? '#ff8f92' : '#9fb2ee'}" class="${v.mode === 'warm' ? 'k-warm' : 'k-cold'}">${cacheLabel}</text>`
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
      color: left < LOW_AT ? '#d97b74' : w.kind === 'five_hour' ? '#e3a157' : '#3f7fb3',
      reset: resetIn(w.resetsAt, now),
    }
  })
  const cache = v ? { icon: v.mode === 'warm' ? '🐈‍⬛' : '💤', text: cacheText(v), color: v.mode === 'warm' ? '#e0474c' : '#7f95c9' } : null
  return { bars, cache }
}
