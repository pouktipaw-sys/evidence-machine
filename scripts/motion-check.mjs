// Captures the opening sequence over time, and every scene transition half-way through.
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright') }
const url = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || 'shots'
const b = await pw.chromium.launch()
for (const [tag, viewport] of [['desk', { width: 1440, height: 900 }], ['mob', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  await p.goto(url)
  let last = 0
  for (const t of [300, 1000, 1500, 1850, 2300, 3200]) {
    await p.waitForTimeout(t - last)
    last = t
    await p.screenshot({ path: `${out}/${tag}-boot-${t}.png` })
  }
  for (const id of ['case', 'lab', 'xray', 'method', 'p-agentops', 'p-peacefi', 'p-dreamcrm', 'finale']) {
    // section top half-way up the screen = transition at 50 %
    await p.evaluate((id) => {
      const el = document.getElementById(id)
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5, behavior: 'instant' })
    }, id)
    await p.waitForTimeout(900)
    await p.screenshot({ path: `${out}/${tag}-tr-${id}.png` })
  }
  console.log(tag, 'errors', errs)
  await p.close()
}
await b.close()
