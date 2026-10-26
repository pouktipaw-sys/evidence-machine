import { useSyncExternalStore } from 'react'

/**
 * Shared mutable state between the DOM choreography (GSAP) and the WebGL scene.
 * Hot values (read every frame) are plain fields; values that drive React renders
 * go through `ui` + subscribe().
 */

export type PartGroup = 'INPUT' | 'EVIDENCE' | 'REASONING' | 'HUMAN DECISION'

export interface Anchor {
  x: number
  y: number
  visible: boolean
}

export const stage = {
  /** theatre timeline target, 0 hero → 1 exploded → 2 graph → 3 dashboard */
  t: 0,
  /** opening reveal 0..1 */
  intro: 0,
  /** finale recomposition 0..1 */
  finale: 0,
  /** 0..1, how present the 3D layer is (opacity) */
  presence: 1,
  /** normalized pointer, -1..1 */
  pointer: { x: 0, y: 0 },
  /** dashboard container rect in viewport px (for the panel morph) */
  dashBox: { x: 0, y: 0, w: 1, h: 1 },
  /** projected anchors, written by the scene each frame */
  anchors: {} as Record<string, Anchor>,
  frameListeners: new Set<() => void>(),
  /** which choreography the sculpture follows */
  mode: 'theatre' as 'theatre' | 'finale',
  /** user drag on the sculpture */
  drag: { yaw: 0, pitch: 0, vel: 0, active: false },
  /** sculpture accepts pointer (hover labels / drag) */
  interactive: true,
  reducedMotion: false,
  isMobile: false,
}

/* ───── low-frequency UI state (React) ───── */

interface UIState {
  canvasActive: boolean
  hovered: PartGroup | null
  webgl: boolean
  buildNotes: boolean
  sound: boolean
}

let ui: UIState = { canvasActive: true, hovered: null, webgl: true, buildNotes: false, sound: false }
const listeners = new Set<() => void>()

export function setUI(patch: Partial<UIState>) {
  let changed = false
  for (const k in patch) {
    const key = k as keyof UIState
    if (ui[key] !== patch[key]) changed = true
  }
  if (!changed) return
  ui = { ...ui, ...patch }
  listeners.forEach((l) => l())
}

export function getUI() {
  return ui
}

export function useUI<T>(sel: (s: UIState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => sel(ui),
    () => sel(ui),
  )
}

export function onFrame(fn: () => void) {
  stage.frameListeners.add(fn)
  return () => {
    stage.frameListeners.delete(fn)
  }
}

/* ───── math helpers shared by DOM + 3D ───── */

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const smooth = (a: number, b: number, v: number) => {
  const x = clamp((v - a) / (b - a))
  return x * x * (3 - 2 * x)
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
