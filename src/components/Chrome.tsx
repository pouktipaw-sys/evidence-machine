import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { links, person } from '../content'
import { setUI, useUI, stage } from '../lib/stage'
import { sfx, unlockAudio } from '../lib/sound'
import { Dashboard } from './Dashboard'

const SECTIONS: [string, string][] = [
  ['theatre', 'Evidence Core'],
  ['case', 'Case File'],
  ['lab', 'Investigation Room'],
  ['xray', 'X-Ray'],
  ['method', 'Méthode'],
  ['projects', 'Artefacts'],
  ['smalk', 'Pour Smalk'],
  ['finale', 'Contact'],
]

/* ───── minimal navigation, contrast follows the section underneath ───── */
export function Nav() {
  const [cur, setCur] = useState(0)
  const [light, setLight] = useState(false)
  const sound = useUI((s) => s.sound)
  const barRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const triggers = SECTIONS.map(([id], i) => {
      const el = document.getElementById(id)
      if (!el) return null
      return ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (s) => s.isActive && setCur(i),
      })
    })
    const lightEls = ['case', 'method', 'p-peacefi', 'p-dreamcrm']
    const lt = lightEls.map((id) => {
      const el = document.getElementById(id)
      return el ? ScrollTrigger.create({ trigger: el, start: 'top 40px', end: 'bottom 40px', onToggle: (s) => s.isActive && setLight(true), onLeave: () => setLight(false), onLeaveBack: () => setLight(false) }) : null
    })
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (barRef.current) barRef.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      triggers.forEach((t) => t?.kill())
      lt.forEach((t) => t?.kill())
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <nav className={`nav ${light ? 'nav--light' : ''}`} aria-label="Navigation principale">
      <a href="#main" className="nav__brand">
        <i aria-hidden="true" />
        <span>MAM</span>
        <em>The Evidence Machine</em>
      </a>
      <p className="nav__where" aria-live="off">
        <span>0{cur + 1}</span> {SECTIONS[cur][1]}
      </p>
      <ul className="nav__links">
        <li>
          <a href="#showcase-anchor">FlowState</a>
        </li>
        <li>
          <a href="#lab">Lab</a>
        </li>
        <li>
          <a href="#projects">Projets</a>
        </li>
        <li>
          <a href="#smalk">Smalk</a>
        </li>
        <li>
          <a href={links.flowstate}>App</a>
        </li>
        <li>
          <a href={links.portfolio} target="_blank" rel="noopener noreferrer">
            Portfolio ↗
          </a>
        </li>
        <li>
          <a href={links.contact} className="nav__cta">
            Contact
          </a>
        </li>
        <li>
          <button
            type="button"
            className={`nav__sound ${sound ? 'is-on' : ''}`}
            aria-pressed={sound}
            aria-label={sound ? 'Couper le son' : 'Activer le son (facultatif)'}
            onClick={() => {
              unlockAudio()
              setUI({ sound: !sound })
              setTimeout(() => sfx('select'), 30)
            }}
          >
            <span aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            {sound ? 'Son' : 'Muet'}
          </button>
        </li>
      </ul>
      <span className="nav__bar" ref={barRef} aria-hidden="true" />
    </nav>
  )
}

/* ───── contextual cursor + magnetic hover (desktop, fine pointers only) ───── */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    const el = ref.current!
    let x = 0
    let y = 0
    let cx = 0
    let cy = 0
    let raf = 0
    let mag: HTMLElement | null = null
    const loop = () => {
      cx += (x - cx) * 0.22
      cy += (y - cy) * 0.22
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      const t = e.target as HTMLElement | null
      const host = t?.closest?.('[data-cursor]') as HTMLElement | null
      const label = host?.dataset.cursor
      const drag = label === 'DRAG' && host?.classList.contains('is-interactive')
      const show = label && (label !== 'DRAG' || drag)
      el.classList.toggle('is-on', !!show)
      el.classList.toggle('is-drag', !!drag)
      if (show) el.dataset.label = label!
      // magnetic pull, bounded
      const m = t?.closest?.('.magnetic') as HTMLElement | null
      if (mag && mag !== m) mag.style.transform = ''
      mag = m
      if (m && !stage.reducedMotion) {
        const r = m.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height
        m.style.transform = `translate(${dx * 8}px, ${dy * 6}px)`
      }
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
    }
  }, [])
  return <div ref={ref} className="cursor" aria-hidden="true" />
}

/* ───── easter egg: type "build" ───── */
export function BuildNotes() {
  const open = useUI((s) => s.buildNotes)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    let buf = ''
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, [contenteditable]')) return
      if (e.key === 'Escape') return setUI({ buildNotes: false })
      if (e.key.length !== 1) return
      buf = (buf + e.key.toLowerCase()).slice(-5)
      if (buf === 'build') setUI({ buildNotes: true })
    }
    window.addEventListener('keydown', key)
    console.log('%c THE EVIDENCE MACHINE %c tapez "build" sur la page pour ouvrir les notes de fabrication.', 'background:#FF4D2D;color:#080808;font-weight:700', 'color:#C5C9CE')
    return () => window.removeEventListener('keydown', key)
  }, [])
  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])
  if (!open) return null
  return (
    <div className="notes-panel" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="bn-title">
      <div className="notes-panel__in">
        <header>
          <p className="mk">Build notes · {person.name}</p>
          <button ref={closeRef} type="button" className="btn btn--line" onClick={() => setUI({ buildNotes: false })}>
            Fermer · Esc
          </button>
        </header>
        <h2 id="bn-title">Comment cette machine est construite.</h2>
        <div className="notes-panel__cols">
          <section>
            <h3>Stack</h3>
            <ul>
              <li><b>React + TypeScript</b> — composants, état local des simulations.</li>
              <li><b>GSAP + ScrollTrigger</b> — une seule timeline réversible pilote la typographie et la mise en scène du produit ; Lenis pour le défilement.</li>
              <li><b>SVG + CSS 3D</b> — Investigation Room, X-Ray, artefacts de projets.</li>
            </ul>
          </section>
          <section>
            <h3>Choix de conception</h3>
            <ul>
              <li>Le dashboard est un vrai composant d'interface, pas une capture : il est mis à l'échelle et zoomé en DOM.</li>
              <li>Aucune bibliothèque 3D : tout est en DOM, SVG et CSS, pour rester léger et fluide.</li>
              <li>Mouvement réduit respecté ; X-Ray en vue 2D au clavier et sur mobile.</li>
            </ul>
          </section>
          <section>
            <h3>Méthode</h3>
            <ul>
              <li>Bible de production et storyboard avant le code (<code>docs/PRODUCTION_BIBLE.md</code>).</li>
              <li>Contrôle visuel par captures automatisées à 1440 px et 390 px (<code>scripts/shots.mjs</code>).</li>
              <li>Données de démonstration marquées comme fictives partout où elles apparaissent.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

/* ───── EXPLORE FULL INTERFACE ───── */
export function ExploreModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('button')?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && ref.current) {
        const f = Array.from(ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), a'))
        if (!f.length) return
        if (e.shiftKey && document.activeElement === f[0]) {
          e.preventDefault()
          f[f.length - 1].focus()
        } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
          e.preventDefault()
          f[0].focus()
        }
      }
    }
    const rs = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('keydown', key)
    window.addEventListener('resize', rs)
    document.documentElement.classList.add('modal-open')
    return () => {
      window.removeEventListener('keydown', key)
      window.removeEventListener('resize', rs)
      document.documentElement.classList.remove('modal-open')
      prev?.focus()
    }
  }, [open, onClose])
  if (!open) return null
  const mobile = vp.w < 760
  const w = mobile ? vp.w - 24 : Math.min(vp.w - 64, (vp.h - 120) * 1.6, 1560)
  const h = mobile ? w / 0.5 : w / 1.6
  return (
    <div className="explore" data-lenis-prevent role="dialog" aria-modal="true" aria-labelledby="ex-title" ref={ref}>
      <header className="explore__head">
        <p id="ex-title">
          <b>FlowState AI</b> · interface interactive · données fictives, actions simulées localement
        </p>
        <button type="button" className="btn btn--line" onClick={onClose}>
          Fermer · Esc
        </button>
      </header>
      <p className="explore__hint mk">Sélectionnez un événement · cliquez une preuve pour filtrer par hypothèse · décidez.</p>
      <div className="explore__body">
        <Dashboard width={w} height={h} isMobile={mobile} interactive />
      </div>
    </div>
  )
}
