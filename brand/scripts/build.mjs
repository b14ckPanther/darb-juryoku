// Builds every Darb Juryoku brand asset from src/tokens.json and src/mark.svg.
//   npm run build            (needs PWEXE pointing at a Chromium / headless-shell binary)
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import opentype from 'opentype.js'
import pngToIco from 'png-to-ico'
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import { serve } from './serve.mjs'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = `${ROOT}exports/`
const T = JSON.parse(await readFile(`${ROOT}src/tokens.json`, 'utf8'))
const C = Object.fromEntries(Object.entries(T.color).map(([k, v]) => [k, v.hex]))
await mkdir(`${OUT}icons`, { recursive: true })
await mkdir(`${OUT}svg`, { recursive: true })
await mkdir(`${OUT}social`, { recursive: true })

// ---------- flat SVG marks ----------

/** The approved mark, src/mark.svg, is the only drawing. Every flat variant is a recolour or a simplification. */
const MARK = (await readFile(`${ROOT}src/mark.svg`, 'utf8')).replace(/<!--[\s\S]*?-->\s*/, '')
const TOKEN = { gold: C.gold, goldLight: C.goldLight, forest: C.forest, night: C.night }

/**
 * opts.colors maps token name -> output colour (null removes elements of that colour).
 * opts.bg keeps the night rounded square. opts.drop removes the chair, desk and spine. opts.thicken scales strokes.
 */
function markSvg({ colors = {}, bg = false, drop = false, thicken = 1, defs = '' } = {}) {
  let s = MARK
  if (!bg) s = s.replace(/<rect id="bg"[^>]*\/>/, '')
  if (drop) {
    s = s.replace(new RegExp(`<path [^>]*stroke="${TOKEN.forest}"[^>]*/>`, 'g'), '')
    s = s.replace(/<path id="spine"[^>]*\/>/, '')
  }
  if (thicken !== 1) s = s.replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${(+w * thicken).toFixed(2)}"`)
  for (const [name, hex] of Object.entries(TOKEN)) {
    if (!(name in colors) || (name === 'night' && bg)) continue
    const to = colors[name]
    if (to === null) {
      s = s.replace(new RegExp(`<path [^>]*stroke="${hex}"[^>]*/>`, 'g'), '')
      continue
    }
    s = s.replaceAll(`"${hex}"`, `"${to}"`)
  }
  return s.replace('<svg ', `<svg `).replace(/(<svg[^>]*>)/, `$1${defs}`)
}

const goldGrad = `<defs><linearGradient id="g" x1="40" y1="20" x2="160" y2="180" gradientUnits="userSpaceOnUse">
  <stop offset="0" stop-color="${C.goldLight}"/><stop offset=".45" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.goldDeep}"/></linearGradient></defs>`
const mono = (c) => ({ gold: c, goldLight: c, forest: c })

const svgs = {
  'mark-gold.svg': markSvg({ colors: { gold: 'url(#g)' }, defs: goldGrad }),
  'mark-on-night.svg': markSvg({ colors: { gold: 'url(#g)' }, bg: true, defs: goldGrad }),
  'mark-ivory.svg': markSvg({ colors: mono(C.ivory) }),
  'mark-ink.svg': markSvg({ colors: mono(C.ink) }),
  // small sizes: no furniture or spine, heavier strokes, so the person, laptop and frame survive 16 px
  'favicon.svg': markSvg({ bg: true, drop: true, thicken: 1.6 }),
  'badge-mono.svg': markSvg({ colors: mono('#fff'), drop: true, thicken: 1.5 }),
}
for (const [f, s] of Object.entries(svgs)) await writeFile(`${OUT}svg/${f}`, s)

// ---------- wordmark (text converted to paths: no font needed to display it) ----------

const mincho = opentype.parse((await readFile(`${ROOT}fonts/${T.type.display.file}`)).buffer)
const minchoR = opentype.parse((await readFile(`${ROOT}fonts/ZenOldMincho-Regular.ttf`)).buffer)
const geist = opentype.parse((await readFile(`${ROOT}fonts/${T.type.ui.file}`)).buffer)

function lockup(ink, sub, gold) {
  // opentype paths: (x, baseline y), y grows downward like SVG
  const NAME = 200, DARB = 54, JP = 46, GAP_DARB = 30
  const nameB = mincho.getPath(T.shortName, 0, 0, NAME).getBoundingBox()
  const darbB = geist.getPath('Darb', 0, 0, DARB).getBoundingBox()
  const jpB = minchoR.getPath(T.japanese, 0, 0, JP).getBoundingBox()
  const base = -(nameB.y1 - GAP_DARB + darbB.y1) // name baseline, so the top of "Darb" sits at y = 0
  const top = 0
  const bottom = base + Math.max(nameB.y2, 0)
  const H = bottom - top
  const markSize = H
  const x0 = markSize + 64
  const nameX = x0 - nameB.x1
  const jpX = x0 + (nameB.x2 - nameB.x1) + 34 - jpB.x1
  const W = jpX + jpB.x2 + 4
  const name = mincho.getPath(T.shortName, nameX, base, NAME).toSVG(2).replace('<path ', `<path fill="${ink}" `)
  const darb = geist.getPath('Darb', x0 + 8 - darbB.x1, base + nameB.y1 - GAP_DARB, DARB).toSVG(2).replace('<path ', `<path fill="${sub}" `)
  const jp = minchoR.getPath(T.japanese, jpX, base, JP).toSVG(2).replace('<path ', `<path fill="${gold}" `)
  const inner = markSvg({ colors: { gold, goldLight: gold, forest: sub } }).replace(/<\/?svg[^>]*>/g, '')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -8 ${Math.ceil(W)} ${Math.ceil(H + 16)}">
  <g transform="scale(${markSize / 200})">${inner}</g>
  ${darb}
  ${name}
  ${jp}
</svg>
`
}
await writeFile(`${OUT}svg/wordmark-on-dark.svg`, lockup(C.ivory, C.muted, C.gold))
await writeFile(`${OUT}svg/wordmark-on-light.svg`, lockup(C.ink, '#6f6357', C.goldDeep))

// ---------- 3D renders ----------

const srv = await serve()
const base = `http://127.0.0.1:${srv.address().port}/render.html`
const browser = await chromium.launch({
  executablePath: process.env.PWEXE,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.error('render error:', e.message))

async function render(name, { w, h, scale, variant = 'tile', align = 1 }) {
  await page.setViewportSize({ width: w, height: h })
  await page.goto(`${base}?variant=${variant}&w=${w}&h=${h}&scale=${scale}&align=${align}`)
  await page.waitForFunction('window.__ready === true', null, { timeout: 120000 })
  const file = `${OUT}${name}`
  await page.locator('#stage').screenshot({ path: file })
  return file
}

const S = T.render.markScale
const master = await render('icons/_master-tile.png', { w: 2048, h: 2048, scale: S.tile })
const masterMask = await render('icons/_master-maskable.png', { w: 2048, h: 2048, scale: S.maskable })
const masterApple = await render('icons/_master-apple.png', { w: 2048, h: 2048, scale: S.apple })
const masterMac = await render('icons/_master-mac.png', { w: 2048, h: 2048, scale: S.mac })
await render('social/og-image.png', { w: T.icons.og[0], h: T.icons.og[1], scale: 0.62, variant: 'og' })
await render('social/hero-aligned.png', { w: 2400, h: 1350, scale: 0.62, variant: 'og' })
for (const [i, a] of [0, 0.5, 1].entries()) await render(`social/align-${i + 1}.png`, { w: 1200, h: 1200, scale: 0.7, align: a })
await browser.close()
srv.close()

// ---------- icon set ----------

/** iOS-style superellipse ("squircle"), n = 5, as an SVG mask. */
function squircle(size, inset = 0, fill = '#fff') {
  const n = 5
  const r = size / 2 - inset
  const pts = []
  for (let i = 0; i < 360; i++) {
    const t = (i / 360) * Math.PI * 2
    const c = Math.cos(t), s = Math.sin(t)
    pts.push(`${(size / 2 + Math.sign(c) * Math.abs(c) ** (2 / n) * r).toFixed(2)},${(size / 2 + Math.sign(s) * Math.abs(s) ** (2 / n) * r).toFixed(2)}`)
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><polygon points="${pts.join(' ')}" fill="${fill}"/></svg>`)
}

async function tile(src, size) {
  return sharp(src).resize(size, size, { kernel: 'lanczos3' }).composite([{ input: squircle(size), blend: 'dest-in' }]).png()
}

for (const s of T.icons.tile) await (await tile(master, s)).toFile(`${OUT}icons/icon-${s}.png`)
for (const s of T.icons.maskable) await sharp(masterMask).resize(s, s, { kernel: 'lanczos3' }).png().toFile(`${OUT}icons/icon-maskable-${s}.png`)
await sharp(masterApple).resize(T.icons.apple, T.icons.apple, { kernel: 'lanczos3' }).flatten({ background: C.night }).png().toFile(`${OUT}icons/apple-touch-icon.png`)

// macOS / desktop (Tauri later): 824 px squircle on a 1024 canvas with the system drop shadow
{
  const size = T.icons.mac
  const body = Math.round(size * 0.805)
  const off = Math.round((size - body) / 2)
  const art = await (await tile(masterMac, body)).toBuffer()
  const shadow = await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: squircle(body, 0, 'rgba(0,0,0,0.55)'), left: off, top: off + Math.round(size * 0.012) }])
    .blur(size * 0.012)
    .png()
    .toBuffer()
  await sharp(shadow).composite([{ input: art, left: off, top: off }]).png().toFile(`${OUT}icons/icon-desktop-${size}.png`)
}

for (const s of T.icons.favicon) await sharp(Buffer.from(svgs['favicon.svg'])).resize(s, s).png().toFile(`${OUT}icons/favicon-${s}.png`)
await writeFile(`${OUT}icons/favicon.ico`, await pngToIco(T.icons.favicon.map((s) => `${OUT}icons/favicon-${s}.png`)))
await sharp(Buffer.from(svgs['badge-mono.svg'])).resize(T.icons.badge, T.icons.badge).png().toFile(`${OUT}icons/badge-${T.icons.badge}.png`)
await writeFile(`${OUT}icons/favicon.svg`, svgs['favicon.svg'])

// ---------- manifest, tokens, head tags ----------

const manifest = {
  name: T.name,
  short_name: T.shortName,
  description: T.tagline,
  display: 'standalone',
  background_color: C.night,
  theme_color: C.night,
  icons: [
    ...T.icons.tile.map((s) => ({ src: `/icons/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'any' })),
    ...T.icons.maskable.map((s) => ({ src: `/icons/icon-maskable-${s}.png`, sizes: `${s}x${s}`, type: 'image/png', purpose: 'maskable' })),
    { src: `/icons/badge-${T.icons.badge}.png`, sizes: `${T.icons.badge}x${T.icons.badge}`, type: 'image/png', purpose: 'monochrome' },
  ],
}
await writeFile(`${OUT}manifest.webmanifest`, JSON.stringify(manifest, null, 2) + '\n')

const css = `/* Generated from src/tokens.json by scripts/build.mjs. Edit the JSON, not this file. */
:root {
${Object.entries(T.color).map(([k, v]) => `  --${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}: ${v.hex}; /* ${v.role} */`).join('\n')}
  --font-display: '${T.type.display.family}', 'Hiragino Mincho ProN', serif;
  --font-ui: '${T.type.ui.family}', system-ui, sans-serif;
  --spring-stiffness: ${T.motion.spring.stiffness};
  --spring-damping: ${T.motion.spring.damping};
  --align-ms: ${T.motion.alignMs}ms;
}
`
await writeFile(`${OUT}tokens.css`, css)

await writeFile(
  `${OUT}head.html`,
  `<link rel="icon" href="/icons/favicon.ico" sizes="48x48">
<link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="${C.night}">
<meta property="og:title" content="${T.name}">
<meta property="og:description" content="${T.tagline}">
<meta property="og:image" content="/social/og-image.png">
<meta name="twitter:card" content="summary_large_image">
`,
)
console.log('built', OUT)
