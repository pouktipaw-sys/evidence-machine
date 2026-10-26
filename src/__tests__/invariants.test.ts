import { describe, expect, it } from 'vitest'
import { layoutFor, dashBoxFor } from '../lib/dashLayout'
import { scenarios, dashboard } from '../content'

describe('dashboard layout', () => {
  it('keeps every panel inside the container, desktop and mobile', () => {
    for (const m of [true, false]) {
      for (const [x, y, w, h] of Object.values(layoutFor(m))) {
        expect(x).toBeGreaterThanOrEqual(0)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(x + w).toBeLessThanOrEqual(1.0001)
        expect(y + h).toBeLessThanOrEqual(1.0001)
      }
    }
  })
  it('fits the showcase box in the viewport', () => {
    for (const [w, h, m] of [[1440, 900, false], [1280, 720, false], [390, 844, true]] as const) {
      const b = dashBoxFor(w, h, m)
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y + b.h).toBeLessThanOrEqual(h)
    }
  })
})

describe('investigation content', () => {
  it('gives each scenario its own grammar, ordered events and key signals', () => {
    expect(new Set(scenarios.map((s) => s.kind)).size).toBe(3)
    for (const s of scenarios) {
      const ts = s.events.map((e) => e.t)
      expect(ts).toEqual([...ts].sort((a, b) => a - b))
      expect(s.events.some((e) => e.key)).toBe(true)
      const sum = s.hypotheses.reduce((a, h) => a + h.p, 0)
      expect(sum).toBeCloseTo(1, 5)
    }
  })
  it('links every evidence item to a known hypothesis', () => {
    const ids = dashboard.hypotheses.map((h) => h.id)
    for (const e of dashboard.evidence) expect(ids).toContain(e.supports)
  })
})
