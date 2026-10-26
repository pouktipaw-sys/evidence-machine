import { useEffect, useMemo, useRef, useState } from 'react'
import { confLevel, type Incident } from './incidents'
import type { Verdict } from './store'

/* ═════════ graph model, derived from the incident record ═════════ */

type NodeKind = 'incident' | 'event' | 'evidence' | 'related' | 'hypothesis' | 'proposal'
export interface GNode {
  id: string
  kind: NodeKind
  label: string
  sub: string
  text: string
  x: number
  y: number
  hot?: boolean
}
export interface GEdge {
  from: string
  to: string
  kind: 'trace' | 'supports' | 'contradicts' | 'history' | 'proposes'
}

const KIND_LABEL: Record<NodeKind, string> = {
  incident: 'Incident',
  event: 'Signal',
  evidence: 'Preuve',
  related: 'Historique',
  hypothesis: 'Hypothèse',
  proposal: 'Proposition',
}

export function buildGraph(inc: Incident) {
  const nodes: GNode[] = []
  const edges: GEdge[] = []
  const evs = inc.events.slice(0, 5)
  nodes.push({ id: inc.id, kind: 'incident', label: inc.id, sub: inc.service, text: inc.title, x: 80, y: 290, hot: true })
  evs.forEach((e, i) => {
    nodes.push({ id: e.id, kind: 'event', label: e.id, sub: e.time, text: `${e.label}. ${e.detail}`, x: 270, y: 70 + i * (440 / Math.max(1, evs.length - 1)), hot: e.severity === 'crit' })
    edges.push({ from: inc.id, to: e.id, kind: 'trace' })
  })
  inc.evidence.forEach((ev, i) => {
    const id = `${inc.id}:${ev.id}`
    nodes.push({ id, kind: 'evidence', label: `${ev.id} · ${ev.kind}`, sub: `confiance ${confLevel(ev.confidence)}`, text: `${ev.title}. ${ev.excerpt}`, x: 500, y: 95 + i * 120 })
    const src = evs[Math.min(evs.length - 1, i + 1)] ?? evs[0]
    if (src) edges.push({ from: src.id, to: id, kind: 'trace' })
    const target = `${inc.id}:${ev.supports}`
    edges.push({ from: id, to: target, kind: 'supports' })
    if (ev.supports === 'H2') edges.push({ from: id, to: `${inc.id}:H1`, kind: 'contradicts' })
  })
  inc.hypotheses.forEach((h, i) => {
    nodes.push({ id: `${inc.id}:${h.id}`, kind: 'hypothesis', label: h.id, sub: `confiance ${confLevel(h.score)}`, text: h.label, x: 730, y: i === 0 ? 180 : 420, hot: i === 0 })
  })
  if (inc.related) {
    nodes.push({ id: inc.related.id, kind: 'related', label: inc.related.id, sub: 'incident passé', text: `${inc.related.title}. ${inc.related.note}`, x: 730, y: 545 })
    edges.push({ from: inc.related.id, to: `${inc.id}:H1`, kind: 'history' })
  }
  nodes.push({ id: `${inc.id}:P`, kind: 'proposal', label: 'Proposition', sub: 'validation humaine', text: inc.decision.action, x: 925, y: 180, hot: true })
  edges.push({ from: `${inc.id}:H1`, to: `${inc.id}:P`, kind: 'proposes' })
  return { nodes, edges }
}

async function sha256(text: string) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
    return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
  } catch {
    // non-secure contexts have no SubtleCrypto: fall back to a visible marker, never a fake hash
    return 'indisponible (contexte non sécurisé)'
  }
}

/* ═════════ evidence graph ═════════ */

export function EvidenceGraph({ inc, visible, compact = false }: { inc: Incident; visible?: Set<string>; compact?: boolean }) {
  const { nodes, edges } = useMemo(() => buildGraph(inc), [inc])
  const [sel, setSel] = useState<string>(inc.id)
  const [hash, setHash] = useState('')
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes])
  const selected = byId[sel] ?? nodes[0]
  const shown = (id: string) => !visible || visible.has(id)

  useEffect(() => {
    let alive = true
    sha256(JSON.stringify({ id: selected.id, kind: selected.kind, text: selected.text })).then((h) => alive && setHash(h))
    return () => {
      alive = false
    }
  }, [selected])

  const path = (a: GNode, b: GNode) => {
    const mx = (a.x + b.x) / 2
    return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`
  }
  const linked = new Set(edges.filter((e) => e.from === sel || e.to === sel).flatMap((e) => [e.from, e.to]))

  return (
    <div className={`fsg ${compact ? 'fsg--compact' : ''}`}>
      <div className="fsg__scroll">
        <svg className="fsg__svg" viewBox="0 0 1000 600" role="img" aria-label={`Graphe de preuves de ${inc.id}`}>
          <defs>
            <marker id="fsgArrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--signal)" />
            </marker>
          </defs>
          {edges.map((e, i) => {
            const a = byId[e.from]
            const b = byId[e.to]
            if (!a || !b || !shown(e.from) || !shown(e.to)) return null
            const on = linked.has(e.from) && linked.has(e.to) && (e.from === sel || e.to === sel)
            return <path key={i} d={path(a, b)} className={`fsg__edge fsg__edge--${e.kind} ${on ? 'is-on' : ''}`} markerEnd={e.kind === 'supports' || e.kind === 'proposes' ? 'url(#fsgArrow)' : undefined} pathLength={1} />
          })}
          {nodes.map((n) =>
            shown(n.id) ? (
              <g
                key={n.id}
                className={`fsg__node fsg__node--${n.kind} ${n.hot ? 'is-hot' : ''} ${sel === n.id ? 'is-sel' : ''} ${linked.has(n.id) ? 'is-linked' : ''}`}
                transform={`translate(${n.x} ${n.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${KIND_LABEL[n.kind]} ${n.label}`}
                onClick={() => setSel(n.id)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSel(n.id))}
              >
                <rect x={-78} y={-24} width={156} height={48} rx={n.kind === 'hypothesis' ? 24 : 4} />
                <text className="fsg__k" x={-66} y={-6}>
                  {KIND_LABEL[n.kind].toUpperCase()}
                </text>
                <text className="fsg__l" x={-66} y={12}>
                  {n.label.length > 20 ? n.label.slice(0, 19) + '…' : n.label}
                </text>
              </g>
            ) : null,
          )}
        </svg>
      </div>
      {!compact && (
        <aside className="fsg__inspect" aria-live="polite">
          <p className="fsg__ik">{KIND_LABEL[selected.kind]}</p>
          <h3>{selected.label}</h3>
          <p className="fsg__is">{selected.sub}</p>
          <p className="fsg__it">{selected.text}</p>
          <p className="fsg__ih">
            <span>SHA-256 de l'enregistrement</span>
            <code>{hash ? `${hash.slice(0, 32)}…` : '…'}</code>
          </p>
          <ul className="fsg__legend">
            <li>
              <i className="l-sup" /> soutient
            </li>
            <li>
              <i className="l-con" /> contredit
            </li>
            <li>
              <i className="l-his" /> précédent historique
            </li>
          </ul>
        </aside>
      )}
    </div>
  )
}

/* ═════════ replay: the agent's run, step by step ═════════ */

interface Step {
  tool: string
  args: string
  phase: string
  lines: string[]
  reveal: string[]
}

export function buildSteps(inc: Incident, verdict: Verdict): Step[] {
  const evs = inc.events.slice(0, 5)
  const h1 = inc.hypotheses[0]
  const h2 = inc.hypotheses[1]
  const support = inc.evidence.filter((e) => e.supports === 'H1').length
  const contra = inc.evidence.filter((e) => e.supports === 'H2').length
  return [
    { phase: 'Intake', tool: 'list_incidents', args: `{ status: "open" }`, lines: [`${inc.id} · ${inc.severity} · ${inc.service}`, inc.title], reveal: [inc.id] },
    { phase: 'Récupération', tool: 'investigate_incident', args: `{ id: "${inc.id}" }`, lines: evs.map((e) => `${e.time}  ${e.id}  ${e.label}`), reveal: evs.map((e) => e.id) },
    { phase: 'Preuves', tool: 'search_knowledge', args: `{ query: "${inc.service}" }`, lines: inc.evidence.map((e) => `${e.id} ${e.kind.padEnd(8)} ${e.title} · ${confLevel(e.confidence)}`), reveal: inc.evidence.map((e) => `${inc.id}:${e.id}`) },
    {
      phase: 'Historique',
      tool: 'find_related_incidents',
      args: `{ id: "${inc.id}" }`,
      lines: inc.related ? [`${inc.related.id} · ${inc.related.title}`, inc.related.note] : ['Aucun incident comparable.'],
      reveal: inc.related ? [inc.related.id] : [],
    },
    {
      phase: 'Hypothèses',
      tool: 'summarize_findings',
      args: `{ investigation: "${inc.id}" }`,
      lines: [`H1 · ${h1.label}`, `   ${support} preuve(s) en soutien · confiance ${confLevel(h1.score)}`, `H2 · ${h2.label}`, `   ${contra} preuve(s) · contredit H1 · confiance ${confLevel(h2.score)}`, ...inc.decision.unknowns.map((u) => `?  ${u}`)],
      reveal: [`${inc.id}:H1`, `${inc.id}:H2`],
    },
    { phase: 'Communication', tool: 'draft_customer_update', args: `{ investigation: "${inc.id}" }`, lines: [`« ${inc.customerDraft} »`, 'Brouillon uniquement : rien n\'est envoyé.'], reveal: [] },
    { phase: 'Proposition', tool: 'generate_incident_report', args: `{ investigation: "${inc.id}" }`, lines: [`Proposition : ${inc.decision.action}`, `Confiance ${confLevel(inc.decision.confidence)} · en attente de validation humaine`], reveal: [`${inc.id}:P`] },
    {
      phase: 'Décision',
      tool: 'get_investigation_history',
      args: `{ id: "${inc.id}" }`,
      lines:
        verdict === 'approved'
          ? ['Décision humaine : approuvée.', 'Statut : not_executed. L\'approbation enregistre une intention, pas une action.']
          : verdict === 'rejected'
            ? ['Décision humaine : rejetée.', `Branche alternative : ${inc.decision.alternative}`]
            : ['En attente d\'une décision humaine.', 'Aucun outil MCP ne peut approuver ni exécuter.'],
      reveal: [],
    },
  ]
}

export function Replay({ inc, verdict }: { inc: Incident; verdict: Verdict }) {
  const steps = useMemo(() => buildSteps(inc, verdict), [inc, verdict])
  const [i, setI] = useState(0)
  const [chars, setChars] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const step = steps[i]
  const total = step.lines.join('\n').length
  const consoleRef = useRef<HTMLDivElement>(null)

  // type the tool output, then move on to the next step
  useEffect(() => {
    if (!playing) return
    if (reduced) {
      setChars(total)
    }
    if (chars < total) {
      const id = window.setTimeout(() => setChars((c) => Math.min(total, c + Math.ceil(3 * speed))), 16)
      return () => clearTimeout(id)
    }
    if (i < steps.length - 1) {
      const id = window.setTimeout(() => {
        setI(i + 1)
        setChars(0)
      }, 900 / speed)
      return () => clearTimeout(id)
    }
    setPlaying(false)
  }, [playing, chars, total, i, steps.length, speed, reduced])

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight })
  }, [i, chars])

  const go = (n: number) => {
    setI(Math.max(0, Math.min(steps.length - 1, n)))
    setChars(steps[Math.max(0, Math.min(steps.length - 1, n))].lines.join('\n').length)
    setPlaying(false)
  }
  const restart = () => {
    setI(0)
    setChars(0)
    setPlaying(true)
  }

  const visible = new Set(steps.slice(0, i + 1).flatMap((s) => s.reveal))
  const typed = step.lines.join('\n').slice(0, chars)

  return (
    <div className="fsr">
      <div className="fsr__bar">
        <div className="fsr__ctl">
          <button type="button" className="btn btn--line" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Étape précédente">
            ←
          </button>
          {playing ? (
            <button type="button" className="btn btn--line" onClick={() => setPlaying(false)}>
              Pause
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={() => (i === steps.length - 1 && chars >= total ? restart() : setPlaying(true))}>
              {i === steps.length - 1 && chars >= total ? 'Rejouer' : 'Lecture'}
            </button>
          )}
          <button type="button" className="btn btn--line" onClick={() => go(i + 1)} disabled={i === steps.length - 1} aria-label="Étape suivante">
            →
          </button>
          <button type="button" className="btn btn--line" onClick={() => setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : 1)} aria-label="Vitesse">
            {speed}×
          </button>
        </div>
        <ol className="fsr__steps" aria-label="Étapes de l'enquête">
          {steps.map((s, k) => (
            <li key={s.phase} className={k < i ? 'is-done' : k === i ? 'is-on' : ''}>
              <button type="button" onClick={() => go(k)}>
                <span>{String(k + 1).padStart(2, '0')}</span>
                {s.phase}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <div className="fsr__grid">
        <div className="fsr__console" ref={consoleRef} aria-live="polite">
          {steps.slice(0, i).map((s) => (
            <div key={s.phase} className="fsr__block is-past">
              <p className="fsr__call">
                <b>→ {s.tool}</b>
                <span>{s.args}</span>
              </p>
              <pre>{s.lines.join('\n')}</pre>
            </div>
          ))}
          <div className="fsr__block">
            <p className="fsr__call">
              <b>→ {step.tool}</b>
              <span>{step.args}</span>
              {chars < total && <i className="fsr__spin" aria-hidden="true" />}
            </p>
            <pre>
              {typed}
              {chars < total && <i className="fsr__caret" aria-hidden="true" />}
            </pre>
          </div>
        </div>
        <div className="fsr__graph">
          <EvidenceGraph inc={inc} visible={visible} compact />
          <p className="fsr__note">Outils MCP réels du projet FlowState · données fictives · aucun outil n'exécute d'action</p>
        </div>
      </div>
    </div>
  )
}

/* ═════════ audit trail: a real SHA-256 hash chain, verified in the browser ═════════ */

interface AuditRow {
  type: string
  text: string
}

export function Audit({ inc, verdict, decisions }: { inc: Incident; verdict: Verdict; decisions: { at: string; text: string; kind: string }[] }) {
  const base: AuditRow[] = useMemo(() => {
    const steps = buildSteps(inc, verdict)
    return [
      ...steps.slice(0, 7).map((s) => ({ type: s.phase, text: `${s.tool} · ${s.lines[0]}` })),
      ...decisions
        .slice()
        .reverse()
        .map((d) => ({ type: d.kind === 'approved' ? 'Approbation' : d.kind === 'rejected' ? 'Rejet' : d.kind === 'asked' ? 'Demande de preuve' : 'Réouverture', text: d.text })),
    ]
  }, [inc, verdict, decisions])

  const [rows, setRows] = useState<AuditRow[]>(base)
  const [sealed, setSealed] = useState<string[]>([])
  const [check, setCheck] = useState<('ok' | 'bad' | null)[]>([])
  const [tampered, setTampered] = useState(false)
  const [running, setRunning] = useState(false)

  // seal the genuine log once: each hash covers the previous hash + this entry
  useEffect(() => {
    let alive = true
    setRows(base)
    setTampered(false)
    setCheck([])
    ;(async () => {
      const out: string[] = []
      let prev = await sha256(`GENESIS:${inc.id}`)
      for (const r of base) {
        prev = await sha256(prev + '|' + JSON.stringify(r))
        out.push(prev)
      }
      if (alive) setSealed(out)
    })()
    return () => {
      alive = false
    }
  }, [base, inc.id])

  const verify = async () => {
    setRunning(true)
    setCheck([])
    let prev = await sha256(`GENESIS:${inc.id}`)
    let broken = false
    const res: ('ok' | 'bad')[] = []
    for (let k = 0; k < rows.length; k++) {
      prev = await sha256(prev + '|' + JSON.stringify(rows[k]))
      if (prev !== sealed[k]) broken = true
      res.push(broken ? 'bad' : 'ok')
      setCheck([...res])
      await new Promise((r) => setTimeout(r, 140))
    }
    setRunning(false)
  }

  const tamper = () => {
    const k = Math.min(2, rows.length - 1)
    setRows(rows.map((r, i) => (i === k ? { ...r, text: r.text.replace(/·/, '· (modifié)') } : r)))
    setTampered(true)
    setCheck([])
  }

  const firstBad = check.indexOf('bad')

  return (
    <div className="fsa-audit">
      <div className="fsa-audit__bar">
        <p>
          Chaque entrée est scellée par <code>SHA-256(hash précédent | entrée)</code>. Modifier une entrée casse la chaîne à partir de cet endroit. Calcul réel, dans votre navigateur.
        </p>
        <div className="fsa-head__actions">
          <button type="button" className="btn btn--primary" onClick={verify} disabled={running || !sealed.length}>
            {running ? 'Vérification…' : 'Vérifier l\'intégrité'}
          </button>
          {tampered ? (
            <button type="button" className="btn btn--line" onClick={() => (setRows(base), setTampered(false), setCheck([]))}>
              Restaurer
            </button>
          ) : (
            <button type="button" className="btn btn--line" onClick={tamper}>
              Simuler une altération
            </button>
          )}
        </div>
      </div>
      {check.length === rows.length && (
        <p className={`fsa-audit__res ${firstBad >= 0 ? 'is-bad' : 'is-ok'}`} role="status">
          {firstBad >= 0 ? `Chaîne rompue à l'entrée ${firstBad + 1} : altération détectée.` : `Intégrité vérifiée : ${rows.length} entrées, chaîne intacte.`}
        </p>
      )}
      <ol className="fsa-chain">
        {rows.map((r, k) => (
          <li key={k} className={check[k] === 'ok' ? 'is-ok' : check[k] === 'bad' ? 'is-bad' : ''}>
            <span className="fsa-chain__n">{String(k + 1).padStart(2, '0')}</span>
            <span className="fsa-chain__t">{r.type}</span>
            <span className="fsa-chain__x">{r.text}</span>
            <code>{sealed[k] ? sealed[k].slice(0, 12) : '…'}</code>
            <i aria-hidden="true">{check[k] === 'ok' ? '✓' : check[k] === 'bad' ? '✗' : ''}</i>
          </li>
        ))}
      </ol>
      <p className="fsa-note">Limite connue, comme dans le projet : un administrateur qui réécrit toute la chaîne n'est pas détecté sans ancrage externe.</p>
    </div>
  )
}
