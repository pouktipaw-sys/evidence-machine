// QA for the FlowState application: navigates every view, makes decisions, captures each state.
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright') }
const base = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || 'shots'
const b = await pw.chromium.launch()
for (const [tag, viewport] of [['desk', { width: 1440, height: 900 }], ['mob', { width: 390, height: 844 }]]) {
  const p = await b.newPage({ viewport })
  const errs = []
  p.on('pageerror', (e) => errs.push(e.message))
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
  const shot = (n) => p.screenshot({ path: `${out}/${tag}-app-${n}.png` })
  await p.goto(base + '#/app', { waitUntil: 'networkidle' })
  await p.waitForTimeout(800)
  await shot('1-inbox')
  await p.click('a[href="#/app/incidents/INC-2049"]')
  await p.waitForTimeout(900)
  await shot('2-detail')
  await p.click('.fs-btn--ok')
  await p.waitForTimeout(600)
  await shot('3-approved')
  await p.goto(base + '#/app/incidents/INC-2051'); await p.waitForTimeout(700)
  await p.locator('.fs-act .fs-btn', { hasText: 'Rejeter' }).click()
  await p.waitForTimeout(500)
  await p.goto(base + '#/app/journal'); await p.waitForTimeout(700)
  await shot('4-journal')
  await p.goto(base + '#/app/preuves'); await p.waitForTimeout(700)
  await shot('5-preuves')
  await p.goto(base + '#/app/reglages'); await p.waitForTimeout(700)
  await p.locator('.fsa-range input').fill('0.8')
  await p.waitForTimeout(300)
  await shot('6-reglages')
  await p.goto(base + '#/app/incidents/INC-2053'); await p.waitForTimeout(700)
  await shot('7-blocked')
  await p.goto(base + '#/app'); await p.waitForTimeout(700)
  await shot('8-inbox-after')
  await p.goto(base + '#/'); await p.waitForTimeout(1500)
  const heroOk = await p.locator('.hero-title').isVisible()
  console.log(tag, 'errors:', errs, 'back to site hero visible:', heroOk)
  await p.close()
}
await b.close()
