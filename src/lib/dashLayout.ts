/**
 * Single source of truth for the FlowState dashboard panel layout.
 * The DOM dashboard renders panels at these rects, and the 3D plates morph
 * into exactly the same rects (converted px → world) before the DOM takes over.
 */

export type Rect = [x: number, y: number, w: number, h: number]

export const PANEL_IDS = ['top', 'events', 'chart', 'ev1', 'ev2', 'ev3', 'ev4', 'decision', 'actions'] as const
export type PanelId = (typeof PANEL_IDS)[number]

const desktop: Record<PanelId, Rect> = {
  top: [0, 0, 1, 0.075],
  events: [0, 0.095, 0.25, 0.905],
  chart: [0.265, 0.095, 0.47, 0.42],
  ev1: [0.265, 0.53, 0.2275, 0.225],
  ev2: [0.5075, 0.53, 0.2275, 0.225],
  ev3: [0.265, 0.77, 0.2275, 0.23],
  ev4: [0.5075, 0.77, 0.2275, 0.23],
  decision: [0.75, 0.095, 0.25, 0.665],
  actions: [0.75, 0.775, 0.25, 0.225],
}

const mobile: Record<PanelId, Rect> = {
  top: [0, 0, 1, 0.05],
  chart: [0, 0.062, 1, 0.19],
  events: [0, 0.264, 1, 0.215],
  ev1: [0, 0.492, 0.49, 0.1],
  ev2: [0.51, 0.492, 0.49, 0.1],
  ev3: [0, 0.604, 0.49, 0.1],
  ev4: [0.51, 0.604, 0.49, 0.1],
  decision: [0, 0.716, 1, 0.17],
  actions: [0, 0.898, 1, 0.102],
}

/** separators the three INPUT rods become: [x1,y1,x2,y2] normalized */
const desktopDividers: [number, number, number, number][] = [
  [0.2575, 0.095, 0.2575, 1],
  [0.7425, 0.095, 0.7425, 1],
  [0, 0.085, 1, 0.085],
]
const mobileDividers: [number, number, number, number][] = [
  [0, 0.056, 1, 0.056],
  [0, 0.486, 1, 0.486],
  [0, 0.71, 1, 0.71],
]

export const layoutFor = (isMobile: boolean) => (isMobile ? mobile : desktop)
export const dividersFor = (isMobile: boolean) => (isMobile ? mobileDividers : desktopDividers)

/** container box in viewport px for the theatre showcase */
export function dashBoxFor(vw: number, vh: number, isMobile: boolean) {
  if (isMobile) {
    const w = vw - 24
    const h = Math.min(vh * 0.8, w / 0.56)
    return { x: (vw - w) / 2, y: (vh - h) / 2 + vh * 0.03, w, h }
  }
  const w = Math.min(vw * 0.9, vh * 0.72 * 1.6, 1320)
  const h = w / 1.6
  return { x: (vw - w) / 2, y: (vh - h) / 2 + vh * 0.025, w, h }
}
