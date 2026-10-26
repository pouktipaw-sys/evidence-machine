import { useLayoutEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Transition, type TransitionKind } from '../components/Transition'
import { projects } from '../content'
import { smooth, stage } from '../lib/stage'

gsap.registerPlugin(ScrollTrigger)

/* ───── AgentOps Security : a physical terminal that reads files and writes a report ───── */
function AgentOpsArtefact() {
  const files = [
    ['auth/session.ts', 0.82, 'risk'],
    ['api/upload.ts', 0.64, ''],
    ['.env.example', 0.38, 'risk'],
    ['agents/tools.py', 0.9, ''],
    ['infra/ci.yml', 0.55, 'risk'],
    ['package.json', 0.46, ''],
    ['README.md', 0.3, ''],
  ] as const
  return (
    <div className="ao" aria-hidden="true">
      <div className="ao__device">
        <div className="ao__top" />
        <div className="ao__side" />
        <div className="ao__screen">
          <div className="ao__bar">
            <span>agentops scan</span>
            <span className="ao__status">
              <i /> analyse
            </span>
          </div>
          <div className="ao__files">
            {files.map(([n, w, r], i) => (
              <div key={n} className={`ao__file ${r ? 'is-risk' : ''}`} style={{ ['--i' as string]: i, ['--w' as string]: w }}>
                <span>{n}</span>
                <b />
              </div>
            ))}
            <div className="ao__scan" />
          </div>
        </div>
        <div className="ao__vents">
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="ao__notes">
        <p style={{ ['--k' as string]: 0 }}>
          <b>L12</b> session sans expiration
        </p>
        <p style={{ ['--k' as string]: 1 }}>
          <b>L3</b> clé d'exemple réaliste
        </p>
        <p style={{ ['--k' as string]: 2 }}>
          <b>L41</b> jeton exposé dans les logs CI
        </p>
      </div>
      <div className="ao__report">
        <p className="ao__rh">Rapport · 3 points de vigilance</p>
        <div className="ao__sev">
          <i style={{ width: '20%' }} className="h" />
          <i style={{ width: '45%' }} className="m" />
          <i style={{ width: '35%' }} />
        </div>
        <ul>
          <li>Haute · secret dans un log</li>
          <li>Moyenne · session illimitée</li>
          <li>Basse · exemple trop réaliste</li>
        </ul>
      </div>
    </div>
  )
}

/* ───── PeaceFi : a minimal map that unfolds in isometric perspective ───── */
function PeaceFiArtefact() {
  const pins = [
    { x: 120, y: 110, l: 'Point A' },
    { x: 330, y: 180, l: 'Point B' },
    { x: 250, y: 330, l: 'Point C' },
    { x: 470, y: 300, l: 'Point D' },
    { x: 520, y: 120, l: 'Point E' },
  ]
  const route = 'M120,110 L200,110 L200,180 L330,180 L330,250 L250,250 L250,330 L470,330 L470,300'
  return (
    <div className="pf" aria-hidden="true">
      <div className="pf__map">
        <svg viewBox="0 0 640 440" className="pf__svg">
          <rect x="0" y="0" width="640" height="440" className="pf__ground" />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={`v${i}`} x1={i * 80} x2={i * 80} y1="0" y2="440" className="pf__street" />
          ))}
          {Array.from({ length: 6 }, (_, i) => (
            <line key={`h${i}`} x1="0" x2="640" y1={i * 80 + 30} y2={i * 80 + 30} className="pf__street" />
          ))}
          <path d="M0,390 C160,350 260,420 400,380 S600,300 640,330 L640,440 L0,440 Z" className="pf__water" />
          <rect x="370" y="40" width="110" height="70" className="pf__park" />
          <rect x="40" y="200" width="90" height="110" className="pf__park" />
          <path d={route} className="pf__route" pathLength={1} />
          {pins.map((p, i) => (
            <g key={p.l} className="pf__pin" style={{ ['--k' as string]: i }}>
              <circle cx={p.x} cy={p.y} r="16" className="pf__halo" />
              <circle cx={p.x} cy={p.y} r="6" />
            </g>
          ))}
        </svg>
        {pins.map((p, i) => (
          <span key={p.l} className="pf__stick" style={{ left: `${(p.x / 640) * 100}%`, top: `${(p.y / 440) * 100}%`, ['--k' as string]: i }}>
            <em>{p.l}</em>
          </span>
        ))}
      </div>
      <p className="pf__legend">
        <i /> points d'accès démonstratifs · <b>—</b> itinéraire
      </p>
    </div>
  )
}

/* ───── DreamCRM : a 2.5D desk of CRM objects that organises under the cursor ───── */
function DreamCRMArtefact() {
  const cards = [
    { cls: 'dc--client', z: 3, body: <><b>Camille R.</b><span>Atelier Nord · 3 contrats</span><em>Relance jeudi</em></> },
    { cls: 'dc--client dc--b', z: 2, body: <><b>Studio Kao</b><span>Prospect chaud · 12 k€</span><em>Démo envoyée</em></> },
    { cls: 'dc--table', z: 1, body: <><b>Pipeline</b><div className="dc__rows">{['Nouveau', 'Qualifié', 'Proposition', 'Gagné'].map((r, i) => <span key={r}><i style={{ width: `${[80, 55, 35, 20][i]}%` }} />{r}</span>)}</div></> },
    { cls: 'dc--kpi', z: 4, body: <><span>Taux de conversion</span><b>24 %</b></> },
    { cls: 'dc--note', z: 2, body: <><span>Note</span><b>« Rappeler après le salon »</b></> },
  ]
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    ref.current!.style.setProperty('--mx', String(((e.clientX - r.left) / r.width) * 2 - 1))
    ref.current!.style.setProperty('--my', String(((e.clientY - r.top) / r.height) * 2 - 1))
  }
  return (
    <div className="dc" ref={ref} onPointerMove={onMove} onPointerLeave={() => (ref.current!.style.setProperty('--mx', '0'), ref.current!.style.setProperty('--my', '0'))} data-cursor="EXPLORE" aria-hidden="true">
      <div className="dc__desk">
        {cards.map((c, i) => (
          <div key={i} className={`dc__card ${c.cls}`} style={{ ['--z' as string]: c.z, ['--i' as string]: i }}>
            {c.body}
          </div>
        ))}
      </div>
    </div>
  )
}

const TRANSITIONS: Record<string, { kind: TransitionKind; from: string }> = {
  agentops: { kind: 'frame', from: '#080808' },
  peacefi: { kind: 'shutter', from: '#121212' },
  dreamcrm: { kind: 'blinds', from: 'var(--bone)' },
}

const ARTEFACTS: Record<string, ReactNode> = {
  agentops: <AgentOpsArtefact />,
  peacefi: <PeaceFiArtefact />,
  dreamcrm: <DreamCRMArtefact />,
}

export function Projects() {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      ;(gsap.utils.toArray('.proj') as HTMLElement[]).forEach((el) => {
        const set = (p: number) => {
          el.style.setProperty('--p', p.toFixed(4))
          el.style.setProperty('--s1', smooth(0.0, 0.32, p).toFixed(4))
          el.style.setProperty('--s2', smooth(0.28, 0.55, p).toFixed(4))
          el.style.setProperty('--s3', smooth(0.45, 0.72, p).toFixed(4))
          el.style.setProperty('--s4', smooth(0.62, 0.88, p).toFixed(4))
        }
        set(stage.reducedMotion ? 1 : 0)
        if (stage.reducedMotion) return
        ScrollTrigger.create({ trigger: el, start: 'top 65%', end: 'bottom bottom', onUpdate: (s) => set(s.progress) })
        gsap.fromTo(el.querySelectorAll('.proj__title .mask__in'), { yPercent: 105 }, { yPercent: 0, stagger: 0.08, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 55%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div id="projects" ref={root} className="projects">
      <header className="projects__intro section">
        <Transition kind="blinds" from="var(--bone)" />
        <p className="mk">Autres projets · artefacts</p>
        <p className="projects__lead">Trois projets, trois objets. Aucun ne ressemble aux autres, parce qu'aucun ne résout le même problème.</p>
      </header>
      {projects.map((p) => {
        const words = p.name.split(' ')
        return (
          <section key={p.id} id={`p-${p.id}`} className={`section proj proj--${p.id}`} aria-labelledby={`t-${p.id}`}>
            <Transition {...TRANSITIONS[p.id]} />
            <div className="proj__pin">
              <span className="proj__index" aria-hidden="true">
                {p.index}
                <small>/03</small>
              </span>
              <h2 id={`t-${p.id}`} className="proj__title">
                {words.map((w) => (
                  <span key={w} className="mask">
                    <span className="mask__in">{w}</span>
                  </span>
                ))}
              </h2>
              <div className="proj__art">{ARTEFACTS[p.id]}</div>
              <div className="proj__info">
                <p className="mk">{p.kicker}</p>
                <p className="proj__text">{p.text}</p>
                <a className="proj__link magnetic" href={p.href} target="_blank" rel="noopener noreferrer" data-cursor="OPEN">
                  Voir dans le portfolio <i aria-hidden="true">↗</i>
                </a>
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
