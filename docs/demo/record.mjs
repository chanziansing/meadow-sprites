// Records demo.html in headless Chrome as timed PNG frames, then encodes a GIF with ffmpeg.
import puppeteer from 'puppeteer-core'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { execFileSync } from 'child_process'

const [chrome, ffmpeg, out, look = 'dark', seconds = '12.5'] = process.argv.slice(2)
if (!['dark', 'light'].includes(look)) throw new Error('look must be dark or light')
const root = process.cwd()
const server = http.createServer((q, r) => {
  const file = path.join(root, decodeURIComponent(new URL(q.url, 'http://x').pathname))
  if (!file.startsWith(root) || !fs.existsSync(file)) { r.statusCode = 404; return r.end() }
  r.setHeader('content-type', file.endsWith('.mjs') ? 'text/javascript' : 'text/html; charset=utf-8')
  r.end(fs.readFileSync(file))
})
await new Promise(ok => server.listen(0, '127.0.0.1', ok))
const port = server.address().port

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--force-color-profile=srgb'] })
const page = await browser.newPage()
await page.setViewport({ width: 900, height: 480, deviceScaleFactor: 1 })
await page.goto(`http://127.0.0.1:${port}/demo.html?look=${look}`)
await page.waitForFunction('window.ready === true')

const dir = `frames-${look}`
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir)
const start = Date.now(), stamps = []
for (let i = 0; Date.now() - start < Number(seconds) * 1000; i++) {
  await page.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.png` })
  stamps.push(Date.now() - start)
}
await browser.close(); server.close()

// Each frame lasts until the next was taken, so the GIF plays in real time.
const list = stamps.map((t, i) => `file 'f${String(i).padStart(4, '0')}.png'\nduration ${(((stamps[i + 1] ?? t + 80) - t) / 1000).toFixed(3)}`).join('\n')
fs.writeFileSync(`${dir}/list.txt`, list + `\nfile 'f${String(stamps.length - 1).padStart(4, '0')}.png'\n`)
execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`,
  '-vf', 'fps=12,scale=900:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle',
  out])
console.log(`${stamps.length} frames over ${(stamps.at(-1) / 1000).toFixed(1)}s → ${out} (${(fs.statSync(out).size / 1e6).toFixed(2)} MB)`)
