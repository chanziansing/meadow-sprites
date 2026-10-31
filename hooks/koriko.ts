import type { Sprite, SpriteStatus } from '../types'
import { delivered, gull, HALO, kiki, jiji, landed, loaf, rainCloud } from './characters'
import { CREAM, EASE_OUT, FONT, KIKI_RED, LAMP, MUTED, ROOFS, esc, hash, lookStyle, scatter } from './palette'
import type { Look } from './palette'
import { bakery, byDay, clockTower, hills, house, moon, nightSky, shore, stars } from './scenery'

// Koriko, the seaside town of Kiki's Delivery Service, by night on Claude's dark
// theme and by day on the light one (see lookStyle): a starry sky, terracotta roofs with lit windows, the clock
// tower, a dark sea (green land and hills by day), and Kiki on her broom with Jiji, carrying parcels. Each
// subagent or background task is one delivery to one house along her route.

export const BAND_H = 44
/** How long Kiki takes to glide most of the way to the next house. */
const GLIDE_S = 24
/** How long a delivered row plays its arrival before it settles. */
export const ARRIVAL_MS = 4000

// ---------- the band above the prompt ----------

/**
 * Kiki's route: the bakery on the left, one house per delivery along the shore.
 * Delivered houses glow; Kiki glides from the last one she reached toward the
 * next, easing off as she nears it, so she is always on her way and never parked.
 */
export function bandSvg(w: number, list: Sprite[], look: Look = 'dark') {
  const h = BAND_H
  const total = list.length
  const done = list.filter(s => s.status !== 'running').length
  const running = list.filter(s => s.status === 'running')
  const isDone = total > 0 && running.length === 0
  const seaTop = h - 8
  const routeY = 14
  const start = 34
  const end = w - 18
  // At most 10 houses: past that, each house stands for several deliveries.
  const stopsN = Math.max(1, Math.min(10, total))
  const per = total / stopsN
  const stopX = (i: number) => start + ((end - start) * (i + 1)) / stopsN
  const reached = Math.floor(done / per + 1e-9)

  // Deliveries: one house per stop, lit once its parcels are in; the newest lights up as you watch.
  let houses = ''
  for (let i = 0; i < stopsN; i++) {
    const x = stopX(i) - 7
    const hh = 9 + Math.floor(scatter(i, 5) * 5)
    const light = i < reached - 1 ? 'lit' : i === reached - 1 ? 'lighting' : 'dark'
    houses += house(x, seaTop, 14, hh, light, ROOFS[i % ROOFS.length] as string)
    if (i === reached && !isDone) {
      // A red pin bobs over the house Kiki is heading for.
      houses += `<g transform="translate(${stopX(i)} ${seaTop - hh - 12})"><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="1.2s" repeatCount="indefinite"/>
        <path d="M0 4 L-2.4 0 A2.6 2.6 0 1 1 2.4 0 Z" fill="${KIKI_RED}"/><circle cy="-0.8" r="0.9" fill="#fff"/></g></g>`
    }
  }

  // Background rooftops between the delivery houses, unlit and smaller.
  let skyline = ''
  for (let x = start + 6, i = 0; x < end; x += 17, i++) {
    skyline += `<path d="M${x} ${seaTop} v-${4 + (i % 3) * 2} l4 -3 l4 3 v${4 + (i % 3) * 2} Z" fill="#2c2940" class="k-bg"/>`
  }

  const fromX = reached === 0 ? start - 6 : stopX(reached - 1)
  const toX = isDone ? stopX(stopsN - 1) : stopX(Math.min(stopsN - 1, reached))
  const glideTo = isDone ? toX : fromX + (toX - fromX) * 0.82
  const kikiY = routeY + 2

  const flock = running
    .slice(1, 4)
    .map((s, i) => `<g transform="translate(${-16 - i * 13} ${-6 + (i % 2) * 9})">${gull(0.6, (hash(s.id) % 8) / 10)}</g>`)
    .join('')
  const rider =
    total === 0
      ? ''
      : `<g transform="translate(${fromX} ${kikiY})">
          <animateTransform attributeName="transform" type="translate" values="${fromX} ${kikiY};${glideTo} ${isDone ? kikiY + 3 : kikiY}" dur="${isDone ? 1.6 : GLIDE_S}s" calcMode="spline" keySplines="${EASE_OUT}" keyTimes="0;1" fill="freeze"/>
          ${flock}${kiki(0.95, { fly: true, parcel: !isDone })}
        </g>`
  // When the last parcel is in, sparkles burst over the final house.
  const burst = isDone
    ? [0, 1, 2, 3, 4, 5]
        .map(i => {
          const a = (Math.PI * 2 * i) / 6
          return `<circle cx="${toX}" cy="${seaTop - 20}" r="1" fill="${i % 2 ? LAMP : '#ff8f92'}" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="1.4s" fill="freeze"/>
            <animateTransform attributeName="transform" type="translate" values="0 0;${(Math.cos(a) * 9).toFixed(1)} ${(Math.sin(a) * 9).toFixed(1)}" dur="1.2s" begin="1.4s" fill="freeze"/></circle>`
        })
        .join('')
    : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${lookStyle(look)}
    <defs>${nightSky('ksky')}${HALO}<clipPath id="kcard"><rect width="${w}" height="${h}" rx="10"/></clipPath></defs>
    <g clip-path="url(#kcard)">
      <rect width="${w}" height="${h}" fill="url(#ksky)"/>
      ${stars(w, h, Math.min(40, Math.floor(w / 18)), 3)}
      ${moon(Math.round(w * 0.62), 8, 4.5)}
      ${byDay(hills(w, seaTop, 16))}${skyline}${houses}${bakery(2, seaTop)}
      ${shore(w, seaTop, 8)}
      <path d="M${start - 6} ${routeY} H${end}" stroke="#fff" stroke-width="1" stroke-dasharray="2 4" opacity="0.28" class="k-route"/>
      ${rider}${burst}
    </g>
    <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="10" fill="none" stroke="#3a3750" class="k-edge"/>
  </svg>`
}

export function bandText(list: Sprite[]) {
  const total = list.length
  const done = list.filter(s => s.status !== 'running').length
  const flying = total - done
  if (flying === 0) return `all ${total} deliver${total === 1 ? 'y' : 'ies'} done`
  return `${done}/${total} delivered · ${flying} in flight`
}

// ---------- the panel ----------

export function headerSvg(w: number, list: Sprite[], look: Look = 'dark') {
  const h = 100
  const running = list.filter(s => s.status === 'running')
  const done = list.filter(s => s.status === 'home').length
  const lost = list.filter(s => s.status === 'lost').length
  const early = list.filter(s => s.status === 'landed').length
  const seaTop = h - 14
  const towerX = Math.min(w - 40, w * 0.8)
  let town = ''
  for (let i = 0, x = w * 0.35; x < w - 8; x += 15, i++) {
    if (Math.abs(x - towerX) < 12) continue
    town += house(x, seaTop, 11 + (i % 2) * 3, 10 + Math.floor(scatter(i, 6) * 9), i < done + 2 ? 'lit' : 'dark', ROOFS[i % ROOFS.length] as string)
  }
  // While deliveries are out Kiki crosses the sky, with a gull for each extra one.
  const flyer =
    running.length > 0
      ? `<g><animateTransform attributeName="transform" type="translate" values="-40 64;${w + 40} 50" dur="16s" repeatCount="indefinite"/>
          ${running
            .slice(1, 4)
            .map((s, i) => `<g transform="translate(${-26 - i * 14} ${-6 + (i % 2) * 8})">${gull(0.8, (hash(s.id) % 8) / 10)}</g>`)
            .join('')}
          ${kiki(1.3, { fly: true })}</g>`
      : ''
  const line =
    list.length === 0
      ? 'No deliveries yet. Jiji is napping.'
      : running.length === 0
        ? `Every parcel delivered · ${done}${early ? ` · ${early} landed early` : ''}${lost ? ` · ${lost} rained out` : ''}`
        : `${running.length} in flight · ${done} delivered${early ? ` · ${early} landed early` : ''}${lost ? ` · ${lost} rained out` : ''}`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${lookStyle(look)}
    <defs>${nightSky('hsky')}${HALO}<clipPath id="hcard"><rect width="${w}" height="${h}" rx="12"/></clipPath></defs>
    <g clip-path="url(#hcard)">
      <rect width="${w}" height="${h}" fill="url(#hsky)"/>
      ${stars(w, h, Math.min(50, Math.floor(w / 9)), 9)}
      ${moon(w - 26, 18, 8)}
      ${byDay(hills(w, seaTop, 30))}${town}
      ${clockTower(towerX, seaTop, 46)}
      ${shore(w, seaTop, 14)}
      <g transform="translate(${towerX - 22} ${seaTop - 3})">${jiji(1.1, { asleep: running.length === 0 })}</g>
      ${flyer}
      <text x="16" y="24" font-family="${FONT}" font-size="15" font-weight="700" fill="${CREAM}" class="k-title">Kiki's Delivery Service</text>
      <text x="16" y="41" font-family="${FONT}" font-size="11.5" fill="${MUTED}" class="k-sub">${esc(line)}</text>
    </g>
    <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="12" fill="none" stroke="#3a3750" class="k-edge"/>
  </svg>`
}

/**
 * One row's picture. A delivery that has just finished plays its arrival before it
 * settles: Kiki (or the loaf) flies off to the right, the parcel drops in with a
 * bounce and the stamp pops; one called off lands with the broom set down beside it; a failed one sinks as a
 * rain cloud rolls in.
 */
export function iconSvg(s: Sprite, at: number, look: Look = 'dark') {
  const size = 44
  const isFresh = s.status !== 'running' && s.endedAt !== undefined && at - s.endedAt < ARRIVAL_MS
  const flying =
    s.kind === 'shell' ? `<g transform="translate(0 4)">${loaf(1.6)}</g>` : `<g transform="translate(5 6)">${kiki(0.92, { fly: true, delay: (hash(s.id) % 10) / 10 })}</g>`
  let body: string
  if (s.status === 'running') {
    body = flying
  } else if (!isFresh) {
    body = s.status === 'home' ? `<g transform="translate(0 1)">${delivered(1.5)}</g>` : s.status === 'landed' ? landed(1.4) : rainCloud(1.4)
  } else if (s.status === 'landed') {
    body = `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 10" dur="0.9s" calcMode="spline" keySplines="${EASE_OUT}" keyTimes="0;1" fill="freeze"/>
        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.7;1" dur="0.9s" fill="freeze"/>${flying}</g>
      <g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.4s" begin="0.6s" fill="freeze"/>${landed(1.4, true)}</g>`
  } else if (s.status === 'home') {
    body = `<g><animateTransform attributeName="transform" type="translate" values="0 0;30 -22" dur="0.9s" calcMode="spline" keySplines="0.5 0 0.8 0.6" keyTimes="0;1" fill="freeze"/>
        <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.6;1" dur="0.9s" fill="freeze"/>${flying}</g>
      <g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.15s" begin="0.7s" fill="freeze"/>
        <animateTransform attributeName="transform" type="translate" values="0 -30;0 1;0 -4;0 1" keyTimes="0;0.55;0.78;1" dur="0.8s" begin="0.7s" calcMode="spline" keySplines="0.5 0 1 1;0 0 0.5 1;0.5 0 1 1" fill="freeze"/>
        ${delivered(1.5, true)}</g>`
  } else {
    body = `<g><animateTransform attributeName="transform" type="translate" values="0 0;-6 18" dur="1.1s" fill="freeze"/>
        <animate attributeName="opacity" values="1;0" dur="1.1s" fill="freeze"/>${flying}</g>
      <g opacity="0"><animate attributeName="opacity" values="0;1" dur="0.6s" begin="0.5s" fill="freeze"/>
        <animateTransform attributeName="transform" type="translate" values="-30 0;0 0" dur="0.9s" begin="0.5s" calcMode="spline" keySplines="${EASE_OUT}" keyTimes="0;1" fill="freeze"/>${rainCloud(1.4)}</g>`
  }
  const bg = s.status === 'running' ? '#283052' : s.status === 'home' ? '#3a3046' : s.status === 'landed' ? '#26304a' : '#2b3340'
  const ring = s.status === 'running' ? '#5d6aa8' : s.status === 'home' ? KIKI_RED : s.status === 'landed' ? '#7f95c9' : '#4b5a6b'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${-size / 2} ${-size / 2} ${size} ${size}">${lookStyle(look)}
    <defs>${HALO}<clipPath id="ic"><circle r="${size / 2 - 1}"/></clipPath></defs>
    <circle r="${size / 2 - 1}" fill="${bg}" stroke="${ring}" stroke-width="1" class="k-ic-${s.status}"/>
    <g clip-path="url(#ic)"><g transform="translate(${-size / 2} ${-size / 2})">${stars(size, size, 5, hash(s.id) % 50)}</g>${body}</g>
  </svg>`
}

/** Kiki's red bow, for the corner of your message bubbles. */
export const bowSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="18" viewBox="-13 -9 26 18">
  <g><animateTransform attributeName="transform" type="rotate" values="0;-6;5;0;0" keyTimes="0;0.06;0.12;0.18;1" dur="5s" repeatCount="indefinite"/>
  <path d="M0 0 C -4 -7, -11 -8, -11 -1 C -11 5, -4 4, 0 0 Z" fill="${KIKI_RED}"/>
  <path d="M0 0 C 4 -7, 11 -8, 11 -1 C 11 5, 4 4, 0 0 Z" fill="${KIKI_RED}"/>
  <path d="M-1 1 L-4 8 M1 1 L4 8" stroke="${KIKI_RED}" stroke-width="2" stroke-linecap="round"/>
  <path d="M-7 -2 C -5 -4, -3 -3, -2 -1 M7 -2 C 5 -4, 3 -3, 2 -1" stroke="#b8323a" stroke-width="0.8" fill="none"/>
  <ellipse rx="2.4" ry="2.8" fill="#b8323a"/></g>
</svg>`

export const whatIs = (s: Sprite) => (s.kind === 'shell' ? 'bakery chore' : s.type || 'delivery')
export const statusWord = (st: SpriteStatus) =>
  st === 'running' ? 'in flight' : st === 'home' ? 'delivered' : st === 'landed' ? 'landed early' : 'rained out'
