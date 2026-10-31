import { DARK_WIN, KIKI_RED, LAMP, ROOFS, SEA_DEEP, SEA_TOP, WALL, WALL_LIT, scatter } from './palette'

// Koriko itself: houses, the bakery, the clock tower, the stars, the moon and the sea.

/**
 * A Koriko house at night. `light` is how its window shows: dark, lit (warm, with a glow),
 * or lighting (dark that warms up as its parcel arrives).
 */
export function house(x: number, base: number, w: number, h: number, light: 'dark' | 'lit' | 'lighting', roof: string) {
  const top = base - h
  const wx = x + w / 2 - 1.6
  const wy = top + 2.5
  const glow = `<circle cx="${wx + 1.6}" cy="${wy + 1.6}" r="5" fill="${LAMP}" opacity="0.18"/>`
  const lit = `<rect x="${wx}" y="${wy}" width="3.2" height="3.2" fill="${LAMP}"/>`
  const win =
    light === 'dark'
      ? `<rect x="${wx}" y="${wy}" width="3.2" height="3.2" fill="${DARK_WIN}" class="k-win"/>`
      : light === 'lit'
        ? glow + lit
        : `<rect x="${wx}" y="${wy}" width="3.2" height="3.2" fill="${DARK_WIN}" class="k-win"/><g opacity="0">${glow}${lit}<animate attributeName="opacity" values="0;1;0.6;1" dur="1.2s" begin="0.4s" fill="freeze"/></g>`
  return `<g><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="${light === 'dark' ? WALL : WALL_LIT}" class="${light === 'dark' ? 'k-wall' : 'k-lit'}"/>
    <path d="M${x - 1.5} ${top} L${x + w / 2} ${top - w * 0.45} L${x + w + 1.5} ${top} Z" fill="${roof}"/>${win}</g>`
}

/** The town's clock tower, its face lit, its hand turning. */
export function clockTower(x: number, base: number, h: number) {
  const top = base - h
  return `<g><rect x="${x - 5}" y="${top}" width="10" height="${h}" fill="#5b5270" class="k-lit"/>
    <path d="M${x - 6.5} ${top} L${x} ${top - 11} L${x + 6.5} ${top} Z" fill="#3f6f6a"/>
    <circle cx="${x}" cy="${top + 7}" r="6" fill="${LAMP}" opacity="0.15"/>
    <circle cx="${x}" cy="${top + 7}" r="3.6" fill="#fff6d6" stroke="#8a6d4b" stroke-width="0.6"/>
    <line x1="${x}" y1="${top + 7}" x2="${x}" y2="${top + 4.4}" stroke="#3a3350" stroke-width="0.6"><animateTransform attributeName="transform" type="rotate" from="0 ${x} ${top + 7}" to="360 ${x} ${top + 7}" dur="12s" repeatCount="indefinite"/></line>
    <line x1="${x}" y1="${top + 7}" x2="${x + 2}" y2="${top + 7}" stroke="#3a3350" stroke-width="0.6"/>
    <rect x="${x - 1.2}" y="${base - 5}" width="2.4" height="5" fill="${LAMP}" opacity="0.7"/></g>`
}

/** The bakery Kiki sets out from: a lit shopfront with a red awning. */
export function bakery(x: number, base: number) {
  return `<g><rect x="${x}" y="${base - 15}" width="18" height="15" fill="${WALL_LIT}" class="k-lit"/>
    <path d="M${x - 2} ${base - 15} L${x + 9} ${base - 23} L${x + 20} ${base - 15} Z" fill="${ROOFS[1]}"/>
    <path d="M${x - 1} ${base - 9} h20 l-2 3 h-16 Z" fill="${KIKI_RED}"/>
    <circle cx="${x + 9}" cy="${base - 4}" r="6" fill="${LAMP}" opacity="0.18"/>
    <rect x="${x + 3}" y="${base - 6}" width="12" height="6" fill="${LAMP}" opacity="0.9"/></g>`
}

/**
 * One star that blinks: it rests dim, flashes bright for a moment, and goes dim
 * again, each on its own beat. Every fourth is a four-point sparkle that swells
 * as it flashes.
 */
export function blinkStar(x: number, y: number, i: number) {
  const dur = (2.2 + scatter(i, 31) * 3.2).toFixed(2)
  const begin = (scatter(i, 47) * 4).toFixed(2)
  const flash = `values="0.12;0.12;1;0.12;0.12" keyTimes="0;0.42;0.5;0.58;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"`
  if (i % 4 === 0) {
    return `<g transform="translate(${x} ${y})"><g opacity="0.12"><animate attributeName="opacity" ${flash}/>
      <animateTransform attributeName="transform" type="scale" values="0.6;0.6;1.3;0.6;0.6" keyTimes="0;0.42;0.5;0.58;1" dur="${dur}s" begin="${begin}s" repeatCount="indefinite"/>
      <path d="M0 -3 L0.6 -0.6 L3 0 L0.6 0.6 L0 3 L-0.6 0.6 L-3 0 L-0.6 -0.6 Z" fill="#fff6d6" class="k-star"/><circle r="1.6" fill="#fff6d6" class="k-star" opacity="0.25"/></g></g>`
  }
  return `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 0.9 : 0.6}" fill="#fff6d6" class="k-star" opacity="0.12"><animate attributeName="opacity" ${flash}/></circle>`
}

export function stars(w: number, h: number, n: number, seed: number) {
  let out = ''
  for (let i = 0; i < n; i++) {
    const x = Math.round(scatter(i, seed) * (w - 8)) + 4
    const y = Math.round(scatter(i + 97, seed) * h * 0.45) + 3
    out += blinkStar(x, y, i + seed * 13)
  }
  return out
}

export function moon(x: number, y: number, r: number) {
  return `<g><circle cx="${x}" cy="${y}" r="${r * 2.2}" fill="#fff4c2" opacity="0.08" class="k-glow"/>
    <circle cx="${x}" cy="${y}" r="${r}" fill="#f3e3a1" class="k-moon"/>
    <circle cx="${x + r * 0.5}" cy="${y - r * 0.25}" r="${r * 0.86}" fill="#181b2b" class="k-cut"/></g>`
}

/** The sea, its wave crests drifting. */
export function sea(w: number, top: number, h: number) {
  let waves = ''
  for (let x = 6, i = 0; x < w + 22; x += 22, i++) {
    waves += `<path d="M${x} ${top + 3 + (i % 2) * 2} q3 -2 6 0" stroke="#4f7fa8" class="k-wave" stroke-width="0.8" fill="none" opacity="0.8"/>`
  }
  return `<defs><linearGradient id="seag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SEA_TOP}" class="k-sea0"/><stop offset="1" stop-color="${SEA_DEEP}" class="k-sea1"/></linearGradient></defs>
    <rect x="0" y="${top}" width="${w}" height="${h}" fill="url(#seag)"/>
    <g><animateTransform attributeName="transform" type="translate" values="0 0;-22 0" dur="6s" repeatCount="indefinite"/>${waves}</g>
    <path d="M0 ${top} H${w}" stroke="#2f5578" class="k-shore" stroke-width="0.8"/>`
}

export const nightSky = (id: string) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151827" class="k-sky0"/><stop offset="0.7" stop-color="#262a42" class="k-sky1"/><stop offset="1" stop-color="#3a3352" class="k-sky2"/></linearGradient>`
