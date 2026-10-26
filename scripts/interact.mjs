// Interaction QA: drives the Incident Lab, the X-Ray and the full interface, capturing each state.
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
const require = createRequire(import.meta.url)
let pw
try { pw = require('playwright') } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright') }
const url = process.argv[2] || 'http://localhost:4173/'
const out = process.argv[3] || 'shots'
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
for (const [tag, viewport] of [['desk', { width: 1440, height: 900 }], ['mob', { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const shot = async (n) => page.screenshot({ path: `${out}/${tag}-i-${n}.png` })
  for (let s = 0; s < 3; s++) {
    await page.locator('#lab').scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollTo({ top: document.querySelector('#lab').offsetTop + 60, behavior: 'instant' }))
    await page.locator('.lab__tab').nth(s).click()
    await page.waitForTimeout(400)
    if (s === 0) await shot(`lab-idle`)
    await page.locator('.lab__go').click()
    await page.waitForTimeout(5200)
    await shot(`lab-${s}-run`)
    await page.locator('.cap').nth(2).click()
    await page.waitForTimeout(300)
    const btn = s === 1 ? 'Rejeter' : 'Approuver'
    await page.locator('.lab__decide button', { hasText: btn }).click()
    await page.waitForTimeout(1600)
    await shot(`lab-${s}-${btn}`)
    if (tag === 'desk') {
      await page.evaluate(() => window.scrollTo({ top: document.querySelector('.lab__grid').getBoundingClientRect().top + window.scrollY - 300, behavior: 'instant' }))
      await page.waitForTimeout(500)
      await shot(`lab-${s}-cards`)
    }
  }
  await page.evaluate(() => window.scrollTo({ top: document.querySelector('#xray').offsetTop + 40, behavior: 'instant' }))
  await page.waitForTimeout(1500)
  await page.locator('.xray__item').nth(2).click()
  await page.waitForTimeout(900)
  await shot('xray-mcp')
  // full interface
  await page.evaluate(() => document.querySelector('.showcase-head button').click())
  await page.waitForTimeout(900)
  await page.locator('.explore .fs-ev__btn').nth(1).click()
  await page.locator('.explore .fs-evi').nth(3).click()
  await page.waitForTimeout(500)
  await shot('explore')
  await page.locator('.explore .fs-btn--ok').click()
  await page.waitForTimeout(700)
  await shot('explore-approved')
  await page.keyboard.press('Escape')
  await page.keyboard.type('build')
  await page.waitForTimeout(500)
  await shot('buildnotes')
  console.log(tag, 'page errors:', errs.length, errs.slice(0, 5))
  await page.close()
}
await browser.close()
