import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Dashboard } from '../components/Dashboard'
import { links, person } from '../content'
import { incidents, incidentById, type Incident, type Sev } from './incidents'
import { fs, useFS, verdictOf, type LogEntry, type Verdict } from './store'

/* ───── tiny hash router: #/app, #/app/incidents/ID, #/app/journal, #/app/preuves, #/app/reglages ───── */
export function go(path: string) {
  window.location.hash = path
}
function useRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const on = () => setHash(window.location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const parts = hash.replace(/^#\/app\/?/, '').split('/').filter(Boolean)
  return { view: parts[0] ?? 'incidents', id: parts[1] }
}

const STATUS: Record<Verdict, string> = { pending: 'Décision requise', approved: 'Résolu', rejected: 'Branche alternative' }
const SEV_ORDER: Record<Sev, number> = { SEV1: 0, SEV2: 1, SEV3: 2 }

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

/* ═════════ shell ═════════ */
export function FlowStateApp() {
  const { view, id } = useRoute()
  const [query, setQuery] = useState('')
  const verdicts = useFS((s) => s.verdicts)
  const log = useFS((s) => s.log)
  const open = incidents.filter((i) => (verdicts[i.id] ?? 'pending') === 'pending').length
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    document.title = 'FlowState AI — démo'
    mainRef.current?.scrollTo({ top: 0 })
    return () => {
      document.title = 'Morjiane Aït Mokhtar — The Evidence Machine'
    }
  }, [view, id])

  const nav = [
    { key: 'incidents', label: 'Incidents', count: open, icon: 'M3 4h14M3 10h14M3 16h9' },
    { key: 'journal', label: 'Journal des décisions', count: log.filter((l) => l.kind === 'approved' || l.kind === 'rejected').length, icon: 'M5 3h10v14H5zM8 7h4M8 11h4' },
    { key: 'preuves', label: 'Preuves', count: incidents.reduce((a, i) => a + i.evidence.length, 0), icon: 'M4 4h8l4 4v8H4zM12 4v4h4' },
    { key: 'reglages', label: 'Réglages', icon: 'M10 6v8M6 10h8M10 2v2M10 16v2M2 10h2M16 10h2' },
  ]
  const current = view === 'incidents' && id ? incidentById(id) : undefined

  return (
    <div className="fsa">
      <aside className="fsa-side">
        <a className="fsa-logo" href="#/app" aria-label="FlowState AI, accueil">
          <i aria-hidden="true" />
          FlowState<b>AI</b>
        </a>
        <p className="fsa-ws">
          <span className="fsa-dot" /> prod · eu-west-3
        </p>
        <nav aria-label="Navigation FlowState">
          <ul>
            {nav.map((n) => (
              <li key={n.key}>
                <a href={`#/app/${n.key}`} className={view === n.key ? 'is-on' : ''} aria-current={view === n.key ? 'page' : undefined}>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d={n.icon} />
                  </svg>
                  <span>{n.label}</span>
                  {n.count !== undefined && <em>{n.count}</em>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="fsa-side__foot">
          <p className="fsa-demo">Démo · données fictives · aucune action réelle</p>
          <a href="#/" className="fsa-back">
            ← Retour à la candidature
          </a>
          <a href={links.portfolio} target="_blank" rel="noopener noreferrer" className="fsa-back">
            Portfolio ↗
          </a>
        </div>
      </aside>

      <div className="fsa-body">
        <header className="fsa-top">
          <p className="fsa-crumb">
            <a href="#/app">FlowState</a>
            <span>/</span>
            {current ? (
              <>
                <a href="#/app/incidents">Incidents</a>
                <span>/</span>
                <b>{current.id}</b>
              </>
            ) : (
              <b>{nav.find((n) => n.key === view)?.label ?? 'Incidents'}</b>
            )}
          </p>
          {view === 'incidents' && !id && (
            <label className="fsa-search">
              <span className="sr-only">Rechercher un incident</span>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="9" cy="9" r="5.5" />
                <path d="M13 13l4 4" />
              </svg>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher : id, service, titre…" />
            </label>
          )}
          <span className="fsa-user" title={person.name}>
            <i>MA</i>
            <span>{person.name}</span>
          </span>
        </header>

        <main className="fsa-main" ref={mainRef}>
          {view === 'incidents' && !id && <Inbox query={query} />}
          {view === 'incidents' && id && (current ? <Detail inc={current} /> : <Missing />)}
          {view === 'journal' && <Journal />}
          {view === 'preuves' && <EvidenceLib />}
          {view === 'reglages' && <Settings />}
        </main>
      </div>

      <nav className="fsa-tabbar" aria-label="Navigation FlowState (mobile)">
        {nav.map((n) => (
          <a key={n.key} href={`#/app/${n.key}`} className={view === n.key ? 'is-on' : ''}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d={n.icon} />
            </svg>
            {n.label.split(' ')[0]}
          </a>
        ))}
        <a href="#/">Site</a>
      </nav>
    </div>
  )
}

function Missing() {
  return (
    <div className="fsa-empty">
      <p>Incident introuvable.</p>
      <a className="btn btn--line" href="#/app/incidents">
        Retour aux incidents
      </a>
    </div>
  )
}

/* ═════════ inbox ═════════ */
function Inbox({ query }: { query: string }) {
  const verdicts = useFS((s) => s.verdicts)
  const askedMap = useFS((s) => s.asked)
  const sources = useFS((s) => s.settings.sources)
  const log = useFS((s) => s.log)
  const [tab, setTab] = useState<'all' | Verdict>('all')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return incidents
      .filter((i) => !q || `${i.id} ${i.title} ${i.service}`.toLowerCase().includes(q))
      .filter((i) => tab === 'all' || (verdicts[i.id] ?? 'pending') === tab)
      .sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
  }, [query, tab, verdicts])

  const pending = incidents.filter((i) => (verdicts[i.id] ?? 'pending') === 'pending').length
  const decided = log.filter((l) => l.kind === 'approved' || l.kind === 'rejected').length
  const avgConf = incidents.reduce((a, i) => a + i.decision.confidence, 0) / incidents.length
  const activeSources = Object.values(sources).filter(Boolean).length

  const tabs: { k: 'all' | Verdict; l: string }[] = [
    { k: 'all', l: 'Tous' },
    { k: 'pending', l: 'Décision requise' },
    { k: 'approved', l: 'Résolus' },
    { k: 'rejected', l: 'Branche alternative' },
  ]

  return (
    <div className="fsa-page">
      <div className="fsa-head">
        <div>
          <h1>Incidents</h1>
          <p>Chaque incident est enquêté automatiquement. Chaque action attend une décision humaine.</p>
        </div>
      </div>

      <div className="fsa-kpis">
        <div className="fsa-kpi fsa-kpi--hot">
          <span>Décisions requises</span>
          <b>{pending}</b>
        </div>
        <div className="fsa-kpi">
          <span>Décisions humaines</span>
          <b>{decided}</b>
        </div>
        <div className="fsa-kpi">
          <span>Confiance moyenne</span>
          <b>{avgConf.toFixed(2)}</b>
        </div>
        <div className="fsa-kpi">
          <span>Sources connectées</span>
          <b>
            {activeSources}
            <small>/5</small>
          </b>
        </div>
      </div>

      <div className="fsa-tabs" role="tablist" aria-label="Filtrer par statut">
        {tabs.map((t) => (
          <button key={t.k} role="tab" type="button" aria-selected={tab === t.k} className={tab === t.k ? 'is-on' : ''} onClick={() => setTab(t.k)}>
            {t.l}
          </button>
        ))}
      </div>

      <div className="fsa-table" role="table" aria-label="Liste des incidents">
        <div className="fsa-tr fsa-tr--h" role="row">
          <span role="columnheader">Sévérité</span>
          <span role="columnheader">Incident</span>
          <span role="columnheader">Service</span>
          <span role="columnheader">Statut</span>
          <span role="columnheader">Confiance</span>
          <span role="columnheader">Ouvert</span>
        </div>
        {rows.map((i) => {
          const v = verdicts[i.id] ?? 'pending'
          return (
            <a key={i.id} href={`#/app/incidents/${i.id}`} className={`fsa-tr fsa-tr--${v}`} role="row">
              <span role="cell">
                <em className={`fsa-sev fsa-sev--${i.severity}`}>{i.severity}</em>
              </span>
              <span role="cell" className="fsa-inc">
                <b>{i.id}</b>
                {i.title}
              </span>
              <span role="cell" className="fsa-mono">
                {i.service}
              </span>
              <span role="cell">
                <em className={`fsa-status fsa-status--${v}`}>{STATUS[v]}</em>
                {askedMap[i.id] && <em className="fsa-tag">preuve demandée</em>}
              </span>
              <span role="cell" className="fsa-conf">
                <i>
                  <i style={{ width: `${i.decision.confidence * 100}%` }} />
                </i>
                {i.decision.confidence.toFixed(2)}
              </span>
              <span role="cell" className="fsa-mono">
                {i.opened}
              </span>
            </a>
          )
        })}
        {rows.length === 0 && <p className="fsa-none">Aucun incident ne correspond.</p>}
      </div>
    </div>
  )
}

/* ═════════ incident detail ═════════ */
function Detail({ inc }: { inc: Incident }) {
  const verdict = useFS((s) => verdictOf(s, inc.id))
  const asked = useFS((s) => !!s.asked[inc.id])
  const minConf = useFS((s) => s.settings.minConfidence)
  const log = useFS((s) => s.log)
  const ref = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(1000)
  const mobile = w < 640

  useLayoutEffect(() => {
    const el = ref.current!
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const mine = log.filter((l) => l.incident === inc.id)
  const blocked = inc.decision.confidence < minConf

  const onVerdict = (v: Verdict) => {
    if (v === 'pending') fs.reopen(inc.id)
    else fs.decide(inc.id, v, v === 'approved' ? inc.decision.action : `Rejeté : ${inc.decision.action}`)
  }

  const idx = incidents.findIndex((i) => i.id === inc.id)
  const next = incidents[(idx + 1) % incidents.length]

  return (
    <div className="fsa-page">
      <div className="fsa-head fsa-head--detail">
        <div>
          <p className="fsa-kicker">
            <em className={`fsa-sev fsa-sev--${inc.severity}`}>{inc.severity}</em>
            <span className="fsa-mono">{inc.service}</span>
            <span className="fsa-mono">ouvert {inc.opened}</span>
          </p>
          <h1>{inc.title}</h1>
        </div>
        <div className="fsa-head__actions">
          <em className={`fsa-status fsa-status--${verdict}`}>{STATUS[verdict]}</em>
          <a className="btn btn--line" href={`#/app/incidents/${next.id}`}>
            Incident suivant →
          </a>
        </div>
      </div>

      {blocked && verdict === 'pending' && (
        <p className="fsa-banner">
          La confiance de la proposition ({inc.decision.confidence.toFixed(2)}) est sous le seuil de l'espace ({minConf.toFixed(2)}). Elle est masquée jusqu'à ce que de nouvelles preuves arrivent, ou que le seuil soit abaissé dans <a href="#/app/reglages">Réglages</a>.
        </p>
      )}

      <div className="fsa-dash" ref={ref}>
        <Dashboard
          key={inc.id}
          data={inc}
          width={w}
          height={mobile ? w / 0.5 : w / 1.6}
          isMobile={mobile}
          interactive
          verdict={verdict}
          onVerdict={onVerdict}
          asked={asked}
          onAsk={() => fs.ask(inc.id, `Preuve demandée : ${inc.followUps.askLabel}`)}
          blocked={blocked}
        />
      </div>

      <section className="fsa-card fsa-history">
        <h2>Historique des décisions sur {inc.id}</h2>
        {mine.length === 0 ? <p className="fsa-none">Aucune décision pour l'instant. Approuvez, rejetez ou demandez une preuve dans le panneau de décision.</p> : <LogList entries={mine} />}
      </section>
    </div>
  )
}

/* ═════════ journal ═════════ */
function LogList({ entries }: { entries: LogEntry[] }) {
  const label: Record<LogEntry['kind'], string> = { approved: 'Approuvé', rejected: 'Rejeté', asked: 'Preuve demandée', reset: 'Rouvert' }
  return (
    <ol className="fsa-log">
      {entries.map((l, i) => (
        <li key={`${l.at}-${i}`} className={`fsa-log--${l.kind}`}>
          <time dateTime={l.at}>{fmtTime(l.at)}</time>
          <em>{label[l.kind]}</em>
          <a href={`#/app/incidents/${l.incident}`}>{l.incident}</a>
          <span>{l.text}</span>
        </li>
      ))}
    </ol>
  )
}

function Journal() {
  const log = useFS((s) => s.log)
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'flowstate-journal.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <div className="fsa-page">
      <div className="fsa-head">
        <div>
          <h1>Journal des décisions</h1>
          <p>Chaque décision humaine est horodatée et traçable. Le journal est conservé dans ce navigateur uniquement.</p>
        </div>
        <div className="fsa-head__actions">
          <button type="button" className="btn btn--line" onClick={exportJson} disabled={!log.length}>
            Exporter (JSON)
          </button>
          <button type="button" className="btn btn--line" onClick={() => fs.resetAll()} disabled={!log.length}>
            Réinitialiser la démo
          </button>
        </div>
      </div>
      <section className="fsa-card">
        {log.length ? (
          <LogList entries={log} />
        ) : (
          <div className="fsa-empty">
            <p>Le journal est vide.</p>
            <a className="btn btn--primary" href={`#/app/incidents/${incidents[0].id}`}>
              Ouvrir un incident
            </a>
          </div>
        )}
      </section>
    </div>
  )
}

/* ═════════ evidence library ═════════ */
function EvidenceLib() {
  const all = useMemo(() => incidents.flatMap((i) => i.evidence.map((e) => ({ ...e, inc: i }))), [])
  const kinds = useMemo(() => Array.from(new Set(all.map((e) => e.kind))), [all])
  const [kind, setKind] = useState<string | null>(null)
  const [strong, setStrong] = useState(false)
  const list = all.filter((e) => (!kind || e.kind === kind) && (!strong || e.confidence >= 0.7)).sort((a, b) => b.confidence - a.confidence)
  return (
    <div className="fsa-page">
      <div className="fsa-head">
        <div>
          <h1>Preuves</h1>
          <p>Toutes les preuves citées par les enquêtes, avec leur source et leur niveau de confiance.</p>
        </div>
      </div>
      <div className="fsa-chips" role="group" aria-label="Filtrer par type">
        <button type="button" className={!kind ? 'is-on' : ''} onClick={() => setKind(null)} aria-pressed={!kind}>
          Toutes
        </button>
        {kinds.map((k) => (
          <button key={k} type="button" className={kind === k ? 'is-on' : ''} onClick={() => setKind(kind === k ? null : k)} aria-pressed={kind === k}>
            {k}
          </button>
        ))}
        <label className="fsa-switch">
          <input type="checkbox" checked={strong} onChange={() => setStrong(!strong)} />
          <span /> Confiance ≥ 0.70
        </label>
      </div>
      <div className="fsa-evgrid">
        {list.map((e) => (
          <a key={`${e.inc.id}-${e.id}`} href={`#/app/incidents/${e.inc.id}`} className={`fsa-ev ${e.confidence < 0.4 ? 'is-weak' : ''}`}>
            <span className="fsa-ev__k">
              <b>{e.kind}</b> {e.inc.id}
              <em>→ {e.supports}</em>
            </span>
            <span className="fsa-ev__t">{e.title}</span>
            <code>{e.excerpt}</code>
            <span className="fsa-conf">
              <i>
                <i style={{ width: `${e.confidence * 100}%` }} />
              </i>
              {e.confidence.toFixed(2)}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

/* ═════════ settings ═════════ */
function Settings() {
  const settings = useFS((s) => s.settings)
  const SOURCES: [string, string, string][] = [
    ['logs', 'Logs', 'Journaux applicatifs et d\'infrastructure'],
    ['metrics', 'Métriques', 'Séries temporelles et SLO'],
    ['traces', 'Traces', 'Traces distribuées'],
    ['deploys', 'Déploiements', 'Historique CI/CD'],
    ['audit', 'Audit', 'Journaux d\'accès et de sécurité'],
  ]
  const hidden = incidents.filter((i) => i.decision.confidence < settings.minConfidence).length
  return (
    <div className="fsa-page">
      <div className="fsa-head">
        <div>
          <h1>Réglages</h1>
          <p>Paramètres de l'espace de démonstration. Ils agissent réellement sur l'interface, mais ne contactent aucun service.</p>
        </div>
      </div>
      <div className="fsa-settings">
        <section className="fsa-card">
          <h2>Politique de décision</h2>
          <div className="fsa-row">
            <div>
              <b>Validation humaine obligatoire</b>
              <p>Aucune action n'est exécutée sans clic explicite. Ce réglage est verrouillé par conception.</p>
            </div>
            <label className="fsa-switch is-locked">
              <input type="checkbox" checked readOnly disabled />
              <span /> Verrouillé
            </label>
          </div>
          <div className="fsa-row">
            <div>
              <b>Seuil de confiance pour proposer une action</b>
              <p>
                Sous ce seuil, la proposition est masquée et seules les preuves sont montrées.{' '}
                {hidden > 0 ? <strong>{hidden} incident(s) concerné(s).</strong> : 'Aucun incident concerné.'}
              </p>
            </div>
            <label className="fsa-range">
              <span className="sr-only">Seuil de confiance</span>
              <input type="range" min={0.5} max={0.95} step={0.01} value={settings.minConfidence} onChange={(e) => fs.setMinConfidence(Number(e.target.value))} />
              <output>{settings.minConfidence.toFixed(2)}</output>
            </label>
          </div>
        </section>
        <section className="fsa-card">
          <h2>Sources (outils MCP)</h2>
          {SOURCES.map(([k, l, d]) => (
            <div className="fsa-row" key={k}>
              <div>
                <b>{l}</b>
                <p>{d}</p>
              </div>
              <label className="fsa-switch">
                <input type="checkbox" checked={!!settings.sources[k]} onChange={() => fs.toggleSource(k)} />
                <span /> {settings.sources[k] ? 'Connectée' : 'Coupée'}
              </label>
            </div>
          ))}
          <p className="fsa-note">Démonstration : les sources sont simulées.</p>
        </section>
      </div>
    </div>
  )
}
