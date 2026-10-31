import { HAIR, KIKI_RED, RAIN, SKIN, FONT } from './palette'

// Kiki, Jiji and the little things they carry, as SVG fragments centred on (0, 0).

/** Jiji, the black cat, with a moonlit rim so he reads on a dark sky. Awake he swishes his tail and now and then licks a paw; asleep he curls up. `jijiProfile` is the same cat seen from the side, for walking. */
export function jiji(s: number, opts: { asleep?: boolean; lick?: boolean } = {}) {
  const rim = 'stroke="#6f7bb8" stroke-width="0.45"'
  if (opts.asleep) {
    return `<g transform="scale(${s})">
      <g><animateTransform attributeName="transform" type="scale" values="1 1;1.03 0.97;1 1" dur="3.4s" repeatCount="indefinite"/>
        <path d="M-7 3 C -8 -3, -2 -5, 2 -4 C 6 -3.5, 8 -1, 7 3 Z" fill="#14131c" ${rim}/>
        <path d="M6 3 C 9 2, 9 -2, 6 -3" stroke="#14131c" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="-3.5" cy="-1.5" r="3.3" fill="#14131c" ${rim}/>
        <path d="M-6 -3.6 L-6.2 -7 L-4.2 -4.6 Z M-2.6 -4.6 L-1.2 -7 L-0.9 -3.6 Z" fill="#14131c" ${rim}/>
        <path d="M-5.3 -1.4 Q-4.6 -0.7 -3.9 -1.4 M-3 -1.4 Q-2.3 -0.7 -1.6 -1.4" stroke="#cfd3e6" stroke-width="0.5" fill="none"/>
      </g>
      <text x="2" y="-6" font-family="${FONT}" font-size="5" font-weight="700" fill="#aab4ea" class="k-z">z<animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 2;2 -2" dur="3s" repeatCount="indefinite"/></text>
    </g>`
  }
  const T = '0;0.5;0.56;0.62;0.68;0.74;0.8;1'
  // Every so often he stops to lick a paw: it comes up to his mouth, his head dips to meet it.
  const lick = opts.lick !== false
  const licking = lick
    ? `<animateTransform attributeName="transform" type="rotate" values="0 0 -1.5;0 0 -1.5;-10 0 -1.5;-10 0 -1.5;-10 0 -1.5;-10 0 -1.5;0 0 -1.5;0 0 -1.5" keyTimes="${T}" dur="9s" repeatCount="indefinite"/>`
    : ''
  const paw = lick
    ? `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 0;-1 -4.7;-0.3 -4.1;-1 -4.7;-0.3 -4.1;0 0;0 0" keyTimes="${T}" dur="9s" repeatCount="indefinite"/>
      <ellipse cx="2.2" cy="2.6" rx="0.9" ry="1.5" fill="#14131c" ${rim}/></g>
    <ellipse cx="0.3" cy="-3" rx="0.55" ry="0.4" fill="#e88aa0" opacity="0"><animate attributeName="opacity" values="0;0;1;0;1;0;0;0" keyTimes="${T}" dur="9s" repeatCount="indefinite"/></ellipse>`
    : ''
  return `<g transform="scale(${s})">
    <g><animateTransform attributeName="transform" type="rotate" values="-14 3 5;12 3 5;-14 3 5" dur="1.6s" repeatCount="indefinite"/>
      <path d="M3 5 C 8 4, 9 -1, 7 -4" stroke="#14131c" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>
    <path d="M-3.5 6 C -4.5 1, -3 -2, 0 -2 C 3 -2, 4.5 1, 3.5 6 Z" fill="#14131c" ${rim}/>
    ${paw}
    <g>${licking}
      <circle cx="0" cy="-4.5" r="3.6" fill="#14131c" ${rim}/>
      <path d="M-3.3 -6.5 L-3.4 -10 L-1.2 -7.6 Z M3.3 -6.5 L3.4 -10 L1.2 -7.6 Z" fill="#14131c" ${rim}/>
      <ellipse cx="-1.4" cy="-4.8" rx="1.1" ry="1.3" fill="#fff"><animate attributeName="ry" values="1.3;1.3;0.15;1.3" keyTimes="0;0.9;0.95;1" dur="4s" repeatCount="indefinite"/></ellipse>
      <ellipse cx="1.4" cy="-4.8" rx="1.1" ry="1.3" fill="#fff"><animate attributeName="ry" values="1.3;1.3;0.15;1.3" keyTimes="0;0.9;0.95;1" dur="4s" repeatCount="indefinite"/></ellipse>
      <circle cx="-1.3" cy="-4.6" r="0.45" fill="#14131c"/><circle cx="1.5" cy="-4.6" r="0.45" fill="#14131c"/>
    </g>
  </g>`
}

// ---------- Jiji from the side ----------
// A small, round Jiji: a big head with tall ears, one big white eye with a small black pupil, a short round body
// on short sturdy legs, and a thin tail carried high with a curl at the tip. Faces left, centred on (0, 0),
// paws on y = 6.

type Pt = [number, number]
const GROUND = 6
/** One full stride, in seconds: little quick steps. */
export const STEP_S = 0.42
const FRAMES = 12
const DUTY = 0.62
const r2 = (n: number) => Math.round(n * 100) / 100

/** The joint of a two-bone leg reaching from `root` to `foot`; `ahead` bends it toward his nose, else toward his tail. */
function joint(root: Pt, foot: Pt, a: number, b: number, ahead: boolean): Pt {
  const dx = foot[0] - root[0]
  const dy = foot[1] - root[1]
  const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), a + b - 0.01))
  const off = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))))
  const ang = Math.atan2(dy, dx) + (ahead ? off : -off)
  return [root[0] + a * Math.cos(ang), root[1] + a * Math.sin(ang)]
}

/** Where a paw is at phase `t` of the stride: planted and sliding back for most of it, then lifted and swung ahead. */
function pawAt(home: number, t: number, stride: number, lift: number): Pt {
  if (t < DUTY) return [home - stride / 2 + (stride * t) / DUTY, GROUND]
  const u = (t - DUTY) / (1 - DUTY)
  return [home + stride / 2 - (stride * (1 - Math.cos(Math.PI * u))) / 2, GROUND - lift * Math.sin(Math.PI * u)]
}

type Leg = { root: Pt; home: number; a: number; b: number; ahead: boolean; lift: number; phase: number; far: boolean }
// Front legs fold ahead at the wrist; hind legs have a round thigh and bend back at the hock. A cat walks in a
// lateral sequence: near hind, near fore, far hind, far fore, a quarter stride apart.
const LEGS: Leg[] = [
  { root: [-2.6, 1], home: -3, a: 2.5, b: 2.5, ahead: true, lift: 1.2, phase: 0.75, far: true },
  { root: [3.4, 0.6], home: 3.2, a: 2.8, b: 2.6, ahead: false, lift: 1.1, phase: 0.5, far: true },
  { root: [-3.4, 1.2], home: -3.8, a: 2.5, b: 2.5, ahead: true, lift: 1.2, phase: 0.25, far: false },
  { root: [4.2, 0.8], home: 4, a: 2.8, b: 2.6, ahead: false, lift: 1.1, phase: 0, far: false },
]
const STRIDE = 3.2
const bobAt = (t: number) => -0.3 * Math.cos(4 * Math.PI * t)

/** The two segments of a leg, plus a short paw pointing ahead. */
const legPaths = (root: Pt, paw: Pt, l: Leg): [string, string] => {
  const j = joint(root, paw, l.a, l.b, l.ahead)
  return [
    `M${r2(root[0])} ${r2(root[1])} L${r2(j[0])} ${r2(j[1])}`,
    `M${r2(j[0])} ${r2(j[1])} L${r2(paw[0])} ${r2(paw[1])} l-0.6 0`,
  ]
}

/** The colours a side-view cat is drawn in. */
export type Coat = { fur: string; rim: string; far: string; ear: string; eye: string; pupil: string; nose: string; bow?: string }
const JIJI: Coat = { fur: '#14131c', rim: '#6f7bb8', far: '#1d1c2a', ear: '#5d4f86', eye: '#fff', pupil: '#14131c', nose: '#d98a6a' }
/** Lily, the white cat next door: Jiji's sweetheart, with blue eyes and a pink bow. */
export const LILY: Coat = { fur: '#f6f2ea', rim: '#b4aed0', far: '#d8d2c6', ear: '#f2b5c4', eye: '#cfe3f5', pupil: '#2b3a5a', nose: '#f08aa0', bow: '#f07a9a' }
/** How far the moonlit rim shows past his outline. */
const EDGE = 0.8

const BODY = 'M-5 0.2 C -5 -2, -1.5 -2.6, 1.5 -2.4 C 4.5 -2.2, 6.2 -1.4, 6.2 0.8 C 6.2 3, 4.2 3.4, 1 3.4 C -2.5 3.4, -5 2.6, -5 0.2 Z'
const NECK = 'M-5.2 0 L-7 -1.5 L-4.2 -4 L-2.6 -1.8 Z'
const TAIL = 'M6 0 C 8.6 -0.4, 9.4 -3.4, 8.8 -5.6 C 8.4 -7, 9.4 -8, 10.4 -7.2'

/**
 * Jiji from the side. `walk` steps through a real walk cycle: each paw plants, slides back under him and swings
 * forward again, the joints bending as they would, while his back rises and dips twice a stride. `point` has
 * him stop with a front paw held out under his chin and an alarmed "!"; `stand` just stands. `coat` draws
 * another cat the same way: Lily in white.
 *
 * He is drawn twice, first in the rim colour and a little fatter, then in fur, so the moonlit edge runs round his
 * whole outline without seams where the parts meet.
 */
export function jijiProfile(s: number, pose: 'walk' | 'point' | 'stand', coat: Coat = JIJI) {
  const walk = pose === 'walk'
  const loop = (values: string[]) =>
    `<animate attributeName="d" values="${values.join(';')}" dur="${STEP_S}s" repeatCount="indefinite"/>`

  // Each leg as [upper, lower] paths and the animation for each.
  const legs = LEGS.map(l => {
    if (walk) {
      const frames = Array.from({ length: FRAMES + 1 }, (_, i) => {
        const t = i / FRAMES
        const root: Pt = [l.root[0], l.root[1] + bobAt(t)]
        return legPaths(root, pawAt(l.home, (t + l.phase) % 1, STRIDE, l.lift), l)
      })
      return { l, d: frames[0]!, anim: [0, 1].map(i => loop(frames.map(f => f[i]!))) }
    }
    if (pose === 'point' && !l.far && l.ahead) {
      // The paw he points with, tapping the air.
      const a = legPaths(l.root, [-9.8, 2.6], l)
      const b = legPaths(l.root, [-10.1, 1.9], l)
      return { l, d: a, anim: [0, 1].map(i => `<animate attributeName="d" values="${a[i]};${b[i]};${a[i]}" dur="0.6s" repeatCount="indefinite"/>`) }
    }
    return { l, d: legPaths(l.root, [l.home, GROUND], l), anim: ['', ''] }
  })
  const legSvg = (far: boolean, color: string, extra: number) =>
    legs
      .filter(x => x.l.far === far)
      .map(({ l, d, anim }) => {
        const [wu, wl] = l.ahead ? [2.3, 1.9] : [3.1, 1.9]
        return [0, 1]
          .map(i => `<path d="${d[i]}" stroke="${color}" stroke-width="${(i ? wl : wu) + extra}" stroke-linecap="round" fill="none">${anim[i]}</path>`)
          .join('')
      })
      .join('')

  const soft = 'calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"'
  // Walking, his back bobs with each step; standing, he just breathes.
  const bob = walk
    ? `<animateTransform attributeName="transform" type="translate" values="${Array.from({ length: FRAMES + 1 }, (_, i) => `0 ${r2(bobAt(i / FRAMES))}`).join(';')}" dur="${STEP_S}s" repeatCount="indefinite"/>`
    : pose === 'stand'
      ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -0.25;0 0" ${soft} dur="2.6s" repeatCount="indefinite"/>`
      : ''
  const nod = walk
    ? `<animateTransform attributeName="transform" type="rotate" values="-3 -5 -1;3 -5 -1;-3 -5 -1" dur="${STEP_S}s" repeatCount="indefinite"/>`
    : pose === 'stand'
      ? `<animateTransform attributeName="transform" type="rotate" values="-2 -5 -1;3 -5 -1;-2 -5 -1" ${soft} dur="3.4s" repeatCount="indefinite"/>`
      : `<animateTransform attributeName="transform" type="rotate" values="-7 -5 -1;-4 -5 -1;-7 -5 -1" dur="1.2s" repeatCount="indefinite"/>`
  const sway = `<animateTransform attributeName="transform" type="rotate" values="-6 6 0;8 6 0;-6 6 0" ${soft} dur="${pose === 'point' ? 0.6 : pose === 'stand' ? 1.9 : STEP_S * 2}s" repeatCount="indefinite"/>`

  // Everything that makes up his outline, in one colour: `extra` fattens strokes for the rim pass.
  const shape = (c: string, extra: number) => {
    const fill = `fill="${c}"${extra ? ` stroke="${c}" stroke-width="${extra}" stroke-linejoin="round"` : ''}`
    return `${legSvg(false, c, extra)}
    <g>${bob}
      <g>${sway}<path d="${TAIL}" stroke="${c}" stroke-width="${1.5 + extra}" fill="none" stroke-linecap="round"/></g>
      <path d="${BODY}" ${fill}/>
      <g>${nod}
        <path d="${NECK}" ${fill}/>
        <ellipse cx="-6.2" cy="-3.4" rx="3.7" ry="3.3" ${fill}/>
        <ellipse cx="-9.3" cy="-2.5" rx="1.3" ry="1.05" ${fill}/>
        <path d="M-8.6 -5.4 L-9 -9.2 L-6.4 -6.4 Z M-6 -6.6 L-4.6 -9.6 L-3.7 -5.6 Z" ${fill}/>
      </g>
    </g>`
  }
  // The eye, nose and inside of the near ear sit on top, moving with his head.
  const face = `<g>${bob}<g>${nod}
      <path d="M-8.3 -6 L-8.6 -8.3 L-7 -6.5 Z" fill="${coat.ear}"/>
      <ellipse cx="-7.7" cy="-3.8" rx="1.25" ry="1.6" fill="${coat.eye}"><animate attributeName="ry" values="1.6;1.6;0.15;1.6" keyTimes="0;0.9;0.95;1" dur="4s" repeatCount="indefinite"/></ellipse>
      <circle cx="-8.15" cy="-3.6" r="0.5" fill="${coat.pupil}"/>
      <circle cx="-10.55" cy="-2.9" r="0.35" fill="${coat.nose}"/>${coat.bow ? `
      <g transform="translate(-4.6 -6.4) rotate(20)"><path d="M0 0 L-2.2 -1.4 L-2 1.2 Z M0 0 L2.2 -1.4 L2 1.2 Z" fill="${coat.bow}"/><circle r="0.6" fill="${coat.bow}"/></g>` : ''}
    </g></g>`
  const alarm = pose !== 'point'
    ? ''
    : `<text x="-13" y="-6" font-family="${FONT}" font-size="6" font-weight="700" fill="#ff8f92">!<animateTransform attributeName="transform" type="translate" values="0 0;0 -1.2;0 0" dur="0.6s" repeatCount="indefinite"/></text>`

  return `<g transform="scale(${s})"><g opacity="0.5">${legSvg(true, coat.rim, EDGE)}</g>${legSvg(true, coat.far, 0)}${shape(coat.rim, EDGE)}${shape(coat.fur, 0)}${face}${alarm}</g>`
}

export const parcel = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-2.6" y="-2" width="5.2" height="4.2" rx="0.6" fill="#c9955b"/>
    <path d="M0 -2 V2.2 M-2.6 0 H2.6" stroke="${KIKI_RED}" stroke-width="0.8"/><path d="M0 -2 l-1.4 -1.2 M0 -2 l1.4 -1.2" stroke="${KIKI_RED}" stroke-width="0.6"/></g>`

/** Kiki on her broom, facing right, with Jiji behind her and a parcel hung at the front, in a soft moonlit halo. */
export function kiki(s: number, opts: { fly?: boolean; delay?: number; parcel?: boolean } = {}) {
  const d = opts.delay ?? 0
  const bob = opts.fly
    ? `<animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="1.6s" begin="${d}s" repeatCount="indefinite"/>`
    : ''
  const flutter = `<animateTransform attributeName="transform" type="skewX" values="0;-8;0" dur="0.5s" repeatCount="indefinite"/>`
  // Bristle sparkles trail behind the broom.
  const trail = opts.fly
    ? [0, 1, 2]
        .map(
          i =>
            `<circle cx="${-24 - i * 4}" cy="${3 + (i % 2) * 2}" r="${0.9 - i * 0.2}" fill="#fff4c2"><animate attributeName="opacity" values="0;0.9;0" dur="1.2s" begin="${i * 0.3}s" repeatCount="indefinite"/></circle>`,
        )
        .join('')
    : ''
  return `<g transform="scale(${s})"><g>${bob}
    <ellipse cx="-3" cy="-3" rx="18" ry="13" fill="url(#halo)"/>
    ${trail}
    <line x1="-15" y1="3" x2="11" y2="0" stroke="#a87048" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M-14 1.2 L-22 -1.4 L-23 3 L-22 7 L-14 4.6 Z" fill="#e0bd78"/>
    <path d="M-15 2 L-15 4.2" stroke="#a87048" stroke-width="1.6"/>
    ${opts.parcel === false ? '' : parcel(8.5, 4.4, 0.8)}
    <g transform="translate(-9 1.6) scale(0.55)">${jiji(1, { lick: false })}</g>
    <g><g transform="translate(-2 -1)">${flutter}<path d="M2 1 C -3 1, -7 -1, -9 -5 C -5 -5, -2 -6, 1 -7 Z" fill="#3d4470" stroke="#6f7bb8" stroke-width="0.4"/></g></g>
    <path d="M-1 2 L3 2 L4.6 -7 L-0.6 -7.6 Z" fill="#3d4470" stroke="#6f7bb8" stroke-width="0.4"/>
    <path d="M3 1.6 L5.5 4 M1.2 2 L2.6 5" stroke="${SKIN}" stroke-width="0.9" stroke-linecap="round"/>
    <path d="M5 3.6 l1.6 0.6 M2.2 4.6 l1.6 0.6" stroke="${KIKI_RED}" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="2.4" cy="-10.4" r="3.3" fill="${SKIN}"/>
    <path d="M-1.1 -9.6 C -1.6 -13.6, 4.6 -15.2, 5.8 -11.2 C 4.4 -12.2, 2 -12.4, 0.6 -11.4 C 0.4 -10.4, -0.2 -9, -1.1 -8 Z" fill="${HAIR}"/>
    <circle cx="3.9" cy="-10.6" r="0.5" fill="${HAIR}"/>
    <g transform="translate(1.6 -13.6)"><path d="M0 0 L-4.4 -2.6 L-3.6 2 Z M0 0 L4 -3.2 L3.8 1.6 Z" fill="${KIKI_RED}"/><circle r="0.9" fill="#b8323a"/></g>
  </g></g>`
}

/** The moonlit glow every drawing that holds Kiki defines once. */
export const HALO = `<radialGradient id="halo"><stop offset="0" stop-color="#fff4c2" stop-opacity="0.22"/><stop offset="1" stop-color="#fff4c2" stop-opacity="0"/></radialGradient>`

/** A pale seagull, wings beating: another delivery in flight. */
export function gull(s: number, delay: number) {
  return `<g transform="scale(${s})"><path d="M-6 0 Q-3 -3 0 0 Q3 -3 6 0" stroke="#d6dcf0" class="k-gull" stroke-width="1.4" fill="none" stroke-linecap="round">
    <animate attributeName="d" values="M-6 0 Q-3 -3 0 0 Q3 -3 6 0;M-6 -1 Q-3 1 0 0 Q3 1 6 -1;M-6 0 Q-3 -3 0 0 Q3 -3 6 0" dur="0.8s" begin="${delay}s" repeatCount="indefinite"/></path></g>`
}

/** A loaf of the bakery's bread, steam rising: a background chore baking. */
export function loaf(s: number) {
  const steam = [-3, 0, 3]
    .map(
      (x, i) =>
        `<path d="M${x} -6 q-1 -2 0 -4 q1 -2 0 -4" stroke="#e8e2f5" class="k-steam" stroke-width="0.8" fill="none" opacity="0"><animate attributeName="opacity" values="0;0.9;0" dur="2s" begin="${i * 0.6}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 2;0 -2" dur="2s" begin="${i * 0.6}s" repeatCount="indefinite"/></path>`,
    )
    .join('')
  return `<g transform="scale(${s})">${steam}
    <path d="M-8 4 C -9 -4, 9 -4, 8 4 Z" fill="#e3a157"/><path d="M-8 4 C -9 -4, 9 -4, 8 4 Z" fill="none" stroke="#b9763a" stroke-width="0.6"/>
    <path d="M-4 -1.5 l1.5 2 M0 -2.2 l1.5 2 M4 -1.5 l1.5 2" stroke="#f6d3a0" stroke-width="0.9" stroke-linecap="round"/></g>`
}

/** A delivered parcel with a red bow and a green stamp; `isFresh` stamps it as you watch, with a ring that ripples out. */
export function delivered(s: number, isFresh = false) {
  const stamp = isFresh
    ? `<g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.2s" begin="1.5s" fill="freeze"/>
        <circle r="2.4" fill="none" stroke="#7cc58a" stroke-width="0.6"><animate attributeName="r" values="2.4;6" dur="0.7s" begin="1.5s" fill="freeze"/><animate attributeName="opacity" values="1;0" dur="0.7s" begin="1.5s" fill="freeze"/></circle>`
    : '<g>'
  return `<g transform="scale(${s})">
    <ellipse cx="0" cy="7" rx="8" ry="1.3" fill="#000" opacity="0.25"/>
    <rect x="-7" y="-4" width="14" height="11" rx="1.4" fill="#c9955b"/>
    <path d="M0 -4 V7 M-7 1.5 H7" stroke="${KIKI_RED}" stroke-width="1.6"/>
    <g transform="translate(0 -4)"><path d="M0 0 L-4.4 -3 L-4 1.4 Z M0 0 L4.4 -3 L4 1.4 Z" fill="${KIKI_RED}"/><circle r="1.1" fill="#b8323a"/></g>
    <g transform="translate(4.4 4.6)">${stamp}<circle r="2.4" fill="#1d2a22" stroke="#7cc58a" stroke-width="0.7"/><path d="M-1 0 l0.8 0.8 l1.4 -1.6" stroke="#7cc58a" stroke-width="0.8" fill="none"/></g></g>
  </g>`
}

/** Kiki's broom set down against a parcel with a moon-blue stamp: a delivery called off, home safe and dry. */
export function landed(s: number, isFresh = false) {
  const pop = isFresh
    ? `<animateTransform attributeName="transform" type="scale" values="0;1.3;1" dur="0.4s" begin="1.1s" fill="freeze"/>`
    : ''
  return `<g transform="scale(${s})">
    <ellipse cx="0" cy="7" rx="9" ry="1.3" fill="#000" opacity="0.25"/>
    <g transform="rotate(-24 -4 6)">
      <line x1="-4" y1="6" x2="-4" y2="-9" stroke="#a87048" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M-5.8 6.5 L-6.6 -0.5 L-4 -1.5 L-1.4 -0.5 L-2.2 6.5 Z" fill="#e0bd78"/><path d="M-5.6 0 H-2.4" stroke="#a87048" stroke-width="1.1"/>
    </g>
    <rect x="-2" y="-1" width="10" height="8" rx="1.2" fill="#c9955b"/>
    <path d="M3 -1 V7 M-2 3 H8" stroke="#3d4470" stroke-width="1.3"/>
    <g transform="translate(6.6 5.2)"><g>${pop}<circle r="2.6" fill="#1f2840" stroke="#9fb2ee" stroke-width="0.7"/><path d="M1.4 -1.1 A1.5 1.5 0 1 0 1.4 1.1 A1.1 1.1 0 1 1 1.4 -1.1 Z" fill="#9fb2ee"/></g></g>
  </g>`
}

/** A small grey rain cloud: Kiki cannot fly in the rain. */
export function rainCloud(s: number) {
  const drops = [-4, 0, 4]
    .map(
      (x, i) =>
        `<line x1="${x}" y1="4" x2="${x - 0.8}" y2="7" stroke="${RAIN}" stroke-width="1.1" stroke-linecap="round"><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="translate" values="0 0;-1 5" dur="1.2s" begin="${i * 0.4}s" repeatCount="indefinite"/></line>`,
    )
    .join('')
  return `<g transform="scale(${s})">
    <g fill="#6f7a86"><circle cx="-5" cy="0" r="4"/><circle cx="0" cy="-3" r="5.2"/><circle cx="5" cy="0" r="4"/><rect x="-9" y="0" width="18" height="4" rx="2"/></g>
    <circle cx="-2" cy="-1" r="0.7" fill="#2b3036"/><circle cx="2" cy="-1" r="0.7" fill="#2b3036"/>
    <path d="M-1.2 1.6 Q0 0.8 1.2 1.6" stroke="#2b3036" stroke-width="0.6" fill="none"/>
    ${drops}
  </g>`
}
