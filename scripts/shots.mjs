// Visual QA: captures the key frames of the experience at desktop and mobile widths.
// usage: node scripts/shots.mjs [url] [outDir] [filter]
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
const require = createRequire(import.meta.url)
let pw
try {
  pw = require('playwright')
} catch {
  pw = require(execSync('npm root -g').toString().trim() + '/playwright')
}
const { chromium } = pw
import fs from 'node:fs'

const url = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || 'shots'
const filter = process.argv[4] || ''
fs.mkdirSync(out, { recursive: true })

// [name, selector, progress-within-section (0..1 of scrollable distance) | 'top']
const frames = [
  ['01-hero', '#theatre', 0],
  ['02-approach', '#theatre', 0.1],
  ['03-explode', '#theatre', 0.3],
  ['04-events', '#theatre', 0.4],
  ['05-graph', '#theatre', 0.52],
  ['06-morph', '#theatre', 0.66],
  ['07-showcase', '#theatre', 0.735],
  ['08-zoom-events', '#theatre', 0.8],
  ['09-zoom-evidence', '#theatre', 0.88],
  ['10-zoom-decision', '#theatre', 0.965],
  ['11-whiteroom', '#case', 0.0],
  ['12-whiteroom-b', '#case', 0.55],
  ['13-lab', '#lab', 'top'],
  ['14-xray', '#xray', 'top'],
  ['15-method', '#method', 0.3],
  ['16-method-b', '#method', 0.75],
  ['17-proj-agentops', '#p-agentops', 0.5],
  ['18-proj-peacefi', '#p-peacefi', 0.5],
  ['19-proj-dreamcrm', '#p-dreamcrm', 0.5],
  ['20-finale', '#finale', 0.35],
  ['21-finale-b', '#finale', 1],
]

const sizes = [
  ['desk', { width: 1440, height: 900 }],
  ['mob', { width: 390, height: 844 }],
]

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
for (const [tag, viewport] of sizes) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 })
  const logs = []
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`[${m.type()}] ${m.text()}`))
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3500)
  for (const [name, sel, prog] of frames) {
    if (filter && !name.includes(filter)) continue
    const y = await page.evaluate(
      ([sel, prog]) => {
        const el = document.querySelector(sel)
        if (!el) return null
        const top = el.getBoundingClientRect().top + window.scrollY
        if (prog === 'top') return top
        const dist = Math.max(0, el.offsetHeight - window.innerHeight)
        return top + dist * prog
      },
      [sel, prog],
    )
    if (y === null) {
      logs.push(`[shots] missing ${sel}`)
      continue
    }
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y)
    await page.waitForTimeout(2600)
    await page.screenshot({ path: `${out}/${tag}-${name}.png` })
  }
  console.log(`${tag}: ${logs.length} console issues`)
  logs.slice(0, 15).forEach((l) => console.log('  ', l))
  await page.close()
}
await browser.close()
