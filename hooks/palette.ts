// Koriko's colours, the day and night looks, and small helpers every drawing shares.

export const KIKI_RED = '#e0474c'
export const NAVY = '#2b2f4a'
/** Light enough to read on the dark theme. */
export const DUSK = '#9aa6e0'
export const ROOF = '#d9874a'
export const RAIN = '#7fa9c9'
export const CREAM = '#f3ead8'
export const MUTED = '#b9b3d1'
export const SKIN = '#f6d7b8'
export const HAIR = '#3a2a22'
export const WALL = '#4a4462'
export const WALL_LIT = '#5b5270'
export const ROOFS = ['#a8473a', '#b8603f', '#8f3b30']
export const LAMP = '#ffd56b'
export const DARK_WIN = '#2a2840'
export const SEA_TOP = '#1f3d5a'
export const SEA_DEEP = '#162c43'
export const FONT = "'Nunito','Quicksand','Segoe UI Rounded','Segoe UI',sans-serif"

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  return h > 0 ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`
}

export const hash = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// ---------- day and night ----------

/** Which Koriko to draw: `auto` follows the light or dark the app reports, the others pin it. */
export type Look = 'auto' | 'light' | 'dark'
export const LOOKS: readonly Look[] = ['auto', 'light', 'dark']

// Koriko by day, laid over the night colours by class: a pale sky, the sun where
// the moon was, cream walls, a bright sea. The stars stay as golden glints.
const DAY: Record<string, string> = {
  'k-sky0': 'stop-color:#9fd3f0',
  'k-sky1': 'stop-color:#cfe9f7',
  'k-sky2': 'stop-color:#fbe9cf',
  'k-star': 'fill:#f2b134',
  'k-glow': 'fill:#fff1b8;opacity:0.5',
  'k-moon': 'fill:#ffcf4d',
  'k-cut': 'opacity:0',
  'k-sea0': 'stop-color:#6fb9df',
  'k-sea1': 'stop-color:#3f8fc0',
  'k-wave': 'stroke:#d8f0fb',
  'k-shore': 'stroke:#9fd0ea',
  'k-wall': 'fill:#f2e3c9',
  'k-lit': 'fill:#fff1d6',
  'k-win': 'fill:#8cbfe0',
  'k-bg': 'fill:#b9d3e3',
  'k-edge': 'stroke:#d9cdb8',
  'k-route': 'stroke:#3d4470;opacity:0.35',
  'k-gull': 'stroke:#5b6a8c',
  'k-title': 'fill:#2b2f4a',
  'k-sub': 'fill:#5a5f86',
  'k-steam': 'stroke:#b3a9c6',
  'k-z': 'fill:#5a6bb8',
  'k-ic-running': 'fill:#dcebf8;stroke:#7f95c9',
  'k-ic-home': 'fill:#fbe9e2',
  'k-ic-lost': 'fill:#e6ebf0;stroke:#8a9aab',
  'k-rib0': 'stop-color:#e9f5fc',
  'k-rib1w': 'stop-color:#fdeede',
  'k-rib1c': 'stop-color:#e3ecfb',
  'k-ink': 'fill:#3d3a52',
  'k-track': 'fill:#efe9df;stroke:#d6ccbb',
  'k-warm': 'fill:#c23b40',
  'k-cold': 'fill:#3f5fae',
}
const DAY_CSS = Object.entries(DAY)
  .map(([k, v]) => `.${k}{${v}}`)
  .join('')

/** The style block each drawing carries: none by night, the day colours pinned, or both by the app's light or dark. */
export const lookStyle = (look: Look) =>
  look === 'dark' ? '' : `<style>${look === 'auto' ? `@media (prefers-color-scheme: light){${DAY_CSS}}` : DAY_CSS}</style>`

export const LOOK_LABEL: Record<Look, string> = { auto: '◐ auto', light: '☀ day', dark: '☾ night' }
export const isLook = (v: unknown): v is Look => LOOKS.includes(v as Look)

/** Meta text: the night blue, a deeper blue by day, and the theme's own on auto, which follows light or dark. */
export const duskOf = (l: Look) => (l === 'light' ? '#4b5aa0' : l === 'dark' ? DUSK : 'suggestion')
export const nextLook = (l: Look): Look => LOOKS[(LOOKS.indexOf(l) + 1) % LOOKS.length] ?? 'auto'

export const EASE_OUT = '0.2 0.7 0.3 1'

/** A scatter in [0, 1) that is the same for the same inputs: neighbouring stars land far apart. */
export const scatter = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}
