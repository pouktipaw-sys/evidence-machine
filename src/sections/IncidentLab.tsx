import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Transition } from '../components/Transition'
import { scenarios, type Scenario } from '../content'
import { sfx } from '../lib/sound'
import { stage } from '../lib/stage'

type Verdict = 'none' | 'approved' | 'rejected'
const STEPS = ['Signal', 'Événements', 'Preuves', 'Hypothèses', 'Incertitudes', 'Proposition']

interface Pt {
  x: number
  y: number
}

/** each scenario has its own spatial grammar */
function layout(s: Scenario, W: number, H: number, mobile: boolean) {
  const lineY = H * (s.kind === 'fanin' ? 0.52 : 0.42)
  const pad = mobile ? 34 : 70
  const actX = W - (mobile ? 30 : 74)
  const span = actX - pad - (mobile ? 46 : 120)
  const pos: Pt[] = s.events.map((e, i) => {
    const x = pad + e.t * span
    if (s.kind === 'cascade') return { x, y: lineY + (mobile ? (i % 2 ? 44 : -44) : 0) }
    if (s.kind === 'regression') {
      const deployT = s.events.find((ev) => ev.key)!.t
      return { x, y: e.t > deployT ? lineY + (mobile ? 70 : 96) : lineY }
    }
    return { x, y: lineY - (mobile ? 92 : 118) + (i % 2 ? (mobile ? 40 : 34) : 0) }
  })
  const source: Pt = { x: pad + span * 0.55, y: lineY + (mobile ? 96 : 128) }
  const action: Pt = { x: actX, y: lineY }
  const alt: Pt = { x: actX, y: lineY + (mobile ? 120 : 150) }
  return { lineY, pos, source, action, alt, pad }
}

export function IncidentLab() {
  const [idx, setIdx] = useState(0)
  const [step, setStep] = useState(0)
  const [verdict, setVerdict] = useState<Verdict>('none')
  const [sel, setSel] = useState<string | null>(null)
  const [size, setSize] = useState({ W: 1200, H: 420 })
  const [mobile, setMobile] = useState(stage.isMobile)
  const stageRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])
  const s = scenarios[idx]

  useLayoutEffect(() => {
    const el = stageRef.current!
    const ro = new ResizeObserver(() => {
      const m = window.innerWidth < 760
      setMobile(m)
      setSize({ W: el.clientWidth, H: m ? 400 : Math.round(Math.min(430, Math.max(300, window.innerHeight * 0.48))) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  const pick = (i: number) => {
    clear()
    setIdx(i)
    setStep(0)
    setVerdict('none')
    setSel(null)
    sfx('select')
  }

  const initiate = () => {
    clear()
    setVerdict('none')
    setSel(null)
    setStep(0)
    sfx('initiate')
    const gap = stage.reducedMotion ? 0 : 620
    for (let k = 1; k <= 6; k++) {
      timers.current.push(
        window.setTimeout(() => {
          setStep(k)
          if (k === 2) setSel(s.events.find((e) => e.key)?.id ?? null)
          sfx('reveal')
        }, gap * k + (gap ? 250 : 0)),
      )
    }
  }

  const decide = (v: Verdict) => {
    setVerdict(v)
    sfx(v === 'approved' ? 'approve' : 'reject')
  }

  const { W, H } = size
  const L = layout(s, W, H, mobile)
  const keyIdx = s.events.findIndex((e) => e.key)
  const lastKey = s.events.length - 1
  const selEv = s.events.find((e) => e.id === sel)
  const on = (k: number) => (step >= k ? 'is-on' : '')

  /* connections, per scenario grammar */
  const conns: { d: string; cls: string; delay: number }[] = []
  if (step >= 2) {
    if (s.kind === 'cascade') {
      for (let i = 0; i < L.pos.length - 1; i++) {
        const a = L.pos[i]
        const b = L.pos[i + 1]
        const lift = 50 + i * 22
        conns.push({ d: `M${a.x},${a.y} C${a.x + 30},${a.y - lift} ${b.x - 30},${b.y - lift} ${b.x},${b.y}`, cls: 'c-arc', delay: i * 0.18 })
      }
    } else if (s.kind === 'regression') {
      const d = L.pos[keyIdx]
      const after = L.pos.filter((_, i) => i > keyIdx)
      conns.push({ d: `M${d.x},${L.lineY} C${d.x + 50},${L.lineY} ${d.x + 30},${after[0].y} ${d.x + 90},${after[0].y} L${after[after.length - 1].x},${after[0].y}`, cls: 'c-branch', delay: 0.2 })
    } else {
      L.pos.forEach((p, i) => {
        conns.push({ d: `M${p.x},${p.y} C${p.x},${L.lineY + 40} ${L.source.x},${L.source.y - 90} ${L.source.x},${L.source.y}`, cls: 'c-fan', delay: i * 0.12 })
      })
    }
  }
  const from = s.kind === 'fanin' ? L.source : L.pos[lastKey]
  const proposalPath = `M${from.x},${from.y} C${from.x + 60},${from.y} ${L.action.x - 80},${L.action.y} ${L.action.x},${L.action.y}`
  const altFrom = s.kind === 'fanin' ? L.source : L.pos[Math.max(0, lastKey - 1)]
  const altPath = `M${altFrom.x},${altFrom.y} C${altFrom.x + 80},${altFrom.y + 40} ${L.alt.x - 90},${L.alt.y} ${L.alt.x},${L.alt.y}`

  return (
    <section id="lab" className={`section lab lab--${s.kind} lab--${verdict} ${step > 0 ? 'is-running' : ''}`} aria-labelledby="lab-title">
      <Transition kind="shutter" from="var(--bone)" />
      <div className="lab__head">
        <div>
          <p className="mk">
            <span className="lab__live" /> Incident Lab · simulation locale · données fictives
          </p>
          <h2 id="lab-title" className="lab__title">
            The investigation <span>room</span>
          </h2>
        </div>
        <div className="lab__controls">
          <div className="lab__tabs" role="tablist" aria-label="Scénarios">
            {scenarios.map((sc, i) => (
              <button key={sc.id} role="tab" aria-selected={i === idx} className={`lab__tab ${i === idx ? 'is-on' : ''}`} onClick={() => pick(i)} type="button" data-cursor="SELECT">
                <span>{sc.code}</span>
                {sc.name}
              </button>
            ))}
          </div>
          <button type="button" className="btn btn--primary lab__go magnetic" onClick={initiate} data-cursor="RUN">
            <span className="lab__go-dot" /> {step === 0 ? 'Initiate investigation' : 'Rerun investigation'}
          </button>
        </div>
      </div>

      {/* ───── the room ───── */}
      <div className="lab__stage" ref={stageRef} style={{ height: H }}>
        <svg className="lab__svg" width={W} height={H} aria-hidden="true">
          <defs>
            <filter id="labGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* time ruler */}
          {Array.from({ length: Math.floor(W / 24) }, (_, i) => (
            <line key={i} x1={i * 24} x2={i * 24} y1={L.lineY + 10} y2={L.lineY + (i % 5 === 0 ? 20 : 14)} className="lab__tick" />
          ))}
          {/* the orange line */}
          <line x1="0" x2={W} y1={L.lineY} y2={L.lineY} className={`lab__line ${step >= 1 ? 'is-hot' : ''}`} />
          {step >= 1 && <line key={`scan-${idx}-${step >= 1}`} x1="0" x2={W} y1={L.lineY} y2={L.lineY} className="lab__scan" pathLength={1} />}

          {/* regression: the deploy slicer */}
          {s.kind === 'regression' && step >= 2 && (
            <g className="lab__slicer">
              <line x1={L.pos[keyIdx].x} x2={L.pos[keyIdx].x} y1={20} y2={H - 20} pathLength={1} />
              <text x={L.pos[keyIdx].x + 8} y={30}>
                AVANT · APRÈS
              </text>
              <rect x={L.pos[keyIdx].x} y={20} width={W - L.pos[keyIdx].x} height={H - 40} />
            </g>
          )}

          {/* cascade: amplification bars */}
          {s.kind === 'cascade' &&
            step >= 3 &&
            L.pos.map((p, i) => <rect key={i} className="lab__amp" x={p.x - 2} y={L.lineY + 24} width="4" height={12 + i * i * 7} style={{ animationDelay: `${i * 0.1}s` }} />)}

          {conns.map((c, i) => (
            <path key={`${idx}-${i}`} d={c.d} className={`lab__conn ${c.cls}`} pathLength={1} style={{ animationDelay: `${c.delay}s` }} />
          ))}

          {/* cascade: travelling wave */}
          {s.kind === 'cascade' && step >= 2 && !stage.reducedMotion && (
            <circle r="5" className="lab__wave" filter="url(#labGlow)">
              <animateMotion dur="2.6s" repeatCount="indefinite" path={conns.map((c) => c.d).join(' ').replace(/ M/g, ' L')} />
            </circle>
          )}

          {/* fan-in source */}
          {s.kind === 'fanin' && step >= 2 && (
            <g className="lab__source">
              <circle cx={L.source.x} cy={L.source.y} r="16" />
              <circle cx={L.source.x} cy={L.source.y} r="30" className="lab__ring" />
              <text x={L.source.x + 40} y={L.source.y + 4}>
                SOURCE UNIQUE · svc-****9f
              </text>
            </g>
          )}

          {/* proposal + decision geometry */}
          {step >= 6 && (
            <>
              <path d={proposalPath} className={`lab__prop ${verdict === 'approved' ? 'is-approved' : ''} ${verdict === 'rejected' ? 'is-rejected' : ''}`} pathLength={1} />
              {verdict === 'approved' && <path key="ok" d={proposalPath} className="lab__prop-ok" pathLength={1} filter="url(#labGlow)" />}
              {verdict === 'rejected' && <path key="alt" d={altPath} className="lab__alt" pathLength={1} />}
            </>
          )}
        </svg>

        {/* action nodes */}
        <div className={`lab__node lab__node--action ${step >= 6 ? 'is-on' : ''}`} style={{ left: L.action.x, top: L.action.y }}>
          <span>ACTION</span>
        </div>
        <div className={`lab__node lab__node--alt ${verdict === 'rejected' ? 'is-on' : ''}`} style={{ left: L.alt.x, top: L.alt.y }}>
          <span>ALT</span>
        </div>
        {verdict === 'approved' && (
          <div className="lab__stamp" style={{ left: Math.min(L.action.x - 40, W - 200), top: L.action.y - 86 }}>
            Approuvé
            <small>décision humaine · simulée</small>
          </div>
        )}

        {/* event capsules */}
        {s.events.map((e, i) => {
          const p = L.pos[i]
          const style = {
            left: p.x,
            top: p.y,
            '--fx': s.kind === 'fanin' ? `${L.source.x - p.x}px` : s.kind === 'regression' ? `${-p.x}px` : '0px',
            '--fy': s.kind === 'fanin' ? `${L.source.y - p.y}px` : s.kind === 'cascade' ? '-120px' : '0px',
            transitionDelay: step >= 2 ? `${i * 0.11}s` : '0s',
          } as CSSProperties
          return (
            <button
              key={`${s.id}-${e.id}`}
              type="button"
              className={`cap ${step >= 2 ? 'is-on' : ''} ${e.key ? 'cap--key' : ''} ${sel === e.id ? 'is-sel' : ''} ${s.kind === 'regression' && i > keyIdx ? 'cap--after' : ''}`}
              style={style}
              onClick={() => {
                setSel(e.id)
                sfx('tick')
              }}
              tabIndex={step >= 2 ? 0 : -1}
              aria-label={`Inspecter ${e.id} : ${e.label}`}
              data-cursor="INSPECT"
            >
              <b>{e.id}</b>
              <span>{e.source}</span>
            </button>
          )
        })}

        {/* idle prompt */}
        <p className={`lab__idle ${step === 0 ? 'is-on' : ''}`} style={{ top: L.lineY - 64 }}>
          <span>{s.code}</span> {s.signal}
          <em>Appuyez sur Initiate investigation</em>
        </p>

        {/* inspector */}
        {selEv && step >= 2 && (
          <div className="lab__inspector" aria-live="polite">
            <p className="mk">Inspector · {selEv.source}</p>
            <p className="lab__inspector-t">
              <b>{selEv.id}</b> {selEv.label}
            </p>
            <pre>{selEv.payload}</pre>
          </div>
        )}
      </div>

      {/* ───── progressive read-out ───── */}
      <ol className="lab__steps" aria-label="Étapes de l'enquête">
        {STEPS.map((st, i) => (
          <li key={st} className={step > i ? 'is-on' : ''}>
            <span>0{i + 1}</span> {st}
          </li>
        ))}
      </ol>
      <p className="sr-only" aria-live="polite">
        {step > 0 ? `Étape ${step} sur 6 : ${STEPS[step - 1]}` : ''}
        {verdict === 'approved' ? ' Proposition approuvée.' : verdict === 'rejected' ? ' Proposition rejetée, branche alternative.' : ''}
      </p>

      <div className="lab__grid">
        <article className={`lab__card lab__card--signal ${on(1)}`}>
          <h3>01 · Signal</h3>
          <p className="lab__signal">{s.signal}</p>
        </article>
        <article className={`lab__card ${on(3)}`}>
          <h3>03 · Preuves</h3>
          <ul>
            {s.evidence.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </article>
        <article className={`lab__card ${on(4)}`}>
          <h3>04 · Hypothèses</h3>
          {s.hypotheses.map((h, i) => {
            const p = verdict === 'rejected' ? (i === 0 ? h.p * 0.6 : Math.min(0.9, h.p * 2.2)) : h.p
            return (
              <div key={h.label} className={`lab__hyp ${verdict === 'rejected' && i === 1 ? 'is-hot' : ''}`}>
                <div>
                  <span>H{i + 1}</span>
                  <b>{p >= 0.75 ? 'élevée' : p >= 0.5 ? 'moyenne' : 'faible'}</b>
                </div>
                <i style={{ width: step >= 4 ? `${p * 100}%` : 0 }} />
                <p>{h.label}</p>
              </div>
            )
          })}
        </article>
        <article className={`lab__card lab__card--unk ${on(5)}`}>
          <h3>05 · Incertitudes</h3>
          <ul>
            {s.uncertainties.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </article>
        <article className={`lab__card lab__card--prop ${on(6)}`}>
          <h3>06 · {verdict === 'rejected' ? 'Branche alternative' : 'Proposition'}</h3>
          <p className="lab__prop-t">{verdict === 'rejected' ? s.alternative : s.proposal}</p>
          {verdict === 'none' ? (
            <div className="lab__decide">
              <button type="button" className="btn btn--primary" onClick={() => decide('approved')} disabled={step < 6} data-cursor="APPROVE">
                Approuver
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => decide('rejected')} disabled={step < 6} data-cursor="REJECT">
                Rejeter
              </button>
            </div>
          ) : (
            <div className="lab__decide">
              <p className="lab__verdict">{verdict === 'approved' ? 'Connexion établie. Action simulée, rien n\'est exécuté.' : 'Proposition écartée. Le graphe ouvre une autre branche.'}</p>
              <button type="button" className="btn btn--ghost" onClick={() => setVerdict('none')}>
                Revenir
              </button>
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
