import { getUI } from './stage'

/** Optional, synthesized sound design. Off by default, never autoplays. */
let ctx: AudioContext | null = null

function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  return ctx
}

type Cue = 'tick' | 'select' | 'initiate' | 'approve' | 'reject' | 'reveal'

const cues: Record<Cue, { f: number[]; d: number; type: OscillatorType; g: number }> = {
  tick: { f: [1800], d: 0.03, type: 'square', g: 0.025 },
  select: { f: [660, 990], d: 0.08, type: 'triangle', g: 0.05 },
  reveal: { f: [420], d: 0.12, type: 'sine', g: 0.05 },
  initiate: { f: [110, 220, 440], d: 0.5, type: 'sawtooth', g: 0.035 },
  approve: { f: [523, 784, 1046], d: 0.35, type: 'triangle', g: 0.06 },
  reject: { f: [300, 200], d: 0.3, type: 'square', g: 0.03 },
}

export function sfx(name: Cue) {
  if (!getUI().sound) return
  try {
    const a = ac()
    const c = cues[name]
    const now = a.currentTime
    c.f.forEach((f, i) => {
      const o = a.createOscillator()
      const g = a.createGain()
      const t0 = now + i * (c.d / c.f.length) * 0.6
      o.type = c.type
      o.frequency.setValueAtTime(f, t0)
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(c.g, t0 + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + c.d)
      o.connect(g).connect(a.destination)
      o.start(t0)
      o.stop(t0 + c.d + 0.02)
    })
  } catch {
    /* audio is a bonus */
  }
}

export function unlockAudio() {
  try {
    void ac().resume()
  } catch {
    /* ignore */
  }
}
