import { HAIR, KIKI_RED, RAIN, SKIN, FONT } from './palette'

// Kiki, Jiji and the little things they carry, as SVG fragments centred on (0, 0).

/** Jiji, the black cat, with a moonlit rim so he reads on a dark sky. Awake he swishes his tail; asleep he curls up. */
export function jiji(s: number, opts: { asleep?: boolean } = {}) {
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
  return `<g transform="scale(${s})">
    <g><animateTransform attributeName="transform" type="rotate" values="-14 3 5;12 3 5;-14 3 5" dur="1.6s" repeatCount="indefinite"/>
      <path d="M3 5 C 8 4, 9 -1, 7 -4" stroke="#14131c" stroke-width="1.5" fill="none" stroke-linecap="round"/></g>
    <path d="M-3.5 6 C -4.5 1, -3 -2, 0 -2 C 3 -2, 4.5 1, 3.5 6 Z" fill="#14131c" ${rim}/>
    <circle cx="0" cy="-4.5" r="3.6" fill="#14131c" ${rim}/>
    <path d="M-3.3 -6.5 L-3.4 -10 L-1.2 -7.6 Z M3.3 -6.5 L3.4 -10 L1.2 -7.6 Z" fill="#14131c" ${rim}/>
    <ellipse cx="-1.4" cy="-4.8" rx="1.1" ry="1.3" fill="#fff"><animate attributeName="ry" values="1.3;1.3;0.15;1.3" keyTimes="0;0.9;0.95;1" dur="4s" repeatCount="indefinite"/></ellipse>
    <ellipse cx="1.4" cy="-4.8" rx="1.1" ry="1.3" fill="#fff"><animate attributeName="ry" values="1.3;1.3;0.15;1.3" keyTimes="0;0.9;0.95;1" dur="4s" repeatCount="indefinite"/></ellipse>
    <circle cx="-1.3" cy="-4.6" r="0.45" fill="#14131c"/><circle cx="1.5" cy="-4.6" r="0.45" fill="#14131c"/>
  </g>`
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
    <g transform="translate(-9 1.6) scale(0.55)">${jiji(1)}</g>
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
