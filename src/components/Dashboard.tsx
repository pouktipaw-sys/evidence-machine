import { useMemo, useState, type CSSProperties } from 'react'
import type { DashEvent } from '../content'
import { layoutFor, type PanelId } from '../lib/dashLayout'
import { incidents, type Incident } from '../app/incidents'

type Verdict = 'pending' | 'approved' | 'rejected'

interface Props {
  width: number
  height: number
  isMobile: boolean
  interactive?: boolean
  className?: string
  style?: CSSProperties
  id?: string
  data?: Incident
  /** controlled decision (the app); uncontrolled when omitted (the showcase) */
  verdict?: Verdict
  onVerdict?: (v: Verdict) => void
  asked?: boolean
  onAsk?: () => void
  /** proposal hidden below the workspace confidence threshold */
  blocked?: boolean
}

/** chart geometry: the threshold always sits at 42 % of the panel */
function Chart({ verdict, c }: { verdict: Verdict; c: Incident['chart'] }) {
  const data = c.values
  const W = 600
  const H = 260
  const top = 70
  const bottom = 236
  const max = c.max
  const thresholdY = 0.42 * H
  // two linear segments: [0, threshold] below the SLO line, [threshold, max] above it
  const y = (v: number) =>
    v <= c.threshold ? bottom - (v / c.threshold) * (bottom - thresholdY) : thresholdY - ((v - c.threshold) / (max - c.threshold)) * (thresholdY - top)
  const step = (W - 40) / (data.length - 1)
  const pts = data.map((v, i) => [20 + i * step, Math.max(top - 20, y(v))] as const)
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join(' ')
  const area = `${d} L${pts[pts.length - 1][0]},${bottom} L20,${bottom} Z`
  const deployX = 20 + c.markerAt * step
  const recoverX = 20 + (data.length - 2.5) * step
  const last = pts[data.length - 3]
  return (
    <svg className="fs-chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="fsArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff4d2d" stopOpacity="0.28" />
          <stop offset="1" stopColor="#ff4d2d" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1="20" x2={W - 20} y1={top + (bottom - top) * g} y2={top + (bottom - top) * g} className="fs-grid" />
      ))}
      <rect x={deployX} y={top - 24} width={W - 20 - deployX} height={bottom - top + 24} className="fs-anom" />
      <line x1={deployX} x2={deployX} y1={top - 30} y2={bottom} className="fs-deploy" />
      <text x={deployX + 6} y={top - 18} className="fs-ctext">{c.markerLabel}</text>
      <line x1="20" x2={W - 20} y1={thresholdY} y2={thresholdY} className="fs-threshold" />
      <text x={W - 22} y={thresholdY - 6} textAnchor="end" className="fs-ctext fs-ctext--o">{c.thresholdLabel}</text>
      <path d={area} fill="url(#fsArea)" />
      <path d={d} className="fs-line" />
      {verdict === 'approved' && (
        <path d={`M${recoverX},${last[1]} C${recoverX + 30},${last[1]} ${W - 60},${y(c.recoverTo * 1.15)} ${W - 20},${y(c.recoverTo)}`} className="fs-line fs-line--proj" />
      )}
      <circle cx={pts[c.peakAt][0]} cy={pts[c.peakAt][1]} r="5" className="fs-peak" />
      <text x={pts[c.peakAt][0] - 10} y={pts[c.peakAt][1] + 18} textAnchor="end" className="fs-ctext">{c.peakLabel}</text>
    </svg>
  )
}

export function Dashboard(props: Props) {
  const { width, height, isMobile, interactive = false, className = '', style, id, data: inc = incidents[0], blocked = false } = props
  const rects = layoutFor(isMobile)
  const [selected, setSelected] = useState<string>(inc.selectedEvent)
  const [focusHyp, setFocusHyp] = useState<'H1' | 'H2' | null>(null)
  const [localVerdict, setLocalVerdict] = useState<Verdict>('pending')
  const [localAsked, setLocalAsked] = useState(false)
  const verdict = props.verdict ?? localVerdict
  const asked = props.asked ?? localAsked
  const setVerdict = (v: Verdict) => (props.onVerdict ? props.onVerdict(v) : setLocalVerdict(v))
  const setAsked = () => (props.onAsk ? props.onAsk() : setLocalAsked(true))
  const dashboard = { incident: inc.id, title: inc.title, env: inc.env, evidence: inc.evidence, hypotheses: inc.hypotheses, decision: inc.decision }

  const events: DashEvent[] = useMemo(() => {
    const extra: DashEvent[] = []
    if (verdict === 'approved') extra.push(inc.followUps.approved)
    if (verdict === 'rejected') extra.push(inc.followUps.rejected)
    if (asked) extra.push(inc.followUps.asked)
    return [...inc.events, ...extra]
  }, [verdict, asked, inc])

  const u = width / 100
  const box = (pid: PanelId): CSSProperties => {
    const [x, y, w, h] = rects[pid]
    return { left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }
  }
  const sel = events.find((e) => e.id === selected)
  const status = verdict === 'approved' ? inc.decision.approvedStatus : verdict === 'rejected' ? 'BRANCHE H2' : 'INVESTIGATING'

  const Tag = interactive ? 'button' : 'div'

  return (
    <div
      id={id}
      className={`fs ${isMobile ? 'fs--m' : ''} ${interactive ? 'fs--live' : ''} fs--${verdict} ${className}`}
      style={{ width, height, ['--u' as string]: `${u}px`, ...style }}
      role={interactive ? 'application' : undefined}
      aria-label="Interface FlowState AI (données fictives de démonstration)"
    >
      {/* ── top bar ── */}
      <div className="fs-p fs-top" data-panel="top" style={box('top')}>
        <span className="fs-logo">
          <i />
          FlowState<b>AI</b>
        </span>
        <span className="fs-crumb">
          <em>{dashboard.incident}</em> {isMobile ? '' : dashboard.title}
        </span>
        <span className="fs-env">{dashboard.env}</span>
        <span className={`fs-status fs-status--${verdict}`}>
          <i /> {status}
        </span>
        <span className="fs-demo">DONNÉES FICTIVES</span>
      </div>

      {/* ── events ── */}
      <div className="fs-p fs-events" data-panel="events" style={box('events')}>
        <header className="fs-h">
          <span>01 · EVENTS</span>
          <span>{events.length} signaux</span>
        </header>
        <ol className="fs-tl">
          {events.map((e) => (
            <li key={e.id} className={`fs-ev fs-ev--${e.severity} ${selected === e.id ? 'is-sel' : ''}`}>
              <Tag className="fs-ev__btn" {...(interactive ? { type: 'button' as const, onClick: () => setSelected(e.id), 'aria-pressed': selected === e.id } : {})}>
                <span className="fs-ev__t">{e.time}</span>
                <span className="fs-ev__dot" />
                <span className="fs-ev__body">
                  <span className="fs-ev__src">{e.source}</span>
                  <span className="fs-ev__l">{e.label}</span>
                </span>
              </Tag>
            </li>
          ))}
        </ol>
        {interactive && sel && (
          <div className="fs-detail" aria-live="polite">
            <span className="fs-detail__id">{sel.id}</span>
            <p>{sel.detail}</p>
          </div>
        )}
      </div>

      {/* ── signal chart ── */}
      <div className="fs-p fs-chartp" data-panel="chart" style={box('chart')}>
        <header className="fs-h">
          <span>SIGNAL · {inc.chart.metric}</span>
          <span className="fs-big">
            {inc.chart.big}
            <small>{inc.chart.bigUnit}</small>
          </span>
        </header>
        <Chart verdict={verdict} c={inc.chart} />
      </div>

      {/* ── evidence ── */}
      {dashboard.evidence.map((ev, i) => {
        const pid = (['ev1', 'ev2', 'ev3', 'ev4'] as const)[i]
        const dim = focusHyp && ev.supports !== focusHyp
        return (
          <Tag
            key={ev.id}
            className={`fs-p fs-evi ${dim ? 'is-dim' : ''} ${focusHyp === ev.supports ? 'is-hot' : ''}`}
            data-panel={pid}
            style={box(pid)}
            {...(interactive ? { type: 'button' as const, onClick: () => setFocusHyp(focusHyp === ev.supports ? null : ev.supports), 'aria-label': `Preuve ${ev.title}, soutient ${ev.supports}` } : {})}
          >
            <span className="fs-evi__k">
              <b>{ev.id}</b> {ev.kind}
              <em>→ {ev.supports}</em>
            </span>
            <span className="fs-evi__t">{ev.title}</span>
            <code className="fs-evi__x">{ev.excerpt}</code>
            <span className="fs-conf">
              <span style={{ width: `${ev.confidence * 100}%` }} />
              <small>{ev.confidence.toFixed(2)}</small>
            </span>
          </Tag>
        )
      })}

      {/* ── decision ── */}
      <div className="fs-p fs-dec" data-panel="decision" style={box('decision')}>
        <header className="fs-h">
          <span>03 · DECISION</span>
          <span>conf. {dashboard.decision.confidence.toFixed(2)}</span>
        </header>
        <p className="fs-dec__lbl">{verdict === 'rejected' ? 'Branche alternative' : 'Proposition'}</p>
        <p className="fs-dec__a">{blocked && verdict === 'pending' ? 'Proposition masquée : confiance sous le seuil' : verdict === 'rejected' ? dashboard.decision.alternative : dashboard.decision.action}</p>
        <div className="fs-hyps">
          {dashboard.hypotheses.map((h) => (
            <div key={h.id} className={`fs-hyp ${focusHyp === h.id ? 'is-hot' : ''} ${verdict === 'rejected' && h.id === 'H2' ? 'is-hot' : ''}`}>
              <span>{h.id}</span>
              <span className="fs-hyp__bar">
                <i style={{ width: `${(verdict === 'rejected' ? (h.id === 'H1' ? 0.4 : 0.6) : h.score) * 100}%` }} />
              </span>
              <span className="fs-hyp__l">{h.label}</span>
            </div>
          ))}
        </div>
        {!isMobile && (
          <>
            <p className="fs-dec__lbl">Pourquoi</p>
            <ul className="fs-why">
              {dashboard.decision.reasoning.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
        <p className="fs-dec__lbl">Reste à vérifier</p>
        <ul className="fs-unk">
          {dashboard.decision.unknowns.slice(0, isMobile ? 1 : 2).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      {/* ── human decision ── */}
      <div className="fs-p fs-act" data-panel="actions" style={box('actions')}>
        {verdict === 'pending' ? (
          <>
            <Tag className="fs-btn fs-btn--ok" {...(interactive ? { type: 'button' as const, onClick: () => setVerdict('approved'), disabled: blocked } : {})}>
              {blocked ? 'Confiance insuffisante' : inc.decision.cta}
            </Tag>
            <div className="fs-act__row">
              <Tag className="fs-btn" {...(interactive ? { type: 'button' as const, onClick: () => setVerdict('rejected') } : {})}>
                Rejeter
              </Tag>
              <Tag className={`fs-btn ${asked ? 'is-on' : ''}`} {...(interactive ? { type: 'button' as const, onClick: setAsked, disabled: asked } : {})}>
                {asked ? 'Preuve demandée' : '+ Preuve'}
              </Tag>
            </div>
          </>
        ) : (
          <div className="fs-verdict">
            <span>{verdict === 'approved' ? 'Décision humaine enregistrée' : 'Proposition rejetée'}</span>
            {interactive && (
              <button type="button" className="fs-btn" onClick={() => setVerdict('pending')}>
                Annuler
              </button>
            )}
          </div>
        )}
        <p className="fs-act__note">Aucune action sans validation humaine · simulation locale</p>
      </div>

    </div>
  )
}
