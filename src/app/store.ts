import { useSyncExternalStore } from 'react'

/** FlowState demo state: human decisions, journal and settings, kept in this browser only. */

export type Verdict = 'pending' | 'approved' | 'rejected'

export interface LogEntry {
  at: string
  incident: string
  kind: 'approved' | 'rejected' | 'asked' | 'reset'
  text: string
}

interface State {
  verdicts: Record<string, Verdict>
  asked: Record<string, boolean>
  log: LogEntry[]
  settings: { minConfidence: number; sources: Record<string, boolean> }
}

const KEY = 'flowstate-demo-v1'
const initial: State = {
  verdicts: {},
  asked: {},
  log: [],
  settings: { minConfidence: 0.5, sources: { logs: true, metrics: true, traces: true, deploys: true, audit: true } },
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return initial
    const s = JSON.parse(raw) as State
    return { ...initial, ...s, settings: { ...initial.settings, ...s.settings, sources: { ...initial.settings.sources, ...s.settings?.sources } } }
  } catch {
    return initial
  }
}

let state = load()
const subs = new Set<() => void>()

function commit(next: State) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* private mode: keep it in memory */
  }
  subs.forEach((f) => f())
}

const now = () => new Date().toISOString()

export const fs = {
  decide(incident: string, verdict: Exclude<Verdict, 'pending'>, text: string) {
    commit({ ...state, verdicts: { ...state.verdicts, [incident]: verdict }, log: [{ at: now(), incident, kind: verdict, text }, ...state.log] })
  },
  reopen(incident: string) {
    const verdicts = { ...state.verdicts }
    delete verdicts[incident]
    commit({ ...state, verdicts, log: [{ at: now(), incident, kind: 'reset', text: 'Décision annulée, incident rouvert' }, ...state.log] })
  },
  ask(incident: string, text: string) {
    commit({ ...state, asked: { ...state.asked, [incident]: true }, log: [{ at: now(), incident, kind: 'asked', text }, ...state.log] })
  },
  setMinConfidence(v: number) {
    commit({ ...state, settings: { ...state.settings, minConfidence: v } })
  },
  toggleSource(k: string) {
    commit({ ...state, settings: { ...state.settings, sources: { ...state.settings.sources, [k]: !state.settings.sources[k] } } })
  },
  resetAll() {
    commit(initial)
  },
}

export function useFS<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => sel(state),
    () => sel(state),
  )
}

export const verdictOf = (s: State, id: string): Verdict => s.verdicts[id] ?? 'pending'
